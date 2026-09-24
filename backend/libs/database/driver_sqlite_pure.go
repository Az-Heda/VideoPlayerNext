//go:build sqlite_pure || all

package database

import (
	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
)

type DriverSqlite3Pure struct {
	name string
}

// Driver implements driverConnection.
func (d DriverSqlite3Pure) Driver() string {
	return d.name
}

// Get implements driverConnection.
func (d DriverSqlite3Pure) Get(dsn string) gorm.Dialector {
	return sqlite.Open(dsn)
}

func init() {
	var driver = DriverSqlite3Pure{name: "sqlite_pure"}
	registred[driver.Driver()] = driver
}
