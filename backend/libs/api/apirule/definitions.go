package apirule

import (
	"net/http"
	"regexp"
	"slices"
	"vp/libs/api/apiplaylist"
	"vp/libs/api/apitag"
	"vp/libs/api/apivideo"
	"vp/libs/array"
	. "vp/libs/definitions"
	"vp/libs/models"

	"gorm.io/gorm"
)

// 200 OK
//
// 400 Bad Request
//
// 500 Internal Server Error
func CB_NewRule(conn *gorm.DB, i *NewRuleRequest) ApiExchange[NewRuleResponse] {
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
		var playlistRequest = apiplaylist.CB_ListPlaylist(conn, &apiplaylist.ListPlaylistRequest{Ids: i.Body.PlaylistIds})
		playlistRequest.Init()
		if playlistRequest.StatusCode != http.StatusOK {
			return ConvertApiExchange[apiplaylist.ListPlaylistResponse, NewRuleResponse](playlistRequest)
		}
		for _, p := range playlistRequest.Value.Body {
			*rule.Playlists = append(*rule.Playlists, &p)
		}
	}

	if len(i.Body.TagIds) > 0 {
		var tagRequest = apitag.CB_ListTag(conn, &apitag.ListTagRequest{Ids: i.Body.TagIds})
		tagRequest.Init()
		if tagRequest.StatusCode != http.StatusOK {
			return ConvertApiExchange[apitag.ListTagResponse, NewRuleResponse](tagRequest)
		}

		for _, t := range tagRequest.Value.Body {
			*rule.Tags = append(*rule.Tags, &t)
		}
	}

	if tx := conn.Create(&rule); tx.Error != nil {
		return ApiExchangeDatabaseError[NewRuleResponse](tx.Error)
	}

	return ApiExchange[NewRuleResponse]{
		Value:      &NewRuleResponse{Body: rule},
		StatusCode: http.StatusOK,
	}
}

