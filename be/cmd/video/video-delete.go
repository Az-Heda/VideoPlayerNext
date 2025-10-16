package video

import (
	"fmt"
	"full/libs/db"
	"full/libs/models"
	"full/libs/utils"
	"strings"

	"github.com/manifoldco/promptui"
	"github.com/rs/zerolog/log"
	"github.com/spf13/cobra"
)

func init() {
	flagCommand := &cobra.Command{
		Use:   "delete",
		Short: "Delete video",
		Long:  "Delete video from database",
		Run: func(cmd *cobra.Command, args []string) {
			conn, err := db.Connect()
			if err != nil {
				log.Err(err).Send()
				return
			}

			_ = conn

			var (
				asker        = utils.AskUserPromptWithValidator(cmd)
				askerOptions = utils.AskUserForOptions(cmd)
				validateId   = func(id string) error {
					var vids []models.Video
					if tx := conn.Find(&vids, models.Video{Id: id}); tx.Error != nil {
						return tx.Error
					}
					switch len(vids) {
					case 0:
						return fmt.Errorf("cannot find video with id=`%s`", id)
					case 1:
						return nil
					default:
						return fmt.Errorf("found multiple videos with id=`%s`", id)
					}
				}
				// validateFilepath = func(filepath string) error {
				// 	var vids []models.Video
				// 	if tx := conn.Find(&vids, models.Video{FilePath: filepath}); tx.Error != nil {
				// 		return tx.Error
				// 	}
				// 	switch len(vids) {
				// 	case 0:
				// 		return fmt.Errorf("cannot find video with filepath=`%s`", filepath)
				// 	case 1:
				// 		return nil
				// 	default:
				// 		return fmt.Errorf("found multiple videos with filepath=`%s`", filepath)
				// 	}
				// }
			)

			var options = []string{"id", "filepath"}
			idx, err := askerOptions("filter-flag", "Select filter method", options)
			if err != nil {
				log.Err(err).Send()
				return
			} else if !(idx >= 0 && idx < len(options)) {
				log.Error().Msg("Cannot find selected option")
				return
			}

			switch options[idx] {
			case "id":
				id, err := asker("id", "Id", validateId)
				if err != nil {
					log.Err(err).Send()
					return
				}
				log.Info().Str("Id", id).Send()
			case "filepath":
				var videos []models.Video
				if tx := conn.Find(&videos); tx.Error != nil {
					log.Err(tx.Error).Send()
					return
				}

				var x promptui.Select = promptui.Select{
					Label: "Select item",
					Items: videos,
					Size:  15,
					Templates: &promptui.SelectTemplates{
						Label:    "{{ . }}",
						Active:   "• {{ .FilePath | yellow }}",
						Inactive: "  {{ .FilePath }}",
						Selected: "• {{ .FilePath | green }}",
					},
					Searcher: func(input string, index int) bool {
						video := videos[index]
						return strings.Contains(strings.ToLower(video.FilePath), strings.ToLower(input))
					},
				}
				idx, _, err := x.Run()
				if err != nil {
					log.Err(err).Send()
					return
				}
				log.Info().Any("selected", videos[idx]).Send()
			}
		},
	}

	flagCommand.PersistentFlags().String("id", "", "Video id")
	flagCommand.PersistentFlags().StringP("filepath", "f", "", "File path")
	flagCommand.PersistentFlags().StringP("filter-flag", "m", "", "Filter flag")

	VideoCmd.AddCommand(flagCommand)
}
