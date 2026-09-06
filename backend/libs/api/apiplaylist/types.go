package apiplaylist

import "vp/libs/models"

type (
	Preload struct {
		PreloadVideos       bool `query:"preloadVideos"`
		PreloadVideosFolder bool `query:"preloadVideosFolders"`
	}
	NewPlaylistRequest struct {
		Body struct {
			Name string   `json:"name"`
			Ids  []string `json:"ids"`
		}
	}
	NewPlaylistResponse struct {
		Body models.Playlist
	}
	ListPlaylistRequest struct {
		Ids  []string `query:"id,explode"`
		Name string   `query:"name"`
		Preload
	}
	ListPlaylistResponse struct {
		Body []models.Playlist
	}
	GetPlaylistRequest struct {
		Id string `path:"id"`
		Preload
	}
	GetPlaylistResponse struct {
		Body models.Playlist
	}
	GetPlaylistM3URequest struct {
		Id string `path:"id"`
	}
	GetPlaylistM3UResponse struct {
		ContentType string `header:"Content-Type"`
		Body        []byte
	}
	DeletePlaylistRequest struct {
		Id string `path:"id"`
	}
	DeletePlaylistResponse struct {
		Body models.Playlist
	}
	UpdatePlaylistRequest struct {
		Id   string `path:"id"`
		Body models.Playlist
	}
	UpdatePlaylistResponse struct {
		Body models.Playlist
	}
	AddVideoToPlaylistRequest struct {
		PlaylistId string `path:"playlistId"`
		VideoId    string `path:"videoId"`
	}
	AddVideoToPlaylistResponse struct {
		Body models.Video
	}
	DeleteVideoFromPlaylistRequest struct {
		PlaylistId string `path:"playlistId"`
		VideoId    string `path:"videoId"`
	}
	DeleteVideoFromPlaylistResponse struct {
		Body models.Video
	}
)
