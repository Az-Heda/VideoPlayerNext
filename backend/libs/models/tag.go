package models

import (
	"errors"
	"time"

	"gorm.io/gorm"
)

func init() {
	validate(&Tag{})
}

type Tag struct {
	Id        string     `json:"id" gorm:"primaryKey"`
	Name      string     `json:"name" gorm:"uniqueIndex"`
	Videos    *[]*Video  `json:"videos,omitempty" gorm:"many2many:video_tags"`
	CreatedAt *time.Time `json:"createdAt"`
	UpdatedAt *time.Time `json:"updatedAt"`
}

func (t *Tag) AfterCreate(tx *gorm.DB) error {
	return t.Validate(After|Create, tx)
}

func (p *Tag) AfterDelete(tx *gorm.DB) error {
	return p.Validate(After|Delete, tx)
}

func (p *Tag) AfterFind(tx *gorm.DB) error {
	return p.Validate(After|Find, tx)
}

func (p *Tag) AfterSave(tx *gorm.DB) error {
	return p.Validate(After|Save, tx)
}

func (p *Tag) AfterUpdate(tx *gorm.DB) error {
	return p.Validate(After|Update, tx)
}

func (p *Tag) BeforeCreate(tx *gorm.DB) error {
	return p.Validate(Before|Create, tx)
}

func (p *Tag) BeforeDelete(tx *gorm.DB) error {
	return p.Validate(Before|Delete, tx)
}

func (p *Tag) BeforeSave(tx *gorm.DB) error {
	return p.Validate(Before|Save, tx)
}

func (p *Tag) BeforeUpdate(tx *gorm.DB) error {
	return p.Validate(Before|Update, tx)
}

func (p *Tag) Validate(op ValidationOP, tx *gorm.DB) error {
	var now = time.Now()
	var errs []error = nil
	switch op {
	case After | Create:
	case After | Delete:
	case After | Find:
	case After | Save:
	case After | Update:
	case Before | Create:
		if p.Id == "" {
			p.Id = NewId()
		}
		if p.CreatedAt == nil || p.CreatedAt.IsZero() {
			p.CreatedAt = &now
		}
	case Before | Delete:
	case Before | Save:
		if p.UpdatedAt == nil || p.UpdatedAt.IsZero() {
			p.UpdatedAt = &now
		}
	case Before | Update:
	}
	return errors.Join(errs...)
}

func (Tag) Preload(conn *gorm.DB, preloadVideos bool) *gorm.DB {
	var newConn *gorm.DB = conn
	if preloadVideos {
		newConn = newConn.Preload("Videos")
	}
	return newConn
}
