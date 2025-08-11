package models

import (
	"errors"
	"fmt"
	"os"
	"path"

	"github.com/graphql-go/graphql"
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

func (f *Folder) AddOrigin() {
	if len(f.Id) == 0 {
		f.generateId()
		return
	}
	f.originalId = f.Id
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
			vids = append(vids, (*Folder).GetVideos(&Folder{
				Id:         f.originalId,
				Path:       fullpath,
				originalId: f.originalId,
			},
			)...)
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
			Folder:   f,
		}
		v.GenerateId()
		v.SetAttributes()

		vids = append(vids, &v)
	}

	return
}

func (*Folder) GetGQLType() *graphql.Output {
	return &gql_FolderType
}

var (
	gql_FolderType graphql.Output = graphql.NewObject(graphql.ObjectConfig{
		Name: "GQLFolder",
		Fields: graphql.Fields{
			"id":   &graphql.Field{Type: graphql.String, Description: "Folder id (Generated) follows pattern: f-%d"},
			"path": &graphql.Field{Type: graphql.String, Description: "Folder path on the system"},
		},
	})
)
