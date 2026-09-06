package database

import (
	"context"
	"errors"
	"time"

	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
	"gorm.io/gorm/logger"
	"gorm.io/gorm/utils"
)

type GormLogger struct {
	zl zerolog.Logger
	logger.Config
}

func NewGormLogger(config logger.Config) logger.Interface {
	var zl = log.Hook(zerolog.HookFunc(func(e *zerolog.Event, level zerolog.Level, message string) {
		e.Str("source", "_gorm")
	}))

	return &GormLogger{
		Config: config,
		zl:     zl,
	}
}

func (l *GormLogger) LogMode(lvl logger.LogLevel) logger.Interface {
	var newLogger = *l
	newLogger.LogLevel = lvl
	return &newLogger
}

func (l *GormLogger) Info(ctx context.Context, msg string, data ...interface{}) {
	if l.LogLevel >= logger.Info {
		l.zl.Info().Msg(msg)
	}
}

func (l *GormLogger) Warn(ctx context.Context, msg string, data ...interface{}) {
	if l.LogLevel >= logger.Warn {
		l.zl.Warn().Msg(msg)
	}
}

func (l *GormLogger) Error(ctx context.Context, msg string, data ...interface{}) {
	if l.LogLevel >= logger.Error {
		l.zl.Error().Msg(msg)
	}
}

func (l *GormLogger) Trace(ctx context.Context, begin time.Time, fc func() (sql string, rowsAffected int64), err error) {
	if l.LogLevel <= logger.Silent {
		return
	}

	elapsed := time.Since(begin)
	switch {
	case err != nil && l.LogLevel >= logger.Error && (!errors.Is(err, logger.ErrRecordNotFound) || !l.IgnoreRecordNotFoundError):
		sql, rows := fc()
		if rows == -1 {
			l.zl.Error().
				Str("query", sql).
				Int64("rows", rows).
				Str("duration", elapsed.String()).
				Msg("Database error")
		} else {
			l.zl.Error().
				Str("query", sql).
				Int64("rows", rows).
				Msg("Database error")
		}
	case elapsed > l.SlowThreshold && l.SlowThreshold != 0 && l.LogLevel >= logger.Warn:
		sql, rows := fc()
		if rows == -1 {
			l.zl.Warn().
				Str("query", sql).
				Str("called", utils.FileWithLineNum()).
				Str("duration", elapsed.String()).
				Str("threshold", l.SlowThreshold.String()).
				Msg("Slow SQL")
		} else {
			l.zl.Warn().
				Str("query", sql).
				Int64("rows", rows).
				Str("called", utils.FileWithLineNum()).
				Str("duration", elapsed.String()).
				Str("threshold", l.SlowThreshold.String()).
				Msg("Slow SQL")
		}
	case l.LogLevel == logger.Info:
		sql, rows := fc()
		if rows == -1 {
			l.zl.Trace().
				Str("query", sql).
				Str("duration", elapsed.String()).
				Str("called", utils.FileWithLineNum()).
				Send()
		} else {
			l.zl.Trace().
				Str("query", sql).
				Str("rows", utils.FileWithLineNum()).
				Str("duration", elapsed.String()).
				Str("called", utils.FileWithLineNum()).
				Send()
		}
	}
}

// ParamsFilter filter params
func (l *GormLogger) ParamsFilter(ctx context.Context, sql string, params ...interface{}) (string, []interface{}) {
	if l.ParameterizedQueries {
		return sql, nil
	}
	return sql, params
}
