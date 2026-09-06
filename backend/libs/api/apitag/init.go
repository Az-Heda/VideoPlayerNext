package apitag

import (
	"net/http"
	. "vp/libs/definitions"

	"github.com/danielgtaylor/huma/v2"
	"gorm.io/gorm"
)

var data = []IApi{
	&ApiDefinition[NewTagRequest, NewTagResponse]{
		Callback: CB_NewTag,
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
	&ApiDefinition[ListTagRequest, ListTagResponse]{
		Callback: CB_ListTag,
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
	&ApiDefinition[GetTagRequest, GetTagResponse]{
		Callback: CB_GetTag,
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
	&ApiDefinition[DeleteTagRequest, DeleteTagResponse]{
		Callback: CB_DeleteTag,
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
	&ApiDefinition[AddVideoToTagRequest, AddVideoToTagResponse]{
		Callback: CB_AddVideoToTag,
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
	&ApiDefinition[DeleteVideoFromTagRequest, DeleteVideoFromTagResponse]{
		Callback: CB_DeleteVideoToTag,
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

func Setup(g *huma.Group, conn *gorm.DB) {
	var additionalTags map[string][]string = map[string][]string{}
	var tags []string = []string{"Tags"}
	for _, iapi := range data {
		iapi.AddTags(tags...)
		iapi.AddTags(additionalTags[iapi.ID()]...)
		iapi.Register(g, conn)
	}
}
