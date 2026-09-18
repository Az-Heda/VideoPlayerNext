package registry

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"
	"vp/libs/array"
	"vp/libs/models"

	. "vp/libs/definitions"

	"github.com/danielgtaylor/huma/v2"
	"github.com/rs/zerolog/log"
	"gorm.io/gorm"
)

type (
	registryFolder  struct{}
	IRegistryFolder interface {
		NewFolder(ctx context.Context, conn *gorm.DB, i *NewFolderRequest) ApiExchange[NewFolderResponse]
		ListFolder(ctx context.Context, conn *gorm.DB, i *ListFolderRequest) ApiExchange[ListFolderResponse]
		GetFolder(ctx context.Context, conn *gorm.DB, i *GetFolderRequest) ApiExchange[GetFolderResponse]
		DeleteFolder(ctx context.Context, conn *gorm.DB, i *DeleteFolderRequest) ApiExchange[DeleteFolderResponse]
		CleanupFolders(ctx context.Context, conn *gorm.DB, i *CleanupFolderRequest) ApiExchange[CleanupFolderResponse]
		ScanFolderStream(ctx context.Context, conn *gorm.DB, i *GetFolderStreamingRequest) ApiExchange[huma.StreamResponse]
	}
	PreloadFolder struct {
		PreloadVideos bool `query:"preloadVideos"`
	}
	NewFolderRequest struct {
		Body struct {
			Path string `json:"path"`
		}
	}
	NewFolderResponse struct {
		Body models.Folder
	}
	ListFolderRequest struct {
		Ids  []string `query:"id,explode"`
		Path string   `query:"path"`
		PreloadFolder
	}
	ListFolderResponse struct {
		Body []models.Folder
	}
	GetFolderRequest struct {
		Id   string `path:"id"`
		Scan bool   `query:"scan"`
		PreloadFolder
	}
	GetFolderResponse struct {
		Body models.Folder
	}
	GetFolderStreamingRequest struct {
		Id string `path:"id"`
		PreloadFolder
	}
	DeleteFolderRequest struct {
		Id string `path:"id"`
	}
	DeleteFolderResponse struct {
		Body models.Folder
	}
	CleanupFolderRequest struct {
		DoDelete bool `query:"doDelete"`
		PreloadFolder
	}
	CleanupFolderResponse struct {
		Body struct {
			Valid   []models.Folder `json:"valid"`
			Invalid []models.Folder `json:"invalid"`
		}
	}
)

func (r registryFolder) NewFolder(ctx context.Context, conn *gorm.DB, i *NewFolderRequest) ApiExchange[NewFolderResponse] {
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

	if tx := conn.WithContext(ctx).Create(&folder); tx.Error != nil {
		return ApiExchangeDatabaseError[NewFolderResponse](tx.Error)
	}

	return ApiExchange[NewFolderResponse]{
		Value:      &NewFolderResponse{Body: folder},
		StatusCode: http.StatusOK,
	}
}

func (r registryFolder) ListFolder(ctx context.Context, conn *gorm.DB, i *ListFolderRequest) ApiExchange[ListFolderResponse] {
	var folders []models.Folder
	var filtered *gorm.DB = models.Folder{}.Preload(conn.WithContext(ctx), i.PreloadVideos)
	switch {
	case len(i.Ids) > 0:
		filtered = filtered.Where("id IN ?", i.Ids)
	case i.Path != "" && !strings.Contains(i.Path, "%"):
		filtered = filtered.Where("fullpath LIKE ?", "%"+i.Path+"%")
	default:
	}

	filtered = filtered.Order("fullpath ASC")

	if tx := filtered.Find(&folders); tx.Error != nil {
		ApiExchangeDatabaseError[ListFolderResponse](tx.Error)
	}

	return ApiExchange[ListFolderResponse]{
		Value:      &ListFolderResponse{Body: folders},
		StatusCode: http.StatusOK,
	}
}

