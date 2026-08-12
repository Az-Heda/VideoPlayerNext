package apifolder

import (
	"net/http"
	"os"
	"path/filepath"
	"strings"
	. "vp/libs/definitions"
	"vp/libs/models"

	"gorm.io/gorm"
)

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
		return ApiExchange[NewFolderResponse]{
			StatusCode: http.StatusInternalServerError,
			ErrorTitle: "Database error",
			Errors:     []error{tx.Error},
		}
	}

	return ApiExchange[NewFolderResponse]{
		Value: &NewFolderResponse{Body: folder},
	}
}

func CB_ListFolder(conn *gorm.DB, i *ListFolderRequest) ApiExchange[ListFolderResponse] {
	var folders []models.Folder
	var filtered *gorm.DB = models.Folder{}.Preload(conn, i.PreloadVideos)
	switch {
	case i.Id != "":
		filtered = conn.Where(models.Folder{Id: i.Id})
	case i.Path != "" && strings.Index(i.Path, "%") == -1:
		filtered = conn.Where("fullpath LIKE ?", "%"+i.Path+"%")
	default:
	}

	if tx := filtered.Find(&folders); tx.Error != nil {
		return ApiExchange[ListFolderResponse]{
			StatusCode: http.StatusInternalServerError,
			ErrorTitle: "Database error",
			Errors:     []error{tx.Error},
		}
	}

	return ApiExchange[ListFolderResponse]{
		Value: &ListFolderResponse{Body: folders},
	}
}

func CB_GetFolder(conn *gorm.DB, i *GetFolderRequest) ApiExchange[GetFolderResponse] {
	var out = CB_ListFolder(conn, &ListFolderRequest{
		Id:            i.Id,
		PreloadVideos: i.PreloadVideos,
	})
	out.Init()
	if out.StatusCode != 200 {
		return ApiExchange[GetFolderResponse]{
			Value:      nil,
			StatusCode: out.StatusCode,
			ErrorTitle: out.ErrorTitle,
			Errors:     out.Errors,
		}
	}

	switch len(out.Value.Body) {
	case 0:
		return ApiExchange[GetFolderResponse]{StatusCode: http.StatusNotFound}
	case 1:
		var folder = out.Value.Body[0]
		if i.Scan {
			if videos, err := folder.Scan(); err != nil {
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
			Value: &GetFolderResponse{Body: folder},
		}
	default:
		return ApiExchange[GetFolderResponse]{StatusCode: http.StatusConflict}
	}
}

func CB_DeleteFolder(conn *gorm.DB, i *DeleteFolderRequest) ApiExchange[DeleteFolderResponse] {
	var out = CB_GetFolder(conn, &GetFolderRequest{Id: i.Id})
	out.Init()
	if out.StatusCode != 200 {
		return ApiExchange[DeleteFolderResponse]{
			Value:      nil,
			StatusCode: out.StatusCode,
			ErrorTitle: out.ErrorTitle,
			Errors:     out.Errors,
		}
	}

	var currentFolder = out.Value.Body
	if tx := conn.Delete(&currentFolder); tx.Error != nil {
		return ApiExchange[DeleteFolderResponse]{
			StatusCode: http.StatusInternalServerError,
			ErrorTitle: "Database error",
			Errors:     []error{tx.Error},
		}
	}
	return ApiExchange[DeleteFolderResponse]{
		Value: &DeleteFolderResponse{
			Body: out.Value.Body,
		},
	}
}

func CB_CleanupFolders(conn *gorm.DB, i *CleanupFolderRequest) ApiExchange[CleanupFolderResponse] {
	var out = CB_ListFolder(conn, &ListFolderRequest{})
	out.Init()

	var retValue CleanupFolderResponse
	var transaction *gorm.DB
	retValue.Body.Invalid = []models.Folder{}
	retValue.Body.Valid = []models.Folder{}

	if out.StatusCode != 200 {
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
			return ApiExchange[CleanupFolderResponse]{
				Value:      nil,
				StatusCode: http.StatusInternalServerError,
				ErrorTitle: "Database transaction error",
				Errors:     []error{transaction.Error},
			}
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
				return ApiExchange[CleanupFolderResponse]{
					Value:      nil,
					StatusCode: http.StatusInternalServerError,
					ErrorTitle: "Database transaction error",
					Errors:     []error{tx.Error},
				}
			}
		}
	}
	if i.DoDelete {
		if tx := transaction.Commit(); tx.Error != nil {
			return ApiExchange[CleanupFolderResponse]{
				Value:      nil,
				StatusCode: http.StatusInternalServerError,
				ErrorTitle: "Database transaction error",
				Errors:     []error{tx.Error},
			}
		}
	}

	return ApiExchange[CleanupFolderResponse]{Value: &retValue}
}

// func CB_ScanFilesStream(conn *gorm.DB, i *GetFolderStreamingRequest) ApiExchange[huma.StreamResponse] {
// 	var out = CB_GetFolder()
// }
