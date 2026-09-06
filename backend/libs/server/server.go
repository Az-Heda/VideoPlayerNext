package server

import (
	"net/http"
	"vp/libs/api/apivideo"

	"gorm.io/gorm"
)

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
