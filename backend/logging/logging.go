package logging

import (
	"fmt"
	"io"
	"log/slog"
	"os"
	"path/filepath"
	"strings"

	"nsms/config"
	"nsms/logging/loggedmodule"
)

type Logger interface {
	Debug(component loggedmodule.Name, msg string, args ...any)
	Info(component loggedmodule.Name, msg string, args ...any)
	Error(component loggedmodule.Name, msg string, args ...any)
}

type slogLogger struct {
	logger *slog.Logger
}

// Debug implements Logger
func (l *slogLogger) Debug(component loggedmodule.Name, msg string, args ...any) {
	if args == nil {
		l.logger.Debug(msg, "component", component)
		return
	}

	newargs := append(args, "component", component)
	l.logger.Debug(msg, newargs...)
}

// Error implements Logger.
func (l *slogLogger) Error(component loggedmodule.Name, msg string, args ...any) {
	if args == nil {
		l.logger.Error(msg, "component", component)
		return
	}
	newargs := append(args, "component", component)
	l.logger.Error(msg, newargs...)
}

// Info implements Logger.
func (l *slogLogger) Info(component loggedmodule.Name, msg string, args ...any) {
	if args == nil {
		l.logger.Info(msg, "component", component)
		return
	}
	newargs := append(args, "component", component)
	l.logger.Info(msg, newargs...)
}

func NewFromConfig(loggingConfig *config.LoggingConfiguration) Logger {
	return &slogLogger{
		logger: CreateLogger(loggingConfig),
	}
}

func GetLoggingLevel(lc *config.LoggingConfiguration) slog.Level {
	switch strings.ToLower(strings.TrimSpace(lc.Level)) {
	case "info":
		return slog.LevelInfo
	case "trace":
		return slog.LevelDebug
	case "debug":
		return slog.LevelDebug
	case "warn":
		return slog.LevelWarn
	case "error":
		return slog.LevelError
	default:
		return slog.LevelDebug
	}
}

func CreateLogger(lc *config.LoggingConfiguration) *slog.Logger {
    if lc.File == "" {
        panic("logging configuration: File path is empty")
    }

    absFile, err := filepath.Abs(lc.File)
    if err != nil {
        panic(fmt.Errorf("failed to resolve log file path: %w", err))
    }

    dir := filepath.Dir(absFile)
    if err := os.MkdirAll(dir, 0o750); err != nil {
        panic(fmt.Errorf("failed to create log directory: %w", err))
    }

    logFile, err := os.OpenFile(absFile, os.O_RDWR|os.O_CREATE|os.O_APPEND, 0o640)
    if err != nil {
        panic(fmt.Errorf("failed to setup logfile: %w", err))
    }

    return slog.New(slog.NewJSONHandler(
        io.MultiWriter(os.Stdout, logFile),
        &slog.HandlerOptions{Level: GetLoggingLevel(lc)},
    ))
}
