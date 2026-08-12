package apiplaylist

import (
	"vp/libs/definitions"

	"github.com/danielgtaylor/huma/v2"
	"gorm.io/gorm"
)

var endpoints map[string]definitions.ApiFn = map[string]definitions.ApiFn{}

func Setup(g *huma.Group, conn *gorm.DB) {
	var tags []string = []string{"Folder"}
	for _, fn := range endpoints {
		fn(g, conn, tags)
	}
}
