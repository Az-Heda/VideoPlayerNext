package apivideo

import "vp/libs/models"

type (
	ListVideoRequest struct {
		Id      string `query:"id"`
		Path    string `query:"path"`
		Watched string `query:"watched"`
	}
	ListVideoResponse struct {
		Body []models.Video
	}
	GetVideoRequest  struct{}
	GetVideoResponse struct{}
)
