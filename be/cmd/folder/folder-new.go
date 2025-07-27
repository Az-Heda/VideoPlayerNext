package folder

import (
	"full/libs/db"
	"full/libs/models"
	"full/libs/utils"
	"time"

	"github.com/rs/zerolog/log"
	"github.com/schollz/progressbar/v3"
	"github.com/spf13/cobra"
	"github.com/vansante/go-ffprobe"
)

func init() {
	flagCommand := &cobra.Command{
		Use:   "new",
		Short: "Folder user",
		Long:  "Add a new folder to database",
		Run: func(cmd *cobra.Command, args []string) {
			conn, err := db.Connect()
			if err != nil {
				log.Err(err).Send()
				return
			}

			p, err := cmd.Flags().GetString("path")
			if err != nil {
				log.Err(err).Send()
				return
			}

			if len(p) == 0 {
				if err := utils.RequestUserInput(cmd.InOrStdin(), "Folder path: ", &p); err != nil {
					log.Err(err).Send()
					return
				}
			}

			var folders []models.Folder
			if tx := conn.Find(&folders, models.Folder{Path: p}); tx.Error != nil {
				log.Err(tx.Error).Send()
				return
			}

			if len(folders) >= 1 {
				log.Error().Msg("Folder already in database")
				return
			}

			var newFolder = models.NewFolder(p)
			if !newFolder.IsValidPath() {
				log.Error().Msg("Folder is not a valid path")
				return
			}

			if tx := conn.Create(newFolder); tx.Error != nil {
				log.Err(err).Send()
				return
			}

			var videos = newFolder.GetVideos()
			log.Info().Int("count", len(videos)).Msg("Collecting video informations")
			bar := progressbar.Default(int64(len(videos)))
			for _, v := range videos {
				bar.Add(1)
				data, err := ffprobe.GetProbeData(v.FilePath, 120000*time.Millisecond)
				if err != nil {
					log.Err(err).Str("file", v.FilePath).Str("id", v.Id).Send()
					continue
				}
				v.Duration = data.Format.Duration()
			}

			if tx := conn.CreateInBatches(videos, 100); tx.Error != nil {
				log.Err(tx.Error).Send()
				return
			}

			log.Info().Str("path", p).Send()
		},
	}

	flagCommand.PersistentFlags().StringP("path", "p", "", "Folder path")

	FolderCmd.AddCommand(flagCommand)
}
