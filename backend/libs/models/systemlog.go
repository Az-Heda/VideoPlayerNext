package models

import (
	"errors"
	"net/http"
	"time"

	"gorm.io/gorm"
)

func init() {
	validate(&SystemLog{})
}

type SystemLog struct {
	Id             int        `json:"id" gorm:"primaryKey"`
	StatusCode     int        `json:"statusCode"`
	StatusCodeText string     `json:"statusCodeText" gorm:"-"`
	Message        string     `json:"message"`
	Errors         []string   `json:"errors" gorm:"serializer:json" `
	CreatedAt      *time.Time `json:"createdAt"`
}

func (s *SystemLog) AfterCreate(tx *gorm.DB) error {
	return s.Validate(After|Create, tx)
}

func (r *SystemLog) AfterDelete(tx *gorm.DB) error {
	return r.Validate(After|Delete, tx)
}

func (r *SystemLog) AfterFind(tx *gorm.DB) error {
	return r.Validate(After|Find, tx)
}

func (r *SystemLog) AfterSave(tx *gorm.DB) error {
	return r.Validate(After|Save, tx)
}

func (r *SystemLog) AfterUpdate(tx *gorm.DB) error {
	return r.Validate(After|Update, tx)
}

func (r *SystemLog) BeforeCreate(tx *gorm.DB) error {
	return r.Validate(Before|Create, tx)
}

func (r *SystemLog) BeforeDelete(tx *gorm.DB) error {
	return r.Validate(Before|Delete, tx)
}

func (r *SystemLog) BeforeSave(tx *gorm.DB) error {
	return r.Validate(Before|Save, tx)
}

func (r *SystemLog) BeforeUpdate(tx *gorm.DB) error {
	return r.Validate(Before|Update, tx)
}

func (r *SystemLog) Validate(op ValidationOP, tx *gorm.DB) error {
	var now = time.Now()
	var errs []error = nil
	switch op {
	case After | Create:
	case After | Delete:
	case After | Find:
		r.StatusCodeText = http.StatusText(r.StatusCode)
	case After | Save:
	case After | Update:
	case Before | Create:
		if r.CreatedAt == nil || r.CreatedAt.IsZero() {
			r.CreatedAt = &now
		}
	case Before | Delete:
	case Before | Save:
	case Before | Update:
	}
	return errors.Join(errs...)
}
