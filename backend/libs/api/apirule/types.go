package apirule

import "vp/libs/models"

type (
	Preload struct {
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
		Preload
	}
	ListRuleResponse struct {
		Body []models.Rule
	}

	GetRuleRequest struct {
		Id string `path:"id"`
		Preload
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
