package routes

import (
	"embed"
	"fmt"
	"full/libs/db"
	"full/libs/models"
	"full/libs/webserver"
	"io/fs"
	"net/http"
	"strings"
	"time"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/rs/zerolog/log"
)

const (
	AuthCookieName  string        = "identity"
	SessionDuration time.Duration = time.Minute * 5

	homepage   string = "/"
	signinPage string = "/auth/signin"
)

var WebServer *webserver.Mux = nil

func init() {
	if WebServer == nil {
		WebServer = webserver.NewMux()
	}
}

func AddWebsite(fsys embed.FS, startDir string, fileCounter prometheus.Gauge) {
	conn, err := db.Connect()
	if err != nil {
		log.Panic().Err(err).Send()
	}

	go func() {
		for {
			var counter int64
			conn.Model(&models.Video{}).Count(&counter)
			fileCounter.Set(float64(counter))
			log.Info().Int64("counter", counter).Send()
			time.Sleep(time.Minute * 20)
		}
	}()

	newFsys, err := fs.Sub(fsys, startDir)
	if err != nil {
		log.Panic().Err(err).Send()
	}

	var videoUpdated chan models.Video = make(chan models.Video)

	WebServer.Handle("/", webserver.DefaultLoggerMiddleware(http.FileServerFS(newFsys)))
	for _, f := range readEmbedFiles(fsys, startDir) {
		if strings.HasSuffix(f, ".html") {
			endpoint := strings.TrimPrefix(strings.TrimSuffix(f, ".html"), startDir)

			WebServer.HandleFunc(endpoint, func(w http.ResponseWriter, r *http.Request) {
				content, err := fsys.ReadFile(f)
				if err != nil && endpoint != "/404" {
					content, err := fsys.ReadFile("website/404.html")
					if err != nil {
						log.Panic().Err(err).Send()
					}
					w.Write(content)
					return
				}
				w.Write(content)
			})
		}
	}

	videoHandler := webserver.NewMux()
	videoHandler.HandleFunc("GET /info/{id}", func(w http.ResponseWriter, r *http.Request) {
		var id = r.PathValue("id")

		var data []models.Video
		if tx := conn.WithContext(r.Context()).Find(&data, models.Video{Id: id}); tx.Error != nil {
			apiError(w, tx.Error, http.StatusInternalServerError)
			return
		}

		if len(data) == 0 {
			apiError(w, fmt.Errorf("cannot find video with id=\"%s\"", id), http.StatusNotFound)
			return
		}
		if len(data) > 1 {
			apiError(w, fmt.Errorf("found multiple videos with id=\"%s\"", id), http.StatusNotFound)
			return
		}

		ApiResponseS(w, &data[0])
		// w.Write([]byte(id))
	})

	videoHandler.HandleFunc("GET /stream/{id}", func(w http.ResponseWriter, r *http.Request) {
		var id = r.PathValue("id")

		var data []models.Video
		if tx := conn.WithContext(r.Context()).Find(&data, models.Video{Id: id}); tx.Error != nil {
			apiError(w, tx.Error, http.StatusInternalServerError)
			return
		}

		if len(data) == 0 {
			apiError(w, fmt.Errorf("cannot find video with id=\"%s\"", id), http.StatusNotFound)
			return
		}
		if len(data) > 1 {
			apiError(w, fmt.Errorf("found multiple videos with id=\"%s\"", id), http.StatusNotFound)
			return
		}

		var vid = data[0]
		if !vid.Attributes.Watched {
			vid.Attributes.Watched = true
			if tx := conn.UpdateColumns(&vid); tx.Error != nil {
				log.Err(tx.Error).Send()
				apiError(w, tx.Error, http.StatusInternalServerError)
				return
			}
			videoUpdated <- vid
		}

		if vid.CheckFile(conn.WithContext(r.Context())) {
			http.ServeFile(w, r, vid.FilePath)
		} else {
			apiError(w, fmt.Errorf("cannot find video with id=\"%s\"", id), http.StatusNotFound)
		}
	})

	WebServer.HandleMux("/video", videoHandler)
	WebServer.HandleMux("/actions", handleActions(webserver.NewMux(), conn))
	WebServer.HandleMux("/api/v1", handleApiV1(webserver.NewMux(), conn, videoUpdated))

	go func() {
		for {
			time.Sleep(time.Minute * 5)
			SessionManager(conn)
		}
	}()
}
