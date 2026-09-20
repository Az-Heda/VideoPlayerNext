package server

import (
	"context"
	"embed"
	"io/fs"
	"net/http"
	"vp/libs/registry"

	"github.com/rs/zerolog/log"
	"gorm.io/gorm"
)

//go:embed all:fe-build
var staticFiles embed.FS

func AddStaticEndpoints(mux *http.ServeMux) {
	const frontend = "fe-build"
	newFsys, err := fs.Sub(staticFiles, frontend)
	if err != nil {
		log.Fatal().Err(err).Send()
	}

	mux.Handle("/", http.FileServerFS(newFsys))
}

func AddEndpoints(mux *http.ServeMux, conn *gorm.DB, ctx context.Context) {
	endpoint_streaming(mux, conn, ctx)
}

func endpoint_streaming(mux *http.ServeMux, conn *gorm.DB, ctx context.Context) {
	reg, ok := ctx.Value("registry").(registry.Registry)
	if !ok {
		panic("Registry not initialized")
	}
	var apiVideo = reg.Videos
	mux.HandleFunc("/stream/{id}", func(w http.ResponseWriter, req *http.Request) {
		var id = req.PathValue("id")
		var videoResponse = apiVideo.GetVideo(ctx, conn, &registry.GetVideoRequest{Id: id})
		videoResponse.Init()
		if videoResponse.StatusCode != http.StatusOK {
			http.Error(w, videoResponse.ErrorTitle, videoResponse.StatusCode)
			return
		}

		var video = videoResponse.Value.Body
		http.ServeFile(w, req, video.Fullpath)
	})
}
