package user

import (
	"full/libs/db"
	"full/libs/utils"

	"github.com/rs/zerolog/log"
	"github.com/spf13/cobra"
)

func init() {
	flagCommand := &cobra.Command{
		Use:   "delete",
		Short: "Delete user",
		Long:  "Delete the given user from the database",
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
			log.Info().Any("user", user).Send()

			if tx := conn.Delete(&user); tx.Error != nil {
				log.Err(tx.Error).Send()
			}
		},
	}

	flagCommand.PersistentFlags().String("filter-id", "", "Filter by id")
	flagCommand.PersistentFlags().String("filter-username", "", "Filter by username")
	flagCommand.PersistentFlags().String("filter-email", "", "Filter by email")

	UserCmd.AddCommand(flagCommand)
}