// 200 OK
//
// 500 Internal Server Error
func CB_ListRule(conn *gorm.DB, i *ListRuleRequest) ApiExchange[ListRuleResponse] {
	var rules []models.Rule

	var filtered *gorm.DB = models.Rule{}.Preload(conn, i.Preload.PreloadPlaylist, i.Preload.PreloadTags)
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

// 200 OK
//
// 404 Not Found
//
// 409 Conflict
//
// 500 Internal Server Error
func CB_GetRule(conn *gorm.DB, i *GetRuleRequest) ApiExchange[GetRuleResponse] {
	var out = CB_ListRule(conn, &ListRuleRequest{Ids: []string{i.Id}, Preload: i.Preload})
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

// 200 OK
//
// 404 Not Found
//
// 409 Conflict
//
// 500 Internal Server Error
func CB_DeleteRule(conn *gorm.DB, i *DeleteRuleRequest) ApiExchange[DeleteRuleResponse] {
	var out = CB_GetRule(conn, &GetRuleRequest{Id: i.Id})
	out.Init()
	if out.StatusCode != http.StatusOK {
		return ConvertApiExchange[GetRuleResponse, DeleteRuleResponse](out)
	}

	var currentRule = out.Value.Body
	if tx := conn.Delete(&currentRule); tx.Error != nil {
		return ApiExchangeDatabaseError[DeleteRuleResponse](tx.Error)
	}

	return ApiExchange[DeleteRuleResponse]{
		Value:      &DeleteRuleResponse{Body: currentRule},
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
func CB_AddPlaylistToRule(conn *gorm.DB, i *AddPlaylistToRuleRequest) ApiExchange[AddPlaylistToRuleResponse] {
	var outRule = CB_GetRule(conn, &GetRuleRequest{Id: i.RuleId, Preload: Preload{PreloadPlaylist: true}})
	outRule.Init()
	if outRule.StatusCode != http.StatusOK {
		return ConvertApiExchange[GetRuleResponse, AddPlaylistToRuleResponse](outRule)
	}

	var outPlaylist = apiplaylist.CB_GetPlaylist(conn, &apiplaylist.GetPlaylistRequest{Id: i.PlaylistId})
	outPlaylist.Init()
	if outPlaylist.StatusCode != http.StatusOK {
		return ConvertApiExchange[apiplaylist.GetPlaylistResponse, AddPlaylistToRuleResponse](outPlaylist)
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
	if tx := conn.Save(&playlist); tx.Error != nil {
		return ApiExchangeDatabaseError[AddPlaylistToRuleResponse](tx.Error)
	}

	return ApiExchange[AddPlaylistToRuleResponse]{
		Value:      &AddPlaylistToRuleResponse{Body: rule},
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
func CB_AddTagToRule(conn *gorm.DB, i *AddTagToRuleRequest) ApiExchange[AddTagToRuleResponse] {
	var outRule = CB_GetRule(conn, &GetRuleRequest{Id: i.RuleId, Preload: Preload{PreloadPlaylist: true}})
	outRule.Init()
	if outRule.StatusCode != http.StatusOK {
		return ConvertApiExchange[GetRuleResponse, AddTagToRuleResponse](outRule)
	}

	var outTag = apitag.CB_GetTag(conn, &apitag.GetTagRequest{Id: i.TagId})
	outTag.Init()
	if outTag.StatusCode != http.StatusOK {
		return ConvertApiExchange[apitag.GetTagResponse, AddTagToRuleResponse](outTag)
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
	if tx := conn.Save(&tag); tx.Error != nil {
		return ApiExchangeDatabaseError[AddTagToRuleResponse](tx.Error)
	}

	return ApiExchange[AddTagToRuleResponse]{
		Value:      &AddTagToRuleResponse{Body: rule},
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
func CB_DeletePlaylistToRule(conn *gorm.DB, i *DeletePlaylistToRuleRequest) ApiExchange[DeletePlaylistToRuleResponse] {
	var outRule = CB_GetRule(conn, &GetRuleRequest{Id: i.RuleId, Preload: Preload{PreloadPlaylist: true}})
	outRule.Init()
	if outRule.StatusCode != http.StatusOK {
		return ConvertApiExchange[GetRuleResponse, DeletePlaylistToRuleResponse](outRule)
	}

	var rule = outRule.Value.Body
	if rule.Playlists == nil {
		rule.Playlists = &[]*models.Playlist{}
	}

	var outPlaylist = apiplaylist.CB_GetPlaylist(conn, &apiplaylist.GetPlaylistRequest{Id: i.PlaylistId})
	outPlaylist.Init()
	if outPlaylist.StatusCode != http.StatusOK {
		return ConvertApiExchange[apiplaylist.GetPlaylistResponse, DeletePlaylistToRuleResponse](outPlaylist)
	}

	var playlist = outPlaylist.Value.Body

	if err := conn.Model(&rule).Association("Playlists").Delete(&playlist); err != nil {
		return ApiExchangeDatabaseError[DeletePlaylistToRuleResponse](err)
	}

	return ApiExchange[DeletePlaylistToRuleResponse]{
		Value:      &DeletePlaylistToRuleResponse{Body: rule},
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
func CB_DeleteTagToRule(conn *gorm.DB, i *DeleteTagToRuleRequest) ApiExchange[DeleteTagToRuleResponse] {
	var outRule = CB_GetRule(conn, &GetRuleRequest{Id: i.RuleId, Preload: Preload{PreloadPlaylist: true}})
	outRule.Init()
	if outRule.StatusCode != http.StatusOK {
		return ConvertApiExchange[GetRuleResponse, DeleteTagToRuleResponse](outRule)
	}

	var rule = outRule.Value.Body
	if rule.Playlists == nil {
		rule.Playlists = &[]*models.Playlist{}
	}

	var outTag = apitag.CB_GetTag(conn, &apitag.GetTagRequest{Id: i.TagId})
	outTag.Init()
	if outTag.StatusCode != http.StatusOK {
		return ConvertApiExchange[apitag.GetTagResponse, DeleteTagToRuleResponse](outTag)
	}

	var tag = outTag.Value.Body

	if err := conn.Model(&rule).Association("Playlists").Delete(&tag); err != nil {
		return ApiExchangeDatabaseError[DeleteTagToRuleResponse](err)
	}

	return ApiExchange[DeleteTagToRuleResponse]{
		Value:      &DeleteTagToRuleResponse{Body: rule},
		StatusCode: http.StatusOK,
	}
}

// 200 OK
//
// 400 Bad Request
//
// 500 Internal Server Error
func CB_ApplyRuleStream(conn *gorm.DB, i *ApplyRuleRequest) ApiExchange[ApplyRuleResponse] {
	var ruleRequest = CB_ListRule(conn, &ListRuleRequest{Ids: i.Ids, Preload: Preload{PreloadPlaylist: true, PreloadTags: true}})
	ruleRequest.Init()
	if ruleRequest.StatusCode != http.StatusOK {
		return ConvertApiExchange[ListRuleResponse, ApplyRuleResponse](ruleRequest)
	}

	var videoRequest = apivideo.CB_ListVideo(conn, &apivideo.ListVideoRequest{Preload: apivideo.Preload{PreloadPlaylist: true, PreloadFolder: true, PreloadTags: true}})
	videoRequest.Init()
	if videoRequest.StatusCode != http.StatusOK {
		return ConvertApiExchange[apivideo.ListVideoResponse, ApplyRuleResponse](videoRequest)
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
		if tx := conn.Save(&updatedVideos); tx.Error != nil {
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
