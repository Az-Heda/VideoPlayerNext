package routes

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"full/libs/models"
	"full/libs/routes/oapi"
	"full/libs/utils"
	"full/libs/webserver"
	"net/http"
	"os"
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
	b, err := json.MarshalIndent(apiData, "", strings.Repeat(" ", 2))
	if err != nil {
		apiError(w, err, http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	w.Write(b)
}

func reload(conn *gorm.DB, videos *utils.GS[[]models.Video]) error {
	Startup(conn)
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

	go func() {
		var pics []models.Picture
		if tx := conn.Find(&pics); tx.Error != nil {
			log.Err(tx.Error).Send()
			return
		}
		for _, p := range pics {
			if _, err := os.Lstat(p.FilePath); err != nil {
				if tx := conn.Delete(&p); tx.Error != nil {
					log.Err(tx.Error).Send()
					continue
				}
			}
		}
	}()

	var before = len(videos.Getter)
	videos.Setter <- correctVideos
	var after = len(videos.Getter)
	log.Debug().Int("before", before).Int("after", after).Msg("Video reloaded")
	return nil
}

func Startup(conn *gorm.DB) error {
	var folders []models.Folder

	if tx := conn.Delete(models.Video{}, map[string]any{"folder_id": ""}); tx.Error != nil {
		log.Err(tx.Error).Send()
		return tx.Error
	}

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
				if err := v.GetDuration(); err != nil {
					log.Err(err).Str("file", v.FilePath).Str("id", v.Id).Send()
				}
				if tx := conn.Create(&v); tx.Error != nil {
					log.Err(tx.Error).Send()
					continue
				}

				log.Info().Str("id", v.Id).Str("title", v.Title).Msg("Created")
			} else if !res[0].Attributes.Exists {
				res[0].Attributes.Exists = true
				if tx := conn.Model(&res[0]).UpdateColumns(map[string]any{"attr_exists": true}); tx.Error != nil {
					log.Err(tx.Error).Send()
					continue
				}
				log.Info().Bool("exists", res[0].Attributes.Exists).Str("id", res[0].Id).Msg("Updated video exist flag")
			}
		}

		for _, p := range f.GetPictures() {
			var res []models.Picture
			if tx := conn.Find(&res, models.Picture{Id: p.Id}); tx.Error != nil {
				log.Err(tx.Error).Send()
			}
			if len(res) == 0 {
				if tx := conn.Create(&p); tx.Error != nil {
					log.Err(tx.Error).Send()
					continue
				}
			}
		}
	}
	return nil
}

