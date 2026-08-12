package apivideo

import (
	"fmt"
	"net/http"
	"strings"
	. "vp/libs/definitions"
	"vp/libs/models"

	"gorm.io/gorm"
)

func CB_ListVideo(conn *gorm.DB, i *ListVideoRequest) ApiExchange[ListVideoResponse] {
	var videos []models.Video
	var filtered *gorm.DB

	fmt.Printf("%#v\n", i)

	switch strings.ToLower(i.Watched) {
	case "true", "t", "1", "on", "yes", "y":
		filtered = conn.Where("attrib_watched = ?", true)
	case "false", "f", "0", "off", "no", "n":
		filtered = conn.Where("attrib_watched = ?", false)
	case "":
	default:
		return ApiExchange[ListVideoResponse]{
			StatusCode: http.StatusBadRequest,
			ErrorTitle: "Malformed input",
		}
	}

	switch {
	case i.Id != "":
		filtered = conn.Where(models.Video{Id: i.Id})
	case i.Path != "" && strings.Index(i.Path, "%") == -1:
		filtered = conn.Where("fullpath LIKE ?", "%"+i.Path+"%")
	default:
		filtered = conn
	}

	if tx := filtered.Find(&videos); tx.Error != nil {
		return ApiExchange[ListVideoResponse]{
			StatusCode: http.StatusInternalServerError,
			ErrorTitle: "Database error",
			Errors:     []error{tx.Error},
		}
	}

	return ApiExchange[ListVideoResponse]{
		Value: &ListVideoResponse{
			Body: videos,
		},
	}
}
