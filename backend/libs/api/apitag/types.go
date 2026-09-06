package apitag

import "vp/libs/models"

type (
	Preload struct {
		PreloadVideos bool `query:"preloadVideos"`
	}

	NewTagRequest struct {
		Body struct {
			Name string   `json:"name"`
			Ids  []string `json:"ids"`
		}
	}
	NewTagResponse struct {
		Body models.Tag
	}

	ListTagRequest struct {
		Ids  []string `query:"id,explode"`
		Name string   `query:"name"`
		Preload
	}
	ListTagResponse struct {
		Body []models.Tag
	}

	GetTagRequest struct {
		Id string `path:"id"`
		Preload
	}
	GetTagResponse struct {
		Body models.Tag
	}

	DeleteTagRequest struct {
		Id string `path:"id"`
	}
	DeleteTagResponse struct {
		Body models.Tag
	}

	AddVideoToTagRequest struct {
		TagId   string `path:"tagId"`
		VideoId string `path:"videoId"`
	}
	AddVideoToTagResponse struct {
		Body models.Video
	}
	DeleteVideoFromTagRequest struct {
		TagId   string `path:"tagId"`
		VideoId string `path:"videoId"`
	}
	DeleteVideoFromTagResponse struct {
		Body models.Video
	}
)
