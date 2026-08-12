package apifolder

import "vp/libs/models"

type (
	NewFolderRequest struct {
		Body struct {
			Path string `json:"path"`
		}
	}
	NewFolderResponse struct {
		Body models.Folder
	}
	ListFolderRequest struct {
		Id            string `query:"id"`
		Path          string `query:"path"`
		PreloadVideos bool   `query:"preloadVideos"`
	}
	ListFolderResponse struct {
		Body []models.Folder
	}
	GetFolderRequest struct {
		Id            string `path:"id"`
		Scan          bool   `query:"scan"`
		PreloadVideos bool   `query:"preloadVideos"`
	}
	GetFolderResponse struct {
		Body models.Folder
	}
	GetFolderStreamingRequest struct {
		Id            string `path:"id"`
		PreloadVideos bool   `query:"preloadVideos"`
	}
	DeleteFolderRequest struct {
		Id string `path:"id"`
	}
	DeleteFolderResponse struct {
		Body models.Folder
	}
	CleanupFolderRequest struct {
		DoDelete bool `query:"doDelete"`
	}
	CleanupFolderResponse struct {
		Body struct {
			Valid   []models.Folder `json:"valid"`
			Invalid []models.Folder `json:"invalid"`
		}
	}
)
