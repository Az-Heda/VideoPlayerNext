package utility

import "github.com/rs/zerolog/log"

func Must[T any](val T, err error) T {
	if err != nil {
		log.Fatal().Err(err).Send()
	}
	return val
}
