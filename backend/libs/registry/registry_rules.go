package registry

import (
	"context"
	"net/http"
	"regexp"
	"slices"
	"vp/libs/array"
	. "vp/libs/definitions"
	"vp/libs/models"

	"gorm.io/gorm"
)

type (
	registryRule  struct{}
	IRegistryRule interface {
		// 200 OK
		//
		// 400 Bad Request
		//
		// 500 Internal Server Error
		NewRule(ctx context.Context, conn *gorm.DB, i *NewRuleRequest) ApiExchange[NewRuleResponse]
		// 200 OK
		//
		// 500 Internal Server Error
		ListRule(ctx context.Context, conn *gorm.DB, i *ListRuleRequest) ApiExchange[ListRuleResponse]
		// 200 OK
		//
		// 404 Not Found
		//
		// 409 Conflict
		//
		// 500 Internal Server Error
		GetRule(ctx context.Context, conn *gorm.DB, i *GetRuleRequest) ApiExchange[GetRuleResponse]
		// 200 OK
		//
		// 404 Not Found
		//
		// 409 Conflict
		//
		// 500 Internal Server Error
		DeleteRule(ctx context.Context, conn *gorm.DB, i *DeleteRuleRequest) ApiExchange[DeleteRuleResponse]
		// 200 OK
		//
		// 400 Bad Request
		//
		// 404 Not Found
		//
		// 409 Conflict
		//
		// 500 Internal Server Error
		AddPlaylistToRule(ctx context.Context, conn *gorm.DB, i *AddPlaylistToRuleRequest) ApiExchange[AddPlaylistToRuleResponse]
		// 200 OK
		//
		// 400 Bad Request
		//
		// 404 Not Found
		//
		// 409 Conflict
		//
		// 500 Internal Server Error
		AddTagToRule(ctx context.Context, conn *gorm.DB, i *AddTagToRuleRequest) ApiExchange[AddTagToRuleResponse]
		// 200 OK
		//
		// 400 Bad Request
		//
		// 404 Not Found
		//
		// 409 Conflict
		//
		// 500 Internal Server Error
		DeletePlaylistToRule(ctx context.Context, conn *gorm.DB, i *DeletePlaylistToRuleRequest) ApiExchange[DeletePlaylistToRuleResponse]
		// 200 OK
		//
		// 400 Bad Request
		//
		// 404 Not Found
		//
		// 409 Conflict
		//
		// 500 Internal Server Error
		DeleteTagToRule(ctx context.Context, conn *gorm.DB, i *DeleteTagToRuleRequest) ApiExchange[DeleteTagToRuleResponse]
		// 200 OK
		//
		// 400 Bad Request
		//
		// 500 Internal Server Error
		ApplyRuleStream(ctx context.Context, conn *gorm.DB, i *ApplyRuleRequest) ApiExchange[ApplyRuleResponse]
	}

	PreloadRule struct {
		PreloadPlaylist bool `query:"preloadPlaylist"`
		PreloadTags     bool `query:"preloadTags"`
	}

	NewRuleRequest struct {
		Body struct {
			PlaylistIds []string `json:"playlistIds"`
			TagIds      []string `json:"tagIds"`
			Regex       string   `json:"regex"`
		}
	}
	NewRuleResponse struct {
		Body models.Rule
	}

	ListRuleRequest struct {
		Ids []string `query:"id,explode"`
		PreloadRule
	}
	ListRuleResponse struct {
		Body []models.Rule
	}

	GetRuleRequest struct {
		Id string `path:"id"`
		PreloadRule
	}
	GetRuleResponse struct {
		Body models.Rule
	}

	DeleteRuleRequest struct {
		Id string `path:"id"`
	}
	DeleteRuleResponse struct {
		Body models.Rule
	}

	AddPlaylistToRuleRequest struct {
		PlaylistId string `path:"playlistId"`
		RuleId     string `path:"ruleId"`
	}
	AddPlaylistToRuleResponse struct {
		Body models.Rule
	}

	AddTagToRuleRequest struct {
		TagId  string `path:"tagId"`
		RuleId string `path:"ruleId"`
	}
	AddTagToRuleResponse struct {
		Body models.Rule
	}

	DeletePlaylistToRuleRequest struct {
		PlaylistId string `path:"playlistId"`
		RuleId     string `path:"ruleId"`
	}
	DeletePlaylistToRuleResponse struct {
		Body models.Rule
	}

	DeleteTagToRuleRequest struct {
		TagId  string `path:"tagId"`
		RuleId string `path:"ruleId"`
	}
	DeleteTagToRuleResponse struct {
		Body models.Rule
	}

	ApplyRuleRequest struct {
		Ids []string `query:"id,explode"`
	}
	ApplyRuleResponse struct {
		Body []models.Video
	}
)

