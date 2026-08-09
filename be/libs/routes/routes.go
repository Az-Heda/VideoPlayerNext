package routes

import (
	"embed"
	"fmt"
	"full/libs/db"
	"full/libs/models"
	"full/libs/routes/gql"
	"full/libs/routes/oapi"
	"full/libs/webserver"
	"io/fs"
	"net/http"
	"os"
	"path/filepath"
	"slices"
	"strings"
	"time"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/rs/zerolog/log"
)

const (
	AuthCookieName  string        = "identity"
	SessionDuration time.Duration = time.Minute * 60

	homepage   string = "/"
	signinPage string = "/auth/signin"
)

var WebServer *webserver.Mux = nil

func init() {
	if WebServer == nil {
		WebServer = webserver.NewMux()
	}
}

type AdditionalConfigs struct {
	EnableGraphql             bool
	GraphqlEndpoint           string
	GraphqlPlaygroundEndpoint string

	EnableOpenApi         bool
	OpenApiSpecEndpoint   string
	OpenApiSpecFullUrl    string
	OpenApiScalarEndpoint string
}

func AddWebsite(fsys embed.FS, startDir string, fileCounter prometheus.Gauge, configs *AdditionalConfigs) {
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

	videoHandler.HandleFuncWithOApi("GET /set/{id}/watched", func(o *oapi.OpenApi, responses oapi.ResponsesCollection) func(w http.ResponseWriter, req *http.Request) {

		o.Paths.New("/video/set/{id}/watched", oapi.OpenApiPathItem{
			Get: &oapi.OpenApiOperation{
				Tags:    []string{"Videos"},
				Summary: "Change video watched attribute",
				Parameters: []oapi.OpenApiParameter{
					{
						In:     "path",
						Name:   "id",
						Schema: oapi.GetSchema("string"),
					},
					{
						In:     "query",
						Name:   "value",
						Schema: oapi.GetSchema("string"),
					},
				},
				Responses: oapi.ResponsesCollection{
					http.StatusOK: oapi.OpenApiResponse{
						Content: oapi.MediaTypeCollection{
							"application/json": oapi.OpenApiMediaType{
								Schema: oapi.OpenApiSchema{
									Ref: o.GetRef("schemas", "video"),
								},
							},
						},
					},
					http.StatusBadRequest: oapi.OpenApiResponse{
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

		return func(w http.ResponseWriter, r *http.Request) {
			var id = r.PathValue("id")
			var target = r.URL.Query().Get("value")

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

			var trueValues = []string{"T", "Y", "1"}
			var falseValues = []string{"F", "N", "0"}

			switch {
			case slices.Contains(trueValues, target):
				if !vid.Attributes.Watched {
					vid.Attributes.Watched = true
					if tx := conn.Save(vid); tx.Error != nil {
						log.Err(tx.Error).Send()
						apiError(w, tx.Error, http.StatusInternalServerError)
					}
				}
				videoUpdated <- vid
				if err := ApiResponseS(w, &vid); err != nil {
					apiError(w, err, http.StatusInternalServerError)
				}
				return

			case slices.Contains(falseValues, target):
				if vid.Attributes.Watched {
					vid.Attributes.Watched = false
					if tx := conn.Save(vid); tx.Error != nil {
						log.Err(tx.Error).Send()
						apiError(w, tx.Error, http.StatusInternalServerError)
					}
				}
				videoUpdated <- vid
				if err := ApiResponseS(w, &vid); err != nil {
					apiError(w, err, http.StatusInternalServerError)
				}
				return

			default:
				apiError(w, fmt.Errorf("Value '%s' is invalid", target), http.StatusBadRequest)
				return
			}
			// if slices.Contains(trueValues, target) {
			// watched = true
			// } else if {}

		}
	})

	videoHandler.HandleFuncWithOApi("GET /set/{id}/favorite", func(o *oapi.OpenApi, responses oapi.ResponsesCollection) func(w http.ResponseWriter, req *http.Request) {

		o.Paths.New("/video/set/{id}/favorite", oapi.OpenApiPathItem{
			Get: &oapi.OpenApiOperation{
				Tags:    []string{"Videos"},
				Summary: "Change video favorite attribute",
				Parameters: []oapi.OpenApiParameter{
					{
						In:     "path",
						Name:   "id",
						Schema: oapi.GetSchema("string"),
					},
					{
						In:     "query",
						Name:   "value",
						Schema: oapi.GetSchema("string"),
					},
				},
				Responses: oapi.ResponsesCollection{
					http.StatusOK: oapi.OpenApiResponse{
						Content: oapi.MediaTypeCollection{
							"application/json": oapi.OpenApiMediaType{
								Schema: oapi.OpenApiSchema{
									Ref: o.GetRef("schemas", "video"),
								},
							},
						},
					},
					http.StatusBadRequest: oapi.OpenApiResponse{
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

		return func(w http.ResponseWriter, r *http.Request) {
			var id = r.PathValue("id")
			var target = r.URL.Query().Get("value")

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

			var trueValues = []string{"T", "Y", "1"}
			var falseValues = []string{"F", "N", "0"}

			switch {
			case slices.Contains(trueValues, target):
				if !vid.Attributes.Favorite {
					vid.Attributes.Favorite = true
					if tx := conn.Save(vid); tx.Error != nil {
						log.Err(tx.Error).Send()
						apiError(w, tx.Error, http.StatusInternalServerError)
					}
				}
				videoUpdated <- vid
				if err := ApiResponseS(w, &vid); err != nil {
					apiError(w, err, http.StatusInternalServerError)
				}
				return

			case slices.Contains(falseValues, target):
				if vid.Attributes.Favorite {
					vid.Attributes.Favorite = false
					if tx := conn.Save(vid); tx.Error != nil {
						log.Err(tx.Error).Send()
						apiError(w, tx.Error, http.StatusInternalServerError)
					}
				}
				videoUpdated <- vid
				if err := ApiResponseS(w, &vid); err != nil {
					apiError(w, err, http.StatusInternalServerError)
				}
				return

			default:
				apiError(w, fmt.Errorf("Value '%s' is invalid", target), http.StatusBadRequest)
				return
			}
		}
	})

	pictureHandler := webserver.NewMux()

	pictureHandler.HandleFunc("/{id}", func(w http.ResponseWriter, r *http.Request) {
		var id = r.PathValue("id")
		var pics []models.Picture
		if tx := conn.WithContext(r.Context()).Find(&pics, models.Picture{Id: id}); tx.Error != nil {
			log.Err(err).Send()
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		switch len(pics) {
		case 0:
			http.Error(w, fmt.Sprintf("Cannot find image with id: `%s`", id), http.StatusNotFound)
		case 1:
			var ct = map[string]string{
				".jpg":  "image/jpeg",
				".jpeg": "image/jpeg",
				".png":  "image/png",
				".gif":  "image/gif",
			}
			mimeType, ok := ct[filepath.Ext(strings.ToLower(pics[0].FilePath))]
			if !ok {
				http.Error(w, "Invalid picture extension", http.StatusInternalServerError)
				return
			}
			file, err := os.ReadFile(pics[0].FilePath)
			if err != nil {
				log.Err(err).Send()
				http.Error(w, fmt.Sprintf("Cannot find file with id: `%s`", id), http.StatusNotFound)
				return
			}
			w.Header().Set("Content-Type", mimeType)
			w.Write(file)
		default:
			http.Error(w, "Found multiple images with the same id", http.StatusInternalServerError)
		}
	})

	WebServer.HandleMux("/video", videoHandler)
	WebServer.HandleMux("/picture", pictureHandler)
	WebServer.HandleMux("/actions", handleActions(webserver.NewMux(), conn))
	WebServer.HandleMux("/api/v1", handleApiV1(webserver.NewMux(), conn, videoUpdated))

	if configs != nil && configs.EnableGraphql {

		WebServer.OpenApi.Components.Schemas.New("api-error", oapi.GetSchemaFromMap(map[string]any{
			"when":  time.Now().Format(time.RFC3339),
			"error": "error",
		}))

		WebServer.OpenApi.Components.Schemas.New("folder", oapi.GetSchemaFromMap(map[string]any{
			"id":   "string",
			"path": "string",
		}))

		WebServer.OpenApi.Components.Schemas.New("picture", oapi.OpenApiSchema{
			Type: "object",
			Properties: oapi.SchemaCollection{
				"id":       oapi.GetSchema("string"),
				"title":    oapi.GetSchema("string"),
				"filepath": oapi.GetSchema("string"),
				"duration": oapi.GetSchema(int64(0)),
				"size":     oapi.GetSchema(int64(0)),
				"folder": oapi.OpenApiSchema{
					Type: "array",
					Items: &oapi.OpenApiSchema{
						Ref: WebServer.OpenApi.GetRef("schemas", "folder"),
					},
				},
			},
		})

		WebServer.OpenApi.Components.Schemas.New("video", oapi.OpenApiSchema{
			Type: "object",
			Properties: oapi.SchemaCollection{
				"id":       oapi.GetSchema("string"),
				"title":    oapi.GetSchema("string"),
				"filepath": oapi.GetSchema("string"),
				"duration": oapi.GetSchema(int64(0)),
				"size":     oapi.GetSchema(int64(0)),
				"folder": oapi.OpenApiSchema{
					Type: "array",
					Items: &oapi.OpenApiSchema{
						Ref: WebServer.OpenApi.GetRef("schemas", "folder"),
					},
				},
				"attributes": oapi.OpenApiSchema{
					Type: "object",
					Properties: oapi.SchemaCollection{
						"exists":  oapi.GetSchema(true),
						"watched": oapi.GetSchema(true),
					},
				},
			},
		})

		WebServer.OpenApi.Components.Schemas.New("user", oapi.OpenApiSchema{
			Type: "object",
			Properties: oapi.SchemaCollection{
				"id":             oapi.GetSchema("string"),
				"email":          oapi.GetSchema("string"),
				"username":       oapi.GetSchema("string"),
				"passwordHashed": oapi.GetSchema("string"),
				"perms": oapi.OpenApiSchema{
					Type: "object",
					Properties: oapi.SchemaCollection{
						"isAdmin": oapi.GetSchema(true),
					},
				},
			},
		})

		WebServer.OpenApi.Components.Schemas.New("session", oapi.OpenApiSchema{
			Type: "object",
			Properties: oapi.SchemaCollection{
				"id":         oapi.GetSchema("string"),
				"user_id":    oapi.GetSchema("string"),
				"created_at": oapi.GetSchema("string"),
				"lifespan":   oapi.GetSchema(1),
			},
		})

		// WebServer.OpenApi.Components.Schemas.New("api-videos")

		WebServer.HandleFunc(configs.GraphqlEndpoint, gql.Handler(conn))
		WebServer.HandleFunc(configs.GraphqlPlaygroundEndpoint, func(w http.ResponseWriter, r *http.Request) {
			if err := gql.Playground(w, configs.GraphqlEndpoint); err != nil {
				log.Err(err).Send()
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
		})
	}

	if configs != nil && configs.EnableOpenApi {
		WebServer.HandleFunc(configs.OpenApiSpecEndpoint, WebServer.OpenApi.ServeOpenApiSpecs)
		WebServer.HandleFunc(configs.OpenApiScalarEndpoint, WebServer.OpenApi.ServeOpenapiScalar(configs.OpenApiSpecFullUrl))
	}

	go func() {
		for {
			time.Sleep(time.Minute * 60)
			SessionManager(conn)
		}
	}()
}
