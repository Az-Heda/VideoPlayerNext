package db

import (
	"full/libs/models"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

const (
	DSN string = "database.sqlite3"
)

func Connect() (*gorm.DB, error) {
	conn, err := gorm.Open(sqlite.Open(DSN), &gorm.Config{})
	if err != nil {
		return nil, err
	}

	models.Register(conn)

	return conn, nil
}
