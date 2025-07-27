package webserver

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"time"
)

var DefaultLoggerMiddleware = LoggerMiddleware(os.Stdout)

// ANSI color codes
const (
	colorReset  = "\033[0m"
	colorRed    = "\033[31m"
	colorGreen  = "\033[32m"
	colorYellow = "\033[33m"
	colorBlue   = "\033[34m"
	colorCyan   = "\033[36m"
)

type HttpMiddleware func(http.Handler) http.Handler

func ChainMiddleware(handler http.Handler, middlewares ...HttpMiddleware) http.Handler {
	for i := len(middlewares) - 1; i >= 0; i-- {
		handler = middlewares[i](handler)
	}
	return handler
}

type responseWriter struct {
	http.ResponseWriter
	statusCode int
	size       int
}

func (rw *responseWriter) WriteHeader(code int) {
	rw.statusCode = code
	rw.ResponseWriter.WriteHeader(code)
}

func (rw *responseWriter) Write(b []byte) (int, error) {
	if rw.statusCode == 0 {
		rw.WriteHeader(http.StatusOK)
	}
	n, err := rw.ResponseWriter.Write(b)
	rw.size += n
	return n, err
}

func colorForStatus(code int) string {
	switch {
	case code >= 200 && code < 300:
		return colorGreen
	case code >= 300 && code < 400:
		return colorCyan
	case code >= 400 && code < 500:
		return colorYellow
	default:
		return colorRed
	}
}

func colorForMethod(method string) string {
	switch method {
	case "GET":
		return colorBlue
	case "POST":
		return colorCyan
	case "PUT":
		return colorYellow
	case "DELETE":
		return colorRed
	default:
		return colorReset
	}
}

func formatSize(bytes int) string {
	const (
		KB = 1 << 10
		MB = 1 << 20
		GB = 1 << 30
	)

	switch {
	case bytes >= GB:
		return fmt.Sprintf("%.2fGB", float64(bytes)/GB)
	case bytes >= MB:
		return fmt.Sprintf("%.2fMB", float64(bytes)/MB)
	case bytes >= KB:
		return fmt.Sprintf("%.2fKB", float64(bytes)/KB)
	default:
		return fmt.Sprintf("%dB", bytes)
	}
}

func LoggerMiddleware(out io.Writer) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			start := time.Now()
			rw := &responseWriter{ResponseWriter: w}

			next.ServeHTTP(rw, r)

			duration := time.Since(start)
			methodColor := colorForMethod(r.Method)
			statusColor := colorForStatus(rw.statusCode)
			sizeFormatted := formatSize(rw.size)
			contentRange := rw.Header().Get("Content-Range")

			// log.Debug().
			// 	Str("duration", duration.String()).
			// 	Str("method", r.Method).
			// 	Int("status", rw.statusCode).
			// 	Str("size", sizeFormatted).
			// 	Send()

			fmt.Fprintf(out, "%s[%s]%s %s%-6s%s %s%3d%s %10s %15s %s %s\n",
				colorReset,
				start.Format("15:04:05 2006-01-02"),
				colorReset,
				methodColor, r.Method, colorReset,
				statusColor, rw.statusCode, colorReset,
				sizeFormatted,
				duration.String(),
				r.URL.Path,
				contentRange,
			)
		})
	}
}
