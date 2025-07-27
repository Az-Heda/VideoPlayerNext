package models

import (
	"fmt"
	"full/libs/argon"
	"strings"

	"github.com/rs/zerolog/log"
)

type User struct {
	Id             string         `json:"id,omitempty" gorm:"primaryKey"`
	Email          string         `json:"email,omitempty" gorm:"unique;index"`
	Username       string         `json:"username,omitempty" gorm:"unique;index"`
	Password       string         `json:"-" gorm:"-"`
	PasswordHashed string         `json:"passwordHashed,omitempty"`
	Perms          UserPermission `json:"-" gorm:"embedded;embeddedPrefix:perm_"`
}

type UserPermission struct {
	IsAdmin bool `json:"isAdmin,omitempty"`
}

func (u *User) GenerateId() bool {
	u.Id = GenerateString(32)
	return u.Id != ""
}

func (u *User) GenerateUsername() bool {
	var parts = strings.Split(u.Email, "@")
	if len(parts) > 1 {
		u.Username = parts[0]
	}
	return len(u.Username) > 0
}

func (u *User) HashPassword() bool {
	if u.Password == "" {
		log.Err(fmt.Errorf("cannot hash nil password for user %s", u.Email)).Send()
		return false
	}

	a2 := argon.NewArgon2()
	encoded, err := a2.GenerateFromPassword(u.Password)
	if err != nil {
		log.Err(err).Send()
		return false
	}
	u.PasswordHashed = encoded
	return u.PasswordHashed != ""
}

func (u *User) CheckPassword() (matched bool) {
	a2 := argon.NewArgon2()
	match, err := a2.ComparePasswordAndHash(u.Password, u.PasswordHashed)
	if err != nil {
		log.Err(err).Send()
		return false
	}
	return match
}
