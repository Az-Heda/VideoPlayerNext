package routes

import (
	"context"
	"encoding/json"
	"full/libs/models"
	"full/libs/utils"
	"full/libs/webserver"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/rs/zerolog/log"
	"gorm.io/gorm"
)

type Api[T any] struct {
	Results []T       `json:"results,omitempty"`
	Result  *T        `json:"result,omitempty"`
	When    time.Time `json:"when"`
	Next    string    `json:"next,omitempty"`
	Error   string    `json:"error,omitempty"`
}

func ApiResponseM[T any](w http.ResponseWriter, data []T) error {
	var apiData = Api[T]{
		Results: data,
		Result:  nil,
		When:    time.Now(),
	}
	b, err := json.MarshalIndent(apiData, "", strings.Repeat(" ", 2))
	if err != nil {
		return err
	}
	w.Header().Set("Content-Type", "application/json")
	w.Write(b)
	return nil
}

func ApiResponseS[T any](w http.ResponseWriter, data *T) error {
	var apiData = Api[T]{
		Results: nil,
		Result:  data,
		When:    time.Now(),
	}
	b, err := json.MarshalIndent(apiData, "", strings.Repeat(" ", 2))
	if err != nil {
		return err
	}
	w.Header().Set("Content-Type", "application/json")
	w.Write(b)
	return nil
}

func apiError(w http.ResponseWriter, err error, statusCode int) {
	var apiData = Api[int]{
		Results: nil,
		Result:  nil,
		When:    time.Now(),
		Error:   err.Error(),
	}
	log.Err(err).Send()
	b, err := json.MarshalIndent(apiData, "", strings.Repeat(" ", 2))
	if err != nil {
		apiError(w, err, http.StatusInternalServerError)
		return
	}
	w.WriteHeader(statusCode)
	w.Header().Set("Content-Type", "application/json")
	w.Write(b)
}

func reloadVideos(conn *gorm.DB, videos *utils.GS[[]models.Video]) error {
	StartupVideos(conn)
	var currentvideos []models.Video
	if tx := conn.Find(&currentvideos, models.Video{Attributes: models.VideoAttributes{Exists: true}}); tx.Error != nil {
		return tx.Error
	}
	var correctVideos []models.Video = []models.Video{}
	for _, v := range currentvideos {
		if v.CheckFile(conn) {
			correctVideos = append(correctVideos, v)
		}
	}

	var before = len(videos.Getter)
	videos.Setter <- correctVideos
	var after = len(videos.Getter)
	log.Debug().Int("before", before).Int("after", after).Msg("Video reloaded")
	return nil
}

func StartupVideos(conn *gorm.DB) error {
	var folders []models.Folder

	if tx := conn.Find(&folders); tx.Error != nil {
		log.Err(tx.Error).Send()
		return tx.Error
	}

	for _, f := range folders {
		for _, v := range f.GetVideos() {
			var res []models.Video
			if tx := conn.Find(&res, models.Video{Id: v.Id}); tx.Error != nil {
				log.Err(tx.Error).Send()
			}
			if len(res) == 0 {
				if err := v.GetDurationn(); err != nil {
					log.Err(err).Str("file", v.FilePath).Str("id", v.Id).Send()
				}
				if tx := conn.Create(&v); tx.Error != nil {
					log.Err(tx.Error).Send()
					continue
				}

				log.Info().Str("id", v.Id).Str("title", v.Title).Msg("Created")
				// } else {
				// 	if err := v.GetDurationn(); err != nil {
				// 		log.Err(err).Str("file", v.FilePath).Str("id", v.Id).Send()
				// 		continue
				// 	}

				// 	if tx := conn.UpdateColumns(&v); tx.Error != nil {
				// 		log.Err(tx.Error).Send()
				// 		continue
				// 	}

				// 	log.Info().Str("id", v.Id).Str("title", v.Title).Msg("Updated")
			}
		}
	}
	return nil
}

func handleApiV1(apiv1 *webserver.Mux, conn *gorm.DB, videoUpdated <-chan models.Video) *webserver.Mux {
	var videos = utils.NewGetterSetter[[]models.Video](nil)
	if err := reloadVideos(conn, videos); err != nil {
		log.Err(err).Send()
	}

	go func() {
		ticker := time.NewTicker(time.Minute)
		for {
			select {
			case v1 := <-videoUpdated:
				var mut sync.Mutex
				mut.Lock()
				for idx, v2 := range videos.Getter {
					if v1.Id == v2.Id {
						videos.Getter[idx] = v1
						log.Info().Str("id", v1.Id).Msg("Updated video")
					}
				}
				mut.Unlock()
			case <-ticker.C:
				continue
			}
		}
	}()

	apiv1.HandleFunc("GET /folders", func(w http.ResponseWriter, r *http.Request) {
		var folders []models.Folder

		if tx := conn.WithContext(r.Context()).Find(&folders); tx.Error != nil {
			apiError(w, tx.Error, http.StatusInternalServerError)
			return
		}

		if err := ApiResponseM(w, folders); err != nil {
			apiError(w, err, http.StatusInternalServerError)
		}
	})

	apiv1.HandleFunc("GET /videos", func(w http.ResponseWriter, r *http.Request) {
		if err := ApiResponseM(w, videos.Getter); err != nil {
			apiError(w, err, http.StatusInternalServerError)
		}
	})

	apiv1.HandleFunc("GET /reload-data", func(w http.ResponseWriter, r *http.Request) {
		if err := reloadVideos(conn.WithContext(r.Context()), videos); err != nil {
			// log.Err(err).Send()
			apiError(w, err, http.StatusInternalServerError)
			return
		}
		w.Write([]byte("ok"))
	})

	go func() {
		for {
			time.Sleep(time.Minute * 30)
			StartupVideos(conn.WithContext(context.Background()))
		}
	}()
	return apiv1
}
