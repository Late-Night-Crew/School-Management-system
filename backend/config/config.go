package config

import (
	"fmt"
	"net"
	"time"

	_ "github.com/jackc/pgx/v4/stdlib"
	"github.com/jmoiron/sqlx"
)

type Config struct {
	Environment string                  `mapstructure:"environment" default:"DEVELOPMENT"`
	Server      HTTPServerConfiguration `mapstructure:"server"`
	Database    DatabaseConfiguration
	Logging     LoggingConfiguration `mapstructure:"logging"`
	Storage     StorageConfiguration `mapstructure:"storage"`
	Auth        AuthConfiguration    `mapstructure:"auth"`
}

type DatabaseConfiguration struct {
	Host               string
	Port               int
	Username           string
	Database           string
	Sslmode            string
	Password           string
	Name               string
	SetConnMaxLifetime int
}

type HTTPServerConfiguration struct {
	FQDN string `mapstructure:"fqdn" envconfig:"KWACHAKONVERTERS_SERVER_FQDN"`
	Host string `mapstructure:"host" envconfig:"KWACHAKONVERTERS_SERVER_HOST"`
	Port int    `mapstructure:"port" envconfig:"KWACHAKONVERTERS_SERVER_PORT"`
}

type AuthConfiguration struct {
	SignupEnabled           bool   `mapstructure:"signup_enabled" envconfig:"KWACHAKONVERTERS_AUTH_SIGNUP_ENABLED"`
	MaxLoginAttempts        int    `mapstructure:"max_login_attempts" envconfig:"KWACHAKONVERTERS_AUTH_MAX_LOGIN_ATTEMPTS"`
	RequireVerifiedAccounts bool   `mapstructure:"require_verified_accounts" envconfig:"KWACHAKONVERTERS_AUTH_REQUIRE_VERIFIED_ACCOUNTS"`
	JwtSecretKey            string `mapstructure:"jwt_secret_key" envconfig:"KWACHAKONVERTERS_AUTH_JWT_SECRET_KEY"`
	JwtIssuer               string `mapstructure:"jwt_issuer" envconfig:"KWACHAKONVERTERS_AUTH_JWT_ISSUER"`
	JwtExpiryTimeout        int    `mapstructure:"jwt_expiry_timeout" envconfig:"KWACHAKONVERTERS_AUTH_JWT_EXPIRY_TIMEOUT"`
}
type LoggingConfiguration struct {
	Level string `mapstructure:"log_level"`
	File  string `mapstructure:"log_file"`
}
type StorageConfiguration struct {
	Type         string             `mapstructure:"type"`
	LocalStorage LocalStorageConfig `mapstructure:"localStorage"`
}

type LocalStorageConfig struct {
	RootDirectory string `mapstructure:"rootDirectory"`
	Enabled       bool   `mapstructure:"enabled"`
}

func (c *Config) GetDatabaseURL() string {
	return fmt.Sprintf("postgres://%s:%s@%s:%d/%s?sslmode=%s", c.Database.Username, c.Database.Password, c.Database.Host, c.Database.Port, c.Database.Database, c.Database.Sslmode)
}
func (c *Config) ListenAddress() string {
	return net.JoinHostPort(c.Server.Host, fmt.Sprint(c.Server.Port))
}

func (c *Config) OpenDB() *sqlx.DB {
	db, err := sqlx.Open("pgx", c.GetDatabaseURL())
	if err != nil {
		panic(err)
	}

	// See "Important settings" section.
	db.SetConnMaxLifetime(time.Duration(c.Database.SetConnMaxLifetime * int(time.Second)))
	db.SetMaxOpenConns(10)
	db.SetMaxIdleConns(10)

	return db
}
