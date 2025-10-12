package api

import (
	"github.com/gofiber/fiber/v2"
	"nsms/config"
	"nsms/database/dbsqlc"
	"nsms/logging"
	"nsms/services"
)

type API struct {
	logger                 logging.Logger
	app                    *fiber.App
	Config                 *config.Config
	AuthService            services.AuthService

}

func NewAPI(config *config.Config) *API {
	dbConn := dbsqlc.New(config.OpenDB())
	logger := logging.NewFromConfig(&config.Logging)


	return &API{
		logger:          logger,
		app:             fiber.New(),
		Config:          config,
		AuthService:     services.NewAuthService(&config.Auth, dbConn, logger),
	}
}

func (api *API) registerRoutes() {
	api.middleware()
	api.routes()
	// api.adminRoutes()
}

// Start runs the Fiber server
func (api *API) Start(addr string) error {
	api.registerRoutes()
	if addr == "" {
		addr = ":1629" // default fixed port
	}
	return api.app.Listen(addr)
}
