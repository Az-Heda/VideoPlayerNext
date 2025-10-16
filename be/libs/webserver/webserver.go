package webserver

import (
	"fmt"
	"full/libs/routes/oapi"
	"net/http"
	"strings"

	"dario.cat/mergo"
	"github.com/rs/zerolog/log"
)

type Mux struct {
	http.ServeMux
	OpenApi *oapi.OpenApi
}

func NewMux() *Mux {
	return &Mux{
		OpenApi: oapi.New("3.1.0", oapi.OpenApiInfo{
			Title:   "Video player",
			Version: "v0.0.2",
		}),
	}
}

func MiddlewareAuthBasic(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		validUsername := "admin"
		validPassword := "secret"

		username, password, ok := r.BasicAuth()
		if !ok || username != validUsername || password != validPassword {
			w.Header().Set("WWW-Authenticate", `Basic realm="protected"`)
			http.Error(w, "401 Unauthorized", http.StatusUnauthorized)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func (m *Mux) HandleMux(pattern string, mux *Mux) {
	if !strings.HasPrefix(pattern, "/") {
		log.Panic().Err(fmt.Errorf("pattern `%s` is invalid, the pattern should start with `/`", pattern)).Send()
	}

	if err := mergo.Merge(m.OpenApi, mux.OpenApi, mergo.WithOverride, mergo.WithoutDereference); err != nil {
		log.Err(err).Send()
	}

	pattern = strings.TrimSuffix(pattern, "/")
	m.Handle(pattern+"/", DefaultLoggerMiddleware(http.StripPrefix(pattern, mux)))
}

func (m *Mux) HandleFuncWithOApi(pattern string, handler func(o *oapi.OpenApi, responses oapi.ResponsesCollection) func(w http.ResponseWriter, req *http.Request)) {
	m.HandleFunc(pattern, handler(m.OpenApi, oapi.ResponsesCollection{}))
}
