package apifolder

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
	. "vp/libs/definitions"
	"vp/libs/models"

	"github.com/danielgtaylor/huma/v2"
	"gorm.io/gorm"
)

var data = []IApi{
	&ApiDefinition[NewFolderRequest, NewFolderResponse]{
		Callback: CB_NewFolder,
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
	&ApiDefinition[ListFolderRequest, ListFolderResponse]{
		Callback: CB_ListFolder,
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
	&ApiDefinition[GetFolderRequest, GetFolderResponse]{
		Callback: CB_GetFolder,
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
	&ApiDefinition[CleanupFolderRequest, CleanupFolderResponse]{
		Callback: CB_CleanupFolders,
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
	&ApiDefinition[DeleteFolderRequest, DeleteFolderResponse]{
		Callback: CB_DeleteFolder,
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
}

func Setup(g *huma.Group, conn *gorm.DB) {
	var additionalTags map[string][]string = map[string][]string{}
	var tags []string = []string{"Folders"}
	for _, iapi := range data {
		iapi.AddTags(tags...)
		iapi.AddTags(additionalTags[iapi.ID()]...)
		iapi.Register(g, conn)
	}

	huma.Register(g, huma.Operation{
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
	}, func(ctx context.Context, i *GetFolderStreamingRequest) (*huma.StreamResponse, error) {
		var out = CB_GetFolder(conn, &GetFolderRequest{Id: i.Id, PreloadVideos: i.PreloadVideos})
		out.Init()
		if out.StatusCode != 200 {
			return nil, huma.NewError(out.StatusCode, out.ErrorTitle, out.Errors...)
		}
		var folder = out.Value.Body
		return &huma.StreamResponse{
			Body: func(hctx huma.Context) {
				var (
					timeout  time.Duration      = time.Second * 5
					writer   io.Writer          = hctx.BodyWriter()
					template string             = "event: %s\ndata: %s\n\n"
					ch       chan *models.Video = make(chan *models.Video, 1)
					nextIter bool               = true
					ticker                      = time.NewTicker(timeout)
				)

				go folder.ScanStream(ch)
				for nextIter {
					ticker.Reset(timeout)
					select {
					case v := <-ch:
						if v.Folder == nil {
							nextIter = false
							fmt.Fprintf(writer, template, "end", "end 1")
						} else {
							if tx := conn.Create(&v); tx.Error != nil {
								fmt.Fprintf(writer, template, "error", tx.Error.Error())
							} else {
								if b, err := json.Marshal(v); err != nil {
									fmt.Fprintf(writer, template, "error", err.Error())
								} else {
									fmt.Fprintf(writer, template, "video", string(b))
								}
							}
						}
						if flusher, ok := writer.(http.Flusher); ok {
							flusher.Flush()
						}
					case <-hctx.Context().Done():
						nextIter = false
						fmt.Fprintf(writer, template, "end", "end 2")
						if flusher, ok := writer.(http.Flusher); ok {
							flusher.Flush()
						}
					case <-ticker.C:
						nextIter = false
						fmt.Fprintf(writer, template, "end", "end 3")
						if flusher, ok := writer.(http.Flusher); ok {
							flusher.Flush()
						}
					}
				}

			},
		}, nil
	})
}
