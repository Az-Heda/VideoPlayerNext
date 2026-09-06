package apifolder

import "vp/libs/models"

type (
	Preload struct {
		PreloadVideos bool `query:"preloadVideos"`
	}
	NewFolderRequest struct {
		Body struct {
			Path string `json:"path"`
		}
	}
	NewFolderResponse struct {
		Body models.Folder
	}
	ListFolderRequest struct {
		Ids  []string `query:"id,explode"`
		Path string   `query:"path"`
		Preload
	}
	ListFolderResponse struct {
		Body []models.Folder
	}
	GetFolderRequest struct {
		Id   string `path:"id"`
		Scan bool   `query:"scan"`
		Preload
	}
	GetFolderResponse struct {
		Body models.Folder
	}
	GetFolderStreamingRequest struct {
		Id string `path:"id"`
		Preload
	}
	DeleteFolderRequest struct {
		Id string `path:"id"`
	}
	DeleteFolderResponse struct {
		Body models.Folder
	}
	CleanupFolderRequest struct {
		DoDelete bool `query:"doDelete"`
		Preload
	}
	CleanupFolderResponse struct {
		Body struct {
			Valid   []models.Folder `json:"valid"`
			Invalid []models.Folder `json:"invalid"`
		}
	}
)
