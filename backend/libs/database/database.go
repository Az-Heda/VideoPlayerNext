package database

import (
	"errors"
	"maps"
	"slices"
	"time"

	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

type driverConnection interface {
	Driver() string
	Get(dsn string) gorm.Dialector
}

var (
	registred         map[string]driverConnection = make(map[string]driverConnection)
	ErrDriverNotFound error                       = errors.New("Driver not found")
)

func GetAvailableDrivers() []string {
	var drivers = slices.Collect(maps.Keys(registred))
	if drivers == nil {
		drivers = make([]string, 0)
	} else {
		slices.Sort(drivers)
	}
	return drivers
}

type DatabaseConnectionOptions struct {
	UseColors     bool
	SlowThreshold time.Duration
}

func Connect(driver string, dsn string, connOptions DatabaseConnectionOptions) (*gorm.DB, error) {
	var dialector gorm.Dialector = nil
	for k, v := range registred {
		if driver == k && k == v.Driver() {
			dialector = v.Get(dsn)
		}
	}

	if dialector == nil {
		return nil, ErrDriverNotFound
	}

	var gormConfigs = &gorm.Config{
		Logger: NewGormLogger(logger.Config{
			SlowThreshold:             connOptions.SlowThreshold,
			LogLevel:                  logger.Warn,
			IgnoreRecordNotFoundError: true,
			Colorful:                  connOptions.UseColors,
		}),
	}

	return gorm.Open(dialector, gormConfigs)
}
