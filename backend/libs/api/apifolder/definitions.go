package apifolder

import (
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"vp/libs/api/apivideo"
	"vp/libs/array"
	. "vp/libs/definitions"
	"vp/libs/models"

	"gorm.io/gorm"
)

// 200 OK
//
// 404 Not found
//
// 422 Unprocessable Entity
//
// 500 Internal Server error
func CB_NewFolder(conn *gorm.DB, i *NewFolderRequest) ApiExchange[NewFolderResponse] {
	if filepath.IsAbs(i.Body.Path) {
		if p, err := filepath.Abs(i.Body.Path); err == nil {
			i.Body.Path = p
		}
	}

	if stats, err := os.Lstat(i.Body.Path); err != nil {
		return ApiExchange[NewFolderResponse]{
			StatusCode: http.StatusNotFound,
			Errors:     []error{err},
		}
	} else {
		if !stats.IsDir() {
			_, err := os.ReadDir(i.Body.Path)
			return ApiExchange[NewFolderResponse]{
				StatusCode: http.StatusUnprocessableEntity,
				Errors:     []error{err},
			}
		}
	}

	var folder = models.Folder{
		Fullpath: i.Body.Path,
	}

	if tx := conn.Create(&folder); tx.Error != nil {
		return ApiExchangeDatabaseError[NewFolderResponse](tx.Error)
	}

	return ApiExchange[NewFolderResponse]{
		Value:      &NewFolderResponse{Body: folder},
		StatusCode: http.StatusOK,
	}
}

// 200 OK
//
// 500 Internal Server Error
func CB_ListFolder(conn *gorm.DB, i *ListFolderRequest) ApiExchange[ListFolderResponse] {
	var folders []models.Folder
	var filtered *gorm.DB = models.Folder{}.Preload(conn, i.Preload.PreloadVideos)
	switch {
	case len(i.Ids) > 0:
		filtered = filtered.Where("id IN ?", i.Ids)
	case i.Path != "" && !strings.Contains(i.Path, "%"):
		filtered = filtered.Where("fullpath LIKE ?", "%"+i.Path+"%")
	default:
	}

	if tx := filtered.Find(&folders); tx.Error != nil {
		ApiExchangeDatabaseError[ListFolderResponse](tx.Error)
	}

	return ApiExchange[ListFolderResponse]{
		Value:      &ListFolderResponse{Body: folders},
		StatusCode: http.StatusOK,
	}
}

// 200 OK
//
// 404 Not Found
//
// 409 Conflict
//
// 500 Internal Server Error
func CB_GetFolder(conn *gorm.DB, i *GetFolderRequest) ApiExchange[GetFolderResponse] {
	var out = CB_ListFolder(conn, &ListFolderRequest{
		Ids:     []string{i.Id},
		Preload: i.Preload,
	})
	out.Init()
	if out.StatusCode != http.StatusOK {
		return ConvertApiExchange[ListFolderResponse, GetFolderResponse](out)
	}

	switch len(out.Value.Body) {
	case 0:
		return ApiExchange[GetFolderResponse]{StatusCode: http.StatusNotFound}
	case 1:
		var folder = out.Value.Body[0]
		if i.Scan {
			var videoRequest = apivideo.CB_ListVideo(conn, &apivideo.ListVideoRequest{Path: folder.Fullpath})
			videoRequest.Init()
			if videoRequest.StatusCode != http.StatusOK {
				return ConvertApiExchange[apivideo.ListVideoResponse, GetFolderResponse](videoRequest)
			}
			var existingVideos []*models.Video = array.Map[[]models.Video, []*models.Video](videoRequest.Value.Body, func(v models.Video, _ int) *models.Video {
				return &v
			})
			if videos, err := folder.Scan(existingVideos); err != nil {
				return ApiExchange[GetFolderResponse]{
					StatusCode: http.StatusInternalServerError,
					Errors:     []error{err},
				}
			} else {
				folder.Videos = append(folder.Videos, videos...)
				if tx := conn.Save(&folder); tx.Error != nil {
					return ApiExchange[GetFolderResponse]{
						StatusCode: http.StatusInternalServerError,
						Errors:     []error{tx.Error},
					}
				}
			}
		}
		return ApiExchange[GetFolderResponse]{
			Value:      &GetFolderResponse{Body: folder},
			StatusCode: http.StatusOK,
		}
	default:
		return ApiExchange[GetFolderResponse]{StatusCode: http.StatusConflict}
	}
}

// 200 OK
//
// 404 Not Found
//
// 409 Conflict
//
// 500 Internal Server Error
func CB_DeleteFolder(conn *gorm.DB, i *DeleteFolderRequest) ApiExchange[DeleteFolderResponse] {
	var out = CB_GetFolder(conn, &GetFolderRequest{Id: i.Id})
	out.Init()
	if out.StatusCode != http.StatusOK {
		return ConvertApiExchange[GetFolderResponse, DeleteFolderResponse](out)
	}

	var currentFolder = out.Value.Body
	if tx := conn.Delete(&currentFolder); tx.Error != nil {
		return ApiExchangeDatabaseError[DeleteFolderResponse](tx.Error)
	}
	return ApiExchange[DeleteFolderResponse]{
		Value:      &DeleteFolderResponse{Body: out.Value.Body},
		StatusCode: http.StatusOK,
	}
}

// 200 OK
//
// 500 Internal Server Error
func CB_CleanupFolders(conn *gorm.DB, i *CleanupFolderRequest) ApiExchange[CleanupFolderResponse] {
	var out = CB_ListFolder(conn, &ListFolderRequest{Preload: i.Preload})
	out.Init()

	var retValue CleanupFolderResponse
	var transaction *gorm.DB
	retValue.Body.Invalid = []models.Folder{}
	retValue.Body.Valid = []models.Folder{}

	if out.StatusCode != http.StatusOK {
		return ApiExchange[CleanupFolderResponse]{
			Value:      nil,
			StatusCode: out.StatusCode,
			ErrorTitle: out.ErrorTitle,
			Errors:     out.Errors,
		}
	}

	if i.DoDelete {
		transaction = conn.Begin()
		if transaction.Error != nil {
			return ApiExchangeDatabaseError[CleanupFolderResponse](transaction.Error, "Database transaction error")
		}
	}
	for _, f := range out.Value.Body {
		var requireDelete bool
		if info, err := os.Lstat(f.Fullpath); err != nil {
			retValue.Body.Invalid = append(retValue.Body.Invalid, f)
			if i.DoDelete {
				requireDelete = true
			}
		} else {
			if !info.IsDir() {
				retValue.Body.Invalid = append(retValue.Body.Invalid, f)
				if i.DoDelete {
					requireDelete = true
				}
			} else {
				retValue.Body.Valid = append(retValue.Body.Valid, f)
			}
		}

		if i.DoDelete && requireDelete {
			if tx := transaction.Delete(&f); tx.Error != nil {
				return ApiExchangeDatabaseError[CleanupFolderResponse](tx.Error, "Database transaction error")
			}
		}
	}
	if i.DoDelete {
		if tx := transaction.Commit(); tx.Error != nil {
			return ApiExchangeDatabaseError[CleanupFolderResponse](tx.Error, "Database transaction error")
		}
	}

	return ApiExchange[CleanupFolderResponse]{
		Value:      &retValue,
		StatusCode: http.StatusOK,
	}
}
