package server

import (
	"bytes"
	"context"
	"embed"
	"io/fs"
	"net/http"
	"path/filepath"
	"strings"
	"vp/libs/registry"
	"vp/libs/version"

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

	var contentType map[string]string = map[string]string{
		".txt":   "text/plain",
		".css":   "text/css",
		".js":    "text/javascript",
		".html":  "text/html",
		".ico":   "image/x-icon",
		".woff2": "font/woff2",
		".woff":  "font/woff",
		".ttf":   "font/ttf",
		".otf":   "font/otf",
		".json":  "application/json",
	}

	mux.Handle("/", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		path := strings.TrimPrefix(r.URL.Path, "/")
		if path == "" {
			path = "index.html"
		}
		data, err := fs.ReadFile(newFsys, path)
		if err != nil {
			http.NotFound(w, r)
			return
		}

		data = bytes.ReplaceAll(
			data,
			[]byte("$GO:VERSION$"),
			[]byte(version.VERSION),
		)

		if ct, ok := contentType[filepath.Ext(path)]; ok {
			w.Header().Set("Content-Type", ct)
		} else {
			w.Header().Set("Content-Type", contentType[".txt"])
		}
		w.Write(data)
	}))

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
