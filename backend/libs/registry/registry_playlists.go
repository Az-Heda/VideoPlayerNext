package registry

import (
	"context"
	"fmt"
	"net/http"
	"slices"
	"strings"
	"vp/libs/array"
	. "vp/libs/definitions"
	"vp/libs/models"
	. "vp/libs/utility"

	"gorm.io/gorm"
)

type (
	registryPlaylist  struct{}
	IRegistryPlaylist interface {
		NewPlaylist(ctx context.Context, conn *gorm.DB, i *NewPlaylistRequest) ApiExchange[NewPlaylistResponse]
		ListPlaylist(ctx context.Context, conn *gorm.DB, i *ListPlaylistRequest) ApiExchange[ListPlaylistResponse]
		GetPlaylist(ctx context.Context, conn *gorm.DB, i *GetPlaylistRequest) ApiExchange[GetPlaylistResponse]
		GetPlaylistM3U(ctx context.Context, conn *gorm.DB, i *GetPlaylistM3URequest) ApiExchange[GetPlaylistM3UResponse]
		DeletePlaylist(ctx context.Context, conn *gorm.DB, i *DeletePlaylistRequest) ApiExchange[DeletePlaylistResponse]
		PatchPlaylist(ctx context.Context, conn *gorm.DB, i *UpdatePlaylistRequest) ApiExchange[UpdatePlaylistResponse]
		AddVideoToPlaylist(ctx context.Context, conn *gorm.DB, i *AddVideoToPlaylistRequest) ApiExchange[AddVideoToPlaylistResponse]
		DeleteVideoToPlaylist(ctx context.Context, conn *gorm.DB, i *DeleteVideoFromPlaylistRequest) ApiExchange[DeleteVideoFromPlaylistResponse]
	}
	PreloadPlaylist struct {
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
		PreloadPlaylist
	}
	ListPlaylistResponse struct {
		Body []models.Playlist
	}
	GetPlaylistRequest struct {
		Id string `path:"id"`
		PreloadPlaylist
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

func (r registryPlaylist) NewPlaylist(ctx context.Context, conn *gorm.DB, i *NewPlaylistRequest) ApiExchange[NewPlaylistResponse] {
	reg, ok := ctx.Value("registry").(Registry)
	if !ok {
		return ApiExchange[NewPlaylistResponse]{
			StatusCode: http.StatusInternalServerError,
			ErrorTitle: "Registry not found",
		}
	}
	var apiVideo = reg.Videos
	var vids ApiExchange[ListVideoResponse] = ApiExchange[ListVideoResponse]{
		Value:      &ListVideoResponse{Body: []models.Video{}},
		StatusCode: http.StatusOK,
	}
	if len(i.Body.Ids) > 0 {
		vids = apiVideo.ListVideos(ctx, conn, &ListVideoRequest{Ids: i.Body.Ids})
		vids.Init()
		if vids.StatusCode != 200 {
			return ConvertApiExchange[ListVideoResponse, NewPlaylistResponse](vids)
		}
	}

	if len(vids.Value.Body) < len(i.Body.Ids) {
		var errs []error

		var idsFound = array.Map[[]models.Video, []string](vids.Value.Body, func(item models.Video, idx int) string {
			return item.Id
		})

		for _, i := range i.Body.Ids {
			if !slices.Contains(idsFound, i) {
				errs = append(errs, fmt.Errorf("cannot find video id='%s'", i))
			}
		}
		return ApiExchange[NewPlaylistResponse]{
			StatusCode: http.StatusNotFound,
			ErrorTitle: "Unknown videos",
			Errors:     errs,
		}
	}

	var videoList = array.Map[[]models.Video, []*models.Video](vids.Value.Body, func(item models.Video, idx int) *models.Video { return &item })
	var playlist models.Playlist = models.Playlist{
		Name:   i.Body.Name,
		Videos: &videoList,
	}

	if tx := conn.WithContext(ctx).Create(&playlist); tx.Error != nil {
		return ApiExchangeDatabaseError[NewPlaylistResponse](tx.Error)
	}

	return ApiExchange[NewPlaylistResponse]{
		Value:      &NewPlaylistResponse{Body: playlist},
		StatusCode: http.StatusOK,
	}
}

func (r registryPlaylist) ListPlaylist(ctx context.Context, conn *gorm.DB, i *ListPlaylistRequest) ApiExchange[ListPlaylistResponse] {
	var playlists []models.Playlist
	var filtered *gorm.DB = models.Playlist{}.Preload(conn.WithContext(ctx), i.PreloadVideos, i.PreloadVideosFolder)
	switch {
	case len(i.Ids) > 0:
		filtered = filtered.Where("id IN ?", i.Ids)
	case i.Name != "" && !strings.Contains(i.Name, "%"):
		filtered = filtered.Where("name LIKE ?", "%"+i.Name+"%")
	default:
	}

	if tx := filtered.Find(&playlists); tx.Error != nil {
		return ApiExchangeDatabaseError[ListPlaylistResponse](tx.Error)
	}

	return ApiExchange[ListPlaylistResponse]{
		Value:      &ListPlaylistResponse{Body: playlists},
		StatusCode: http.StatusOK,
	}
}

func (r registryPlaylist) GetPlaylist(ctx context.Context, conn *gorm.DB, i *GetPlaylistRequest) ApiExchange[GetPlaylistResponse] {
	var out = r.ListPlaylist(ctx, conn, &ListPlaylistRequest{
		Ids: []string{i.Id},
		PreloadPlaylist: PreloadPlaylist{
			PreloadVideos:       i.PreloadVideos,
			PreloadVideosFolder: i.PreloadVideosFolder,
		},
	})
	out.Init()
	if out.StatusCode != http.StatusOK {
		return ConvertApiExchange[ListPlaylistResponse, GetPlaylistResponse](out)
	}

	switch len(out.Value.Body) {
	case 0:
		return ApiExchange[GetPlaylistResponse]{StatusCode: http.StatusNotFound}
	case 1:
		var playlist = out.Value.Body[0]
		return ApiExchange[GetPlaylistResponse]{
			Value:      &GetPlaylistResponse{Body: playlist},
			StatusCode: http.StatusOK,
		}
	default:
		return ApiExchange[GetPlaylistResponse]{StatusCode: http.StatusConflict}
	}
}

func (r registryPlaylist) GetPlaylistM3U(ctx context.Context, conn *gorm.DB, i *GetPlaylistM3URequest) ApiExchange[GetPlaylistM3UResponse] {
	var out = r.ListPlaylist(ctx, conn, &ListPlaylistRequest{
		Ids: []string{i.Id},
		PreloadPlaylist: PreloadPlaylist{
			PreloadVideos: true,
		},
	})
	out.Init()
	if out.StatusCode != http.StatusOK {
		return ConvertApiExchange[ListPlaylistResponse, GetPlaylistM3UResponse](out)
	}

	switch len(out.Value.Body) {
	case 0:
		return ApiExchange[GetPlaylistM3UResponse]{StatusCode: http.StatusNotFound}
	case 1:
		var playlist = out.Value.Body[0]
		return ApiExchange[GetPlaylistM3UResponse]{
			Value: &GetPlaylistM3UResponse{
				ContentType: "text/plain",
				Body:        []byte(playlist.String()),
			},
			StatusCode: http.StatusOK,
		}
	default:
		return ApiExchange[GetPlaylistM3UResponse]{StatusCode: http.StatusConflict}
	}
}

func (r registryPlaylist) DeletePlaylist(ctx context.Context, conn *gorm.DB, i *DeletePlaylistRequest) ApiExchange[DeletePlaylistResponse] {
	var out = r.GetPlaylist(ctx, conn, &GetPlaylistRequest{Id: i.Id})
	out.Init()
	if out.StatusCode != http.StatusOK {
		return ConvertApiExchange[GetPlaylistResponse, DeletePlaylistResponse](out)
	}

	var currentPlaylist = out.Value.Body
	if tx := conn.WithContext(ctx).Delete(&currentPlaylist); tx.Error != nil {
		return ApiExchangeDatabaseError[DeletePlaylistResponse](tx.Error)
	}

	return ApiExchange[DeletePlaylistResponse]{
		Value:      &DeletePlaylistResponse{Body: currentPlaylist},
		StatusCode: http.StatusOK,
	}
}

func (r registryPlaylist) PatchPlaylist(ctx context.Context, conn *gorm.DB, i *UpdatePlaylistRequest) ApiExchange[UpdatePlaylistResponse] {
	var out = r.GetPlaylist(ctx, conn, &GetPlaylistRequest{
		Id: i.Id,
		PreloadPlaylist: PreloadPlaylist{
			PreloadVideos: true,
		},
	})
	if out.StatusCode != http.StatusOK {
		return ConvertApiExchange[GetPlaylistResponse, UpdatePlaylistResponse](out)
	}

	var _ models.Playlist
	var in = i.Body
	var p = out.Value.Body
	if !IsZero(in.Name) {
		p.Name = i.Body.Name
	}
	if !IsZero(in.Videos) {
		p.Videos = in.Videos
	}

	// if tx := conn.Model(&p).Select("*").Updates(&p); tx.Error != nil {
	if tx := conn.WithContext(ctx).Save(&p); tx.Error != nil {
		return ApiExchangeDatabaseError[UpdatePlaylistResponse](tx.Error)
	}

	return ApiExchange[UpdatePlaylistResponse]{
		Value:      &UpdatePlaylistResponse{Body: p},
		StatusCode: http.StatusOK,
	}
}

func (r registryPlaylist) AddVideoToPlaylist(ctx context.Context, conn *gorm.DB, i *AddVideoToPlaylistRequest) ApiExchange[AddVideoToPlaylistResponse] {
	reg, ok := ctx.Value("registry").(Registry)
	if !ok {
		return ApiExchange[AddVideoToPlaylistResponse]{
			StatusCode: http.StatusInternalServerError,
			ErrorTitle: "Registry not found",
		}
	}
	var apiVideo = reg.Videos
	var outPlaylist = r.GetPlaylist(ctx, conn, &GetPlaylistRequest{Id: i.PlaylistId})
	outPlaylist.Init()
	if outPlaylist.StatusCode != http.StatusOK {
		return ConvertApiExchange[GetPlaylistResponse, AddVideoToPlaylistResponse](outPlaylist)
	}
	var outVideo = apiVideo.GetVideo(ctx, conn, &GetVideoRequest{
		Id: i.VideoId,
		PreloadVideos: PreloadVideos{
			PreloadPlaylist: true,
			PreloadTags:     true,
			PreloadFolder:   true,
		},
	})
	outVideo.Init()
	if outVideo.StatusCode != http.StatusOK {
		return ConvertApiExchange[GetVideoResponse, AddVideoToPlaylistResponse](outVideo)
	}
	var playlist = outPlaylist.Value.Body
	var video = outVideo.Value.Body
	if playlist.Videos == nil {
		playlist.Videos = &[]*models.Video{}
	}
	for _, v := range *playlist.Videos {
		if v.Id == i.VideoId {
			return ApiExchange[AddVideoToPlaylistResponse]{
				StatusCode: http.StatusOK,
				Value:      &AddVideoToPlaylistResponse{Body: video},
			}
		}
	}

	*playlist.Videos = append(*playlist.Videos, &video)

	if tx := conn.WithContext(ctx).Save(&playlist); tx.Error != nil {
		return ApiExchangeDatabaseError[AddVideoToPlaylistResponse](tx.Error)
	}

	outVideo = apiVideo.GetVideo(ctx, conn, &GetVideoRequest{
		Id: i.VideoId,
		PreloadVideos: PreloadVideos{
			PreloadPlaylist: true,
			PreloadTags:     true,
			PreloadFolder:   true,
		},
	})
	outVideo.Init()
	if outVideo.StatusCode != http.StatusOK {
		return ConvertApiExchange[GetVideoResponse, AddVideoToPlaylistResponse](outVideo)
	}

	return ApiExchange[AddVideoToPlaylistResponse]{
		Value: &AddVideoToPlaylistResponse{Body: outVideo.Value.Body},
	}
}

func (r registryPlaylist) DeleteVideoToPlaylist(ctx context.Context, conn *gorm.DB, i *DeleteVideoFromPlaylistRequest) ApiExchange[DeleteVideoFromPlaylistResponse] {
	reg, ok := ctx.Value("registry").(Registry)
	if !ok {
		return ApiExchange[DeleteVideoFromPlaylistResponse]{
			StatusCode: http.StatusInternalServerError,
			ErrorTitle: "Registry not found",
		}
	}
	var apiVideo = reg.Videos

	var outPlaylist = r.GetPlaylist(ctx, conn, &GetPlaylistRequest{})
	outPlaylist.Init()
	if outPlaylist.StatusCode != http.StatusOK {
		return ConvertApiExchange[GetPlaylistResponse, DeleteVideoFromPlaylistResponse](outPlaylist)
	}

	var playlist = outPlaylist.Value.Body
	if playlist.Videos == nil {
		playlist.Videos = &[]*models.Video{}
	}

	var outVideos = apiVideo.GetVideo(ctx, conn, &GetVideoRequest{
		Id: i.VideoId,
		PreloadVideos: PreloadVideos{
			PreloadPlaylist: true,
			PreloadTags:     true,
			PreloadFolder:   true,
		},
	})
	outVideos.Init()
	if outVideos.StatusCode != http.StatusOK {
		return ConvertApiExchange[GetVideoResponse, DeleteVideoFromPlaylistResponse](outVideos)
	}

	var video = outVideos.Value.Body

	if err := conn.WithContext(ctx).Model(&playlist).Association("Videos").Delete(&video); err != nil {
		return ApiExchangeDatabaseError[DeleteVideoFromPlaylistResponse](err)
	}

	var outVideo = apiVideo.GetVideo(ctx, conn, &GetVideoRequest{
		Id: i.VideoId,
		PreloadVideos: PreloadVideos{
			PreloadPlaylist: true,
			PreloadTags:     true,
			PreloadFolder:   true,
		},
	})
	outVideo.Init()
	if outVideo.StatusCode != http.StatusOK {
		return ConvertApiExchange[GetVideoResponse, DeleteVideoFromPlaylistResponse](outVideo)
	}

	return ApiExchange[DeleteVideoFromPlaylistResponse]{
		Value:      &DeleteVideoFromPlaylistResponse{Body: outVideo.Value.Body},
		StatusCode: http.StatusOK,
	}
}
