package api

import (
	"context"
	"net/http"
	"vp/libs/registry"

	"github.com/danielgtaylor/huma/v2"
	"github.com/danielgtaylor/huma/v2/adapters/humago"
	"gorm.io/gorm"
)

func Setup(mux *http.ServeMux, conn *gorm.DB, ctx context.Context) {
	reg, ok := ctx.Value("registry").(registry.Registry)
	if !ok {
		panic("Registry not initialized")
	}
	var config = huma.DefaultConfig("Api", "1.0.0")
	config.Info.Description = "My api reference"
	config.DocsRenderer = huma.DocsRendererScalar

	var (
		api          = humago.New(mux, config)
		apiGroup     = huma.NewGroup(api, "/api")
		apiFolder    = huma.NewGroup(apiGroup, "/folder")
		apiVideo     = huma.NewGroup(apiGroup, "/video")
		apiPlaylist  = huma.NewGroup(apiGroup, "/playlist")
		apiTag       = huma.NewGroup(apiGroup, "/tag")
		apiRule      = huma.NewGroup(apiGroup, "/automatic-rule")
		apiSystemLog = huma.NewGroup(apiGroup, "/system-log")
	)

	setupApiFolders(apiFolder, conn, ctx, reg.Folders)
	setupApiVideos(apiVideo, conn, ctx, reg.Videos)
	setupApiPlaylists(apiPlaylist, conn, ctx, reg.Playlists)
	setupApiTags(apiTag, conn, ctx, reg.Tags)
	setupApiRules(apiRule, conn, ctx, reg.Rules)
	setupApiSystemLog(apiSystemLog, conn, ctx, reg.SystemLog)
}
