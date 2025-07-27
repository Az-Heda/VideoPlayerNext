package user

import (
	"full/libs/db"
	"full/libs/utils"
	"os"

	"github.com/rs/zerolog/log"
	"github.com/spf13/cobra"
)

func init() {
	flagCommand := &cobra.Command{
		Use:   "reset-password",
		Short: "Reset user password",
		Long:  "Reset the password for the given user",
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

			var (
				newPassword        string
				confirmNewPassword string
			)

			if err := utils.RequestUserPassword("Type new password   : ", true, os.Stdin, &newPassword); err != nil {
				log.Err(err).Send()
				return
			}
			if err := utils.RequestUserPassword("Confirm new password: ", true, os.Stdin, &confirmNewPassword); err != nil {
				log.Err(err).Send()
				return
			}
			if len(newPassword) == 0 {
				log.Error().Msg("Password is empty")
				return
			}
			if newPassword != confirmNewPassword {
				log.Error().Msg("Passwords do not match")
				return
			}
			var usr = users[0]

			usr.Password = newPassword
			usr.HashPassword()

			if tx := conn.Updates(&usr); tx.Error != nil {
				log.Err(tx.Error).Send()
			}
		},
	}

	flagCommand.PersistentFlags().String("filter-id", "", "Filter by id")
	flagCommand.PersistentFlags().String("filter-username", "", "Filter by username")
	flagCommand.PersistentFlags().String("filter-email", "", "Filter by email")

	UserCmd.AddCommand(flagCommand)
}
