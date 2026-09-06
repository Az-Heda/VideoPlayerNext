//go:build sqlite || all

package database

import (
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

type DriverSqlite3 struct {
	name string
}

// Driver implements driverConnection.
func (d DriverSqlite3) Driver() string {
	return d.name
}

// Get implements driverConnection.
func (d DriverSqlite3) Get(dsn string) gorm.Dialector {
	return sqlite.Open(dsn)
}

func init() {
	var driver = DriverSqlite3{name: "sqlite"}
	registred[driver.Driver()] = driver
}
