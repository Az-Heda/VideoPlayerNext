package apivideo

import (
	"net/http"
	"strings"
	. "vp/libs/array"
	. "vp/libs/definitions"
	"vp/libs/models"

	"gorm.io/gorm"
)

// 200 OK
//
// 400 Bad Request
//
// 500 Internal Server Error
func CB_ListVideo(conn *gorm.DB, i *ListVideoRequest) ApiExchange[ListVideoResponse] {
	var videos []models.Video
	var filtered *gorm.DB = models.Video{}.Preload(conn, i.Preload.PreloadFolder, i.Preload.PreloadPlaylist, i.Preload.PreloadTags)

	switch strings.ToLower(i.Watched) {
	case "true", "t", "1", "on", "yes", "y":
		filtered = filtered.Where("attrib_watched = ?", true)
	case "false", "f", "0", "off", "no", "n":
		filtered = filtered.Where("attrib_watched = ?", false)
	case "":
	default:
		return ApiExchange[ListVideoResponse]{
			StatusCode: http.StatusBadRequest,
			ErrorTitle: "Malformed input",
		}
	}

	switch {
	case len(i.Ids) > 0:
		filtered = filtered.Where("id IN ?", i.Ids)
	case i.Path != "" && !strings.Contains(i.Path, "%"):
		filtered = filtered.Where("fullpath LIKE ?", "%"+i.Path+"%")
	default:
	}

	if tx := filtered.Find(&videos); tx.Error != nil {
		return ApiExchangeDatabaseError[ListVideoResponse](tx.Error)
	}

	if videos == nil {
		videos = make([]models.Video, 0)
	} else {
		videos = Filter(videos, func(video models.Video, idx int) bool {
			switch {
			case !i.OnlyExisting:
				return true
			case i.OnlyExisting && video.Attributes.Exists == nil:
				return false
			case i.OnlyExisting && video.Attributes.Exists != nil:
				return *video.Attributes.Exists
			default:
				return false
			}
		})
	}
	return ApiExchange[ListVideoResponse]{
		Value:      &ListVideoResponse{Body: videos},
		StatusCode: http.StatusOK,
	}
}

// 200 OK
//
// 400 Bad Request
//
// 404 Not Found
//
// 409 Conflict
//
// 500 Internal Server Error
func CB_GetVideo(conn *gorm.DB, i *GetVideoRequest) ApiExchange[GetVideoResponse] {
	var out = CB_ListVideo(conn, &ListVideoRequest{Ids: []string{i.Id}, Preload: i.Preload})
	out.Init()
	if out.StatusCode != http.StatusOK {
		return ConvertApiExchange[ListVideoResponse, GetVideoResponse](out)
	}

	switch len(out.Value.Body) {
	case 0:
		return ApiExchange[GetVideoResponse]{StatusCode: http.StatusNotFound}
	case 1:
		var video = out.Value.Body[0]
		return ApiExchange[GetVideoResponse]{
			Value:      &GetVideoResponse{Body: video},
			StatusCode: http.StatusOK,
		}
	default:
		return ApiExchange[GetVideoResponse]{StatusCode: http.StatusConflict}
	}
}
