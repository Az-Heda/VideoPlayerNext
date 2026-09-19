package main

import (
	"os"
	"time"
	"vp/cmd"

	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
)

func init() {
	loc, _ := time.LoadLocation("Europe/Rome")
	log.Logger = zerolog.New(zerolog.MultiLevelWriter(
		zerolog.ConsoleWriter{
			Out:          os.Stdout,
			TimeFormat:   "15:04:05 02/01/2006",
			TimeLocation: loc,
		},
	)).
		With().Timestamp().Logger()
}

func main() {
	cmd.Execute()
}
