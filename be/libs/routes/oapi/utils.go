package oapi

import (
	"net/http"
	"reflect"
	"strings"

	"github.com/MarceloPetrucio/go-scalar-api-reference"
)

func GetSchemaPtr[T any](v T) *OpenApiSchema {
	var schema = GetSchema(v)
	return &schema
}

func GetSchema[T any](v T) OpenApiSchema {
	var schema = OpenApiSchema{
		Items:       nil,
		Description: "",
	}
	var rt = reflect.TypeOf(v)
	var rv = reflect.ValueOf(v)

	switch rt.Kind() {
	case reflect.String:
		schema.Type = "string"

	case reflect.Int, reflect.Int8, reflect.Int16, reflect.Int32, reflect.Int64:
		schema.Type = "number"
		schema.Format = rt.Kind().String()

	case reflect.Uint, reflect.Uint8, reflect.Uint16, reflect.Uint32, reflect.Uint64:
		schema.Type = "number"
		schema.Format = rt.Kind().String()

	case reflect.Float32:
		schema.Type = "number"
		schema.Format = "float"

	case reflect.Float64:
		schema.Type = "number"
		schema.Format = "double"

	case reflect.Array, reflect.Slice:
		schema.Type = "array"
		var sliceType = reflect.New(rt.Elem()).Elem()
		var newSchema = GetSchema(sliceType.Interface())
		schema.Items = &newSchema

	case reflect.Bool:
		schema.Type = "boolean"

	case reflect.Map:
		schema.Type = "object"
		schema.Properties = map[string]OpenApiSchema{}
		additionalProperties := GetSchema(reflect.New(rt.Elem()).Interface())
		schema.AdditionalProperties = &additionalProperties

	case reflect.Struct:
		schema.Type = "object"
		schema.AdditionalProperties = nil
		schema.Properties = map[string]OpenApiSchema{}
		for n := range rt.NumField() {
			var ft = rt.Field(n)
			var fv = rv.Field(n)

			var fieldName = ft.Name
			if jsonTag, ok := ft.Tag.Lookup("json"); ok {
				fieldName = strings.Split(jsonTag, ",")[0]
			}
			schema.Properties[fieldName] = GetSchema(fv.Interface())
		}

	case reflect.Ptr:
		return GetSchema(rv.Elem().Interface())
	}
	return schema
}

func GetSchemaFromMap[T any](m map[string]T) OpenApiSchema {
	var schema = OpenApiSchema{
		Items:       nil,
		Description: "",
		Type:        "object",
		Properties:  SchemaCollection{},
	}

	for k, v := range m {
		schema.Properties.New(k, GetSchema(v))
	}

	return schema
}

func GetSchemaFromMapPtr[T any](m map[string]T) *OpenApiSchema {
	var schema = GetSchemaFromMap(m)
	return &schema
}

func (o *OpenApi) ServeOpenApiSpecs(w http.ResponseWriter, req *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Write(o.ToJson())
}

func (o *OpenApi) ServeOpenapiScalar(specsEndpoint string) func(w http.ResponseWriter, req *http.Request) {
	return func(w http.ResponseWriter, req *http.Request) {
		html, err := scalar.ApiReferenceHTML(&scalar.Options{
			DarkMode: true,
			SpecURL:  specsEndpoint,
			CustomOptions: scalar.CustomOptions{
				PageTitle: "Scalar API",
			},
		})
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Write([]byte(html))
	}
}
