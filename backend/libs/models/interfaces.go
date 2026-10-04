package models

type IModelScope interface {
	ColumnMapper() map[string]string
}
