package api

import (
	"net/http"
	"vp/libs/api/apifolder"
	"vp/libs/api/apiplaylist"
	"vp/libs/api/apivideo"

	"github.com/danielgtaylor/huma/v2"
	"github.com/danielgtaylor/huma/v2/adapters/humago"
	"gorm.io/gorm"
)

func Setup(mux *http.ServeMux, conn *gorm.DB) {
	var config = huma.DefaultConfig("Api", "1.0.0")
	config.Info.Description = "My api reference"
	config.DocsRenderer = huma.DocsRendererScalar

	var (
		api         = humago.New(mux, config)
		apiGroup    = huma.NewGroup(api, "/api")
		apiFolder   = huma.NewGroup(apiGroup, "/folder")
		apiVideo    = huma.NewGroup(apiGroup, "/video")
		apiPlaylist = huma.NewGroup(apiGroup, "/playlist")
	)

	apifolder.Setup(apiFolder, conn)
	apivideo.Setup(apiVideo, conn)
	apiplaylist.Setup(apiPlaylist, conn)
}
