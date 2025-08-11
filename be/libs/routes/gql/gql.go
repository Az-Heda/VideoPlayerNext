package gql

import (
	"embed"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"reflect"
	"text/template"

	"github.com/graphql-go/graphql"
	"github.com/rs/zerolog/log"
	"gorm.io/gorm"
)

type postData struct {
	Query     string                 `json:"query"`
	Operation string                 `json:"operationName"`
	Variables map[string]interface{} `json:"variables"`
}

func Handler(conn *gorm.DB) func(w http.ResponseWriter, req *http.Request) {
	return func(w http.ResponseWriter, req *http.Request) {
		var p postData
		if err := json.NewDecoder(req.Body).Decode(&p); err != nil {
			w.WriteHeader(http.StatusBadRequest)
			log.Error().Err(err).Int("StatusCode", http.StatusBadRequest).Msg(http.StatusText(http.StatusBadRequest))
			return
		}
		result := graphql.Do(graphql.Params{
			Context:        req.Context(),
			Schema:         *GetSchema(conn.WithContext(req.Context())),
			RequestString:  p.Query,
			VariableValues: p.Variables,
			OperationName:  p.Operation,
		})
		if err := json.NewEncoder(w).Encode(result); err != nil {
			log.Error().Err(err).Send()
		}
	}
}

func GetSchema(conn *gorm.DB) *graphql.Schema {
	s, err := graphql.NewSchema(graphql.SchemaConfig{
		Query:        getQuery(conn),
		Mutation:     getMutation(conn),
		Subscription: getSubscription(conn),
	})
	if err != nil {
		log.Panic().Err(err).Send()
	}
	return &s
}

func getArg[T any](args map[string]any, name string) (val *T, err error) {
	rt := reflect.TypeOf(val).Elem()

	mapVal, isInMap := args[name]
	if !isInMap {
		return nil, fmt.Errorf("cannot find arg `%s`", name)
	}

	if mapVal == nil {
		return nil, nil
	}

	valN, ok := mapVal.(T)
	if !ok {
		return nil, fmt.Errorf("cannot convert arg to type %s", rt.String())
	}

	return &valN, nil
}

//go:embed playground.tmpl
var playground embed.FS

func Playground(writer io.Writer, endpoint string) error {
	tmpl, err := template.
		ParseFS(playground, "playground.tmpl")

	if err != nil {
		return err
	}

	return tmpl.Execute(writer, map[string]any{
		"GraphqlEndpoint": endpoint,
	})
}
