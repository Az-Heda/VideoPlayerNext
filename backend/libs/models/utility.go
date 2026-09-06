package models

import (
	"crypto/sha256"
	"fmt"
	"math/rand"
	"reflect"
	"time"

	"github.com/oklog/ulid/v2"
	"github.com/rs/zerolog/log"
	"gorm.io/gorm"
)

func AutoMigrate(conn *gorm.DB) {
	autoMigrate(&Folder{}, conn)
	autoMigrate(&Video{}, conn)
	autoMigrate(&Playlist{}, conn)
	autoMigrate(&Tag{}, conn)
	autoMigrate(&Rule{}, conn)
}

func autoMigrate[T ValidModel](model T, conn *gorm.DB) {
	conn.AutoMigrate(&model)
}

func NewId() string {
	var now = time.Now()
	var entropy = rand.New(rand.NewSource(now.UnixNano()))
	var id, err = ulid.New(ulid.Timestamp(now), entropy)
	if err != nil {
		log.Fatal().Err(err).Send()
	}
	return id.String()
}

func NewIdFrom(s string) string {
	var hash = sha256.Sum256([]byte(s))
	var id ulid.ULID
	copy(id[:], hash[:16])
	return id.String()
}

// *

func Inject[T any](v1 *T, v2 T) error {
	var (
		rtV1 = reflect.TypeOf(v1)
		rvV1 = reflect.ValueOf(v1)
		rtV2 = reflect.TypeOf(v2)
		rvV2 = reflect.ValueOf(v2)

		ErrNotAPointer = func(v any) error {
			return fmt.Errorf("%T is not a pointer", v)
		}
		ErrNotAStruct = func(v any) error {
			return fmt.Errorf("%T is not a struct", v)
		}
	)

	switch {
	case rtV1 == nil || rtV1.Kind() != reflect.Ptr:
		return ErrNotAPointer(v1)

	case rtV1.Elem().Kind() != reflect.Struct:
		return ErrNotAStruct(v1)

	case rtV2 == nil || rtV2.Kind() != reflect.Struct:
		return ErrNotAStruct(v2)
	}

	// Work with the actual structs, not the pointer type.
	rtV1 = rtV1.Elem()
	rvV1 = rvV1.Elem()

	for i := 0; i < rtV1.NumField(); i++ {
		f := rtV1.Field(i)
		dst := rvV1.Field(i)

		// Ignore unexported fields.
		if !dst.CanSet() {
			continue
		}

		src := rvV2.FieldByName(f.Name)
		if !src.IsValid() {
			continue
		}

		// Recursively inject nested structs.
		if dst.Kind() == reflect.Struct && src.Kind() == reflect.Struct {
			if err := injectValue(dst, src); err != nil {
				return err
			}
			continue
		}

		// Only assign compatible values.
		if src.Type().AssignableTo(dst.Type()) {
			dst.Set(src)
		}
	}

	return nil
}

func injectValue(dst, src reflect.Value) error {
	for i := 0; i < dst.NumField(); i++ {
		dstField := dst.Type().Field(i)
		dstValue := dst.Field(i)

		if !dstValue.CanSet() {
			continue
		}

		srcValue := src.FieldByName(dstField.Name)
		if !srcValue.IsValid() {
			continue
		}

		// Recurse into nested structs.
		if dstValue.Kind() == reflect.Struct && srcValue.Kind() == reflect.Struct {
			if err := injectValue(dstValue, srcValue); err != nil {
				return err
			}
			continue
		}

		if srcValue.Type().AssignableTo(dstValue.Type()) {
			dstValue.Set(srcValue)
		}
	}

	return nil
}
