package registry

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"slices"
	"strings"
	"vp/libs/array"
	. "vp/libs/definitions"
	"vp/libs/models"

	"gorm.io/gorm"
)

type (
	registryTag struct {
		bannedChars []string
	}
	IRegistryTag interface {
		NewTag(ctx context.Context, conn *gorm.DB, i *NewTagRequest) ApiExchange[NewTagResponse]
		ListTag(ctx context.Context, conn *gorm.DB, i *ListTagRequest) ApiExchange[ListTagResponse]
		GetTag(ctx context.Context, conn *gorm.DB, i *GetTagRequest) ApiExchange[GetTagResponse]
		DeleteTag(ctx context.Context, conn *gorm.DB, i *DeleteTagRequest) ApiExchange[DeleteTagResponse]
		AddVideoToTag(ctx context.Context, conn *gorm.DB, i *AddVideoToTagRequest) ApiExchange[AddVideoToTagResponse]
		DeleteVideoToTag(ctx context.Context, conn *gorm.DB, i *DeleteVideoFromTagRequest) ApiExchange[DeleteVideoFromTagResponse]
	}
	PreloadTags struct {
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
		PreloadTags
	}
	ListTagResponse struct {
		Body []models.Tag
	}

	GetTagRequest struct {
		Id string `path:"id"`
		PreloadTags
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

func (r registryTag) NewTag(ctx context.Context, conn *gorm.DB, i *NewTagRequest) ApiExchange[NewTagResponse] {
	reg, ok := ctx.Value("registry").(Registry)
	if !ok {
		return ApiExchange[NewTagResponse]{
			StatusCode: http.StatusInternalServerError,
			ErrorTitle: "Registry not found",
		}
	}
	var apiVideo = reg.Videos
	var tag = models.Tag{
		Name: i.Body.Name,
	}

	var validationErrors []error
	if tag.Name == "" {
		validationErrors = append(validationErrors, fmt.Errorf("Tag name cannot be empty"))
	}
	for _, b := range r.bannedChars {
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

	var vids ApiExchange[ListVideoResponse] = ApiExchange[ListVideoResponse]{
		Value:      &ListVideoResponse{Body: []models.Video{}},
		StatusCode: http.StatusOK,
	}

	if len(i.Body.Ids) > 0 {
		vids = apiVideo.ListVideos(ctx, conn, &ListVideoRequest{Ids: i.Body.Ids})
		vids.Init()
		if vids.StatusCode != http.StatusOK {
			return ConvertApiExchange[ListVideoResponse, NewTagResponse](vids)
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

	if tx := conn.WithContext(ctx).Create(&tag); tx.Error != nil {
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

func (r registryTag) ListTag(ctx context.Context, conn *gorm.DB, i *ListTagRequest) ApiExchange[ListTagResponse] {
	var tags []models.Tag
	var filtered *gorm.DB = models.Tag{}.Preload(conn.WithContext(ctx), i.PreloadVideos)
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

func (r registryTag) GetTag(ctx context.Context, conn *gorm.DB, i *GetTagRequest) ApiExchange[GetTagResponse] {
	var out = r.ListTag(ctx, conn, &ListTagRequest{Ids: []string{i.Id}, PreloadTags: i.PreloadTags})
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

func (r registryTag) DeleteTag(ctx context.Context, conn *gorm.DB, i *DeleteTagRequest) ApiExchange[DeleteTagResponse] {
	var out = r.GetTag(ctx, conn, &GetTagRequest{Id: i.Id})
	out.Init()
	if out.StatusCode != http.StatusOK {
		return ConvertApiExchange[GetTagResponse, DeleteTagResponse](out)
	}

	var currentTag = out.Value.Body
	if tx := conn.WithContext(ctx).Delete(&currentTag); tx.Error != nil {
		return ApiExchangeDatabaseError[DeleteTagResponse](tx.Error)
	}

	return ApiExchange[DeleteTagResponse]{
		Value:      &DeleteTagResponse{Body: currentTag},
		StatusCode: http.StatusOK,
	}
}

func (r registryTag) AddVideoToTag(ctx context.Context, conn *gorm.DB, i *AddVideoToTagRequest) ApiExchange[AddVideoToTagResponse] {
	reg, ok := ctx.Value("registry").(Registry)
	if !ok {
		return ApiExchange[AddVideoToTagResponse]{
			StatusCode: http.StatusInternalServerError,
			ErrorTitle: "Registry not found",
		}
	}
	var apiVideo = reg.Videos
	var outTag = r.GetTag(ctx, conn, &GetTagRequest{Id: i.TagId, PreloadTags: PreloadTags{PreloadVideos: true}})
	outTag.Init()
	if outTag.StatusCode != http.StatusOK {
		return ConvertApiExchange[GetTagResponse, AddVideoToTagResponse](outTag)
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
	if outTag.StatusCode != http.StatusOK {
		return ConvertApiExchange[GetVideoResponse, AddVideoToTagResponse](outVideo)
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
	if tx := conn.WithContext(ctx).Save(&tag); tx.Error != nil {
		return ApiExchangeDatabaseError[AddVideoToTagResponse](tx.Error)
	}

	return ApiExchange[AddVideoToTagResponse]{
		Value:      &AddVideoToTagResponse{Body: video},
		StatusCode: http.StatusOK,
	}
}

func (r registryTag) DeleteVideoToTag(ctx context.Context, conn *gorm.DB, i *DeleteVideoFromTagRequest) ApiExchange[DeleteVideoFromTagResponse] {
	reg, ok := ctx.Value("registry").(Registry)
	if !ok {
		return ApiExchange[DeleteVideoFromTagResponse]{
			StatusCode: http.StatusInternalServerError,
			ErrorTitle: "Video registry not found",
		}
	}
	var apiVideo = reg.Videos
	var outTags = r.GetTag(ctx, conn, &GetTagRequest{Id: i.TagId})
	outTags.Init()
	if outTags.StatusCode != http.StatusOK {
		return ConvertApiExchange[GetTagResponse, DeleteVideoFromTagResponse](outTags)
	}

	var tag = outTags.Value.Body
	if tag.Videos == nil {
		tag.Videos = &[]*models.Video{}
	}
	var outVideos = apiVideo.GetVideo(ctx, conn, &GetVideoRequest{Id: i.VideoId})
	outVideos.Init()
	if outVideos.StatusCode != http.StatusOK {
		return ConvertApiExchange[GetVideoResponse, DeleteVideoFromTagResponse](outVideos)
	}
	var video = outVideos.Value.Body

	if err := conn.WithContext(ctx).Model(&tag).Association("Videos").Delete(&video); err != nil {
		return ApiExchangeDatabaseError[DeleteVideoFromTagResponse](err)
	}

	return ApiExchange[DeleteVideoFromTagResponse]{
		Value:      &DeleteVideoFromTagResponse{Body: video},
		StatusCode: http.StatusOK,
	}
}
