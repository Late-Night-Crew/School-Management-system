package api

import (
	"nsms/config"
	"nsms/database/dbsqlc"
	"nsms/logging"
	"nsms/services"

	"github.com/gofiber/fiber/v2"
)

type API struct {
	logger              logging.Logger
	app                 *fiber.App
	Config              *config.Config
	AuthService         services.AuthService
	RegionService       services.RegionService
	DistrictService     services.DistrictService
	SchoolService       services.SchoolService
	StudentService      services.StudentService
	AcademicYearService services.AcademicYearService
	TransferService     services.TransferService
	SchoolAdminService  services.SchoolAdminService
	SubjectService      services.SubjectService
	ReportService       services.ReportService
	RegionAdminService  services.RegionAdminService
	MarksService        services.MarksService
	CommsService        services.CommsService
	AccountService      services.AccountService
	ContactService      services.ContactService
	GradingService      services.GradingService
	SchoolRequests      services.SchoolRequestService
}

func NewAPI(config *config.Config) *API {
	sqlDB := config.OpenDB()
	dbConn := dbsqlc.New(sqlDB)
	logger := logging.NewFromConfig(&config.Logging)
	accountService := services.NewAccountService(dbConn, logger)

	return &API{
		logger:              logger,
		app:                 fiber.New(),
		Config:              config,
		AuthService:         services.NewAuthService(&config.Auth, dbConn, logger),
		RegionService:       services.NewRegionService(dbConn, logger),
		DistrictService:     services.NewDistrictService(dbConn, logger),
		SchoolService:       services.NewSchoolService(dbConn, logger),
		StudentService:      services.NewStudentService(dbConn, logger),
		AcademicYearService: services.NewAcademicYearService(dbConn, logger),
		TransferService:     services.NewTransferService(dbConn, logger),
		SchoolAdminService:  services.NewSchoolAdminService(dbConn, logger),
		SubjectService:      services.NewSubjectService(dbConn, logger),
		ReportService:       services.NewReportService(dbConn, logger),
		RegionAdminService:  services.NewRegionAdminService(dbConn, logger),
		MarksService:        services.NewMarksService(dbConn, logger),
		CommsService:        services.NewCommsService(dbConn, logger),
		AccountService:      accountService,
		ContactService:      services.NewContactService(dbConn, logger),
		GradingService:      services.NewGradingService(sqlDB.DB, dbConn, logger),
		SchoolRequests:      services.NewSchoolRequestService(dbConn, accountService, logger),
	}
}

func (api *API) registerRoutes() {
	api.middleware()
	api.routes()
	api.adminRoutes()
	api.SchoolRoutes()
	api.regionRoutes()
	api.commsRoutes()
	api.accountRoutes()
	api.schoolRequestRoutes()
}

// Start runs the Fiber server
func (api *API) Start(addr string) error {
	api.registerRoutes()

	if addr == "" {
		addr = ":1629"
	}

	return api.app.Listen(addr)
}
