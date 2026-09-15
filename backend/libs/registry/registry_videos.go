package registry

import (
	"context"
	"net/http"
	"strings"
	. "vp/libs/array"
	. "vp/libs/definitions"
	"vp/libs/models"

	"gorm.io/gorm"
)

type (
	registryVideo  struct{}
	IRegistryVideo interface {
		// 200 OK
		//
		// 400 Bad Request
		//
		// 500 Internal Server Error
		ListVideos(ctx context.Context, conn *gorm.DB, i *ListVideoRequest) ApiExchange[ListVideoResponse]

		// 200 OK
		//
		// 400 Bad Request
		//
		// 404 Not Found
		//
		// 409 Conflict
		//
		// 500 Internal Server Error
		GetVideo(ctx context.Context, conn *gorm.DB, i *GetVideoRequest) ApiExchange[GetVideoResponse]

		// 200 OK
		//
		// 400 Bad Request
		//
		// 404 Not Found
		//
		// 409 Conflict
		//
		// 500 Internal Server Error
		AttrWatched(ctx context.Context, conn *gorm.DB, i *PatchVideoWatchedRequest) ApiExchange[PatchVideoWatchedResponse]
	}

	PreloadVideos struct {
		PreloadPlaylist bool `query:"preloadPlaylist"`
		PreloadFolder   bool `query:"preloadFolder"`
		PreloadTags     bool `query:"preloadTags"`
	}

	ListVideoRequest struct {
		Ids          []string `query:"id,explode"`
		Path         string   `query:"path"`
		Watched      string   `query:"watched"`
		OnlyExisting bool     `query:"show-only-existing" default:"true"`
		PreloadVideos
	}
	ListVideoResponse struct {
		Body []models.Video
	}
	GetVideoRequest struct {
		Id string `path:"id"`
		PreloadVideos
	}
	GetVideoResponse struct {
		Body models.Video
	}

	PatchVideoWatchedRequest struct {
		Id      string `path:"id"`
		Watched bool   `query:"attr,required"`
	}
	PatchVideoWatchedResponse struct {
		Body models.Video
	}
)

func (r registryVideo) ListVideos(ctx context.Context, conn *gorm.DB, i *ListVideoRequest) ApiExchange[ListVideoResponse] {
	var videos []models.Video
	var filtered *gorm.DB = models.Video{}.Preload(conn.WithContext(ctx), i.PreloadFolder, i.PreloadPlaylist, i.PreloadTags)

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

	filtered = filtered.Order("fullpath ASC")

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

func (r registryVideo) GetVideo(ctx context.Context, conn *gorm.DB, i *GetVideoRequest) ApiExchange[GetVideoResponse] {
	var out = r.ListVideos(ctx, conn, &ListVideoRequest{
		Ids:           []string{i.Id},
		PreloadVideos: i.PreloadVideos,
	})
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

func (r registryVideo) AttrWatched(ctx context.Context, conn *gorm.DB, i *PatchVideoWatchedRequest) ApiExchange[PatchVideoWatchedResponse] {
	var videoRequest = r.GetVideo(ctx, conn, &GetVideoRequest{
		Id: i.Id,
		PreloadVideos: PreloadVideos{
			PreloadPlaylist: true,
			PreloadFolder:   true,
			PreloadTags:     true,
		}})
	videoRequest.Init()
	if videoRequest.StatusCode != http.StatusOK {
		return ConvertApiExchange[GetVideoResponse, PatchVideoWatchedResponse](videoRequest)
	}

	var video = videoRequest.Value.Body

	video.Attributes.Watched = &i.Watched
	if tx := conn.WithContext(ctx).Save(&video); tx.Error != nil {
		return ApiExchangeDatabaseError[PatchVideoWatchedResponse](tx.Error)
	}

	return ApiExchange[PatchVideoWatchedResponse]{
		Value:      &PatchVideoWatchedResponse{Body: video},
		StatusCode: http.StatusOK,
	}
}
