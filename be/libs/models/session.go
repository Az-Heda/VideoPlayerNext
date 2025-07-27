package models

import (
	"time"

	"github.com/rs/zerolog/log"
	"gorm.io/gorm"
)

type Session struct {
	Id        string        `json:"id,omitempty" gorm:"primaryKey"`
	UserId    string        `json:"userId,omitempty"`
	CreatedAt time.Time     `json:"createdAt"`
	Lifespan  time.Duration `json:"lifespan,omitempty"`
}

func (s *Session) CleanupPreviusUserSessions(conn *gorm.DB) {
	if s.UserId == "" {
		log.Error().Msg("Cannot cleanup session of empty user")
		return
	}
	var sessions []Session

	if tx := conn.Find(&sessions, Session{UserId: s.UserId}); tx.Error != nil {
		log.Err(tx.Error).Send()
		return
	}

	for _, s := range sessions {
		conn.Delete(&s)
	}
}

func NewSession(usr *User, lifespan time.Duration) Session {
	if usr.Id == "" {
		usr.GenerateId()
	}

	return Session{
		Id:        GenerateString(32),
		UserId:    usr.Id,
		CreatedAt: time.Now(),
		Lifespan:  lifespan,
	}
}
