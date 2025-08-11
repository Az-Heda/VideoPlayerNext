package models

import (
	"errors"
	"fmt"
	"os"
	"time"

	"github.com/graphql-go/graphql"
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
	Folder     *Folder         `json:"folder,omitempty" gorm:"embedded;embeddedPrefix:folder_"`
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

func (v *Video) GetDuration() error {
	data, err := ffprobe.GetProbeData(v.FilePath, 120000*time.Millisecond)
	if err != nil {
		return err
	}
	v.Duration = data.Format.Duration()
	return nil
}

func (*Video) GetGQLType() *graphql.Output {
	return &gql_VideoType
}

var (
	gql_VideoType graphql.Output = graphql.NewObject(graphql.ObjectConfig{
		Name: "GQLVideo",
		Fields: graphql.Fields{
			"id":       &graphql.Field{Type: graphql.String, Description: "Video id (Generated) follows pattern: v-%d"},
			"title":    &graphql.Field{Type: graphql.String, Description: "Video title"},
			"filePath": &graphql.Field{Type: graphql.String, Description: "File path in the file system"},
			"duration": &graphql.Field{Type: graphql.String, Description: "Video duration (MS)"},
			"size":     &graphql.Field{Type: graphql.Int, Description: "Video size (Byte)"},
			"folder": &graphql.Field{
				Type:        *(*Folder).GetGQLType(nil),
				Description: "Folder",
			},
			"attributes": &graphql.Field{
				Type: graphql.NewObject(graphql.ObjectConfig{
					Name: "GQLVideoAttributes",
					Fields: graphql.Fields{
						"exists":  &graphql.Field{Type: graphql.Boolean, Description: "Does the file exist on the file system?"},
						"watched": &graphql.Field{Type: graphql.Boolean, Description: "Did i watched the video?"},
					},
					Description: "Video attributes",
				}),
			},
		},
	})
)
