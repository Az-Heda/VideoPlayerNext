package gql

import (
	"github.com/graphql-go/graphql"
	"gorm.io/gorm"
)

func getSubscription(conn *gorm.DB) *graphql.Object {
	// return graphql.NewObject(graphql.ObjectConfig{
	// 	Name: "Subscription",
	// 	Fields: graphql.Fields{
	// 		"ScanFolders": &graphql.Field{
	// 			Name: "ScanFolder",
	// 			Type: *(*models.Video).GetGQLType(nil),
	// 			Args: graphql.FieldConfigArgument{
	// 				"id": &graphql.ArgumentConfig{Type: graphql.String, Description: "Folder id", DefaultValue: ""},
	// 			},
	// 			Resolve: func(p graphql.ResolveParams) (interface{}, error) {
	// 				return p.Source, nil
	// 			},
	// 			Subscribe: func(p graphql.ResolveParams) (interface{}, error) {
	// 				id, err := getArg[string](p.Args, "id")
	// 				if err != nil {
	// 					return nil, err
	// 				}

	// 				var filter []any
	// 				if len(*id) > 0 {
	// 					filter = append(filter, models.Folder{Id: *id})
	// 				}

	// 				var folders []models.Folder
	// 				if tx := conn.Find(&folders, filter...); tx.Error != nil {
	// 					log.Err(tx.Error).Send()
	// 					return nil, tx.Error
	// 				}

	// 				var out chan any = make(chan any)
	// 				go func() {
	// 					for _, f := range folders {
	// 						f.AddOrigin()
	// 						vids := f.GetVideos()
	// 						for _, v := range vids {
	// 							select {
	// 							case <-p.Context.Done():
	// 								log.Info().Msg("Closing subscription")
	// 								close(out)
	// 								return
	// 							default:
	// 								if tx := conn.FirstOrCreate(&v); tx.Error != nil {
	// 									log.Err(tx.Error).Send()
	// 									continue
	// 								}
	// 								out <- v
	// 							}
	// 						}
	// 					}
	// 					close(out)
	// 				}()

	// 				return out, nil
	// 			},
	// 		},
	// 	},
	// })
	return nil
}
