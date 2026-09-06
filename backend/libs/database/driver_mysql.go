//go:build mysql || all

package database

import (
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

type DriverMySql struct {
	name string
}

// Driver implements driverConnection.
func (d DriverMySql) Driver() string {
	return d.name
}

// Get implements driverConnection.
func (d DriverMySql) Get(dsn string) gorm.Dialector {
	return mysql.Open(dsn)
}

func init() {
	var driver = DriverMySql{name: "mysql"}
	registred[driver.Driver()] = driver
}