func (r registryRule) NewRule(ctx context.Context, conn *gorm.DB, i *NewRuleRequest) ApiExchange[NewRuleResponse] {
	reg, ok := ctx.Value("registry").(Registry)
	if !ok {
		return ApiExchange[NewRuleResponse]{
			StatusCode: http.StatusInternalServerError,
			ErrorTitle: "Registry not found",
		}
	}

	var apiPlaylist = reg.Playlists
	var apiTag = reg.Tags

	var re, err = regexp.Compile(i.Body.Regex)
	if err != nil {
		return ApiExchange[NewRuleResponse]{
			StatusCode: http.StatusBadRequest,
			ErrorTitle: "Invalid regex",
			Errors:     []error{err},
		}
	}

	var rule = models.Rule{
		RegexRaw:   i.Body.Regex,
		Regex:      re,
		RegexError: nil,
		Playlists:  &[]*models.Playlist{},
		Tags:       &[]*models.Tag{},
	}

	if len(i.Body.PlaylistIds) > 0 {
		var playlistRequest = apiPlaylist.ListPlaylist(ctx, conn, &ListPlaylistRequest{Ids: i.Body.PlaylistIds})
		playlistRequest.Init()
		if playlistRequest.StatusCode != http.StatusOK {
			return ConvertApiExchange[ListPlaylistResponse, NewRuleResponse](playlistRequest)
		}
		for _, p := range playlistRequest.Value.Body {
			*rule.Playlists = append(*rule.Playlists, &p)
		}
	}

	if len(i.Body.TagIds) > 0 {
		var tagRequest = apiTag.ListTag(ctx, conn, &ListTagRequest{Ids: i.Body.TagIds})
		tagRequest.Init()
		if tagRequest.StatusCode != http.StatusOK {
			return ConvertApiExchange[ListTagResponse, NewRuleResponse](tagRequest)
		}

		for _, t := range tagRequest.Value.Body {
			*rule.Tags = append(*rule.Tags, &t)
		}
	}

	if tx := conn.WithContext(ctx).Create(&rule); tx.Error != nil {
		return ApiExchangeDatabaseError[NewRuleResponse](tx.Error)
	}

	return ApiExchange[NewRuleResponse]{
		Value:      &NewRuleResponse{Body: rule},
		StatusCode: http.StatusOK,
	}
}

func (r registryRule) ListRule(ctx context.Context, conn *gorm.DB, i *ListRuleRequest) ApiExchange[ListRuleResponse] {
	var rules []models.Rule

	var filtered *gorm.DB = models.Rule{}.Preload(conn.WithContext(ctx), i.PreloadRule.PreloadPlaylist, i.PreloadRule.PreloadTags)
	switch {
	case len(i.Ids) > 0:
		filtered = filtered.Where("id IN ?", i.Ids)
	}

	if tx := filtered.Find(&rules); tx.Error != nil {
		return ApiExchangeDatabaseError[ListRuleResponse](tx.Error)
	}

	return ApiExchange[ListRuleResponse]{
		Value:      &ListRuleResponse{Body: rules},
		StatusCode: http.StatusOK,
	}
}

