package models

import (
	"fmt"

	"github.com/rs/zerolog/log"
)

type Page struct {
	Id           string `json:"id" gorm:"primaryKey"`
	Title        string `json:"title"`
	Url          string `json:"url"`
	AuthRequired bool   `json:"-" gorm:"index"`
}

func (p *Page) generateId() *Page {
	if len(p.Url) == 0 {
		log.Err(fmt.Errorf("cannot generate id from empty path"))
		return nil
	}
	p.Id = fmt.Sprintf("page-%d", hashFromString(p.Url))
	return p
}

func NewPage(title, url string, authRequired bool) Page {
	f := Page{
		Title:        title,
		Url:          url,
		AuthRequired: authRequired,
	}
	f.generateId()
	return f
}
