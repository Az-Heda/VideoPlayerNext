//go:build sqlserver || all

package database

import (
	"gorm.io/driver/sqlserver"
	"gorm.io/gorm"
)

type DriverSqlServer struct {
	name string
}

// Driver implements driverConnection.
func (d DriverSqlServer) Driver() string {
	return d.name
}

// Get implements driverConnection.
func (d DriverSqlServer) Get(dsn string) gorm.Dialector {
	return sqlserver.Open(dsn)
}

func init() {
	var driver = DriverSqlServer{name: "sqlserver"}
	registred[driver.Driver()] = driver
}
