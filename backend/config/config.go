package config

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"net"
	"os"
	"strings"
	"time"

	_ "github.com/jackc/pgx/v4/stdlib"
	"github.com/jmoiron/sqlx"
)

type Config struct {
	// Environment is DEVELOPMENT (the default) or PRODUCTION
	Environment string                  `mapstructure:"environment"`
	Server      HTTPServerConfiguration `mapstructure:"server"`
	Database    DatabaseConfiguration
	Admin       AdminConfiguration   `mapstructure:"admin"`
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
	FQDN string `mapstructure:"fqdn"`
	Host string `mapstructure:"host"`
	Port int    `mapstructure:"port"`
	// TrustedProxies are the reverse proxies (IPs or CIDR ranges) in front of the API.
	// Requests from them are attributed to the client in X-Forwarded-For, so login
	// rate limits apply per user rather than to everyone behind the proxy.
	TrustedProxies []string `mapstructure:"trusted_proxies"`
}
type AdminConfiguration struct {
	Username string `mapstructure:"username"`
	Password string `mapstructure:"password"`
	Email    string `mapstructure:"email"`
	Enabled  bool   `mapstructure:"enabled"`
}

type AuthConfiguration struct {
	SignupEnabled           bool `mapstructure:"signup_enabled"`
	MaxLoginAttempts        int  `mapstructure:"max_login_attempts"`
	RequireVerifiedAccounts bool `mapstructure:"require_verified_accounts"`
	// JwtSecretKey signs login tokens. Set it with NSMS_JWT_SECRET rather than in the
	// file; see ApplyEnvironment and CheckAuth.
	JwtSecretKey     string `mapstructure:"jwt_secret_key"`
	JwtIssuer        string `mapstructure:"jwt_issuer"`
	JwtExpiryTimeout int    `mapstructure:"jwt_expiry_timeout"`
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

// MinJwtSecretLength is the shortest JWT secret accepted in production.
const MinJwtSecretLength = 32

// IsProduction reports whether the config is for a live deployment.
func (c *Config) IsProduction() bool {
	return strings.EqualFold(strings.TrimSpace(c.Environment), "PRODUCTION")
}

// ApplyEnvironment lets secrets come from environment variables instead of the
// config file: NSMS_JWT_SECRET, NSMS_DATABASE_PASSWORD and NSMS_ENVIRONMENT.
func (c *Config) ApplyEnvironment() {
	if v := os.Getenv("NSMS_ENVIRONMENT"); v != "" {
		c.Environment = v
	}
	if v := os.Getenv("NSMS_JWT_SECRET"); v != "" {
		c.Auth.JwtSecretKey = v
	}
	if v := os.Getenv("NSMS_DATABASE_PASSWORD"); v != "" {
		c.Database.Password = v
	}
}

// ErrWeakJwtSecret means production was started without a usable JWT secret.
var ErrWeakJwtSecret = errors.New("set a JWT secret of at least 32 characters in NSMS_JWT_SECRET (or auth.jwt_secret_key) before running in production")

// CheckAuth makes sure login tokens cannot be forged. In production the JWT secret
// must be set and long enough; in development a random one is generated if missing
// (everyone is signed out when the server restarts). It reports whether it generated one.
func (c *Config) CheckAuth() (generated bool, err error) {
	secret := strings.TrimSpace(c.Auth.JwtSecretKey)
	if c.IsProduction() {
		if len(secret) < MinJwtSecretLength {
			return false, ErrWeakJwtSecret
		}
		return false, nil
	}
	if secret != "" {
		return false, nil
	}
	buf := make([]byte, 32)
	if _, err := rand.Read(buf); err != nil {
		return false, fmt.Errorf("failed to generate a development JWT secret: %w", err)
	}
	c.Auth.JwtSecretKey = hex.EncodeToString(buf)
	return true, nil
}
