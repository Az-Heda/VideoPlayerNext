package user

import (
	"full/libs/db"
	"full/libs/utils"
	"os"

	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
	"github.com/spf13/cobra"
)

func init() {
	flagCommand := &cobra.Command{
		Use:   "check-password",
		Short: "Check user password",
		Long:  "Check the password for the given user",
		Run: func(cmd *cobra.Command, args []string) {
			conn, err := db.Connect()
			if err != nil {
				log.Err(err).Send()
				return
			}
			field, value, users := utils.GetUsersFromCliInput(cmd, conn)
			if len(users) == 0 {
				log.Error().
					Str("field", field).
					Str("value", value).
					Msg("Cannot find user")
				return
			}

			if len(users) > 1 {
				log.Error().
					Str("field", field).
					Str("value", value).
					Msg("Found multiple users")
				return
			}

			var user = users[0]
			if err := utils.RequestUserPassword("Insert password: ", true, os.Stdin, &user.Password); err != nil {
				log.Err(err).Send()
				return
			}

			var match = user.CheckPassword()
			var evt *zerolog.Event
			var msg string

			if match {
				evt = log.Info()
				msg = "Password match!"
			} else {
				evt = log.Error()
				msg = "Password is wrong"
			}
			evt.Msg(msg)
		},
	}

	flagCommand.PersistentFlags().String("filter-id", "", "Filter by id")
	flagCommand.PersistentFlags().String("filter-username", "", "Filter by username")
	flagCommand.PersistentFlags().String("filter-email", "", "Filter by email")

	UserCmd.AddCommand(flagCommand)
}