func (r registryRule) GetRule(ctx context.Context, conn *gorm.DB, i *GetRuleRequest) ApiExchange[GetRuleResponse] {
	var out = r.ListRule(ctx, conn, &ListRuleRequest{Ids: []string{i.Id}, PreloadRule: i.PreloadRule})
	out.Init()
	if out.StatusCode != http.StatusOK {
		return ConvertApiExchange[ListRuleResponse, GetRuleResponse](out)
	}

	switch len(out.Value.Body) {
	case 0:
		return ApiExchange[GetRuleResponse]{StatusCode: http.StatusNotFound}
	case 1:
		var rule = out.Value.Body[0]
		return ApiExchange[GetRuleResponse]{
			Value:      &GetRuleResponse{Body: rule},
			StatusCode: http.StatusOK,
		}
	default:
		return ApiExchange[GetRuleResponse]{StatusCode: http.StatusConflict}
	}
}

func (r registryRule) DeleteRule(ctx context.Context, conn *gorm.DB, i *DeleteRuleRequest) ApiExchange[DeleteRuleResponse] {
	var out = r.GetRule(ctx, conn, &GetRuleRequest{Id: i.Id})
	out.Init()
	if out.StatusCode != http.StatusOK {
		return ConvertApiExchange[GetRuleResponse, DeleteRuleResponse](out)
	}

	var currentRule = out.Value.Body
	if tx := conn.WithContext(ctx).Delete(&currentRule); tx.Error != nil {
		return ApiExchangeDatabaseError[DeleteRuleResponse](tx.Error)
	}

	return ApiExchange[DeleteRuleResponse]{
		Value:      &DeleteRuleResponse{Body: currentRule},
		StatusCode: http.StatusOK,
	}
}

func (r registryRule) AddPlaylistToRule(ctx context.Context, conn *gorm.DB, i *AddPlaylistToRuleRequest) ApiExchange[AddPlaylistToRuleResponse] {
	reg, ok := ctx.Value("registry").(Registry)
	if !ok {
		return ApiExchange[AddPlaylistToRuleResponse]{
			StatusCode: http.StatusInternalServerError,
			ErrorTitle: "Registry not found",
		}
	}
	var apiPlaylist = reg.Playlists
	var outRule = r.GetRule(ctx, conn, &GetRuleRequest{
		Id: i.RuleId,
		PreloadRule: PreloadRule{
			PreloadPlaylist: true,
		},
	})
	outRule.Init()
	if outRule.StatusCode != http.StatusOK {
		return ConvertApiExchange[GetRuleResponse, AddPlaylistToRuleResponse](outRule)
	}

	var outPlaylist = apiPlaylist.GetPlaylist(ctx, conn, &GetPlaylistRequest{Id: i.PlaylistId})
	outPlaylist.Init()
	if outPlaylist.StatusCode != http.StatusOK {
		return ConvertApiExchange[GetPlaylistResponse, AddPlaylistToRuleResponse](outPlaylist)
	}

	var rule = outRule.Value.Body
	var playlist = outPlaylist.Value.Body

	if rule.Playlists == nil {
		rule.Playlists = &[]*models.Playlist{}
	}

	for _, p := range *rule.Playlists {
		if p.Id == playlist.Id {
			return ApiExchange[AddPlaylistToRuleResponse]{
				Value: &AddPlaylistToRuleResponse{Body: rule},
			}
		}
	}

	*rule.Playlists = append(*rule.Playlists, &playlist)
	if tx := conn.WithContext(ctx).Save(&playlist); tx.Error != nil {
		return ApiExchangeDatabaseError[AddPlaylistToRuleResponse](tx.Error)
	}

	return ApiExchange[AddPlaylistToRuleResponse]{
		Value:      &AddPlaylistToRuleResponse{Body: rule},
		StatusCode: http.StatusOK,
	}
}

