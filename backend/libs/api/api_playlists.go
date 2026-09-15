package api

import (
	"context"
	"net/http"
	. "vp/libs/definitions"
	"vp/libs/registry"

	"github.com/danielgtaylor/huma/v2"
	"gorm.io/gorm"
)

func setupApiPlaylists(g *huma.Group, conn *gorm.DB, ctx context.Context, r registry.IRegistryPlaylist) {
	var data = []IApi{
		&ApiDefinition[registry.NewPlaylistRequest, registry.NewPlaylistResponse]{
			Callback: r.NewPlaylist,
			Operation: huma.Operation{
				OperationID: "playlist-new",
				Method:      http.MethodPost,
				Path:        "/",
				Summary:     "Add a new playlist",
				Description: "Create a playlist with some videos",
				Errors: []int{
					http.StatusBadRequest,
					http.StatusNotFound,
					http.StatusInternalServerError,
				},
			},
		},
		&ApiDefinition[registry.ListPlaylistRequest, registry.ListPlaylistResponse]{
			Callback: r.ListPlaylist,
			Operation: huma.Operation{
				OperationID: "playlist-list",
				Method:      http.MethodGet,
				Path:        "/",
				Summary:     "Playlist list",
				Description: "Get the list of playlists. Optional: you can filter them",
				Errors: []int{
					http.StatusInternalServerError,
				},
			},
		},
		&ApiDefinition[registry.GetPlaylistRequest, registry.GetPlaylistResponse]{
			Callback: r.GetPlaylist,
			Operation: huma.Operation{
				OperationID: "playlist-get",
				Method:      http.MethodGet,
				Path:        "/{id}",
				Summary:     "Get Playlist",
				Description: "Get the specified playlist",
				Parameters: []*huma.Param{
					{
						In:          "path",
						Name:        "id",
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
		&ApiDefinition[registry.GetPlaylistM3URequest, registry.GetPlaylistM3UResponse]{
			Callback: r.GetPlaylistM3U,
			Operation: huma.Operation{
				OperationID: "playlist-get-m3u",
				Method:      http.MethodGet,
				Path:        "/{id}/m3u",
				Summary:     "Get Playlist in M3U format",
				Description: "Get the specified playlist in M3U Format",
				Parameters: []*huma.Param{
					{
						In:          "path",
						Name:        "id",
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
		&ApiDefinition[registry.DeletePlaylistRequest, registry.DeletePlaylistResponse]{
			Callback: r.DeletePlaylist,
			Operation: huma.Operation{
				OperationID: "playlist-delete",
				Method:      http.MethodDelete,
				Path:        "/{id}",
				Summary:     "Delete playlist",
				Description: "Delete a specific playlist",
				Parameters: []*huma.Param{
					{
						In:          "path",
						Name:        "id",
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
		&ApiDefinition[registry.UpdatePlaylistRequest, registry.UpdatePlaylistResponse]{
			Callback: r.PatchPlaylist,
			Operation: huma.Operation{
				OperationID: "playlist-patch",
				Method:      http.MethodPatch,
				Path:        "/{id}",
				Summary:     "Patch a playlist",
				Description: "Update some informations about the playlist",
				Parameters: []*huma.Param{
					{
						In:          "path",
						Name:        "id",
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
		&ApiDefinition[registry.AddVideoToPlaylistRequest, registry.AddVideoToPlaylistResponse]{
			Callback: r.AddVideoToPlaylist,
			Operation: huma.Operation{
				OperationID: "playlist-add-video",
				Method:      http.MethodPatch,
				Path:        "/{playlistId}/video/{videoId}",
				Summary:     "Add a video to playlist",
				Description: "Add the specified video to the selected playlist",
				Parameters: []*huma.Param{
					{
						In:          "path",
						Name:        "playlistId",
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
		&ApiDefinition[registry.DeleteVideoFromPlaylistRequest, registry.DeleteVideoFromPlaylistResponse]{
			Callback: r.DeleteVideoToPlaylist,
			Operation: huma.Operation{
				OperationID: "playlist-delete-video",
				Method:      http.MethodDelete,
				Path:        "/{playlistId}/video/{videoId}",
				Summary:     "Remove a video from playlist",
				Description: "Remove the specified video from the selected playlist",
				Parameters: []*huma.Param{
					{
						In:          "path",
						Name:        "playlistId",
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
	var tags []string = []string{"Playlist"}
	for _, iapi := range data {
		iapi.AddTags(tags...)
		iapi.AddTags(additionalTags[iapi.ID()]...)
		iapi.Register(g, conn, ctx)
	}
}
