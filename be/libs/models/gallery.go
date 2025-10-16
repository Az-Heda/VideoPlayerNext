package models

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/rs/zerolog/log"
)

type Picture struct {
	Id       string  `json:"id" gorm:"primaryKey"`
	FilePath string  `json:"filePath" gorm:"unique;not null"`
	Title    string  `json:"title"`
	Size     *int64  `json:"size"`
	Folder   *Folder `json:"folder,omitempty" gorm:"embedded;embeddedPrefix:folder_"`
}

func (p *Picture) generateId() *Picture {
	if len(p.FilePath) == 0 {
		log.Err(fmt.Errorf("cannot generate id from empty path"))
		return nil
	}
	p.Id = fmt.Sprintf("p-%d", hashFromString(p.FilePath))
	return p
}

func NewPicture(filePath string) Picture {
	f := Picture{
		FilePath: filePath,
		Title:    filepath.Base(filePath),
	}
	f.generateId()
	f.GetSize()
	return f
}

func (p *Picture) GetSize() *int64 {
	stats, err := os.Lstat(p.FilePath)
	if err != nil {
		log.Err(err).Send()
		return nil
	}
	var size = stats.Size()
	p.Size = &size
	return &size
}
