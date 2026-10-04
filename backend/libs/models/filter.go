package models

import (
	"bytes"
	"encoding/json"
	"fmt"
	"reflect"
	"slices"
	"strings"
)

type (
	FilterExpression[T IModelScope] struct {
		Item  *FilterItem[T]
		Group *FilterGroup[T]
	}
	FilterItem[T any] struct {
		Property string `json:"property"`
		Value    any    `json:"value"`
		Op       string `json:"op"`

		// Only used by "between"
		Num1 *float64 `json:"num1,omitempty"`
		Num2 *float64 `json:"num2,omitempty"`

		// Only used by string filters
		TreatCase *string `json:"treatCase,omitempty"`
	}
	FilterGroup[T IModelScope] struct {
		Operator string                `json:"operator"`
		Filters  []FilterExpression[T] `json:"filters"`
	}
)

func (f *FilterExpression[T]) UnmarshalJSON(data []byte) error {
	data = bytes.TrimSpace(data)

	if len(data) == 0 {
		return fmt.Errorf("empty filter expression")
	}

	var raw map[string]json.RawMessage

	if err := json.Unmarshal(data, &raw); err != nil {
		return fmt.Errorf("invalid filter expression: %w", err)
	}

	// Group: { "operator": "and", "filters": [...] }
	if _, ok := raw["operator"]; ok {
		var group FilterGroup[T]

		if err := json.Unmarshal(data, &group); err != nil {
			return fmt.Errorf("invalid filter group: %w", err)
		}

		if group.Operator != "and" && group.Operator != "or" {
			return fmt.Errorf("invalid filter group operator: %q", group.Operator)
		}

		f.Group = &group
		f.Item = nil

		return nil
	}

	// Leaf: { "property": "...", "value": ..., "op": "..." }
	if _, ok := raw["property"]; ok {
		var item FilterItem[T]

		if err := json.Unmarshal(data, &item); err != nil {
			return fmt.Errorf("invalid filter item: %w", err)
		}

		f.Item = &item
		f.Group = nil

		return nil
	}

	return fmt.Errorf("filter expression must contain either 'operator' or 'property'")
}

func (f *FilterExpression[T]) ValidFields() []string {
	var (
		fields          []string
		t               T
		rt              reflect.Type   = reflect.TypeOf(t)
		validFieldTypes []reflect.Kind = []reflect.Kind{
			reflect.String,
			reflect.Bool,
			reflect.Int, reflect.Int8, reflect.Int16, reflect.Int32, reflect.Int64,
			reflect.Uint, reflect.Uint8, reflect.Uint16, reflect.Uint32, reflect.Uint64,
			reflect.Float32, reflect.Float64,
		}
	)

	for field := range rt.Fields() {
		var kind = field.Type.Kind()
		if kind == reflect.Ptr {
			kind = field.Type.Elem().Kind()
		}
		if !slices.Contains(validFieldTypes, kind) {
			continue
		}
		var fieldName = field.Name
		if json, ok := field.Tag.Lookup("json"); ok {
			fieldName = strings.Split(json, ",")[0]
		}
		fields = append(fields, fieldName)
	}
	return fields
}
