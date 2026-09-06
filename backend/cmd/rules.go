package cmd

import (
	"encoding/json"
	"fmt"
	"slices"
	"vp/libs/database"
	"vp/libs/handler"

	"github.com/spf13/cobra"
)

var ruleCmd = &cobra.Command{
	Use:   "rules",
	Short: "Apply the rules in the database on all of the visible videos",
	Run:   handler.Rule,
}

func init() {
	var availableDrivers = database.GetAvailableDrivers()
	drivers, _ := json.Marshal(availableDrivers)

	var sqliteDriver = "sqlite"
	var defaualtDriver string
	var defaultDsn string
	switch {
	case len(availableDrivers) == 1:
		defaualtDriver = availableDrivers[0]
	case len(availableDrivers) > 1 && !slices.Contains(availableDrivers, sqliteDriver):
		defaualtDriver = availableDrivers[0]
	case len(availableDrivers) > 1 && slices.Contains(availableDrivers, sqliteDriver):
		defaualtDriver = sqliteDriver
	}
	if defaualtDriver == sqliteDriver {
		defaultDsn = ".sqlite3"
	}

	ruleCmd.Flags().String("database.driver", defaualtDriver, fmt.Sprintf("Choose the driver for the database connection. Available options: %s", string(drivers)))
	ruleCmd.Flags().String("database.dsn", defaultDsn, "Set the database connection string to use with the specified driver")

	removeHelpFlag(ruleCmd)
}
