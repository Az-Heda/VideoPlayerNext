package oapi

// https://swagger.io/specification/#openapi-object
type OpenApi struct {
	OpenApi      string                        `json:"openapi"` // Default "3.1.0"
	Components   OpenApiComponents             `json:"components"`
	Info         OpenApiInfo                   `json:"info"`
	Paths        PathItemsCollection           `json:"paths"`
	Webhooks     PathItemsCollection           `json:"webhooks,omitzero,omitempty"`
	Security     []map[string][]string         `json:"security,omitzero,omitempty"`
	Tags         []OpenApiTag                  `json:"tags,omitzero,omitempty"`
	Servers      []OpenApiServer               `json:"servers"`
	ExternalDocs *OpenApiExternalDocumentation `json:"externalDocs,omitzero,omitempty"`
}

// https://swagger.io/specification/#info-object
type OpenApiInfo struct {
	Title          string          `json:"title"`
	Version        string          `json:"version"`
	Summary        string          `json:"summary,omitzero,omitempty"`
	Description    string          `json:"description,omitzero,omitempty"`
	TermsOfService string          `json:"termsOfService,omitzero,omitempty"`
	Contact        *OpenApiContact `json:"contact,omitzero,omitempty"`
	License        *OpenApiLicense `json:"license,omitzero,omitempty"`
}

// https://swagger.io/specification/#components-object
type OpenApiComponents struct {
	Schemas         SchemaCollection          `json:"schemas,omitzero,omitempty"`
	Responses       ResponsesCollection       `json:"responses,omitzero,omitempty"`
	Parameters      ParametersCollection      `json:"parameters,omitzero,omitempty"`
	Examples        ExamplesCollection        `json:"examples,omitzero,omitempty"`
	RequestBodies   RequestBodiesCollection   `json:"requestBodies,omitzero,omitempty"`
	Headers         HeadersCollection         `json:"headers,omitzero,omitempty"`
	SecuritySchemes SecuritySchemesCollection `json:"securitySchemes,omitzero,omitempty"`
	PathItems       PathItemsCollection       `json:"pathItems,omitzero,omitempty"`
}
