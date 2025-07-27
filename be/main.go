/*
Copyright © 2025 NAME HERE <EMAIL ADDRESS>
*/
package main

import (
	"full/cmd"
	"os"
	"time"

	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
)

func main() {
	l, _ := time.LoadLocation("Europe/Rome")
	log.Logger = zerolog.New(zerolog.MultiLevelWriter(
		zerolog.ConsoleWriter{
			Out:          os.Stdout,
			TimeFormat:   "15:04:05 02/01/2006",
			TimeLocation: l,
		},
	)).With().Timestamp().Logger().With().Caller().Logger()

	cmd.Execute()
}
