package gql

import (
	"fmt"
	"full/libs/models"

	"github.com/graphql-go/graphql"
	"github.com/rs/zerolog/log"
	"gorm.io/gorm"
)

func getMutation(conn *gorm.DB) *graphql.Object {
	return graphql.NewObject(graphql.ObjectConfig{
		Name: "Mutation",
		Fields: graphql.Fields{
			"AddFolder": &graphql.Field{
				Name: "AddFolder",
				Type: *(*models.Folder).GetGQLType(nil),
				Args: graphql.FieldConfigArgument{
					"path": &graphql.ArgumentConfig{Type: graphql.NewNonNull(graphql.String)},
				},
				Resolve: func(p graphql.ResolveParams) (any, error) {
					path, err := getArg[string](p.Args, "path")
					if err != nil {
						return nil, err
					}

					folder := models.NewFolder(*path)
					if tx := conn.WithContext(p.Context).Create(&folder); tx.Error != nil {
						log.Err(tx.Error).Send()
						return nil, tx.Error
					}
					return folder, nil
				},
			},
			"DeleteFolder": &graphql.Field{
				Name: "DeleteFolder",
				Type: *(*models.Folder).GetGQLType(nil),
				Args: graphql.FieldConfigArgument{
					"id": &graphql.ArgumentConfig{Type: graphql.NewNonNull(graphql.String)},
				},
				Resolve: func(p graphql.ResolveParams) (any, error) {
					id, err := getArg[string](p.Args, "id")
					if err != nil {
						return nil, err
					}
					var folders []models.Folder
					if tx := conn.WithContext(p.Context).Find(&folders, models.Folder{Id: *id}); tx.Error != nil {
						log.Err(tx.Error).Send()
						return nil, tx.Error
					}

					if len(folders) == 0 {
						return nil, fmt.Errorf("cannot find folder with id=`%s`", *id)
					}

					if len(folders) > 1 {
						return nil, fmt.Errorf("found multiple folders with id=`%s`", *id)
					}

					if tx := conn.WithContext(p.Context).Delete(&folders[0]); tx.Error != nil {
						log.Err(tx.Error).Send()
						return nil, tx.Error
					}

					return folders[0], nil
				},
			},
			"ScanFolders": &graphql.Field{
				Name: "ScanFolder",
				Type: graphql.NewList(*(*models.Video).GetGQLType(nil)),
				Args: graphql.FieldConfigArgument{
					"id": &graphql.ArgumentConfig{Type: graphql.String, Description: "Folder id", DefaultValue: ""},
				},
				Resolve: func(p graphql.ResolveParams) (interface{}, error) {
					id, err := getArg[string](p.Args, "id")
					if err != nil {
						return nil, err
					}

					var filter []any
					if len(*id) > 0 {
						filter = append(filter, models.Folder{Id: *id})
					}

					var folders []models.Folder
					if tx := conn.WithContext(p.Context).Find(&folders, filter...); tx.Error != nil {
						log.Err(tx.Error).Send()
						return nil, tx.Error
					}

					var out []*models.Video
					for _, f := range folders {
						f.AddOrigin()
						vids := f.GetVideos()
						for _, v := range vids {
							if tx := conn.WithContext(p.Context).FirstOrCreate(&v); tx.Error != nil {
								log.Err(tx.Error).Send()
								continue
							}
							out = append(out, v)
						}
					}

					return out, nil
				},
			},
		},
	})
}
