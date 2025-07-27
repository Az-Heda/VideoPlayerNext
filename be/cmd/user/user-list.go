package user

import (
	"full/libs/db"
	"full/libs/models"

	"github.com/rs/zerolog/log"
	"github.com/spf13/cobra"
	"gorm.io/gorm/clause"
)

func init() {
	flagCommand := &cobra.Command{
		Use:   "list",
		Short: "List all users",
		Long:  "List all the users in the database",
		Run: func(cmd *cobra.Command, args []string) {
			flagId, _ := cmd.Flags().GetBool("id")
			flagUsername, _ := cmd.Flags().GetBool("username")
			flagEmail, _ := cmd.Flags().GetBool("email")
			flagPerms, _ := cmd.Flags().GetBool("perms")

			conn, err := db.Connect()
			if err != nil {
				log.Err(err).Send()
				return
			}

			var users []models.User
			if tx := conn.Find(&users).Order(clause.OrderByColumn{Column: clause.Column{Name: "perm_is_admin"}, Desc: true}); tx.Error != nil {
				log.Err(tx.Error).Send()
				return
			}

			for _, u := range users {
				evt := log.Info()
				if flagId {
					evt.Str(" id", u.Id)
				}
				if flagUsername {
					evt.Str("Username", u.Username)
				}
				if flagEmail {
					evt.Str("Email", u.Email)
				}
				if flagPerms {
					evt.Any("perms", u.Perms)
				}
				evt.Send()
			}
		},
	}

	flagCommand.PersistentFlags().Bool("id", false, "Print Id")
	flagCommand.PersistentFlags().BoolP("username", "u", false, "Print Username")
	flagCommand.PersistentFlags().BoolP("email", "e", true, "Print Email")
	flagCommand.PersistentFlags().BoolP("perms", "p", false, "Print perms")

	UserCmd.AddCommand(flagCommand)
}