func (r registryRule) AddTagToRule(ctx context.Context, conn *gorm.DB, i *AddTagToRuleRequest) ApiExchange[AddTagToRuleResponse] {
	reg, ok := ctx.Value("registry").(Registry)
	if !ok {
		return ApiExchange[AddTagToRuleResponse]{
			StatusCode: http.StatusInternalServerError,
			ErrorTitle: "Registry not found",
		}
	}
	var apiTag = reg.Tags
	var outRule = r.GetRule(ctx, conn, &GetRuleRequest{
		Id: i.RuleId,
		PreloadRule: PreloadRule{
			PreloadPlaylist: true,
		},
	})
	outRule.Init()
	if outRule.StatusCode != http.StatusOK {
		return ConvertApiExchange[GetRuleResponse, AddTagToRuleResponse](outRule)
	}

	var outTag = apiTag.GetTag(ctx, conn, &GetTagRequest{Id: i.TagId})
	outTag.Init()
	if outTag.StatusCode != http.StatusOK {
		return ConvertApiExchange[GetTagResponse, AddTagToRuleResponse](outTag)
	}

	var rule = outRule.Value.Body
	var tag = outTag.Value.Body

	if rule.Tags == nil {
		rule.Tags = &[]*models.Tag{}
	}

	for _, p := range *rule.Tags {
		if p.Id == tag.Id {
			return ApiExchange[AddTagToRuleResponse]{
				Value: &AddTagToRuleResponse{Body: rule},
			}
		}
	}

	*rule.Tags = append(*rule.Tags, &tag)
	if tx := conn.WithContext(ctx).Save(&tag); tx.Error != nil {
		return ApiExchangeDatabaseError[AddTagToRuleResponse](tx.Error)
	}

	return ApiExchange[AddTagToRuleResponse]{
		Value:      &AddTagToRuleResponse{Body: rule},
		StatusCode: http.StatusOK,
	}
}

func (r registryRule) DeletePlaylistToRule(ctx context.Context, conn *gorm.DB, i *DeletePlaylistToRuleRequest) ApiExchange[DeletePlaylistToRuleResponse] {
	reg, ok := ctx.Value("registry").(Registry)
	if !ok {
		return ApiExchange[DeletePlaylistToRuleResponse]{
			StatusCode: http.StatusInternalServerError,
			ErrorTitle: "Registry not found",
		}
	}
	var apiPlaylist = reg.Playlists
	var outRule = r.GetRule(ctx, conn, &GetRuleRequest{
		Id: i.RuleId,
		PreloadRule: PreloadRule{
			PreloadPlaylist: true,
		},
	})
	outRule.Init()
	if outRule.StatusCode != http.StatusOK {
		return ConvertApiExchange[GetRuleResponse, DeletePlaylistToRuleResponse](outRule)
	}

	var rule = outRule.Value.Body
	if rule.Playlists == nil {
		rule.Playlists = &[]*models.Playlist{}
	}

	var outPlaylist = apiPlaylist.GetPlaylist(ctx, conn, &GetPlaylistRequest{Id: i.PlaylistId})
	outPlaylist.Init()
	if outPlaylist.StatusCode != http.StatusOK {
		return ConvertApiExchange[GetPlaylistResponse, DeletePlaylistToRuleResponse](outPlaylist)
	}

	var playlist = outPlaylist.Value.Body

	if err := conn.WithContext(ctx).Model(&rule).Association("Playlists").Delete(&playlist); err != nil {
		return ApiExchangeDatabaseError[DeletePlaylistToRuleResponse](err)
	}

	return ApiExchange[DeletePlaylistToRuleResponse]{
		Value:      &DeletePlaylistToRuleResponse{Body: rule},
		StatusCode: http.StatusOK,
	}
}

func (r registryRule) DeleteTagToRule(ctx context.Context, conn *gorm.DB, i *DeleteTagToRuleRequest) ApiExchange[DeleteTagToRuleResponse] {
	reg, ok := ctx.Value("registry").(Registry)
	if !ok {
		return ApiExchange[DeleteTagToRuleResponse]{
			StatusCode: http.StatusInternalServerError,
			ErrorTitle: "Registry not found",
		}
	}
	var apiTag = reg.Tags
	var outRule = r.GetRule(ctx, conn, &GetRuleRequest{
		Id: i.RuleId,
		PreloadRule: PreloadRule{
			PreloadPlaylist: true,
		},
	})
	outRule.Init()
	if outRule.StatusCode != http.StatusOK {
		return ConvertApiExchange[GetRuleResponse, DeleteTagToRuleResponse](outRule)
	}

	var rule = outRule.Value.Body
	if rule.Playlists == nil {
		rule.Playlists = &[]*models.Playlist{}
	}

	var outTag = apiTag.GetTag(ctx, conn, &GetTagRequest{Id: i.TagId})
	outTag.Init()
	if outTag.StatusCode != http.StatusOK {
		return ConvertApiExchange[GetTagResponse, DeleteTagToRuleResponse](outTag)
	}

	var tag = outTag.Value.Body

	if err := conn.WithContext(ctx).Model(&rule).Association("Playlists").Delete(&tag); err != nil {
		return ApiExchangeDatabaseError[DeleteTagToRuleResponse](err)
	}

	return ApiExchange[DeleteTagToRuleResponse]{
		Value:      &DeleteTagToRuleResponse{Body: rule},
		StatusCode: http.StatusOK,
	}
}

