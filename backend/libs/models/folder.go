package models

import (
	"errors"
	"os"
	"path/filepath"
	"slices"
	"time"

	"gorm.io/gorm"
)

type Folder struct {
	Id        string     `json:"id" gorm:"primaryKey"`
	Fullpath  string     `json:"fullpath" gorm:"uniqueIndex"`
	CreatedAt *time.Time `json:"createdAt"`
	UpdatedAt *time.Time `json:"updatedAt"`
	Videos    []*Video   `json:"videos" gorm:"foreignKey:FolderId;references:Id"`
}

func (f *Folder) AfterCreate(tx *gorm.DB) error {
	return f.Validate(After|Create, tx)
}

func (f *Folder) AfterDelete(tx *gorm.DB) error {
	return f.Validate(After|Delete, tx)
}

func (f *Folder) AfterFind(tx *gorm.DB) error {
	return f.Validate(After|Find, tx)
}

func (f *Folder) AfterSave(tx *gorm.DB) error {
	return f.Validate(After|Save, tx)
}

func (f *Folder) AfterUpdate(tx *gorm.DB) error {
	return f.Validate(After|Update, tx)
}

func (f *Folder) BeforeCreate(tx *gorm.DB) error {
	return f.Validate(Before|Create, tx)
}

func (f *Folder) BeforeDelete(tx *gorm.DB) error {
	return f.Validate(Before|Delete, tx)
}

func (f *Folder) BeforeSave(tx *gorm.DB) error {
	return f.Validate(Before|Save, tx)
}

func (f *Folder) BeforeUpdate(tx *gorm.DB) error {
	return f.Validate(Before|Update, tx)
}

func (f *Folder) Validate(op ValidationOP, tx *gorm.DB) error {
	var now = time.Now()
	var errs []error = nil
	switch op {
	case After | Create:
	case After | Delete:
	case After | Find:
	case After | Save:
	case After | Update:
	case Before | Create:
		if f.Id == "" {
			f.Id = NewId()
		}
		if f.CreatedAt == nil || f.CreatedAt.IsZero() {
			f.CreatedAt = &now
		}
	case Before | Delete:
	case Before | Save:
		if f.UpdatedAt == nil || f.UpdatedAt.IsZero() {
			f.UpdatedAt = &now
		}
	case Before | Update:
	}
	return errors.Join(errs...)
}

func (f *Folder) Scan() ([]*Video, error) {
	return f.readFilesRecursive(f.Fullpath, nil, true)
}

func (f *Folder) ScanStream(ch chan *Video) ([]*Video, error) {
	return f.readFilesRecursive(f.Fullpath, ch, true)
}

func (f *Folder) readFilesRecursive(startPath string, ch chan *Video, isRoot bool) (files []*Video, err error) {
	items, err := os.ReadDir(startPath)
	if err != nil {
		return nil, err
	}

	for _, item := range items {
		var fullpath = filepath.Join(startPath, item.Name())
		if item.IsDir() {
			f, err := f.readFilesRecursive(fullpath, ch, false)
			if err != nil {
				return nil, err
			}
			files = append(files, f...)
			continue
		}

		if !slices.Contains(Video{}.getValidExtensions(), filepath.Ext(item.Name())) {
			continue
		}

		info, err := item.Info()
		if err != nil {
			return nil, err
		}
		var v *Video = &Video{
			Fullpath: fullpath,
			Filename: item.Name(),
			FolderId: f.Id,
			Folder:   f,
			Attributes: Attributes{
				Size:   info.Size(),
				Exists: true,
			},
		}
		if err := v.ReadDuration(); err != nil {
			return nil, err
		}
		if ch != nil {
			ch <- v
		}
		files = append(files, v)
	}

	if isRoot && ch != nil {
		ch <- &Video{}
	}

	return files, nil
}

func (Folder) Preload(conn *gorm.DB, preloadVideos bool) *gorm.DB {
	var newConn = conn
	if preloadVideos {
		newConn = newConn.Preload("Videos")
	}
	return newConn
}
