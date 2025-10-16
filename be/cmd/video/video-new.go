package video

import (
	"fmt"
	"full/libs/db"
	"full/libs/models"
	"full/libs/utils"
	"os"
	"path/filepath"

	"github.com/rs/zerolog/log"
	"github.com/spf13/cobra"
)

func init() {
	flagCommand := &cobra.Command{
		Use:   "new",
		Short: "New video",
		Long:  "Add a new video to database",
		Run: func(cmd *cobra.Command, args []string) {
			conn, err := db.Connect()
			if err != nil {
				log.Err(err).Send()
				return
			}

			var doesFileExists = func(file string) error {
				if info, err := os.Lstat(file); err != nil {
					return err
				} else {
					if info.IsDir() {
						return fmt.Errorf("`%s` is a folder", file)
					}
				}

				if filepath.Ext(file) != ".mp4" {
					return fmt.Errorf("`%s` is not a .mp4 file", file)
				}
				return nil
			}

			var stats os.FileInfo
			var video *models.Video = &models.Video{
				Attributes: models.VideoAttributes{
					Exists: true,
				},
				Folder: &models.Folder{},
			}
			var asker = utils.AskUserPromptWithValidator(cmd)
			var askerConfirm = utils.AskUserYN(cmd)

			if video.FilePath, err = asker("filepath", "File path", doesFileExists); err != nil {
				log.Err(err).Send()
				return
			}
			if video.FilePath, err = filepath.Abs(video.FilePath); err != nil {
				log.Err(err).Send()
				return
			}

			if err = video.GetDuration(); err != nil {
				log.Err(err).Send()
			}
			if stats, err = os.Lstat(video.FilePath); err != nil {
				log.Err(err).Send()
				return
			} else {
				video.Size = stats.Size()
			}

			base, file := filepath.Split(video.FilePath)
			video.Title = file
			video.Folder = models.NewFolder(base)
			video.GenerateId()
			video.Attributes.Watched = askerConfirm("watched", "Watched")

			var folder models.Folder
			if tx := conn.FirstOrCreate(&folder, &video.Folder); tx.Error != nil {
				log.Err(tx.Error).Send()
				return
			}

			if tx := conn.Create(&video); tx.Error != nil {
				log.Err(tx.Error).Send()
				return
			}
		},
	}

	// flagCommand.PersistentFlags().String("id", "", "Video id")
	flagCommand.PersistentFlags().StringP("filepath", "f", "", "File path")
	flagCommand.PersistentFlags().BoolP("watched", "w", false, "Video watched")

	VideoCmd.AddCommand(flagCommand)
}
