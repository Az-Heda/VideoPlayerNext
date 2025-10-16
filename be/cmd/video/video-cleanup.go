package video

import (
	"fmt"
	"full/libs/db"
	"full/libs/models"
	"full/libs/utils"
	"os"

	"github.com/rs/zerolog/log"
	"github.com/spf13/cobra"
)

func init() {
	flagCommand := &cobra.Command{
		Use:   "cleanup",
		Short: "Cleanup database",
		Long:  "Remove non existing videos",
		Run: func(cmd *cobra.Command, args []string) {
			conn, err := db.Connect()
			if err != nil {
				log.Err(err).Send()
				return
			}

			var videos []models.Video
			if tx := conn.WithContext(cmd.Context()).Find(&videos); tx.Error != nil {
				log.Err(tx.Error).Send()
				os.Exit(1)
			}

			var invalidVideos []*models.Video
			for _, v := range videos {
				if _, err := os.Lstat(v.FilePath); err != nil {
					invalidVideos = append(invalidVideos, &v)
				}
			}

			if len(invalidVideos) == 0 {
				log.Info().Msg("Cannot find videos to delete")
				os.Exit(0)
			}

			confirm := utils.AskUserYN(cmd)
			if !confirm("confirm", fmt.Sprintf("Are you sure to delete %d videos", len(invalidVideos))) {
				log.Info().Msg("Aborted")
				os.Exit(0)
			}

			for _, v := range invalidVideos {
				if tx := conn.WithContext(cmd.Context()).Delete(&v); tx.Error != nil {
					log.Err(tx.Error).Send()
				}
			}

		},
	}

	flagCommand.PersistentFlags().BoolP("confirm", "y", false, "Delete without prompt")

	VideoCmd.AddCommand(flagCommand)
}
