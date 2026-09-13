package server

import (
	"context"
	"fmt"
	"net"
	"net/http"
	"slices"
	"sync"
	"time"

	"github.com/rs/cors"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/hlog"
	"golang.org/x/time/rate"
)

type Middleware func(http.Handler) http.Handler
type MiddlewareIf struct {
	Cond       bool
	Middleware Middleware
}
type Method uint

func ApplyMiddleware(handler http.Handler, middlewares ...Middleware) http.Handler {
	slices.Reverse(middlewares)
	for _, m := range middlewares {
		handler = m(handler)
	}
	return handler
}

func ApplyMiddlewareIf(handler http.Handler, middlewares ...MiddlewareIf) http.Handler {
	var validMiddlewares []Middleware
	for _, m := range middlewares {
		if m.Cond {
			validMiddlewares = append(validMiddlewares, m.Middleware)
		}
	}
	return ApplyMiddleware(handler, validMiddlewares...)
}

func MiddlewareRequestLogger(next http.Handler) http.Handler {
	return ApplyMiddleware(
		next,
		hlog.RequestIDHandler("reqid", "Request-Id"),
		hlog.RefererHandler("referer"),
		hlog.RemoteAddrHandler("ip"),
		hlog.AccessHandler(func(r *http.Request, status, size int, duration time.Duration) {
			var hl = hlog.FromRequest(r)
			var l *zerolog.Event
			switch {
			case 200 <= status && status < 400:
				// l = hl.WithLevel(SuccessLevel)
				l = hl.Info()

				hl.WithLevel(zerolog.ErrorLevel)
			case status >= 400:
				l = hl.Error()
			default:
				l = hl.Trace()
			}

			l.
				Str("method", r.Method).
				Stringer("url", r.URL).
				Int("status", status).
				Int("size", size).
				Stringer("duration", duration).
				Msg("Logging request")
		}),
	)
}

func MiddlewareAuthorization(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		token := r.Header.Get("Authorization")
		if token == "" {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func MiddlewareRecover(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if v := recover(); v != nil {
				hlog.FromRequest(r).Error().
					Any("error", v).
					Msg("Panic")
				fmt.Fprintf(w, "Panic!\n\n%v", v)
				return
			}
		}()

		next.ServeHTTP(w, r)
	})
}

func MiddlewareTimeout(timeoutDuration time.Duration) func(next http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ctx, cancel := context.WithTimeout(r.Context(), timeoutDuration)
			defer cancel()
			r = r.WithContext(ctx)

			done := make(chan struct{})

			go func() {
				next.ServeHTTP(w, r)
				close(done)
			}()

			select {
			case <-done:
			case <-ctx.Done():
				http.Error(w, "request timeout", http.StatusGatewayTimeout)
			}
		})
	}
}

// Implement a rate limit.
//
// - rps (rate) = how quickly tokens are added to the bucket
//
// - burst = the bucket's maximum size (how many tokens it can hold)
//
// Common values:
//
// Strict API | rps=5 | burst=10
//
// Normal API | rps=10 | burst=20
//
// Busy API | rps=50 | burst=100
//
// Internal service | rps=100 | burst=200
//
// Very permissive | rps=500 | burst=1000
func MiddlewareRateLimit(rps float64, burst int) func(next http.Handler) http.Handler {
	limiter := rate.NewLimiter(rate.Limit(rps), burst)

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if limiter.Allow() {
				next.ServeHTTP(w, r)
			} else {
				http.Error(w, "rate limit exceeded", http.StatusTooManyRequests)
			}
		})
	}
}

// Implement a rate limit.
//
// - rps (rate) = how quickly tokens are added to the bucket
//
// - burst = the bucket's maximum size (how many tokens it can hold)
//
// Common values:
//
// Strict API | rps=5 | burst=10
//
// Normal API | rps=10 | burst=20
//
// Busy API | rps=50 | burst=100
//
// Internal service | rps=100 | burst=200
//
// Very permissive | rps=500 | burst=1000
func MiddlewareRateLimitByIP(rps float64, burst int) func(next http.Handler) http.Handler {
	clients := make(map[string]*rate.Limiter)
	var mu sync.Mutex

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ip, _, _ := net.SplitHostPort(r.RemoteAddr)

			mu.Lock()
			limiter, exists := clients[ip]
			if !exists {
				limiter = rate.NewLimiter(rate.Limit(rps), burst)
				clients[ip] = limiter
			}
			mu.Unlock()

			if limiter.Allow() {
				next.ServeHTTP(w, r)
			} else {
				http.Error(w, "rate limit exceeded", http.StatusTooManyRequests)
			}
		})
	}
}

func SkipPath(mw Middleware, paths ...string) Middleware {
	skip := make(map[string]struct{}, len(paths))
	for _, path := range paths {
		skip[path] = struct{}{}
	}

	return Skip(mw, func(r *http.Request) bool {
		_, ok := skip[r.URL.Path]
		return ok
	})
}

func Skip(mw Middleware, shouldSkip func(*http.Request) bool) Middleware {
	return func(next http.Handler) http.Handler {
		handler := mw(next)

		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if shouldSkip(r) {
				next.ServeHTTP(w, r)
				return
			}

			handler.ServeHTTP(w, r)
		})
	}
}

func SkipPattern(mw Middleware, patterns ...string) Middleware {
	skip := make(map[string]struct{}, len(patterns))
	for _, pattern := range patterns {
		skip[pattern] = struct{}{}
	}

	return func(next http.Handler) http.Handler {
		handler := mw(next)

		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if _, ok := skip[r.Pattern]; ok {
				next.ServeHTTP(w, r)
				return
			}

			handler.ServeHTTP(w, r)
		})
	}
}

func MiddlewareCORS(enableDebugMode bool, allowedOrigins []string) func(next http.Handler) http.Handler {
	// var cl = log.Hook(zerolog.HookFunc(func(e *zerolog.Event, level zerolog.Level, message string) {
	// 	e.Str("source", "_cors")
	// }))
	var corsRules = cors.New(cors.Options{
		AllowedOrigins:   allowedOrigins,
		AllowCredentials: true,
		Debug:            enableDebugMode,
		AllowedMethods: []string{
			http.MethodHead,
			http.MethodGet,
			http.MethodPost,
			http.MethodDelete,
			http.MethodPatch,
			http.MethodPut,
		},
	})
	return func(handler http.Handler) http.Handler {
		return corsRules.Handler(handler)
	}
}

func MiddlewareCSRF(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Only protect state-changing requests
		switch r.Method {
		case http.MethodPost, http.MethodPut, http.MethodPatch, http.MethodDelete:
		default:
			next.ServeHTTP(w, r)
			return
		}

		cookie, err := r.Cookie("csrf_token")
		if err != nil {
			http.Error(w, "missing csrf token", http.StatusForbidden)
			return
		}

		headerToken := r.Header.Get("X-CSRF-Token")

		if headerToken == "" || headerToken != cookie.Value {
			http.Error(w, "invalid csrf token", http.StatusForbidden)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func MiddlewareRequestSizeLimit(maxBytes int64) func(next http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			r.Body = http.MaxBytesReader(
				w,
				r.Body,
				maxBytes,
			)

			next.ServeHTTP(w, r)
		})
	}
}

func MiddlewareLogger(logger zerolog.Logger) func(http.Handler) http.Handler {
	return hlog.NewHandler(logger)
}
