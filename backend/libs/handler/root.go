package handler

import (
	"net"
	"net/http"
	"os"
	"strconv"
	"vp/libs/api"
	"vp/libs/database"
	"vp/libs/models"
	"vp/libs/server"
	. "vp/libs/utility"

	"github.com/rs/zerolog/log"
	"github.com/spf13/cobra"
)

func Root(cmd *cobra.Command, args []string) {
	var (
		databaseDriver        = Must(cmd.Flags().GetString("database.driver"))
		databaseDsn           = Must(cmd.Flags().GetString("database.dsn"))
		databaseSlowThreshold = Must(cmd.Flags().GetDuration("database.slowThreshold"))

		serverHost         = Must(cmd.Flags().GetString("server.host"))
		serverPort         = Must(cmd.Flags().GetInt("server.port"))
		serverEnableLogger = Must(cmd.Flags().GetBool("server.enableLogger"))

		corsEnable         = Must(cmd.Flags().GetBool("cors.enable"))
		corsDebugMode      = Must(cmd.Flags().GetBool("cors.debugMode"))
		corsAllowedOrigins = Must(cmd.Flags().GetStringSlice("cors.allowOrigin"))

		rateLimitEnabled = Must(cmd.Flags().GetBool("ratelimit"))
		rateLimitRps     = Must(cmd.Flags().GetFloat64("ratelimit.rps"))
		rateLimitBurst   = Must(cmd.Flags().GetInt("ratelimit.burst"))
	)

	var (
		address = net.JoinHostPort(serverHost, strconv.Itoa(serverPort))
		mux     = http.NewServeMux()
		conn    = Must(database.Connect(databaseDriver, databaseDsn, database.DatabaseConnectionOptions{
			UseColors:     cmd.OutOrStdout() == os.Stdout,
			SlowThreshold: databaseSlowThreshold,
		}))
	)

	models.AutoMigrate(conn)
	api.Setup(mux, conn)
	server.AddEndpoints(mux, conn)

	log.Info().Msgf("Server online at http://%s", address)

	var handler = server.ApplyMiddlewareIf(
		mux,
		server.MiddlewareIf{Cond: corsEnable, Middleware: server.MiddlewareCORS(corsDebugMode, corsAllowedOrigins)},
		server.MiddlewareIf{Cond: true, Middleware: server.MiddlewareRecover},
		server.MiddlewareIf{Cond: rateLimitEnabled, Middleware: server.MiddlewareRateLimit(rateLimitRps, rateLimitBurst)},
		server.MiddlewareIf{Cond: serverEnableLogger, Middleware: server.MiddlewareLogger(log.Logger)},
		server.MiddlewareIf{Cond: serverEnableLogger, Middleware: server.MiddlewareRequestLogger},
	)
	if err := http.ListenAndServe(address, handler); err != nil {
		log.Fatal().Err(err).Send()
	}
}
