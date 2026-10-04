package models

import "time"

type Attributes struct {
	Watched        *bool         `json:"watched" gorm:"index;column:watched"`
	Rating         float32       `json:"rating" gorm:"index;column:rating"`
	Exists         *bool         `json:"exists" gorm:"column:exists"`
	Size           int64         `json:"size" gorm:"column:size"`
	Duration       time.Duration `json:"duration" gorm:"column:duration"`
	LastFileChange *time.Time    `json:"lastFileChange,omitempty" gorm:"column:last_file_change"`
}

func (Attributes) ColumnMapper() map[string]string {
	return map[string]string{
		"watched":        "watched",
		"rating":         "rating",
		"exists":         "exists",
		"size":           "size",
		"duration":       "duration",
		"lastFileChange": "last_file_change",
	}
}