func handleApiV1(apiv1 *webserver.Mux, conn *gorm.DB, videoUpdated <-chan models.Video) *webserver.Mux {
	var videos = utils.NewGetterSetter[[]models.Video](nil)
	if err := reload(conn, videos); err != nil {
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

	apiv1.HandleFuncWithOApi("GET /folders", func(o *oapi.OpenApi, responses oapi.ResponsesCollection) func(w http.ResponseWriter, req *http.Request) {

		o.Paths.New("/api/v1/folders", oapi.OpenApiPathItem{
			Get: &oapi.OpenApiOperation{
				Tags:    []string{"Folders"},
				Summary: "Get folders",
				Responses: oapi.ResponsesCollection{
					http.StatusOK: oapi.OpenApiResponse{
						Content: oapi.MediaTypeCollection{
							"application/json": oapi.OpenApiMediaType{
								Schema: oapi.OpenApiSchema{
									Type: "array",
									Items: &oapi.OpenApiSchema{
										Ref: o.GetRef("schemas", "folder"),
									},
								},
							},
						},
					},
					http.StatusInternalServerError: oapi.OpenApiResponse{
						Content: oapi.MediaTypeCollection{
							"application/json": oapi.OpenApiMediaType{
								Schema: oapi.OpenApiSchema{
									Ref: o.GetRef("schemas", "api-error"),
								},
							},
						},
					},
				},
			},
		})

		return func(w http.ResponseWriter, req *http.Request) {
			var folders []models.Folder

			if tx := conn.WithContext(req.Context()).Find(&folders); tx.Error != nil {
				apiError(w, tx.Error, http.StatusInternalServerError)
				return
			}

			if err := ApiResponseM(w, folders); err != nil {
				apiError(w, err, http.StatusInternalServerError)
			}
		}
	})

	apiv1.HandleFuncWithOApi("GET /videos", func(o *oapi.OpenApi, responses oapi.ResponsesCollection) func(w http.ResponseWriter, req *http.Request) {

		o.Paths.New("/api/v1/videos", oapi.OpenApiPathItem{
			Get: &oapi.OpenApiOperation{
				Tags:    []string{"Videos"},
				Summary: "Get videos",
				Responses: oapi.ResponsesCollection{
					http.StatusOK: oapi.OpenApiResponse{
						Content: oapi.MediaTypeCollection{
							"application/json": oapi.OpenApiMediaType{
								Schema: oapi.OpenApiSchema{
									Type: "object",
									Properties: oapi.SchemaCollection{
										"when": oapi.GetSchema("string"),
										"results": oapi.OpenApiSchema{
											Type: "array",
											Items: &oapi.OpenApiSchema{
												Ref: o.GetRef("schemas", "video"),
											},
										},
									},
								},
							},
						},
					},
					http.StatusInternalServerError: oapi.OpenApiResponse{
						Content: oapi.MediaTypeCollection{
							"application/json": oapi.OpenApiMediaType{
								Schema: oapi.OpenApiSchema{
									Ref: o.GetRef("schemas", "api-error"),
								},
							},
						},
					},
				},
			},
		})

		return CheckAuth(conn, func(w http.ResponseWriter, r *http.Request, user *models.User, err error) {
			var logged bool = user != nil
			var folders []models.Folder
			if tx := conn.WithContext(r.Context()).Find(&folders); tx.Error != nil {
				log.Err(tx.Error).Send()
				apiError(w, tx.Error, http.StatusInternalServerError)
			}

			var vids []*models.Video
			for _, v := range videos.Getter {
				var correctFolder *models.Folder = nil
				for _, f := range folders {
					if v.Folder.Id == f.Id {
						correctFolder = &f
						break
					}
				}

				if correctFolder != nil {
					if !correctFolder.AuthRequired || (correctFolder.AuthRequired && logged) {
						vids = append(vids, &v)
					}
				}
			}

			if err := ApiResponseM(w, vids); err != nil {
				apiError(w, err, http.StatusInternalServerError)
			}
		})
	})

	apiv1.HandleFuncWithOApi("GET /reload-data", func(o *oapi.OpenApi, responses oapi.ResponsesCollection) func(w http.ResponseWriter, req *http.Request) {

		o.Paths.New("/api/v1/reload-data", oapi.OpenApiPathItem{
			Get: &oapi.OpenApiOperation{
				Tags:    []string{"Reload data"},
				Summary: "Reload data",
				Responses: oapi.ResponsesCollection{
					http.StatusOK: oapi.OpenApiResponse{
						Content: oapi.MediaTypeCollection{
							"text/plain": oapi.OpenApiMediaType{
								Schema: oapi.GetSchema("string"),
							},
						},
					},
					http.StatusInternalServerError: oapi.OpenApiResponse{
						Content: oapi.MediaTypeCollection{
							"application/json": oapi.OpenApiMediaType{
								Schema: oapi.OpenApiSchema{
									Ref: o.GetRef("schemas", "api-error"),
								},
							},
						},
					},
				},
			},
		})

		return func(w http.ResponseWriter, req *http.Request) {
			if err := reload(conn.WithContext(req.Context()), videos); err != nil {
				apiError(w, err, http.StatusInternalServerError)
				return
			}
			w.Write([]byte("ok"))
		}
	})

	apiv1.HandleFuncWithOApi("GET /pictures", func(o *oapi.OpenApi, responses oapi.ResponsesCollection) func(w http.ResponseWriter, req *http.Request) {

		o.Paths.New("/api/v1/pictures", oapi.OpenApiPathItem{
			Get: &oapi.OpenApiOperation{
				Tags:    []string{"Pictures"},
				Summary: "Picture list",
				Responses: oapi.ResponsesCollection{
					http.StatusOK: oapi.OpenApiResponse{
						Content: oapi.MediaTypeCollection{
							"application/json": oapi.OpenApiMediaType{
								Schema: oapi.OpenApiSchema{
									Type: "object",
									Properties: oapi.SchemaCollection{
										"when": oapi.GetSchema("string"),
										"results": oapi.OpenApiSchema{
											Type: "array",
											Items: &oapi.OpenApiSchema{
												Ref: o.GetRef("schemas", "picture"),
											},
										},
									},
								},
							},
						},
					},
					http.StatusInternalServerError: oapi.OpenApiResponse{
						Content: oapi.MediaTypeCollection{
							"application/json": oapi.OpenApiMediaType{
								Schema: oapi.OpenApiSchema{
									Ref: o.GetRef("schemas", "api-error"),
								},
							},
						},
					},
				},
			},
		})

		return func(w http.ResponseWriter, r *http.Request) {
			var pics []models.Picture
			if tx := conn.Find(&pics); tx.Error != nil {
				return
			}
			if err := ApiResponseM(w, pics); err != nil {
				apiError(w, err, http.StatusInternalServerError)
			}
		}
	})

	apiv1.HandleFuncWithOApi("GET /pictures/info/{id}", func(o *oapi.OpenApi, responses oapi.ResponsesCollection) func(w http.ResponseWriter, req *http.Request) {

		o.Paths.New("/api/v1/pictures/info/{id}", oapi.OpenApiPathItem{
			Get: &oapi.OpenApiOperation{
				Tags:    []string{"Pictures"},
				Summary: "Picture info",
				Parameters: []oapi.OpenApiParameter{
					{
						Name:            "id",
						In:              "path",
						Required:        true,
						AllowEmptyValue: false,
						Deprecated:      false,
						Schema:          oapi.GetSchema("string"),
					},
				},
				Responses: oapi.ResponsesCollection{
					http.StatusOK: oapi.OpenApiResponse{
						Content: oapi.MediaTypeCollection{
							"application/json": oapi.OpenApiMediaType{
								Schema: oapi.OpenApiSchema{
									Type: "object",
									Properties: oapi.SchemaCollection{
										"when": oapi.GetSchema("string"),
										"result": oapi.OpenApiSchema{
											Ref: o.GetRef("schemas", "picture"),
										},
									},
								},
							},
						},
					},
					http.StatusInternalServerError: oapi.OpenApiResponse{
						Content: oapi.MediaTypeCollection{
							"application/json": oapi.OpenApiMediaType{
								Schema: oapi.OpenApiSchema{
									Ref: o.GetRef("schemas", "api-error"),
								},
							},
						},
					},
				},
			},
		})

		return func(w http.ResponseWriter, r *http.Request) {
			var pics []models.Picture
			var id = r.PathValue("id")
			if tx := conn.Find(&pics, models.Picture{Id: id}); tx.Error != nil {
				apiError(w, tx.Error, http.StatusInternalServerError)
				return
			}
			switch len(pics) {
			case 0:
				apiError(w, fmt.Errorf("cannot find picture with id=`%s`", id), http.StatusNotFound)
				return
			case 1:
				if err := ApiResponseS(w, &pics[0]); err != nil {
					apiError(w, err, http.StatusInternalServerError)
				}
			default:
				apiError(w, fmt.Errorf("found %d pictures with id=`%s`", len(pics), id), http.StatusInternalServerError)
				return
			}
		}
	})

	apiv1.HandleFuncWithOApi("GET /whoami", func(o *oapi.OpenApi, responses oapi.ResponsesCollection) func(w http.ResponseWriter, req *http.Request) {

		o.Paths.New("/api/v1/whoami", oapi.OpenApiPathItem{
			Get: &oapi.OpenApiOperation{
				Tags:    []string{"User"},
				Summary: "User info",
				Responses: oapi.ResponsesCollection{
					http.StatusOK: oapi.OpenApiResponse{
						Content: oapi.MediaTypeCollection{
							"application/json": oapi.OpenApiMediaType{
								Schema: oapi.OpenApiSchema{
									Type: "object",
									Properties: oapi.SchemaCollection{
										"when": oapi.GetSchema("string"),
										"result": oapi.OpenApiSchema{
											Type: "object",
											Properties: oapi.SchemaCollection{
												"user": oapi.OpenApiSchema{
													Ref: o.GetRef("schemas", "user"),
												},
												"session": oapi.OpenApiSchema{
													Ref: o.GetRef("schemas", "session"),
												},
											},
										},
									},
								},
							},
						},
					},
					http.StatusUnauthorized: oapi.OpenApiResponse{
						Content: oapi.MediaTypeCollection{
							"application/json": oapi.OpenApiMediaType{
								Schema: oapi.OpenApiSchema{
									Ref: o.GetRef("schemas", "api-error"),
								},
							},
						},
					},
					http.StatusInternalServerError: oapi.OpenApiResponse{
						Content: oapi.MediaTypeCollection{
							"application/json": oapi.OpenApiMediaType{
								Schema: oapi.OpenApiSchema{
									Ref: o.GetRef("schemas", "api-error"),
								},
							},
						},
					},
				},
			},
		})

		return CheckAuth(conn, func(w http.ResponseWriter, r *http.Request, user *models.User, err error) {
			if err != nil {
				apiError(w, err, http.StatusUnauthorized)
				return
			}
			if user == nil {
				apiError(w, errors.New("error while trying to get the logged user"), http.StatusInternalServerError)
				return
			}

			var sessions []models.Session
			if tx := conn.WithContext(r.Context()).Find(&sessions, models.Session{UserId: user.Id}); tx.Error != nil {
				apiError(w, errors.New("error while trying to get the user session"), http.StatusInternalServerError)
				return
			}

			var session *models.Session
			if len(sessions) == 1 {
				session = &sessions[0]
			}

			user.PasswordHashed = ""
			if err := ApiResponseS(w, &map[string]any{
				"user":    user,
				"session": session,
			}); err != nil {
				apiError(w, err, http.StatusInternalServerError)
			}
		})
	})

	apiv1.HandleFuncWithOApi("GET /pages", func(o *oapi.OpenApi, responses oapi.ResponsesCollection) func(w http.ResponseWriter, req *http.Request) {
		o.Paths.New("/api/v1/pages", oapi.OpenApiPathItem{
			Get: &oapi.OpenApiOperation{
				Tags:    []string{"Pages"},
				Summary: "Page list",
				Responses: oapi.ResponsesCollection{
					http.StatusOK: oapi.OpenApiResponse{
						Content: oapi.MediaTypeCollection{
							"application/json": oapi.OpenApiMediaType{
								Schema: oapi.OpenApiSchema{
									Type: "object",
									Properties: oapi.SchemaCollection{
										"when": oapi.GetSchema("string"),
										"result": oapi.OpenApiSchema{
											Type: "object",
											Properties: oapi.SchemaCollection{
												"id":     oapi.GetSchema("string"),
												"title":  oapi.GetSchema("title"),
												"schema": oapi.GetSchema("schema"),
											},
										},
									},
								},
							},
						},
					},
					http.StatusInternalServerError: oapi.OpenApiResponse{
						Content: oapi.MediaTypeCollection{
							"application/json": oapi.OpenApiMediaType{
								Schema: oapi.OpenApiSchema{
									Ref: o.GetRef("schemas", "api-error"),
								},
							},
						},
					},
				},
			},
		})

		return CheckAuth(conn, func(w http.ResponseWriter, r *http.Request, user *models.User, err error) {
			var pages []models.Page

			if tx := conn.Find(&pages, map[string]any{"auth_required": err == nil && user != nil}); tx.Error != nil {
				log.Err(tx.Error).Send()
				apiError(w, tx.Error, http.StatusInternalServerError)
				return
			}

			if err := ApiResponseM(w, pages); err != nil {
				apiError(w, err, http.StatusInternalServerError)
			}
		})
	})

	go func() {
		for {
			time.Sleep(time.Minute * 30)
			reload(conn.WithContext(context.Background()), videos)
		}
	}()
	return apiv1
}
