package user

import (
	"full/libs/db"
	"full/libs/models"
	"full/libs/utils"
	"os"
	"slices"

	"github.com/rs/zerolog/log"
	"github.com/spf13/cobra"
)

func init() {
	const adminArgName = "admin"
	UserCmd.AddCommand(&cobra.Command{
		Use:       "new",
		Short:     "New user",
		Long:      "Create a new user with the given informations",
		Args:      cobra.OnlyValidArgs,
		ValidArgs: []cobra.Completion{adminArgName},
		Run: func(cmd *cobra.Command, args []string) {
			conn, err := db.Connect()
			if err != nil {
				log.Err(err).Send()
				return
			}
			var (
				email           string
				password        string
				confirmPassword string
			)
			if err := utils.RequestUserInput(cmd.InOrStdin(), "Email      : ", &email); err != nil || len(email) == 0 {
				if err != nil {
					log.Err(err).Send()
					return
				}
				log.Error().Str("field", "email").Msg("cannot be empty")
				return
			}
			if err := utils.RequestUserPassword("Password   : ", true, os.Stdin, &password); err != nil || len(password) == 0 {
				if err != nil {
					log.Err(err).Send()
					return
				}
				log.Error().Str("field", "password").Msg("cannot be empty")
				return
			}
			if err := utils.RequestUserPassword("Confirm PWD: ", true, os.Stdin, &confirmPassword); err != nil || len(confirmPassword) == 0 {
				if err != nil {
					log.Err(err).Send()
					return
				}
				log.Error().Str("field", "confirmPassword").Msg("cannot be empty")
				return
			}

			if password != confirmPassword {
				log.Error().Msg("Passwords do not match")
				return
			}

			var u models.User = models.User{
				Email:    email,
				Password: password,
				Perms: models.UserPermission{
					IsAdmin: slices.Contains(args, adminArgName),
				},
			}

			u.GenerateId()
			u.GenerateUsername()

			if !u.HashPassword() {
				log.Error().Msg("Cannot hash the given password")
				return
			}

			// _ = conn
			if tx := conn.Create(&u); tx.Error != nil {
				log.Err(tx.Error).Send()
				return
			}

			log.Info().Msg("User successuly created!")
		},
	})
}
