package api

import (
	"github.com/gofiber/fiber/v2"
	"nsms/config"
	"nsms/database/dbsqlc"
	"nsms/logging"
	"nsms/services"
)

type API struct {
	logger        logging.Logger
	app           *fiber.App
	Config        *config.Config
	AuthService   services.AuthService
	RegionService services.RegionService
	DistrictService services.DistrictService
	SchoolService services.SchoolService
	StudentService services.StudentService
}

func NewAPI(config *config.Config) *API {
	dbConn := dbsqlc.New(config.OpenDB())
	logger := logging.NewFromConfig(&config.Logging)

	return &API{
		logger:      logger,
		app:         fiber.New(),
		Config:      config,
		AuthService: services.NewAuthService(&config.Auth, dbConn, logger),
		RegionService: services.NewRegionService(dbConn, logger),
		DistrictService: services.NewDistrictService(dbConn, logger),
		SchoolService: services.NewSchoolService(dbConn, logger),
		StudentService: services.NewStudentService(dbConn, logger),
	}
}

func (api *API) registerRoutes() {
	api.middleware()
	api.routes()
	api.adminRoutes()
}

// Start runs the Fiber server
func (api *API) Start(addr string) error {
	api.registerRoutes()
	if addr == "" {
		addr = ":1629" 
	}
	return api.app.Listen(addr)
}
