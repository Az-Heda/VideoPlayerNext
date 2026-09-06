package apivideo

import (
	"net/http"
	. "vp/libs/definitions"

	"github.com/danielgtaylor/huma/v2"
	"gorm.io/gorm"
)

var data = []IApi{
	&ApiDefinition[ListVideoRequest, ListVideoResponse]{
		Callback: CB_ListVideo,
		Operation: huma.Operation{
			OperationID: "video-list",
			Method:      http.MethodGet,
			Path:        "/",
			Summary:     "Video list",
			Description: "Get the list of videos",
			Errors: []int{
				http.StatusBadRequest,
				http.StatusInternalServerError,
			},
		},
	},
	&ApiDefinition[GetVideoRequest, GetVideoResponse]{
		Callback: CB_GetVideo,
		Operation: huma.Operation{
			OperationID: "video-get",
			Method:      http.MethodGet,
			Path:        "/{id}",
			Summary:     "Get video info",
			Description: "Get the desired video informations",
			Parameters: []*huma.Param{
				{
					In:          "path",
					Name:        "id",
					Description: "Video id",
				},
			},
			Errors: []int{
				http.StatusInternalServerError,
			},
		},
	},
}

func Setup(g *huma.Group, conn *gorm.DB) {
	var additionalTags map[string][]string = map[string][]string{}
	var tags []string = []string{"Videos"}
	for _, iapi := range data {
		iapi.AddTags(tags...)
		iapi.AddTags(additionalTags[iapi.ID()]...)
		iapi.Register(g, conn)
	}
}
