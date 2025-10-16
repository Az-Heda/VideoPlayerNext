package oapi

import "net/http"

type StatusCode uint

// https://swagger.io/specification/#contact-object
type OpenApiContact struct {
	Name  string `json:"name,omitzero,omitempty"`
	Url   string `json:"url,omitzero,omitempty"`
	Email string `json:"email,omitzero,omitempty"`
}

// https://swagger.io/specification/#license-object
type OpenApiLicense struct {
	Name       string `json:"name,omitzero,omitempty"`
	Identifier string `json:"identifier,omitzero,omitempty"`
	Url        string `json:"url,omitzero,omitempty"`
}

// https://swagger.io/specification/#server-object
type OpenApiServer struct {
	Url         string `json:"url"`
	Description string `json:"description,omitzero,omitempty"`
}

// https://swagger.io/specification/#schema-object
type OpenApiSchema struct {
	Type                 string           `json:"type,omitzero,omitempty"`
	Items                *OpenApiSchema   `json:"items,omitzero,omitempty"`                // Only for OpenApiSchema.Type == "array"
	Properties           SchemaCollection `json:"properties,omitzero,omitempty"`           // Only for OpenApiSchema.Type == "object"
	AdditionalProperties *OpenApiSchema   `json:"additionalProperties,omitzero,omitempty"` // Only for OpenApiSchema.Type == "object"
	Description          string           `json:"description,omitzero,omitempty"`
	Format               string           `json:"format,omitzero,omitempty"` // https://swagger.io/specification/#data-type-format
	Ref                  string           `json:"$ref,omitzero,omitempty"`
}

// https://swagger.io/specification/#header-object
type OpenApiHeader struct {
	Description string `json:"description"`
	Required    bool   `json:"required"`
	Deprecated  bool   `json:"deprecated,omitzero,omitempty"`
}

// https://swagger.io/specification/#media-type-object
type OpenApiMediaType struct {
	Description string             `json:"description,omitzero,omitempty"`
	Schema      OpenApiSchema      `json:"schema,omitzero,omitempty"`
	Examples    ExamplesCollection `json:"examples,omitzero,omitempty"`
}

// https://swagger.io/specification/#response-object
type OpenApiResponse struct {
	Description string              `json:"description"`
	Headers     HeadersCollection   `json:"headers,omitzero,omitempty"`
	Content     MediaTypeCollection `json:"content,omitzero,omitempty"`
}

// https://swagger.io/specification/#parameter-object
type OpenApiParameter struct {
	Name            string              `json:"name"`
	In              string              `json:"in"` // One of ["query", "header", "path", "cookie"]
	Description     string              `json:"description,omitzero,omitempty"`
	Required        bool                `json:"required,omitzero,omitempty"`
	Deprecated      bool                `json:"deprecated,omitzero,omitempty"`
	AllowEmptyValue bool                `json:"allowEmptyValue,omitzero,omitempty"`
	Schema          OpenApiSchema       `json:"schema,omitzero,omitempty"`
	Examples        ExamplesCollection  `json:"examples,omitzero,omitempty"`
	Content         MediaTypeCollection `json:"content,omitzero,omitempty"`
}

// https://swagger.io/specification/#example-object
type OpenApiExample struct {
	Summary     string `json:"summary,omitzero,omitempty"`
	Description string `json:"description,omitzero,omitempty"`
	Value       any    `json:"value,omitzero,omitempty"`
	Ref         string `json:"$ref,omitzero,omitempty"`
}

// https://swagger.io/specification/#request-body-object
type OpenApiRequestBody struct {
	Description string              `json:"description,omitzero,omitempty"`
	Content     MediaTypeCollection `json:"content,omitzero,omitempty"`
	Required    bool                `json:"required,omitzero,omitempty"`
}

