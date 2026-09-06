package handler

import (
	"net/http"
	"os"
	"regexp"
	"slices"
	"time"
	"vp/libs/api/apivideo"
	"vp/libs/array"
	"vp/libs/database"
	"vp/libs/models"
	. "vp/libs/utility"

	"github.com/rs/zerolog/log"
	"github.com/spf13/cobra"
)

func Rule(cmd *cobra.Command, args []string) {
	var (
		databaseDriver = Must(cmd.Flags().GetString("database.driver"))
		databaseDsn    = Must(cmd.Flags().GetString("database.dsn"))
		conn           = Must(database.Connect(databaseDriver, databaseDsn, database.DatabaseConnectionOptions{
			UseColors:     cmd.OutOrStdout() == os.Stdout,
			SlowThreshold: time.Minute,
		}))
	)

	models.AutoMigrate(conn)

	var rules []models.Rule

	if tx := (models.Rule{}.Preload(conn.WithContext(cmd.Context()), true, true)).Find(&rules); tx.Error != nil {
		log.Fatal().
			Err(tx.Error).
			Msg("Cannot retrieve the rules")
	}
	rules = array.Map[[]models.Rule, []models.Rule](rules, func(r models.Rule, idx int) models.Rule {
		if r.Playlists == nil {
			r.Playlists = &[]*models.Playlist{}
		}
		if r.Tags == nil {
			r.Tags = &[]*models.Tag{}
		}

		r.Regex, r.RegexError = regexp.Compile(r.RegexRaw)
		return r
	})

	rules = array.Filter(rules, func(r models.Rule, idx int) bool {
		if r.Regex == nil {
			log.Warn().
				Str("id", r.Id).
				Err(r.RegexError).
				Msg("Skipping rule")
			return false
		}
		return true
	})
	log.Trace().
		Int("count", len(rules)).
		Msg("Rules")

	var outVideos = apivideo.CB_ListVideo(conn, &apivideo.ListVideoRequest{Preload: apivideo.Preload{PreloadPlaylist: true, PreloadFolder: true, PreloadTags: true}})
	outVideos.Init()
	if outVideos.StatusCode != http.StatusOK {
		log.Fatal().
			Int("status", outVideos.StatusCode).
			Str("error", outVideos.ErrorTitle).
			Errs("errorList", outVideos.Errors).
			Msg("Cannto retrieve the videos")
	}
	var videos = outVideos.Value.Body

	log.Trace().
		Int("count", len(videos)).
		Msg("Videos")

	var updatedVideos []models.Video

	for _, vid := range videos {
		var updates int
		for _, r := range rules {
			if matches := r.Regex.FindAllString(vid.Fullpath, -1); len(matches) > 0 {
				var existingPlaylists []string = array.Map[[]*models.Playlist, []string](vid.Playlists, func(item *models.Playlist, _ int) string {
					return item.Id
				})
				var existingTags []string = array.Map[[]*models.Tag, []string](vid.Tags, func(item *models.Tag, _ int) string {
					return item.Id
				})
				for _, p := range *r.Playlists {
					if !slices.Contains(existingPlaylists, p.Id) {
						updates += 1
						vid.Playlists = append(vid.Playlists, p)
					}
				}
				for _, t := range *r.Tags {
					if !slices.Contains(existingTags, t.Id) {
						updates += 1
						vid.Tags = append(vid.Tags, t)
					}
				}
			}
		}

		if updates > 0 {
			updatedVideos = append(updatedVideos, vid)
		}
	}

	if len(updatedVideos) > 0 {
		log.Info().Int("changes", len(updatedVideos)).Msg("Found")
		for _, v := range updatedVideos {
			log.Debug().Str("id", v.Id).Msg(v.Filename)
		}
		if tx := conn.Save(&updatedVideos); tx.Error != nil {
			log.Fatal().Err(tx.Error).Msg("Database saving error")
		}
	}
}
