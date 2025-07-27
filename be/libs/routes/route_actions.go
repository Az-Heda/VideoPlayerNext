package routes

import (
	"errors"
	"fmt"
	"full/libs/models"
	"full/libs/webserver"
	"net/http"
	"time"

	"github.com/rs/zerolog/log"
	"gorm.io/gorm"
)

func handleActions(auth *webserver.Mux, conn *gorm.DB) *webserver.Mux {

	auth.HandleFunc("GET /auth/signout", CheckAuth(conn, func(w http.ResponseWriter, r *http.Request, user *models.User, err error) {
		if err != nil {
			if errors.Is(err, ErrorCannotFindAuthCookie) {
				http.Redirect(w, r, signinPage, http.StatusFound)
				return
			}
			http.Error(w, err.Error(), http.StatusFound)
			return
		}
		if user == nil {
			http.Redirect(w, r, signinPage, http.StatusFound)
			return
		}

		http.SetCookie(w, &http.Cookie{
			Name:    AuthCookieName,
			Value:   "",
			MaxAge:  0,
			Expires: time.Now(),
			Path:    "/",
		})

		var sessions []models.Session
		conn.Find(&sessions, models.Session{UserId: user.Id})
		// w.Write([]byte("Bye"))
		http.Redirect(w, r, homepage, http.StatusFound)
	}))

	auth.HandleFunc("POST /auth/signin", func(w http.ResponseWriter, r *http.Request) {
		if err := r.ParseForm(); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		var (
			email    string = r.Form.Get("email")
			password string = r.Form.Get("password")
		)

		var users []models.User
		if tx := conn.Find(&users, models.User{Email: email}); tx.Error != nil {
			http.Error(w, tx.Error.Error(), http.StatusBadRequest)
			return
		}

		if len(users) == 0 {
			http.Error(w, fmt.Sprintf("cannot find user with email `%s`", email), http.StatusNotFound)
			return
		} else if len(users) > 1 {
			http.Error(w, fmt.Sprintf("Found multiple users with email `%s`", email), http.StatusInternalServerError)
			return
		}

		var user = users[0]
		user.Password = password
		if !user.CheckPassword() {
			http.Error(w, "invalid password", http.StatusUnauthorized)
			return
		}

		var userSession = models.NewSession(&user, SessionDuration)

		http.SetCookie(w, &http.Cookie{
			Name:    AuthCookieName,
			Value:   userSession.Id,
			Expires: userSession.CreatedAt.Add(userSession.Lifespan),
			// MaxAge:   int(userSession.Lifespan.Seconds()),
			Path:     "/",
			HttpOnly: true,
			Quoted:   false,
		})

		conn.Create(&userSession)

		// w.Write([]byte("signin"))
		http.Redirect(w, r, homepage, http.StatusFound)
	})

	auth.HandleFunc("POST /auth/signup", func(w http.ResponseWriter, r *http.Request) {
		if err := r.ParseForm(); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		var (
			email     string = r.Form.Get("email")
			password  string = r.Form.Get("password")
			cpassword string = r.Form.Get("cpassword")
		)
		log.Debug().
			Str("email", email).
			Str("password", password).
			Str("cpassword", cpassword).
			Send()
		var users []models.User
		if tx := conn.Find(&users, models.User{Email: email}); tx.Error != nil {
			http.Error(w, tx.Error.Error(), http.StatusBadRequest)
			return
		}

		if len(users) > 0 {
			http.Error(w, "email is already in use by another user", http.StatusNotFound)
			return
		}
		if password != cpassword {
			http.Error(w, "different passwords", http.StatusBadRequest)
			return
		}

		var user models.User = models.User{
			Email:    email,
			Password: password,
		}

		user.GenerateId()
		user.GenerateUsername()

		if !user.HashPassword() {
			http.Error(w, "cannot hash password", http.StatusBadRequest)
			return
		}
		conn.Create(&user)

		var userSession = models.NewSession(&user, SessionDuration)

		http.SetCookie(w, &http.Cookie{
			Name:    AuthCookieName,
			Value:   userSession.Id,
			Expires: userSession.CreatedAt.Add(userSession.Lifespan),
			// MaxAge:   int(userSession.Lifespan.Seconds()),
			Path:     "/",
			HttpOnly: true,
			Quoted:   false,
		})

		conn.Create(&userSession)

		// w.Write([]byte("signup"))
		http.Redirect(w, r, homepage, http.StatusFound)
	})

	return auth
}