func (r registryRule) ApplyRuleStream(ctx context.Context, conn *gorm.DB, i *ApplyRuleRequest) ApiExchange[ApplyRuleResponse] {
	reg, ok := ctx.Value("registry").(Registry)
	if !ok {
		return ApiExchange[ApplyRuleResponse]{
			StatusCode: http.StatusInternalServerError,
			ErrorTitle: "Registry not found",
		}
	}
	var apiVideo = reg.Videos
	var ruleRequest = r.ListRule(ctx, conn, &ListRuleRequest{
		Ids: i.Ids,
		PreloadRule: PreloadRule{
			PreloadPlaylist: true,
			PreloadTags:     true,
		},
	})
	ruleRequest.Init()
	if ruleRequest.StatusCode != http.StatusOK {
		return ConvertApiExchange[ListRuleResponse, ApplyRuleResponse](ruleRequest)
	}

	var videoRequest = apiVideo.ListVideos(ctx, conn, &ListVideoRequest{PreloadVideos: PreloadVideos{PreloadPlaylist: true, PreloadFolder: true, PreloadTags: true}})
	videoRequest.Init()
	if videoRequest.StatusCode != http.StatusOK {
		return ConvertApiExchange[ListVideoResponse, ApplyRuleResponse](videoRequest)
	}
	var rules = ruleRequest.Value.Body
	var videos = videoRequest.Value.Body

	rules = array.Map[[]models.Rule, []models.Rule](rules, func(r models.Rule, idx int) models.Rule {
		if r.Playlists == nil {
			r.Playlists = &[]*models.Playlist{}
		}
		if r.Tags == nil {
			r.Tags = &[]*models.Tag{}
		}

		r.Regex, r.RegexError = regexp.Compile(r.RegexRaw)
		return r
	})
	rules = array.Filter(rules, func(r models.Rule, idx int) bool {
		if r.Regex == nil {
			return false
		}
		return true
	})

	var updatedVideos []models.Video
	for _, vid := range videos {
		var updates int
		for _, r := range rules {
			if matches := r.Regex.FindAllString(vid.Fullpath, -1); len(matches) > 0 {
				var existingPlaylists []string = array.Map[[]*models.Playlist, []string](vid.Playlists, func(item *models.Playlist, _ int) string {
					return item.Id
				})
				var existingTags []string = array.Map[[]*models.Tag, []string](vid.Tags, func(item *models.Tag, _ int) string {
					return item.Id
				})

				for _, p := range *r.Playlists {
					if !slices.Contains(existingPlaylists, p.Id) {
						updates += 1
						vid.Playlists = append(vid.Playlists, p)
					}
				}

				for _, t := range *r.Tags {
					if !slices.Contains(existingTags, t.Id) {
						updates += 1
						vid.Tags = append(vid.Tags, t)
					}
				}
			}
		}
		if updates > 0 {
			updatedVideos = append(updatedVideos, vid)
		}
	}

	if len(updatedVideos) > 0 {
		if tx := conn.WithContext(ctx).Save(&updatedVideos); tx.Error != nil {
			return ApiExchangeDatabaseError[ApplyRuleResponse](tx.Error)
		}

		return ApiExchange[ApplyRuleResponse]{
			Value:      &ApplyRuleResponse{Body: updatedVideos},
			StatusCode: http.StatusOK,
		}
	}
	return ApiExchange[ApplyRuleResponse]{
		StatusCode: http.StatusOK,
		Value:      &ApplyRuleResponse{Body: make([]models.Video, 0)},
	}

}
