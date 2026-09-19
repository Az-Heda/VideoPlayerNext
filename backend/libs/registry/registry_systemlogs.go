package registry

import (
	"context"
	"net/http"
	. "vp/libs/definitions"
	"vp/libs/models"

	"github.com/rs/zerolog"
	"gorm.io/gorm"
)

type (
	registrySystemLog  struct{}
	IRegistrySystemLog interface {
		ListSystemLog(ctx context.Context, conn *gorm.DB, i *ListSystemLogRequest) ApiExchange[ListSystemLogResponse]
		GetSystemLog(ctx context.Context, conn *gorm.DB, i *GetSystemLogRequest) ApiExchange[GetSystemLogResponse]
	}

	ListSystemLogRequest struct {
		Ids   []int         `query:"id,explode"`
		Level zerolog.Level `query:"level"`
	}
	ListSystemLogResponse struct {
		Body []models.SystemLog
	}

	GetSystemLogRequest struct {
		Id int `path:"id"`
	}
	GetSystemLogResponse struct {
		Body models.SystemLog
	}
)

func (r registrySystemLog) ListSystemLog(ctx context.Context, conn *gorm.DB, i *ListSystemLogRequest) ApiExchange[ListSystemLogResponse] {
	var systemLogs []models.SystemLog
	var filtered = conn.WithContext(ctx)

	switch {
	case len(i.Ids) > 0:
		filtered = filtered.Where("id iN ?", i.Ids)
	case i.Level > 0:
		filtered = filtered.Where("level = ", i.Level)
	default:
	}

	if tx := filtered.Find(&systemLogs); tx.Error != nil {
		return ApiExchangeDatabaseError[ListSystemLogResponse](tx.Error)
	}

	if systemLogs == nil {
		systemLogs = make([]models.SystemLog, 0)
	}

	return ApiExchange[ListSystemLogResponse]{
		Value:      &ListSystemLogResponse{Body: systemLogs},
		StatusCode: http.StatusOK,
	}
}

func (r registrySystemLog) GetSystemLog(ctx context.Context, conn *gorm.DB, i *GetSystemLogRequest) ApiExchange[GetSystemLogResponse] {
	var out = r.ListSystemLog(ctx, conn, &ListSystemLogRequest{Ids: []int{i.Id}})
	out.Init()
	if out.StatusCode != http.StatusOK {
		return ConvertApiExchange[ListSystemLogResponse, GetSystemLogResponse](out)
	}

	switch len(out.Value.Body) {
	case 0:
		return ApiExchange[GetSystemLogResponse]{StatusCode: http.StatusNotFound}
	case 1:
		var systemlog = out.Value.Body[0]
		return ApiExchange[GetSystemLogResponse]{
			Value:      &GetSystemLogResponse{Body: systemlog},
			StatusCode: http.StatusOK,
		}
	default:
		return ApiExchange[GetSystemLogResponse]{StatusCode: http.StatusConflict}
	}
}
