package server

import (
	"embed"
	"io/fs"
	"net/http"
	"vp/libs/api/apivideo"

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

func AddEndpoints(mux *http.ServeMux, conn *gorm.DB) {
	endpoint_streaming(mux, conn)
}

func endpoint_streaming(mux *http.ServeMux, conn *gorm.DB) {
	mux.HandleFunc("/stream/{id}", func(w http.ResponseWriter, req *http.Request) {
		var id = req.PathValue("id")
		var videoResponse = apivideo.CB_GetVideo(conn, &apivideo.GetVideoRequest{Id: id})
		videoResponse.Init()
		if videoResponse.StatusCode != http.StatusOK {
			http.Error(w, videoResponse.ErrorTitle, videoResponse.StatusCode)
			return
		}

		var video = videoResponse.Value.Body
		http.ServeFile(w, req, video.Fullpath)
	})
}
