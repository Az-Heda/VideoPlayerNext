package models

import (
	"errors"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
	"time"
	. "vp/libs/utility"

	"github.com/rs/zerolog/log"
	"gorm.io/gorm"
)

func init() {
	validate(&Video{})
}

type Video struct {
	Id         string      `json:"id" gorm:"primaryKey"`
	Fullpath   string      `json:"fullpath" gorm:"uniqueIndex"`
	Filename   string      `json:"filename" gorm:"index"`
	FolderId   string      `json:"folderId"`
	Attributes Attributes  `json:"attributes" gorm:"embedded;embeddedPrefix:attrib_"`
	Playlists  []*Playlist `json:"playlists,omitempty" gorm:"many2many:video_playlists"`
	Tags       []*Tag      `json:"tags,omitempty" gorm:"many2many:video_tags"`
	Folder     *Folder     `json:"folder" gorm:"foreignKey:FolderId;references:Id"`
	CreatedAt  *time.Time  `json:"createdAt"`
	UpdatedAt  *time.Time  `json:"updatedAt"`
}

func (f *Video) AfterCreate(tx *gorm.DB) error {
	return f.Validate(After|Create, tx)
}

func (f *Video) AfterDelete(tx *gorm.DB) error {
	return f.Validate(After|Delete, tx)
}

func (f *Video) AfterFind(tx *gorm.DB) error {
	return f.Validate(After|Find, tx)
}

func (f *Video) AfterSave(tx *gorm.DB) error {
	return f.Validate(After|Save, tx)
}

func (f *Video) AfterUpdate(tx *gorm.DB) error {
	return f.Validate(After|Update, tx)
}

func (f *Video) BeforeCreate(tx *gorm.DB) error {
	return f.Validate(Before|Create, tx)
}

func (f *Video) BeforeDelete(tx *gorm.DB) error {
	return f.Validate(Before|Delete, tx)
}

func (f *Video) BeforeSave(tx *gorm.DB) error {
	return f.Validate(Before|Save, tx)
}

func (f *Video) BeforeUpdate(tx *gorm.DB) error {
	return f.Validate(Before|Update, tx)
}

func (f *Video) Validate(op ValidationOP, tx *gorm.DB) error {
	var now = time.Now()
	var errs []error = nil
	switch op {
	case After | Create:
	case After | Delete:
	case After | Find:
		if stats, err := os.Stat(f.Fullpath); err == nil {
			f.Attributes.LastFileChange = Ptr(stats.ModTime())
			f.Attributes.Exists = Ptr(true)
		} else {
			if errors.Is(err, os.ErrNotExist) {
				f.Attributes.Exists = Ptr(false)
				if tx2 := tx.Save(&f); tx2.Error != nil {
					errs = append(errs, tx2.Error)
				}
			} else {
				log.Err(err).Send()
			}
		}
	case After | Save:
	case After | Update:
	case Before | Create:
		if f.Id == "" {
			f.Id = NewId()
		}
		if f.CreatedAt == nil || f.CreatedAt.IsZero() {
			f.CreatedAt = &now
		}
		if f.Filename == "" {
			f.Filename = filepath.Base(f.Fullpath)
		}
	case Before | Delete:
	case Before | Save:
		if f.UpdatedAt == nil || f.UpdatedAt.IsZero() {
			f.UpdatedAt = &now
		}
		if f.Attributes.Exists != nil && *f.Attributes.Exists {
			if _, err := os.Stat(f.Fullpath); err == nil {
				f.Attributes.Exists = Ptr(false)
			}
		}
		if f.Attributes.Watched == nil {
			f.Attributes.Watched = Ptr(false)
		}
	case Before | Update:
	}
	return errors.Join(errs...)
}

func (Video) getValidExtensions() []string {
	return []string{".mp4"}
}
func (v *Video) ReadDuration() error {
	cmd := exec.Command(
		"ffprobe",
		"-v", "error",
		"-show_entries", "format=duration",
		"-of", "default=noprint_wrappers=1:nokey=1",
		v.Fullpath,
	)

	output, err := cmd.Output()
	if err != nil {
		return err
	}

	seconds, err := strconv.ParseFloat(strings.TrimSpace(string(output)), 64)
	if err != nil {
		return err
	}

	v.Attributes.Duration = time.Duration(seconds * float64(time.Second))
	return nil
}

func (Video) Preload(conn *gorm.DB, preloadFolder, preloadPlaylist, preloadTags bool) *gorm.DB {
	var newConn *gorm.DB = conn
	if preloadPlaylist {
		newConn = newConn.Preload("Playlists")
	}
	if preloadFolder {
		newConn = newConn.Preload("Folder")
	}
	if preloadTags {
		newConn = newConn.Preload("Tags")
	}
	return newConn
}
