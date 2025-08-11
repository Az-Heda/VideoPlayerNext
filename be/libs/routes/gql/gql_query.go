package gql

import (
	"fmt"
	"full/libs/models"

	"github.com/graphql-go/graphql"
	"github.com/rs/zerolog/log"
	"gorm.io/gorm"
)

func getQuery(conn *gorm.DB) *graphql.Object {
	return graphql.NewObject(graphql.ObjectConfig{
		Name: "Query",
		Fields: graphql.Fields{
			"Folders": &graphql.Field{
				Name:        "Get folders",
				Description: "Get folders",
				Type:        graphql.NewList(*(*models.Folder).GetGQLType(nil)),
				Args: graphql.FieldConfigArgument{
					"id": &graphql.ArgumentConfig{Type: graphql.String, Description: "Folder ID"},
				},
				Resolve: func(p graphql.ResolveParams) (any, error) {
					var filters []any
					id, ok := p.Args["id"]
					if ok {
						idStr, ok := id.(string)
						if !ok {
							return nil, fmt.Errorf("cannot convert %v to string", p.Args["id"])
						}
						filters = append(filters, models.Folder{Id: idStr})
					}

					var folders []models.Folder
					if tx := conn.WithContext(p.Context).Find(&folders, filters...); tx.Error != nil {
						log.Err(tx.Error).Send()
						return nil, tx.Error
					}
					return folders, nil
				},
			},
			"Videos": &graphql.Field{
				Name:        "Get videos",
				Description: "Get videos",
				Type:        graphql.NewList(*(*models.Video).GetGQLType(nil)),
				Args: graphql.FieldConfigArgument{
					"id":      &graphql.ArgumentConfig{Type: graphql.String, Description: "Video ID"},
					"watched": &graphql.ArgumentConfig{Type: graphql.Boolean, Description: "Filter for watched Y/N"},
				},
				Resolve: func(p graphql.ResolveParams) (any, error) {
					var filters []any
					id, ok := p.Args["id"]
					if ok {
						idStr, ok := id.(string)
						if !ok {
							return nil, fmt.Errorf("cannot convert %v to string", p.Args["id"])
						}
						filters = append(filters, models.Video{Id: idStr})
					}

					if watched, ok := p.Args["watched"]; ok {
						watchedBool, ok := watched.(bool)
						if !ok {
							return nil, fmt.Errorf("cannot convert %v to boolean", p.Args["watched"])
						}

						var data = map[string]interface{}{
							"attr_watched": watchedBool,
						}
						filters = append(filters, data)
					}

					var videos []models.Video
					if tx := conn.WithContext(p.Context).Find(&videos, filters...); tx.Error != nil {
						log.Err(tx.Error).Send()
						return nil, tx.Error
					}
					return videos, nil
				},
			},
		},
	})
}
