package webserver

import (
	"fmt"
	"net/http"
	"strings"

	"github.com/rs/zerolog/log"
)

type Mux struct{ http.ServeMux }

func NewMux() *Mux {
	return &Mux{}
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

	pattern = strings.TrimSuffix(pattern, "/")
	m.Handle(pattern+"/", DefaultLoggerMiddleware(http.StripPrefix(pattern, mux)))
}
