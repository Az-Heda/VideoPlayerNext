package routes

import (
	"errors"
	"full/libs/models"
	"net/http"

	"gorm.io/gorm"
)

var (
	ErrorCannotFindAuthCookie     error = errors.New("cannot find auth cookie")
	ErrorCannotFindCorrectSession error = errors.New("cannot find correct session")
)

func CheckAuth(conn *gorm.DB, next func(w http.ResponseWriter, r *http.Request, user *models.User, err error)) func(w http.ResponseWriter, r *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		var user *models.User = nil

		// for idx, c := range r.Cookies() {
		// 	log.Info().Bool("check", c.Name == AuthCookieName).Int("idx", idx).Any("cookie", c).Send()
		// }

		cookie, err := r.Cookie(AuthCookieName)
		if err != nil {
			next(w, r, nil, ErrorCannotFindAuthCookie)
			return
		}

		// log.Info().Any("session-id", cookie.Value).Send()

		var sessions []models.Session

		if tx := conn.Find(&sessions, models.Session{Id: cookie.Value}); tx.Error != nil {
			next(w, r, nil, tx.Error)
			return
		}

		if len(sessions) != 1 {
			next(w, r, nil, ErrorCannotFindCorrectSession)
			return
		}

		var users []models.User
		if tx := conn.Find(&users, models.User{Id: sessions[0].UserId}); tx.Error != nil {
			next(w, r, nil, tx.Error)
			return
		}

		if len(users) == 1 {
			user = &users[0]
		}

		next(w, r, user, nil)
	}
}
