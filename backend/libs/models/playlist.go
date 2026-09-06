package models

import (
	"errors"
	"fmt"
	"strings"
	"time"

	"gorm.io/gorm"
)

func init() {
	validate(&Playlist{})
}

type Playlist struct {
	Id        string     `json:"id" gorm:"primaryKey"`
	Name      string     `json:"name" gorm:"index"`
	Videos    *[]*Video  `json:"videos,omitempty" gorm:"many2many:video_playlists"`
	Thumbnail []byte     `json:"thumbnail,omitempty"`
	CreatedAt *time.Time `json:"createdAt"`
	UpdatedAt *time.Time `json:"updatedAt"`
}

func (p *Playlist) AfterCreate(tx *gorm.DB) error {
	return p.Validate(After|Create, tx)
}

func (p *Playlist) AfterDelete(tx *gorm.DB) error {
	return p.Validate(After|Delete, tx)
}

func (p *Playlist) AfterFind(tx *gorm.DB) error {
	return p.Validate(After|Find, tx)
}

func (p *Playlist) AfterSave(tx *gorm.DB) error {
	return p.Validate(After|Save, tx)
}

func (p *Playlist) AfterUpdate(tx *gorm.DB) error {
	return p.Validate(After|Update, tx)
}

func (p *Playlist) BeforeCreate(tx *gorm.DB) error {
	return p.Validate(Before|Create, tx)
}

func (p *Playlist) BeforeDelete(tx *gorm.DB) error {
	return p.Validate(Before|Delete, tx)
}

func (p *Playlist) BeforeSave(tx *gorm.DB) error {
	return p.Validate(Before|Save, tx)
}

func (p *Playlist) BeforeUpdate(tx *gorm.DB) error {
	return p.Validate(Before|Update, tx)
}

func (p *Playlist) Validate(op ValidationOP, tx *gorm.DB) error {
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

func (Playlist) Preload(conn *gorm.DB, preloadVideos bool, preloadVideosFolder bool) *gorm.DB {
	var newConn *gorm.DB = conn
	if preloadVideos || preloadVideosFolder {
		newConn = newConn.Preload("Videos")
	}
	if preloadVideosFolder {
		newConn = newConn.Preload("Videos.Folder")
	}
	return newConn
}

func (p Playlist) String() string {
	var sb strings.Builder
	const eol = "\n"

	sb.WriteString("#EXTM3U" + eol)

	for _, v := range *p.Videos {
		var title = v.Filename
		var duration = v.Attributes.Duration.Seconds()
		if duration == 0 {
			duration = -1
		}
		fmt.Fprintf(&sb, "#EXTINF:%f,%s"+eol, duration, title)
		fmt.Fprintf(&sb, "/stream/%s"+eol, v.Id)
	}

	return sb.String()
}
