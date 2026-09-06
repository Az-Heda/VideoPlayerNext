package apiplaylist

import (
	"fmt"
	"net/http"
	"slices"
	"strings"
	"vp/libs/api/apivideo"
	"vp/libs/array"
	. "vp/libs/definitions"
	"vp/libs/models"
	. "vp/libs/utility"

	"gorm.io/gorm"
)

// 200 OK
//
// 400 Bad Request
//
// 404 Not Found
//
// 500 Internal Server Error
func CB_NewPlaylist(conn *gorm.DB, i *NewPlaylistRequest) ApiExchange[NewPlaylistResponse] {
	var vids ApiExchange[apivideo.ListVideoResponse] = ApiExchange[apivideo.ListVideoResponse]{
		Value:      &apivideo.ListVideoResponse{Body: []models.Video{}},
		StatusCode: http.StatusOK,
	}
	if len(i.Body.Ids) > 0 {
		vids = apivideo.CB_ListVideo(conn, &apivideo.ListVideoRequest{Ids: i.Body.Ids})
		vids.Init()
		if vids.StatusCode != 200 {
			return ConvertApiExchange[apivideo.ListVideoResponse, NewPlaylistResponse](vids)
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

	if tx := conn.Create(&playlist); tx.Error != nil {
		return ApiExchangeDatabaseError[NewPlaylistResponse](tx.Error)
	}

	return ApiExchange[NewPlaylistResponse]{
		Value:      &NewPlaylistResponse{Body: playlist},
		StatusCode: http.StatusOK,
	}
}

// 200 OK
//
// 500 Internal Server Error
func CB_ListPlaylist(conn *gorm.DB, i *ListPlaylistRequest) ApiExchange[ListPlaylistResponse] {
	var playlists []models.Playlist
	var filtered *gorm.DB = models.Playlist{}.Preload(conn, i.PreloadVideos, i.PreloadVideosFolder)
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

// 200 OK
//
// 400 Bad Request
//
// 404 Not Found
//
// 409 Conflict
//
// 500 Internal Server Error
func CB_GetPlaylist(conn *gorm.DB, i *GetPlaylistRequest) ApiExchange[GetPlaylistResponse] {
	var out = CB_ListPlaylist(conn, &ListPlaylistRequest{Ids: []string{i.Id}, Preload: i.Preload})
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

// 200 OK
//
// 400 Bad Request
//
// 404 Not Found
//
// 409 Conflict
//
// 500 Internal Server Error
func CB_GetPlaylistM3U(conn *gorm.DB, i *GetPlaylistM3URequest) ApiExchange[GetPlaylistM3UResponse] {
	var out = CB_ListPlaylist(conn, &ListPlaylistRequest{Ids: []string{i.Id}, Preload: Preload{PreloadVideos: true}})
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

// 200 OK
//
// 400 Bad Request
//
// 404 Not Found
//
// 409 Conflict
//
// 500 Internal Server Error
func CB_DeletePlaylist(conn *gorm.DB, i *DeletePlaylistRequest) ApiExchange[DeletePlaylistResponse] {
	var out = CB_GetPlaylist(conn, &GetPlaylistRequest{Id: i.Id})
	out.Init()
	if out.StatusCode != http.StatusOK {
		return ConvertApiExchange[GetPlaylistResponse, DeletePlaylistResponse](out)
	}

	var currentPlaylist = out.Value.Body
	if tx := conn.Delete(&currentPlaylist); tx.Error != nil {
		return ApiExchangeDatabaseError[DeletePlaylistResponse](tx.Error)
	}

	return ApiExchange[DeletePlaylistResponse]{
		Value:      &DeletePlaylistResponse{Body: currentPlaylist},
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
func CB_PatchPlaylist(conn *gorm.DB, i *UpdatePlaylistRequest) ApiExchange[UpdatePlaylistResponse] {
	var out = CB_GetPlaylist(conn, &GetPlaylistRequest{Id: i.Id, Preload: Preload{PreloadVideos: true}})
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
	if tx := conn.Save(&p); tx.Error != nil {
		return ApiExchangeDatabaseError[UpdatePlaylistResponse](tx.Error)
	}

	return ApiExchange[UpdatePlaylistResponse]{
		Value:      &UpdatePlaylistResponse{Body: p},
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
func CB_AddVideoToPlaylist(conn *gorm.DB, i *AddVideoToPlaylistRequest) ApiExchange[AddVideoToPlaylistResponse] {
	var outPlaylist = CB_GetPlaylist(conn, &GetPlaylistRequest{Id: i.PlaylistId})
	outPlaylist.Init()
	if outPlaylist.StatusCode != http.StatusOK {
		return ConvertApiExchange[GetPlaylistResponse, AddVideoToPlaylistResponse](outPlaylist)
	}
	var outVideo = apivideo.CB_GetVideo(conn, &apivideo.GetVideoRequest{Id: i.VideoId, Preload: apivideo.Preload{PreloadPlaylist: true, PreloadTags: true, PreloadFolder: true}})
	outVideo.Init()
	if outVideo.StatusCode != http.StatusOK {
		return ConvertApiExchange[apivideo.GetVideoResponse, AddVideoToPlaylistResponse](outVideo)
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

	if tx := conn.Save(&playlist); tx.Error != nil {
		return ApiExchangeDatabaseError[AddVideoToPlaylistResponse](tx.Error)
	}

	outVideo = apivideo.CB_GetVideo(conn, &apivideo.GetVideoRequest{Id: i.VideoId, Preload: apivideo.Preload{PreloadPlaylist: true, PreloadTags: true, PreloadFolder: true}})
	outVideo.Init()
	if outVideo.StatusCode != http.StatusOK {
		return ConvertApiExchange[apivideo.GetVideoResponse, AddVideoToPlaylistResponse](outVideo)
	}

	return ApiExchange[AddVideoToPlaylistResponse]{
		Value: &AddVideoToPlaylistResponse{Body: outVideo.Value.Body},
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
func CB_DeleteVideoToPlaylist(conn *gorm.DB, i *DeleteVideoFromPlaylistRequest) ApiExchange[DeleteVideoFromPlaylistResponse] {
	var outPlaylist = CB_GetPlaylist(conn, &GetPlaylistRequest{Id: i.PlaylistId, Preload: Preload{PreloadVideos: true}})
	outPlaylist.Init()
	if outPlaylist.StatusCode != http.StatusOK {
		return ConvertApiExchange[GetPlaylistResponse, DeleteVideoFromPlaylistResponse](outPlaylist)
	}

	var playlist = outPlaylist.Value.Body
	if playlist.Videos == nil {
		playlist.Videos = &[]*models.Video{}
	}

	var outVideo = apivideo.CB_GetVideo(conn, &apivideo.GetVideoRequest{Id: i.VideoId, Preload: apivideo.Preload{PreloadPlaylist: true, PreloadTags: true, PreloadFolder: true}})
	outVideo.Init()
	if outVideo.StatusCode != http.StatusOK {
		return ConvertApiExchange[apivideo.GetVideoResponse, DeleteVideoFromPlaylistResponse](outVideo)
	}

	var video = outVideo.Value.Body

	if err := conn.Model(&playlist).Association("Videos").Delete(&video); err != nil {
		return ApiExchangeDatabaseError[DeleteVideoFromPlaylistResponse](err)
	}

	outVideo = apivideo.CB_GetVideo(conn, &apivideo.GetVideoRequest{Id: i.VideoId, Preload: apivideo.Preload{PreloadPlaylist: true, PreloadTags: true, PreloadFolder: true}})
	outVideo.Init()
	if outVideo.StatusCode != http.StatusOK {
		return ConvertApiExchange[apivideo.GetVideoResponse, DeleteVideoFromPlaylistResponse](outVideo)
	}

	return ApiExchange[DeleteVideoFromPlaylistResponse]{
		Value:      &DeleteVideoFromPlaylistResponse{Body: outVideo.Value.Body},
		StatusCode: http.StatusOK,
	}
}
