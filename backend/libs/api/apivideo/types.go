package apivideo

import "vp/libs/models"

type (
	Preload struct {
		PreloadPlaylist bool `query:"preloadPlaylist"`
		PreloadFolder   bool `query:"preloadFolder"`
		PreloadTags     bool `query:"preloadTags"`
	}

	ListVideoRequest struct {
		Ids          []string `query:"id,explode"`
		Path         string   `query:"path"`
		Watched      string   `query:"watched"`
		OnlyExisting bool     `query:"show-only-existing" default:"true"`
		Preload
	}
	ListVideoResponse struct {
		Body []models.Video
	}
	GetVideoRequest struct {
		Id string `path:"id"`
		Preload
	}
	GetVideoResponse struct {
		Body models.Video
	}
)
