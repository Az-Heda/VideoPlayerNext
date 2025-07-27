package models

import (
	"errors"
	"fmt"
	"os"
	"path"

	"github.com/rs/zerolog/log"
)

type Folder struct {
	Id         string `json:"id,omitempty" gorm:"primaryKey"`
	Path       string `json:"path" gorm:"unique,index"`
	originalId string `json:"-" gorm:"-"`
}

func NewFolder(p string) *Folder {
	return (&Folder{Path: p}).generateId()
}

func (f *Folder) generateId() *Folder {
	if len(f.Path) == 0 {
		log.Err(fmt.Errorf("cannot generate id from empty path"))
		return nil
	}
	f.Id = fmt.Sprintf("f-%d", hashFromString(f.Path))
	f.originalId = f.Id
	return f
}

func (f *Folder) IsValidPath() bool {
	_, err := os.ReadDir(f.Path)
	if err == nil {
		return true
	}
	if !errors.Is(err, os.ErrNotExist) {
		log.Err(err).Send()
	}
	return false
}

func (f *Folder) GetVideos() (vids []*Video) {
	entries, err := os.ReadDir(f.Path)
	if err != nil {
		log.Err(err).Send()
	}
	for _, e := range entries {
		var fullpath = path.Join(f.Path, e.Name())
		if e.IsDir() {
			vids = append(vids, (*Folder).GetVideos(&Folder{Path: fullpath, originalId: f.originalId})...)
			continue
		}
		if path.Ext(fullpath) != ".mp4" {
			continue
		}
		var size int64 = 0
		info, err := e.Info()
		if err != nil {
			log.Err(err).Send()
		} else {
			size = info.Size()
		}
		var v = Video{
			Title:    e.Name(),
			FilePath: fullpath,
			Size:     size,
			FolderId: f.originalId,
		}
		v.GenerateId()
		v.SetAttributes()

		vids = append(vids, &v)
	}

	return
}
