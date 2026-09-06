package models

import (
	"fmt"
	"reflect"

	"gorm.io/gorm"
)

type ValidationOP uint

const (
	_ ValidationOP = 1 << iota
	Before
	After

	Save
	Create
	Update
	Delete
	Find
)

var (
	validate    func(v ValidModel)      = func(v ValidModel) {}
	ErrInjector func(t, into any) error = func(t, into any) error {
		return fmt.Errorf("Cannot inject value %s into %s", reflect.TypeOf(t).String(), reflect.TypeOf(into).String())
	}
)

type ValidModel interface {
	Validate(op ValidationOP, tx *gorm.DB) error

	BeforeSave(tx *gorm.DB) error
	BeforeCreate(tx *gorm.DB) error
	BeforeUpdate(tx *gorm.DB) error
	BeforeDelete(tx *gorm.DB) error

	AfterSave(tx *gorm.DB) error
	AfterCreate(tx *gorm.DB) error
	AfterUpdate(tx *gorm.DB) error
	AfterDelete(tx *gorm.DB) error
	AfterFind(tx *gorm.DB) error
}