func (r registryFolder) GetFolder(ctx context.Context, conn *gorm.DB, i *GetFolderRequest) ApiExchange[GetFolderResponse] {
	apiVideo, ok := ctx.Value("registry-videos").(IRegistryVideo)
	if !ok {
		return ApiExchange[GetFolderResponse]{
			StatusCode: http.StatusInternalServerError,
			ErrorTitle: "Video registry not found",
		}
	}
	var out = r.ListFolder(ctx, conn, &ListFolderRequest{
		Ids:           []string{i.Id},
		PreloadFolder: i.PreloadFolder,
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
			var videoRequest = apiVideo.ListVideos(ctx, conn, &ListVideoRequest{Path: folder.Fullpath})
			videoRequest.Init()
			if videoRequest.StatusCode != http.StatusOK {
				return ConvertApiExchange[ListVideoResponse, GetFolderResponse](videoRequest)
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

func (r registryFolder) DeleteFolder(ctx context.Context, conn *gorm.DB, i *DeleteFolderRequest) ApiExchange[DeleteFolderResponse] {
	var out = r.GetFolder(ctx, conn, &GetFolderRequest{Id: i.Id})
	out.Init()
	if out.StatusCode != http.StatusOK {
		return ConvertApiExchange[GetFolderResponse, DeleteFolderResponse](out)
	}

	var currentFolder = out.Value.Body
	if tx := conn.WithContext(ctx).Delete(&currentFolder); tx.Error != nil {
		return ApiExchangeDatabaseError[DeleteFolderResponse](tx.Error)
	}
	return ApiExchange[DeleteFolderResponse]{
		Value:      &DeleteFolderResponse{Body: out.Value.Body},
		StatusCode: http.StatusOK,
	}
}

func (r registryFolder) CleanupFolders(ctx context.Context, conn *gorm.DB, i *CleanupFolderRequest) ApiExchange[CleanupFolderResponse] {
	var out = r.ListFolder(ctx, conn, &ListFolderRequest{PreloadFolder: i.PreloadFolder})
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
		transaction = conn.WithContext(ctx).Begin()
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

func (r registryFolder) ScanFolderStream(ctx context.Context, conn *gorm.DB, i *GetFolderStreamingRequest) ApiExchange[huma.StreamResponse] {
	apiVideo, ok := ctx.Value("registry-videos").(IRegistryVideo)
	if !ok {
		return ApiExchange[huma.StreamResponse]{
			StatusCode: http.StatusInternalServerError,
			ErrorTitle: "Video registry not found",
		}
	}
	var out = r.GetFolder(ctx, conn, &GetFolderRequest{Id: i.Id, PreloadFolder: i.PreloadFolder})
	out.Init()
	if out.StatusCode != http.StatusOK {
		return ConvertApiExchange[GetFolderResponse, huma.StreamResponse](out)
	}

	var folder = out.Value.Body
	return ApiExchange[huma.StreamResponse]{
		StatusCode: http.StatusOK,
		Value: &huma.StreamResponse{
			Body: func(hctx huma.Context) {
				var (
					timeout  time.Duration      = time.Second * 5
					writer   io.Writer          = hctx.BodyWriter()
					template string             = "event: %s\ndata: %s\n\n"
					ch       chan *models.Video = make(chan *models.Video, 1)
					nextIter bool               = true
					ticker   *time.Ticker       = time.NewTicker(timeout)
				)

				hctx.SetHeader("Content-Type", "text/event-stream")
				hctx.SetHeader("Cache-Control", "no-cache")

				var videoRequest = apiVideo.ListVideos(ctx, conn, &ListVideoRequest{Path: folder.Fullpath})
				videoRequest.Init()
				if videoRequest.StatusCode != http.StatusOK {
					fmt.Fprintf(writer, template, "error", fmt.Sprintf("%s\n%s", videoRequest.ErrorTitle, errors.Join(videoRequest.Errors...).Error()))
				}
				var existingVideos []*models.Video = array.Map[[]models.Video, []*models.Video](videoRequest.Value.Body, func(v models.Video, _ int) *models.Video {
					return &v
				})
				var existingVideoMap = array.Reduce[[]*models.Video, *models.Video, map[string]*models.Video](existingVideos, make(map[string]*models.Video), func(prev map[string]*models.Video, curr *models.Video, idx int) map[string]*models.Video {
					prev[curr.Fullpath] = curr
					return prev
				})

				go folder.ScanStream(ch, existingVideos)
				for nextIter {
					ticker.Reset(timeout)
					select {
					case v := <-ch:
						if v.Folder == nil {
							nextIter = false
							fmt.Fprintf(writer, template, "end", "end 1")
						} else {
							var newV models.Video = models.Video{Fullpath: v.Fullpath}
							if tx := conn.FirstOrInit(&newV, models.Video{Fullpath: v.Fullpath}).Attrs(v); tx.Error != nil {
								fmt.Fprintf(writer, template, "error", tx.Error.Error())
							}
							newV.Attributes = v.Attributes
							newV.Playlists = v.Playlists
							newV.Tags = v.Tags
							newV.Folder = v.Folder

							if existing, ok := existingVideoMap[v.Fullpath]; ok {
								log.Debug().
									Bool("watched", *existing.Attributes.Watched).
									Msg(existing.Filename)
								newV.Attributes = existing.Attributes
								newV.Playlists = existing.Playlists
								newV.Tags = existing.Tags
							}

							if tx := conn.Save(&newV); tx.Error != nil {
								if errors.Is(tx.Error, gorm.ErrDuplicatedKey) {
									var currentOne models.Video
									if tx := conn.Where(models.Video{Fullpath: newV.Fullpath}).First(&currentOne); tx.Error != nil {
										fmt.Fprintf(writer, template, "error", tx.Error.Error())
									} else {
										newV.Id = currentOne.Id
										if b, err := json.Marshal(newV); err != nil {
											fmt.Fprintf(writer, template, "error", err.Error())
										} else {
											fmt.Fprintf(writer, template, "video", string(b))
										}
									}
								}
							} else {
								if b, err := json.Marshal(newV); err != nil {
									fmt.Fprintf(writer, template, "error", err.Error())
								} else {
									fmt.Fprintf(writer, template, "video", string(b))
								}
							}
						}
						if flusher, ok := writer.(http.Flusher); ok {
							flusher.Flush()
						}
					case <-hctx.Context().Done():
						nextIter = false
						fmt.Fprintf(writer, template, "end", "end 2")
						if flusher, ok := writer.(http.Flusher); ok {
							flusher.Flush()
						}
					case <-ticker.C:
						nextIter = false
						fmt.Fprintf(writer, template, "end", "end 3")
						if flusher, ok := writer.(http.Flusher); ok {
							flusher.Flush()
						}
					}
				}
			},
		},
	}
}
