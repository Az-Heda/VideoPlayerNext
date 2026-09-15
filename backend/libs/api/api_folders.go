package api

import (
	"context"
	"net/http"
	. "vp/libs/definitions"
	"vp/libs/registry"

	"github.com/danielgtaylor/huma/v2"
	"gorm.io/gorm"
)

func setupApiFolders(g *huma.Group, conn *gorm.DB, ctx context.Context, r registry.IRegistryFolder) {
	var data = []IApi{
		&ApiDefinition[registry.NewFolderRequest, registry.NewFolderResponse]{
			Callback: r.NewFolder,
			Operation: huma.Operation{
				OperationID: "folder-new",
				Method:      http.MethodPost,
				Path:        "/",
				Summary:     "Add a new folder",
				Description: "Start tracking a new folder.\nNote: this will NOT create a folder on disk",
				Errors: []int{
					http.StatusNotFound,
					http.StatusUnprocessableEntity,
					http.StatusInternalServerError,
				},
			},
		},
		&ApiDefinition[registry.ListFolderRequest, registry.ListFolderResponse]{
			Callback: r.ListFolder,
			Operation: huma.Operation{
				OperationID: "folder-list",
				Method:      http.MethodGet,
				Path:        "/",
				Summary:     "Folder list",
				Description: "Get the list of folders. Optional: you can filter them",
				Errors: []int{
					http.StatusInternalServerError,
				},
			},
		},
		&ApiDefinition[registry.GetFolderRequest, registry.GetFolderResponse]{
			Callback: r.GetFolder,
			Operation: huma.Operation{
				OperationID: "folder-get",
				Method:      http.MethodGet,
				Path:        "/{id}",
				Summary:     "Get folder",
				Description: "Get the specified folder",
				Parameters: []*huma.Param{
					{
						In:          "path",
						Name:        "id",
						Description: "Folder id",
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
		&ApiDefinition[registry.CleanupFolderRequest, registry.CleanupFolderResponse]{
			Callback: r.CleanupFolders,
			Operation: huma.Operation{
				OperationID: "folder-cleanup",
				Method:      http.MethodPost,
				Path:        "/cleanup",
				Summary:     "Cleanup non-existing folders",
				Description: "Find / Remove all non-existing folders",
				Parameters: []*huma.Param{
					{
						In:          "query",
						Name:        "doDelete",
						Description: "Choose if the non-existing folder should be deleted or not",
						Required:    true,
					},
				},
				Errors: []int{
					http.StatusInternalServerError,
				},
			},
		},
		&ApiDefinition[registry.DeleteFolderRequest, registry.DeleteFolderResponse]{
			Callback: r.DeleteFolder,
			Operation: huma.Operation{
				OperationID: "folder-delete",
				Method:      http.MethodDelete,
				Path:        "/{id}",
				Summary:     "Remove tracking folder",
				Description: "Remove the tracked folder from the internal database.\nNote: the folder on disk is NOT deleted",
				Parameters: []*huma.Param{
					{
						In:          "path",
						Name:        "id",
						Description: "Folder id",
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
		&ApiDefinition[registry.GetFolderStreamingRequest, huma.StreamResponse]{
			Callback: r.ScanFolderStream,
			Operation: huma.Operation{
				OperationID: "folder-scan-stream",
				Method:      http.MethodGet,
				Path:        "/{id}/stream",
				Summary:     "Scan stream",
				Description: "Scan all files in the folder and stream the results via SSE",
				Parameters: []*huma.Param{
					{
						In:          "path",
						Name:        "id",
						Description: "Folder id",
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
	}

	var additionalTags map[string][]string = map[string][]string{}
	var tags []string = []string{"Folders"}
	for _, iapi := range data {
		iapi.AddTags(tags...)
		iapi.AddTags(additionalTags[iapi.ID()]...)
		iapi.Register(g, conn, ctx)
	}
}
