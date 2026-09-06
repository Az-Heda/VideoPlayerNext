package apitag

import (
	"errors"
	"fmt"
	"net/http"
	"slices"
	"strings"
	"vp/libs/api/apivideo"
	"vp/libs/array"
	. "vp/libs/definitions"
	"vp/libs/models"

	"gorm.io/gorm"
)

var bannedChars = []string{"%"}

// 200 OK
//
// 400 Bad Request
//
// 409 Conflict
//
// 500 Internal Server Error
func CB_NewTag(conn *gorm.DB, i *NewTagRequest) ApiExchange[NewTagResponse] {
	var tag = models.Tag{
		Name: i.Body.Name,
	}

	var validationErrors []error
	if tag.Name == "" {
		validationErrors = append(validationErrors, fmt.Errorf("Tag name cannot be empty"))
	}
	for _, b := range bannedChars {
		if strings.Contains(strings.ToLower(tag.Name), strings.ToLower(b)) {
			validationErrors = append(validationErrors, fmt.Errorf("Tag name cannot contain %s", b))
		}
	}
	if len(validationErrors) > 0 {
		return ApiExchange[NewTagResponse]{
			StatusCode: http.StatusBadRequest,
			Errors:     validationErrors,
		}
	}

	var vids ApiExchange[apivideo.ListVideoResponse] = ApiExchange[apivideo.ListVideoResponse]{
		Value:      &apivideo.ListVideoResponse{Body: []models.Video{}},
		StatusCode: http.StatusOK,
	}

	if len(i.Body.Ids) > 0 {
		vids = apivideo.CB_ListVideo(conn, &apivideo.ListVideoRequest{Ids: i.Body.Ids})
		vids.Init()
		if vids.StatusCode != http.StatusOK {
			return ConvertApiExchange[apivideo.ListVideoResponse, NewTagResponse](vids)
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
		return ApiExchange[NewTagResponse]{
			StatusCode: http.StatusNotFound,
			ErrorTitle: "Unknown videos",
			Errors:     errs,
		}
	}
	var videoList = array.Map[[]models.Video, []*models.Video](vids.Value.Body, func(item models.Video, idx int) *models.Video { return &item })
	tag.Videos = &videoList

	if tx := conn.Create(&tag); tx.Error != nil {
		var status = http.StatusInternalServerError
		if errors.Is(tx.Error, gorm.ErrDuplicatedKey) {
			status = http.StatusConflict
		}
		var response = ApiExchangeDatabaseError[NewTagResponse](tx.Error)
		response.StatusCode = status
		return response
	}

	return ApiExchange[NewTagResponse]{
		Value:      &NewTagResponse{Body: tag},
		StatusCode: http.StatusOK,
	}
}

// 200 OK
//
// 500 Internal Server Error
func CB_ListTag(conn *gorm.DB, i *ListTagRequest) ApiExchange[ListTagResponse] {
	var tags []models.Tag
	var filtered *gorm.DB = models.Tag{}.Preload(conn, i.Preload.PreloadVideos)
	switch {
	case len(i.Ids) > 0:
		filtered = filtered.Where("id IN ?", i.Ids)
	case i.Name != "" && !strings.Contains(i.Name, "%"):
		filtered = filtered.Where("name LIKE ?", "%"+i.Name+"%")
	default:
	}

	if tx := filtered.Find(&tags); tx.Error != nil {
		return ApiExchangeDatabaseError[ListTagResponse](tx.Error)
	}

	return ApiExchange[ListTagResponse]{
		Value:      &ListTagResponse{Body: tags},
		StatusCode: http.StatusOK,
	}
}

// 200 OK
//
// 404 Not Found
//
// 409 Conflict
//
// 500 Internal Server Error
func CB_GetTag(conn *gorm.DB, i *GetTagRequest) ApiExchange[GetTagResponse] {
	var out = CB_ListTag(conn, &ListTagRequest{Ids: []string{i.Id}, Preload: i.Preload})
	out.Init()
	if out.StatusCode != http.StatusOK {
		return ConvertApiExchange[ListTagResponse, GetTagResponse](out)
	}

	switch len(out.Value.Body) {
	case 0:
		return ApiExchange[GetTagResponse]{StatusCode: http.StatusNotFound}
	case 1:
		var tag = out.Value.Body[0]
		return ApiExchange[GetTagResponse]{
			Value:      &GetTagResponse{Body: tag},
			StatusCode: http.StatusOK,
		}
	default:
		return ApiExchange[GetTagResponse]{StatusCode: http.StatusConflict}
	}
}

// 200 OK
//
// 404 Not Found
//
// 409 Conflict
//
// 500 Internal Server Error
func CB_DeleteTag(conn *gorm.DB, i *DeleteTagRequest) ApiExchange[DeleteTagResponse] {
	var out = CB_GetTag(conn, &GetTagRequest{Id: i.Id})
	out.Init()
	if out.StatusCode != http.StatusOK {
		return ConvertApiExchange[GetTagResponse, DeleteTagResponse](out)
	}

	var currentTag = out.Value.Body
	if tx := conn.Delete(&currentTag); tx.Error != nil {
		return ApiExchangeDatabaseError[DeleteTagResponse](tx.Error)
	}

	return ApiExchange[DeleteTagResponse]{
		Value:      &DeleteTagResponse{Body: currentTag},
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
func CB_AddVideoToTag(conn *gorm.DB, i *AddVideoToTagRequest) ApiExchange[AddVideoToTagResponse] {
	var outTag = CB_GetTag(conn, &GetTagRequest{Id: i.TagId, Preload: Preload{PreloadVideos: true}})
	outTag.Init()
	if outTag.StatusCode != http.StatusOK {
		return ConvertApiExchange[GetTagResponse, AddVideoToTagResponse](outTag)
	}

	var outVideo = apivideo.CB_GetVideo(conn, &apivideo.GetVideoRequest{Id: i.VideoId, Preload: apivideo.Preload{PreloadPlaylist: true, PreloadTags: true, PreloadFolder: true}})
	outVideo.Init()
	if outTag.StatusCode != http.StatusOK {
		return ConvertApiExchange[apivideo.GetVideoResponse, AddVideoToTagResponse](outVideo)
	}

	var tag = outTag.Value.Body
	var video = outVideo.Value.Body
	if tag.Videos == nil {
		tag.Videos = &[]*models.Video{}
	}
	for _, v := range *tag.Videos {
		if v.Id == i.VideoId {
			return ApiExchange[AddVideoToTagResponse]{
				Value:      &AddVideoToTagResponse{Body: video},
				StatusCode: http.StatusOK,
			}
		}
	}

	*tag.Videos = append(*tag.Videos, &video)
	if tx := conn.Save(&tag); tx.Error != nil {
		return ApiExchangeDatabaseError[AddVideoToTagResponse](tx.Error)
	}

	return ApiExchange[AddVideoToTagResponse]{
		Value:      &AddVideoToTagResponse{Body: video},
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
func CB_DeleteVideoToTag(conn *gorm.DB, i *DeleteVideoFromTagRequest) ApiExchange[DeleteVideoFromTagResponse] {
	var outTags = CB_GetTag(conn, &GetTagRequest{Id: i.TagId})
	outTags.Init()
	if outTags.StatusCode != http.StatusOK {
		return ConvertApiExchange[GetTagResponse, DeleteVideoFromTagResponse](outTags)
	}

	var tag = outTags.Value.Body
	if tag.Videos == nil {
		tag.Videos = &[]*models.Video{}
	}
	var outVideos = apivideo.CB_GetVideo(conn, &apivideo.GetVideoRequest{Id: i.VideoId})
	outVideos.Init()
	if outVideos.StatusCode != http.StatusOK {
		return ConvertApiExchange[apivideo.GetVideoResponse, DeleteVideoFromTagResponse](outVideos)
	}
	var video = outVideos.Value.Body

	if err := conn.Model(&tag).Association("Videos").Delete(&video); err != nil {
		return ApiExchangeDatabaseError[DeleteVideoFromTagResponse](err)
	}

	return ApiExchange[DeleteVideoFromTagResponse]{
		Value:      &DeleteVideoFromTagResponse{Body: video},
		StatusCode: http.StatusOK,
	}
}
