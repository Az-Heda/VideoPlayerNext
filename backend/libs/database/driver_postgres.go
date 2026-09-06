//go:build postgres || all

package database

import (
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

type DriverPostgres struct {
	name string
}

// Driver implements driverConnection.
func (d DriverPostgres) Driver() string {
	return d.name
}

// Get implements driverConnection.
func (d DriverPostgres) Get(dsn string) gorm.Dialector {
	return postgres.Open(dsn)
}

func init() {
	var driver = DriverPostgres{name: "postgres"}
	registred[driver.Driver()] = driver
}
