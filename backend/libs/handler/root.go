package handler

import (
	"net"
	"net/http"
	"strconv"
	"vp/libs/api"
	"vp/libs/database"
	"vp/libs/models"
	. "vp/libs/utility"

	"github.com/rs/zerolog/log"
	"github.com/spf13/cobra"
)

func Root(cmd *cobra.Command, args []string) {
	var (
		host    = Must(cmd.Flags().GetString("host"))
		port    = Must(cmd.Flags().GetInt("port"))
		address = net.JoinHostPort(host, strconv.Itoa(port))
		conn, _ = database.Connect()
		mux     = http.NewServeMux()
	)

	models.AutoMigrate(conn)
	api.Setup(mux, conn)

	log.Info().Msgf("Server online at http://%s", address)
	if err := http.ListenAndServe(address, mux); err != nil {
		log.Fatal().Err(err).Send()
	}
}
