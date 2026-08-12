package models

import (
	"crypto/sha256"
	"math/rand"
	"time"

	"github.com/oklog/ulid/v2"
	"github.com/rs/zerolog/log"
	"gorm.io/gorm"
)

func AutoMigrate(conn *gorm.DB) {
	autoMigrate(&Folder{}, conn)
	autoMigrate(&Video{}, conn)
	autoMigrate(&Playlist{}, conn)
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
