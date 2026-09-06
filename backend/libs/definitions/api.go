package definitions

import (
	"context"
	"net/http"

	"github.com/danielgtaylor/huma/v2"
	"gorm.io/gorm"
)

type (
	ApiFn              func(g *huma.Group, conn *gorm.DB, tags []string)
	ApiExchange[T any] struct {
		Value      *T
		StatusCode int
		ErrorTitle string
		Errors     []error
	}
	ApiDefinition[In, Out any] struct {
		Operation huma.Operation
		Fn        ApiFn
		Callback  func(conn *gorm.DB, input *In) ApiExchange[Out]
	}
	IApi interface {
		Register(g *huma.Group, conn *gorm.DB)
		AddTags(tags ...string)
		ID() string
	}
)

func ApiExchangeDatabaseError[T any](err error, overWriteMessage ...string) ApiExchange[T] {
	if len(overWriteMessage) == 0 {
		overWriteMessage = append(overWriteMessage, "Database Error")
	}
	return ApiExchange[T]{
		StatusCode: http.StatusInternalServerError,
		ErrorTitle: overWriteMessage[0],
		Errors:     []error{err},
	}
}
func ConvertApiExchange[A, B any](in ApiExchange[A]) ApiExchange[B] {
	return ApiExchange[B]{
		StatusCode: in.StatusCode,
		ErrorTitle: in.ErrorTitle,
		Errors:     in.Errors,
	}
}

func (a *ApiExchange[T]) Init() *ApiExchange[T] {
	if a.StatusCode == 0 {
		a.StatusCode = http.StatusOK
	}
	if a.ErrorTitle == "" && a.StatusCode != http.StatusOK {
		a.ErrorTitle = http.StatusText(a.StatusCode)
	}
	return a
}

func (a *ApiExchange[T]) ReturnStatus() (*T, error) {
	switch a.StatusCode {
	case http.StatusOK:
		return a.Value, nil

	case http.StatusBadRequest:
		return nil, huma.Error400BadRequest(a.ErrorTitle, a.Errors...)

	case http.StatusUnauthorized:
		return nil, huma.Error401Unauthorized(a.ErrorTitle, a.Errors...)

	case http.StatusForbidden:
		return nil, huma.Error403Forbidden(a.ErrorTitle, a.Errors...)

	case http.StatusNotFound:
		return nil, huma.Error404NotFound(a.ErrorTitle, a.Errors...)

	case http.StatusConflict:
		return nil, huma.Error409Conflict(a.ErrorTitle, a.Errors...)

	case http.StatusUnprocessableEntity:
		return nil, huma.Error422UnprocessableEntity(a.ErrorTitle, a.Errors...)

	case http.StatusInternalServerError:
		return nil, huma.Error500InternalServerError(a.ErrorTitle, a.Errors...)

	case http.StatusNotImplemented:
		return nil, huma.Error501NotImplemented(a.ErrorTitle, a.Errors...)

	default:
		return nil, huma.NewError(a.StatusCode, a.ErrorTitle, a.Errors...)
	}
}

func (a ApiDefinition[In, Out]) Register(g *huma.Group, conn *gorm.DB) {
	huma.Register(g, a.Operation, func(ctx context.Context, i *In) (*Out, error) {
		var data = a.Callback(conn.WithContext(ctx), i)
		data.Init()
		return data.ReturnStatus()
	})
}

func (a *ApiDefinition[In, Out]) AddTags(tags ...string) {
	a.Operation.Tags = append(a.Operation.Tags, tags...)
}

func (a *ApiDefinition[In, Out]) ID() string {
	return a.Operation.OperationID
}
