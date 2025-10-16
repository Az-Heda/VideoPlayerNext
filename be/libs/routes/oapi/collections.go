package oapi

import (
	"iter"
	"slices"

	"dario.cat/mergo"
	"github.com/rs/zerolog/log"
)

type Collection[T any, K comparable] map[K]T

type (
	SchemaCollection          = Collection[OpenApiSchema, string]
	ResponsesCollection       = Collection[OpenApiResponse, StatusCode]
	ParametersCollection      = Collection[OpenApiParameter, string]
	ExamplesCollection        = Collection[OpenApiExample, string]
	RequestBodiesCollection   = Collection[OpenApiRequestBody, string]
	HeadersCollection         = Collection[OpenApiHeader, string]
	SecuritySchemesCollection = Collection[OpenApiSecurityScheme, string]
	PathItemsCollection       = Collection[OpenApiPathItem, string]
	MediaTypeCollection       = Collection[OpenApiMediaType, string]
)

func (c *Collection[T, K]) New(key K, value T) *Collection[T, K] {
	if !slices.Contains(c.Keys(), key) {
		(*c)[key] = value
		return c
	}

	if err := mergo.Merge((*c)[key], value, mergo.WithOverride, mergo.WithoutDereference); err != nil {
		log.Err(err).Send()
	}

	return c
}

func (c *Collection[T, K]) Delete(key K) *Collection[T, K] {
	delete(*c, key)
	return c
}

func (c *Collection[T, K]) Get(key K) (value T, ok bool) {
	value, ok = (*c)[key]
	return value, ok
}

func (c *Collection[T, K]) MustGet(key K) T {
	return (*c)[key]
}

func (c *Collection[T, K]) Filter(callback func(T, K) bool) []T {
	var data []T
	for k, v := range *c {
		if callback(v, k) {
			data = append(data, v)
		}
	}
	return data
}

func (c *Collection[T, K]) Keys() []K {
	var keys []K
	for k := range *c {
		keys = append(keys, k)
	}
	return keys
}

func (c *Collection[T, K]) NumItems() int {
	var keys = c.Keys()
	return len(keys)
}

func (c *Collection[T, K]) Iter() iter.Seq2[K, T] {
	return func(yield func(K, T) bool) {
		for k, v := range *c {
			if !yield(k, v) {
				return
			}
		}
	}
}
