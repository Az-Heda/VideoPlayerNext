package api

import (
	"context"
	"net/http"
	. "vp/libs/definitions"
	"vp/libs/registry"

	"github.com/danielgtaylor/huma/v2"
	"gorm.io/gorm"
)

func setupApiTags(g *huma.Group, conn *gorm.DB, ctx context.Context, r registry.IRegistryTag) {
	var data = []IApi{
		&ApiDefinition[registry.NewTagRequest, registry.NewTagResponse]{
			Callback: r.NewTag,
			Operation: huma.Operation{
				OperationID: "tag-new",
				Method:      http.MethodPost,
				Path:        "/",
				Summary:     "Create a new tag",
				Description: "Create a new tag using the given name and attributes",
				Errors: []int{
					http.StatusBadRequest,
					http.StatusConflict,
					http.StatusInternalServerError,
				},
			},
		},
		&ApiDefinition[registry.ListTagRequest, registry.ListTagResponse]{
			Callback: r.ListTag,
			Operation: huma.Operation{
				OperationID: "tag-list",
				Method:      http.MethodGet,
				Path:        "/",
				Summary:     "Tag list",
				Description: "Get the list of tags. Optional: You can filter them",
				Errors: []int{
					http.StatusInternalServerError,
				},
			},
		},
		&ApiDefinition[registry.GetTagRequest, registry.GetTagResponse]{
			Callback: r.GetTag,
			Operation: huma.Operation{
				OperationID: "tag-get",
				Method:      http.MethodGet,
				Path:        "/{id}",
				Summary:     "Get tag",
				Description: "Get the specific tag",
				Parameters: []*huma.Param{
					{
						In:          "path",
						Name:        "id",
						Description: "Tag id",
						Required:    true,
					},
				},
				Errors: []int{
					http.StatusNotFound,
					http.StatusConflict,
					http.StatusInternalServerError,
				},
			},
		},
		&ApiDefinition[registry.DeleteTagRequest, registry.DeleteTagResponse]{
			Callback: r.DeleteTag,
			Operation: huma.Operation{
				OperationID: "tag-delete",
				Method:      http.MethodDelete,
				Path:        "/{id}",
				Summary:     "Remove a tag",
				Description: "Remove the specified tag",
				Parameters: []*huma.Param{
					{
						In:          "path",
						Name:        "id",
						Description: "Tag id",
						Required:    true,
					},
				},
				Errors: []int{
					http.StatusNotFound,
					http.StatusConflict,
					http.StatusInternalServerError,
				},
			},
		},
		&ApiDefinition[registry.AddVideoToTagRequest, registry.AddVideoToTagResponse]{
			Callback: r.AddVideoToTag,
			Operation: huma.Operation{
				OperationID: "tag-add-video",
				Method:      http.MethodPatch,
				Path:        "/{tagId}/video/{videoId}",
				Summary:     "Add a video to tag",
				Description: "Add the specified video to the selected tag",
				Parameters: []*huma.Param{
					{
						In:          "path",
						Name:        "tagId",
						Description: "Playlist id",
						Required:    true,
					},
					{
						In:          "path",
						Name:        "videoId",
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
		&ApiDefinition[registry.DeleteVideoFromTagRequest, registry.DeleteVideoFromTagResponse]{
			Callback: r.DeleteVideoToTag,
			Operation: huma.Operation{
				OperationID: "tag-delete-video",
				Method:      http.MethodDelete,
				Path:        "/{tagId}/video/{videoId}",
				Summary:     "Remove a video from tag",
				Description: "Remove the specified video from the selected tag",
				Parameters: []*huma.Param{
					{
						In:          "path",
						Name:        "tagId",
						Description: "Playlist id",
						Required:    true,
					},
					{
						In:          "path",
						Name:        "videoId",
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
	var tags []string = []string{"Tags"}
	for _, iapi := range data {
		iapi.AddTags(tags...)
		iapi.AddTags(additionalTags[iapi.ID()]...)
		iapi.Register(g, conn, ctx)
	}
}
