package models

import (
	"errors"
	"regexp"
	"time"

	"gorm.io/gorm"
)

func init() {
	validate(&Rule{})
}

type Rule struct {
	Id        string       `json:"id" gorm:"primaryKey"`
	RegexRaw  string       `json:"regexRaw"`
	CreatedAt *time.Time   `json:"createdAt"`
	UpdatedAt *time.Time   `json:"updatedAt"`
	Playlists *[]*Playlist `json:"playlists,omitempty" gorm:"many2many:rule_playlists"`
	Tags      *[]*Tag      `json:"tags,omitempty" gorm:"many2many:rule_tags"`

	Regex      *regexp.Regexp `json:"-" gorm:"-"`
	RegexError error          `json:"-" gorm:"-"`
}

func (r *Rule) AfterCreate(tx *gorm.DB) error {
	return r.Validate(After|Create, tx)
}

func (r *Rule) AfterDelete(tx *gorm.DB) error {
	return r.Validate(After|Delete, tx)
}

func (r *Rule) AfterFind(tx *gorm.DB) error {
	return r.Validate(After|Find, tx)
}

func (r *Rule) AfterSave(tx *gorm.DB) error {
	return r.Validate(After|Save, tx)
}

func (r *Rule) AfterUpdate(tx *gorm.DB) error {
	return r.Validate(After|Update, tx)
}

func (r *Rule) BeforeCreate(tx *gorm.DB) error {
	return r.Validate(Before|Create, tx)
}

func (r *Rule) BeforeDelete(tx *gorm.DB) error {
	return r.Validate(Before|Delete, tx)
}

func (r *Rule) BeforeSave(tx *gorm.DB) error {
	return r.Validate(Before|Save, tx)
}

func (r *Rule) BeforeUpdate(tx *gorm.DB) error {
	return r.Validate(Before|Update, tx)
}

func (r *Rule) Validate(op ValidationOP, tx *gorm.DB) error {
	var now = time.Now()
	var errs []error = nil
	switch op {
	case After | Create:
	case After | Delete:
	case After | Find:
	case After | Save:
	case After | Update:
	case Before | Create:
		if r.Id == "" {
			r.Id = NewId()
		}
		if r.CreatedAt == nil || r.CreatedAt.IsZero() {
			r.CreatedAt = &now
		}
	case Before | Delete:
	case Before | Save:
		if r.UpdatedAt == nil || r.UpdatedAt.IsZero() {
			r.UpdatedAt = &now
		}
	case Before | Update:
	}
	return errors.Join(errs...)
}

func (Rule) Preload(conn *gorm.DB, preloadPlaylist, preloadTags bool) *gorm.DB {
	var newConn *gorm.DB = conn
	if preloadPlaylist {
		newConn = newConn.Preload("Playlists")
	}
	if preloadTags {
		newConn = newConn.Preload("Tags")
	}
	return newConn
}
