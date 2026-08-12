package models

import "time"

type Attributes struct {
	Watched  bool          `json:"watched,omitempty" gorm:"index"`
	Favorite bool          `json:"favorite,omitempty"`
	Exists   bool          `json:"exists,omitempty"`
	Size     int64         `json:"size"`
	Duration time.Duration `json:"duration"`
}
