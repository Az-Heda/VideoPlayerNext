package api

import (
	"context"
	"net/http"
	. "vp/libs/definitions"
	"vp/libs/registry"

	"github.com/danielgtaylor/huma/v2"
	"gorm.io/gorm"
)

func setupApiVideos(g *huma.Group, conn *gorm.DB, ctx context.Context, r registry.IRegistryVideo) {
	var data = []IApi{
		&ApiDefinition[registry.ListVideoRequest, registry.ListVideoResponse]{
			Callback: r.ListVideos,
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
		&ApiDefinition[registry.GetVideoRequest, registry.GetVideoResponse]{
			Callback: r.GetVideo,
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
						Required:    true,
					},
				},
				Errors: []int{
					http.StatusInternalServerError,
				},
			},
		},
		&ApiDefinition[registry.PatchVideoWatchedRequest, registry.PatchVideoWatchedResponse]{
			Callback: r.AttrWatched,
			Operation: huma.Operation{
				OperationID: "video-watched-patch",
				Method:      http.MethodPatch,
				Path:        "/{id}/watched",
				Summary:     "Change watched flag for videos",
				Description: "Set the watched flags for videos as true/false",
				Parameters: []*huma.Param{
					{
						In:          "path",
						Name:        "id",
						Description: "Video id",
						Required:    true,
					},
				},
				Errors: []int{
					http.StatusBadRequest,
					http.StatusNotFound,
					http.StatusConflict,
					http.StatusInternalServerError,
				},
			},
		},
	}
	var additionalTags map[string][]string = map[string][]string{}
	var tags []string = []string{"Videos"}
	for _, iapi := range data {
		iapi.AddTags(tags...)
		iapi.AddTags(additionalTags[iapi.ID()]...)
		iapi.Register(g, conn, ctx)
	}
}
