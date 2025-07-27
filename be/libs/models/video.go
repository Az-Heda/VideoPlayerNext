package models

import (
	"errors"
	"fmt"
	"os"
	"time"

	"github.com/rs/zerolog/log"
	"github.com/vansante/go-ffprobe"
	"gorm.io/gorm"
)

type Video struct {
	Id         string          `json:"id" gorm:"primaryKey"`
	Title      string          `json:"title" gorm:"index"`
	FilePath   string          `json:"filePath" gorm:"index"`
	Duration   time.Duration   `json:"duration,omitempty"`
	Size       int64           `json:"size,omitempty"`
	FolderId   string          `json:"folderId,omitempty"`
	Attributes VideoAttributes `json:"attributes" gorm:"embedded;embeddedPrefix:attr_"`
}

type VideoAttributes struct {
	Exists  bool `json:"exists" gorm:"index"`
	Watched bool `json:"watched"`
}

func (v *Video) GenerateId() {
	v.Id = fmt.Sprintf("v-%d", hashFromString(fmt.Sprintf("[%d {%d}] %s", v.Size, v.Duration, v.FilePath)))
}

func (v *Video) SetAttributes() {
	_, err := os.Lstat(v.FilePath)
	if err != nil && !errors.Is(err, os.ErrNotExist) {
		log.Err(err).Send()
	} else {
		v.Attributes.Exists = true
	}
}

func (v *Video) CheckFile(conn *gorm.DB) bool {
	var newExists bool = true
	if _, err := os.Lstat(v.FilePath); err != nil {
		newExists = false
	}

	if v.Attributes.Exists != newExists {
		v.Attributes.Exists = newExists
		if tx := conn.UpdateColumns(v); tx.Error != nil {
			log.Err(tx.Error).Send()
			return false
		}
	}

	return v.Attributes.Exists
}

func (v *Video) GetDurationn() error {
	data, err := ffprobe.GetProbeData(v.FilePath, 120000*time.Millisecond)
	if err != nil {
		return err
	}
	v.Duration = data.Format.Duration()
	return nil
}
