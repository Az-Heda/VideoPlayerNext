package folder

import (
	"full/libs/db"
	"full/libs/models"
	"full/libs/utils"

	"github.com/rs/zerolog/log"
	"github.com/spf13/cobra"
)

func init() {
	flagCommand := &cobra.Command{
		Use:   "delete",
		Short: "Delete folder",
		Long:  "Remove a folder from database",
		Run: func(cmd *cobra.Command, args []string) {
			conn, err := db.Connect()
			if err != nil {
				log.Err(err).Send()
				return
			}
			choosenField, inputValue, data := utils.GetFromCliInput(cmd, conn, map[string]func(value string) models.Folder{
				"id":   func(value string) models.Folder { return models.Folder{Id: value} },
				"path": func(value string) models.Folder { return models.Folder{Path: value} },
			})

			log.Debug().
				Str("choosenField", choosenField).
				Str("inputValue", inputValue).
				Any("data", data).
				Send()

		},
	}

	flagCommand.PersistentFlags().String("filter-id", "", "Filter by id")
	flagCommand.PersistentFlags().String("filter-path", "", "Filter by path")

	FolderCmd.AddCommand(flagCommand)
}
