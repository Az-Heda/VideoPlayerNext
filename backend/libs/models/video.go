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

func (v *Video) AfterCreate(tx *gorm.DB) error {
	return v.Validate(After|Create, tx)
}

func (v *Video) AfterDelete(tx *gorm.DB) error {
	return v.Validate(After|Delete, tx)
}

func (v *Video) AfterFind(tx *gorm.DB) error {
	return v.Validate(After|Find, tx)
}

func (v *Video) AfterSave(tx *gorm.DB) error {
	return v.Validate(After|Save, tx)
}

func (v *Video) AfterUpdate(tx *gorm.DB) error {
	return v.Validate(After|Update, tx)
}

func (v *Video) BeforeCreate(tx *gorm.DB) error {
	return v.Validate(Before|Create, tx)
}

func (v *Video) BeforeDelete(tx *gorm.DB) error {
	return v.Validate(Before|Delete, tx)
}

func (v *Video) BeforeSave(tx *gorm.DB) error {
	return v.Validate(Before|Save, tx)
}

func (v *Video) BeforeUpdate(tx *gorm.DB) error {
	return v.Validate(Before|Update, tx)
}

func (v *Video) Validate(op ValidationOP, tx *gorm.DB) error {
	var now = time.Now()
	var errs []error = nil
	switch op {
	case After | Create:
	case After | Delete:
	case After | Find:
		if stats, err := os.Stat(v.Fullpath); err == nil {
			v.Attributes.LastFileChange = Ptr(stats.ModTime())
			v.Attributes.Exists = Ptr(true)
		} else {
			if errors.Is(err, os.ErrNotExist) {
				if v.Attributes.Exists == nil || *v.Attributes.Exists {
					v.Attributes.Exists = Ptr(false)
					if tx2 := tx.Save(&v); tx2.Error != nil {
						errs = append(errs, tx2.Error)
					}
				}
			} else {
				log.Err(err).Send()
			}
		}
	case After | Save:
	case After | Update:
	case Before | Create:
		if v.Id == "" {
			v.Id = NewId()
		}
		if v.CreatedAt == nil || v.CreatedAt.IsZero() {
			v.CreatedAt = &now
		}
		if v.Filename == "" {
			v.Filename = filepath.Base(v.Fullpath)
		}
	case Before | Delete:
	case Before | Save:
		if v.UpdatedAt == nil || v.UpdatedAt.IsZero() {
			v.UpdatedAt = &now
		}
		if v.Attributes.Exists != nil && *v.Attributes.Exists {
			if _, err := os.Stat(v.Fullpath); err == nil {
				v.Attributes.Exists = Ptr(false)
			}
		}
		if v.Attributes.Watched == nil {
			v.Attributes.Watched = Ptr(false)
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
