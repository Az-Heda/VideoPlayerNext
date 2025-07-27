package routes

import (
	"embed"
	"full/libs/models"
	"path"
	"strings"
	"time"

	"github.com/rs/zerolog/log"
	"gorm.io/gorm"
)

func readEmbedFiles(fs embed.FS, startPath string) (f []string) {
	entries, err := fs.ReadDir(startPath)
	if err != nil {
		log.Panic().Err(err).Send()
	}
	for _, e := range entries {
		var fullpath = path.Join(startPath, e.Name())
		if e.IsDir() {
			f = append(f, readEmbedFiles(fs, fullpath)...)
			continue
		}
		f = append(f, fullpath)
	}

	return
}

func SessionManager(conn *gorm.DB) {
	var sessions []models.Session

	if tx := conn.Find(&sessions); tx.Error != nil {
		log.Err(tx.Error).Send()
		return
	}
	var counter int = 0
	for _, s := range sessions {
		if s.CreatedAt.Add(s.Lifespan).Before(time.Now()) {
			if tx := conn.Delete(&s); tx.Error != nil {
				log.Err(tx.Error).Send()
				continue
			}
			counter += 1
		}
	}
	if counter > 0 {
		log.Warn().
			Str("at", time.Now().Format("15:04:05 2006-01-02")).
			Int("deleted", counter).
			Msg("Cleanup sessions")
	}
}

func GetMimeType(file string) *string {
	var mimeMap = map[string]string{
		".css":   "text/css",
		".csv":   "text/csv",
		".gif":   "image/gif",
		".html":  "text/html",
		".jepg":  "image/jpeg",
		".jpg":   "image/jpeg",
		".js":    "text/javascript",
		".json":  "application/json",
		".md":    "text/markdown",
		".mjs":   "text/javascript",
		".otf":   "font/otf",
		".pdf":   "application/pdf",
		".php":   "application/x-httpd-php",
		".svg":   "image/svg+xml",
		".ttf":   "font/ttf",
		".webp":  "image/webp",
		".woff":  "font/woff",
		".woff2": "font/woff2",
		".xml":   "application/xml",
	}
	ext := strings.ToLower(path.Ext(file))

	mime, ok := mimeMap[ext]
	if !ok {
		return nil
	}
	return &mime
}
