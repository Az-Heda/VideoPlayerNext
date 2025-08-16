package serve

import (
	"embed"
	"fmt"
	"full/libs/routes"
	"net"
	"net/http"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"github.com/rs/cors"
	"github.com/rs/zerolog/log"
	"github.com/spf13/cobra"
)

//go:embed website
//go:embed website/*
var fsys embed.FS

const (
	default_IpAddress string = "0.0.0.0"
	default_Port      int    = 6004
)

var (
	fileCounter = promauto.NewGauge(prometheus.GaugeOpts{
		Name: "videoplayer_video_counter",
		Help: "The total number of files visible within this service",
	})
	ServeCmd = &cobra.Command{
		Use:   "serve",
		Short: "Serve",
		Long:  "Serve",
		Run: func(cmd *cobra.Command, args []string) {
			ip, err := cmd.Flags().GetIP("address")
			if err != nil {
				log.Err(err).Send()
				return
			}
			port, err := cmd.Flags().GetInt("port")
			if err != nil {
				log.Err(err).Send()
				return
			}

			cors := cors.New(cors.Options{
				AllowedMethods: []string{http.MethodGet, http.MethodPost},
				AllowedOrigins: []string{
					"http://localhost:3000",
					"http://localhost:6004",
					"http://vp.localhost",
				},
				// AllowedOrigins: []string{"*"},
				AllowedHeaders: []string{"Content-Type", "Accept"},
			})

			server := http.Server{
				Addr:    net.JoinHostPort(ip.String(), fmt.Sprint(port)),
				Handler: cors.Handler(routes.WebServer),
			}

			routes.AddWebsite(fsys, "website", fileCounter, &routes.AdditionalConfigs{
				EnableGraphql:             true,
				GraphqlEndpoint:           "/gql/graphql",
				GraphqlPlaygroundEndpoint: "/gql/playground",
			})
			routes.WebServer.Handle("/metrics", promhttp.Handler())

			log.Info().Str("address", server.Addr).Msg("Server online")
			if err := server.ListenAndServe(); err != nil {
				log.Panic().Err(err).Send()
			}
		},
	}
)

func init() {

	ServeCmd.PersistentFlags().IPP("address", "a", net.ParseIP(default_IpAddress), "Host")
	ServeCmd.PersistentFlags().IntP("port", "p", default_Port, "Port")
}
