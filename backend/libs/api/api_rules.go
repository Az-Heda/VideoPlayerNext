package api

import (
	"context"
	"net/http"
	. "vp/libs/definitions"
	"vp/libs/registry"

	"github.com/danielgtaylor/huma/v2"
	"gorm.io/gorm"
)

func setupApiRules(g *huma.Group, conn *gorm.DB, ctx context.Context, r registry.IRegistryRule) {
	var data = []IApi{
		&ApiDefinition[registry.NewRuleRequest, registry.NewRuleResponse]{
			Callback: r.NewRule,
			Operation: huma.Operation{
				OperationID: "rule-new",
				Method:      http.MethodPost,
				Path:        "/",
				Summary:     "Create a new rule",
				Description: "Create a new automatic rule, use to assign playlist and tags automatically",
				Errors: []int{
					http.StatusBadRequest,
					http.StatusInternalServerError,
				},
			},
		},
		&ApiDefinition[registry.ListRuleRequest, registry.ListRuleResponse]{
			Callback: r.ListRule,
			Operation: huma.Operation{
				OperationID: "rule-list",
				Method:      http.MethodGet,
				Path:        "/",
				Summary:     "Rule list",
				Description: "Get the list of rules. Optional: You can filter them",
				Errors: []int{
					http.StatusInternalServerError,
				},
			},
		},
		&ApiDefinition[registry.GetRuleRequest, registry.GetRuleResponse]{
			Callback: r.GetRule,
			Operation: huma.Operation{
				OperationID: "rule-get",
				Method:      http.MethodGet,
				Path:        "/{id}",
				Summary:     "Get rule",
				Description: "Get the specific rule",
				Parameters: []*huma.Param{
					{
						In:          "path",
						Name:        "id",
						Description: "Rule id",
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
		&ApiDefinition[registry.DeleteRuleRequest, registry.DeleteRuleResponse]{
			Callback: r.DeleteRule,
			Operation: huma.Operation{
				OperationID: "rule-delete",
				Method:      http.MethodDelete,
				Path:        "/{id}",
				Summary:     "Remove a rule",
				Description: "Remove the specified rule",
				Parameters: []*huma.Param{
					{
						In:          "path",
						Name:        "id",
						Description: "Rule id",
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
		&ApiDefinition[registry.AddPlaylistToRuleRequest, registry.AddPlaylistToRuleResponse]{
			Callback: r.AddPlaylistToRule,
			Operation: huma.Operation{
				OperationID: "rule-add-playlist",
				Method:      http.MethodPatch,
				Path:        "/{ruleId}/playlist/{playlistId}",
				Summary:     "Add a playlist to rule",
				Description: "Add the specific playlist to the selected rule",
				Parameters: []*huma.Param{
					{
						In:          "path",
						Name:        "ruleId",
						Description: "Rule id",
						Required:    true,
					},
					{
						In:          "path",
						Name:        "playlistId",
						Description: "Playlist id",
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
		&ApiDefinition[registry.AddTagToRuleRequest, registry.AddTagToRuleResponse]{
			Callback: r.AddTagToRule,
			Operation: huma.Operation{
				OperationID: "rule-add-tag",
				Method:      http.MethodPatch,
				Path:        "/{ruleId}/tag/{tagId}",
				Summary:     "Add a tag to rule",
				Description: "Add the specific tag to the selected rule",
				Parameters: []*huma.Param{
					{
						In:          "path",
						Name:        "ruleId",
						Description: "Rule id",
						Required:    true,
					},
					{
						In:          "path",
						Name:        "tagId",
						Description: "Tag id",
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
		&ApiDefinition[registry.DeletePlaylistToRuleRequest, registry.DeletePlaylistToRuleResponse]{
			Callback: r.DeletePlaylistToRule,
			Operation: huma.Operation{
				OperationID: "rule-delete-playlist",
				Method:      http.MethodDelete,
				Path:        "/{ruleId}/playlist/{playlistId}",
				Summary:     "Remove a playlist from rule",
				Description: "Remove the specified playlist from the selected rule",
				Parameters: []*huma.Param{
					{
						In:          "path",
						Name:        "ruleId",
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
		&ApiDefinition[registry.DeleteTagToRuleRequest, registry.DeleteTagToRuleResponse]{
			Callback: r.DeleteTagToRule,
			Operation: huma.Operation{
				OperationID: "rule-delete-tag",
				Method:      http.MethodDelete,
				Path:        "/{ruleId}/tag/{tagId}",
				Summary:     "Remove a tag from rule",
				Description: "Remove the specified tag from the selected rule",
				Parameters: []*huma.Param{
					{
						In:          "path",
						Name:        "ruleId",
						Description: "Tag id",
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
		&ApiDefinition[registry.ApplyRuleRequest, registry.ApplyRuleResponse]{
			Callback: r.ApplyRuleStream,
			Operation: huma.Operation{
				OperationID: "rule-apply",
				Method:      http.MethodGet,
				Path:        "/apply",
				Summary:     "Apply all automatic rules",
				Description: "Apply all of the rules (or the ones choosed) and return the videos with SSE",
				Errors: []int{
					http.StatusBadRequest,
					http.StatusInternalServerError,
				},
			},
		},
		&ApiDefinition[registry.ValidateRuleRequest, registry.ValidateRuleResponse]{
			Callback: r.ValidateRule,
			Operation: huma.Operation{
				OperationID: "rule-validate",
				Method:      http.MethodPost,
				Path:        "/validate",
				Summary:     "Validate an automatic rule",
				Description: "Given the input rule, validate it (check if the regex can be used) and returns if it's valid and eventually the error",
				Errors: []int{
					http.StatusBadRequest,
				},
			},
		},
	}
	var additionalTags map[string][]string = map[string][]string{}
	var tags []string = []string{"Automatic rules"}
	for _, iapi := range data {
		iapi.AddTags(tags...)
		iapi.AddTags(additionalTags[iapi.ID()]...)
		iapi.Register(g, conn, ctx)
	}
}
