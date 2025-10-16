package oapi

import (
	"encoding/json"
	"fmt"
	"strings"
)

func ifOneLine[T any](cond bool, ifTrue T, ifFalse T) T {
	if cond {
		return ifTrue
	}
	return ifFalse
}

func New(version string, info OpenApiInfo) *OpenApi {
	return &OpenApi{
		OpenApi: ifOneLine(version == "", "3.1.0", version),
		Info:    info,
		Components: OpenApiComponents{
			Schemas:         SchemaCollection{},
			Responses:       ResponsesCollection{},
			Parameters:      ParametersCollection{},
			Examples:        ExamplesCollection{},
			RequestBodies:   RequestBodiesCollection{},
			Headers:         HeadersCollection{},
			SecuritySchemes: SecuritySchemesCollection{},
			PathItems:       PathItemsCollection{},
		},
		Paths:        PathItemsCollection{},
		Webhooks:     PathItemsCollection{},
		Security:     []map[string][]string{},
		Tags:         []OpenApiTag{},
		Servers:      []OpenApiServer{},
		ExternalDocs: nil,
	}
}

func (o *OpenApi) AddServer(srv OpenApiServer) *OpenApi {
	o.Servers = append(o.Servers, srv)
	return o
}

func (o *OpenApi) ToJson() []byte {
	for _, data := range o.Paths.Iter() {
		data.Get.DefaultResponseDescription()
		data.Put.DefaultResponseDescription()
		data.Post.DefaultResponseDescription()
		data.Delete.DefaultResponseDescription()
		data.Options.DefaultResponseDescription()
		data.Head.DefaultResponseDescription()
		data.Patch.DefaultResponseDescription()
		data.Trace.DefaultResponseDescription()
	}

	b, err := json.MarshalIndent(o, "", strings.Repeat(" ", 2))
	if err != nil {
		return nil
	}
	return b
}

func (o *OpenApi) GetRef(category, name string) string {
	return fmt.Sprintf("#/components/%s/%s", category, name)
}
