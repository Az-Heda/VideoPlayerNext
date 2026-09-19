package api

import (
	"context"
	"net/http"
	. "vp/libs/definitions"
	"vp/libs/registry"

	"github.com/danielgtaylor/huma/v2"
	"gorm.io/gorm"
)

func setupApiSystemLog(g *huma.Group, conn *gorm.DB, ctx context.Context, r registry.IRegistrySystemLog) {
	var data = []IApi{
		&ApiDefinition[registry.ListSystemLogRequest, registry.ListSystemLogResponse]{
			Callback: r.ListSystemLog,
			Operation: huma.Operation{
				OperationID: "systemlog-list",
				Method:      http.MethodGet,
				Path:        "/",
				Summary:     "Systemlog list",
				Description: "Get the list of all SystemLogs saved",
				Errors: []int{
					http.StatusInternalServerError,
				},
			},
		},
		&ApiDefinition[registry.GetSystemLogRequest, registry.GetSystemLogResponse]{
			Callback: r.GetSystemLog,
			Operation: huma.Operation{
				OperationID: "systemlog-get",
				Method:      http.MethodGet,
				Path:        "/{id}",
				Summary:     "Get system log info",
				Description: "Get the desired system log information",
				Parameters: []*huma.Param{
					{
						In:          "path",
						Name:        "id",
						Description: "SystemLog id",
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
	var tags []string = []string{"System Logs"}
	for _, iapi := range data {
		iapi.AddTags(tags...)
		iapi.AddTags(additionalTags[iapi.ID()]...)
		iapi.Register(g, conn, ctx)
	}
}