// https://swagger.io/specification/#security-scheme-object
type OpenApiSecurityScheme struct {
	Type             string             `json:"type"` // One of ["apiKey", "http", "mutualTLS", "oauth2", "openIdConnect"]
	Name             string             `json:"name"`
	In               string             `json:"in"` // One of ["query", "header", "cookie"]
	Description      string             `json:"description,omitzero,omitempty"`
	Scheme           string             `json:"scheme,omitzero,omitempty"`           // Only for OpenApiSecurityScheme.Type == "http"
	BearerFormat     string             `json:"bearerFormat,omitzero,omitempty"`     // Only for OpenApiSecurityScheme.Type == "http"
	OpenIdConnectUrl string             `json:"openIdConnectUrl,omitzero,omitempty"` // Only for OpenApiSecurityScheme.Type == "openIdConnect"
	Flows            *OpenApiOAuthFlows `json:"flows,omitzero,omitempty"`            // Only for OpenApiSecurityScheme.Type == "oauth2"
}

// https://swagger.io/specification/#path-item-object
type OpenApiPathItem struct {
	Ref         string            `json:"$ref,omitzero,omitempty"`
	Summary     string            `json:"summary,omitzero,omitempty"`
	Description string            `json:"description,omitzero,omitempty"`
	Get         *OpenApiOperation `json:"get,omitzero,omitempty"`
	Put         *OpenApiOperation `json:"put,omitzero,omitempty"`
	Post        *OpenApiOperation `json:"post,omitzero,omitempty"`
	Delete      *OpenApiOperation `json:"delete,omitzero,omitempty"`
	Options     *OpenApiOperation `json:"options,omitzero,omitempty"`
	Head        *OpenApiOperation `json:"head,omitzero,omitempty"`
	Patch       *OpenApiOperation `json:"patch,omitzero,omitempty"`
	Trace       *OpenApiOperation `json:"trace,omitzero,omitempty"`
	Servers     []OpenApiServer   `json:"servers,omitzero,omitempty"`
	Parameters  *OpenApiParameter `json:"parameters,omitzero,omitempty"`
}

// https://swagger.io/specification/#operation-object
type OpenApiOperation struct {
	Tags        []string                      `json:"tags,omitzero,omitempty"`
	Summary     string                        `json:"summary,omitzero,omitempty"`
	Description string                        `json:"description,omitzero,omitempty"`
	ExternalDoc *OpenApiExternalDocumentation `json:"externalDoc,omitzero,omitempty"`
	OperationId string                        `json:"operationId,omitzero,omitempty"`
	Parameters  []OpenApiParameter            `json:"parameters,omitzero,omitempty"`
	RequestBody *OpenApiRequestBody           `json:"requestBody,omitzero,omitempty"`
	Responses   ResponsesCollection           `json:"responses,omitzero,omitempty"`
	Deprecated  bool                          `json:"deprecated,omitzero,omitempty"`
	Security    []map[string][]string         `json:"security,omitzero,omitempty"`
	Servers     []OpenApiServer               `json:"servers,omitzero,omitempty"`
}

// https://swagger.io/specification/#external-documentation-object
type OpenApiExternalDocumentation struct {
	Url         string `json:"url"`
	Description string `json:"description,omitzero,omitempty"`
}

// https://swagger.io/specification/#oauth-flows-object
type OpenApiOAuthFlows struct {
	Implicid          *OpenApiOAuthFlows `json:"implicid,omitzero,omitempty"`
	Password          *OpenApiOAuthFlows `json:"password,omitzero,omitempty"`
	ClientCredentials *OpenApiOAuthFlows `json:"clientCredentials,omitzero,omitempty"`
	AuthorizationCode *OpenApiOAuthFlows `json:"authorizationCode,omitzero,omitempty"`
	AuthorizationUrl  string             `json:"authorizationUrl,omitzero,omitempty"`
	TokenUrl          string             `json:"tokenUrl,omitzero,omitempty"`
	RefreshUrl        string             `json:"refreshUrl,omitzero,omitempty"`
	Scopes            map[string]string  `json:"scopes,omitzero,omitempty"`
}

// https://swagger.io/specification/#tag-object
type OpenApiTag struct {
	Name         string                        `json:"name"`
	Description  string                        `json:"description,omitzero,omitempty"`
	ExternalDocs *OpenApiExternalDocumentation `json:"externalDocs,omitzero,omitempty"`
}

func (op *OpenApiOperation) DefaultResponseDescription() {
	if op == nil {
		return
	}
	for status, resp := range op.Responses.Iter() {
		if resp.Description == "" {
			resp.Description = http.StatusText(int(status))
			op.Responses[status] = resp
		}
	}
}
