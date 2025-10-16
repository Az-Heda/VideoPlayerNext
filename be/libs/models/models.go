package models

import (
	"hash/fnv"
	"math/rand"

	"github.com/rs/zerolog/log"
	"gorm.io/gorm"
)

var (
	initializable []any = []any{
		&User{},
		&Session{},
		&Folder{},
		&Video{},
		&Picture{},
		&Page{},
	}
)

func Register(conn *gorm.DB) {
	for _, v := range initializable {
		if err := conn.AutoMigrate(v); err != nil {
			log.Err(err).Send()
		}
	}

	var pages []Page = []Page{
		NewPage("Login", "/login", false),
		NewPage("Logout", "/logout", true),
		NewPage("Gallery", "/gallery", true),
		NewPage("OpenApi", "/oapi/scalar", true),
		NewPage("GraphQL", "/gql/playground", true),
	}

	for _, p := range pages {
		conn.FirstOrCreate(&p)
	}
}

func GenerateString(n int) string {
	var charset = []rune("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!#$%&'*+-.^_`|~")
	b := make([]rune, n)
	for i := range b {
		b[i] = charset[rand.Intn(len(charset))]
	}
	return string(b)
}

func hashFromString(s string) uint32 {
	h := fnv.New32a()
	h.Write([]byte(s))
	return h.Sum32()
}
