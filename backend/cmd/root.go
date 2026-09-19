package cmd

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"slices"
	"time"
	"vp/libs/database"
	"vp/libs/handler"

	"github.com/spf13/cobra"
)

// rootCmd represents the base command when called without any subcommands
var rootCmd = &cobra.Command{
	Use:   "vp",
	Short: "This server will handler the a video player webpage and database requests.",
	Run:   handler.Root,
}

func Execute() {
	err := rootCmd.Execute()
	if err != nil {
		os.Exit(1)
	}
}

func init() {
	removeHelpFlag(rootCmd)
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
		if executable, err := os.Executable(); err == nil {
			defaultDsn = filepath.Join(filepath.Dir(executable), defaultDsn)
		}
	}

	rootCmd.Flags().Bool("cors.enable", false, "Enable the cors headers to be sent by the server")
	rootCmd.Flags().Bool("cors.debugMode", false, "Enable debug mode for cors. The logger has source=_cors")
	rootCmd.Flags().StringSlice("cors.allowOrigin", []string{}, "Cors allowed origins")

	rootCmd.Flags().String("database.driver", defaualtDriver, fmt.Sprintf("Choose the driver for the database connection. Available options: %s", string(drivers)))
	rootCmd.Flags().String("database.dsn", defaultDsn, "Set the database connection string to use with the specified driver")
	rootCmd.Flags().Duration("database.slowThreshold", time.Millisecond*500, "Set the slow threshold for the queries. Every single query longer that that will appear on the logger")

	rootCmd.Flags().Bool("ratelimit.enable", true, "Enable the API rate limit. Configurable with flags ratelimit.rps and ratelimit.burst")
	rootCmd.Flags().Float64("ratelimit.rps", 10, "rps (rate) = how quickly tokens are added to the bucket")
	rootCmd.Flags().Int("ratelimit.burst", 20, "burst = the bucket's maximum size (how many tokens it can hold)")

	rootCmd.Flags().Bool("server.enableLogger", true, "Enable server request logger")
	rootCmd.Flags().StringP("server.host", "h", "127.0.0.1", "Host of the webserver")
	rootCmd.Flags().IntP("server.port", "p", 5008, "Port of the webserver")
}

func removeHelpFlag(cmd *cobra.Command) {
	_ = cmd.Flags().MarkHidden("help")
	cmd.SetHelpCommand(&cobra.Command{Hidden: true})
	cmd.Flags().Bool("help", false, "help for this command")
	cmd.CompletionOptions = cobra.CompletionOptions{
		DisableDefaultCmd: true,
	}
}
