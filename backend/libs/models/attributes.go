package models

import "time"

type Attributes struct {
	Watched  *bool         `json:"watched" gorm:"index"`
	Rating   float32       `json:"rating" gorm:"index"`
	Exists   *bool         `json:"exists"`
	Size     int64         `json:"size"`
	Duration time.Duration `json:"duration"`
}
