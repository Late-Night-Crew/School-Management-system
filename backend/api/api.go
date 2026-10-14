package api

import (
	"context"
	"time"

	"nsms/config"
	"nsms/database/dbsqlc"
	"nsms/logging"
	"nsms/services"

	"github.com/gofiber/fiber/v2"
)

type API struct {
	queries             *dbsqlc.Queries
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
	PasswordRequests    services.PasswordRequestService
	Promotions          services.PromotionService
	TermReports         services.TermReportService
	Reminders           services.ReminderService
	Audit               services.AuditService
	Insights            services.InsightsService
	LearnerSearch       services.LearnerSearchService
}

func NewAPI(config *config.Config) *API {
	sqlDB := config.OpenDB()
	dbConn := dbsqlc.New(sqlDB)
	logger := logging.NewFromConfig(&config.Logging)
	accountService := services.NewAccountService(dbConn, logger)
	promotionService := services.NewPromotionService(sqlDB.DB, dbConn, logger)
	termReports := services.NewTermReportService(dbConn, promotionService, logger)

	return &API{
		queries:             dbConn,
		logger:              logger,
		app:                 fiber.New(fiberConfig(config)),
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
		MarksService:        services.NewMarksService(sqlDB.DB, dbConn, logger),
		CommsService:        services.NewCommsService(dbConn, logger),
		AccountService:      accountService,
		ContactService:      services.NewContactService(dbConn, logger),
		GradingService:      services.NewGradingService(sqlDB.DB, dbConn, logger),
		SchoolRequests:      services.NewSchoolRequestService(dbConn, accountService, logger),
		PasswordRequests:    services.NewPasswordRequestService(dbConn, accountService, logger),
		Promotions:          promotionService,
		TermReports:         termReports,
		Reminders:           services.NewReminderService(sqlDB.DB, dbConn, promotionService, logger),
		Audit:               services.NewAuditService(dbConn),
		Insights:            services.NewInsightsService(dbConn, termReports),
		LearnerSearch:       services.NewLearnerSearchService(dbConn),
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

	go api.sendRemindersHourly()
	return api.app.Listen(addr)
}

// sendRemindersHourly runs the term reminder check when the server starts and then
// every hour. Each reminder is sent once, so running it often is safe; it just means
// a reminder goes out soon after its day starts in Malawi.
func (api *API) sendRemindersHourly() {
	check := func() {
		// Year statuses first: they follow the dates
		if err := services.SyncAcademicYearStatuses(context.Background(), api.queries); err != nil {
			api.logger.Error("academic-years", "status update failed", "error", err)
		}
		run, err := api.Reminders.SendDue(context.Background(), services.TodayInMalawi())
		if err != nil {
			api.logger.Error("reminders", "term reminder check failed", "error", err)
			return
		}
		if len(run.Sent) > 0 || len(run.Failures) > 0 {
			api.logger.Info("reminders", "term reminders sent", "sent", run.Sent, "failures", run.Failures)
		}
	}
	check()
	for range time.Tick(time.Hour) {
		check()
	}
}

// fiberConfig trusts X-Forwarded-For only from the configured reverse proxies, so
// c.IP() (and the login rate limit) sees the real client behind the main website's
// proxy without letting anyone else spoof their address.
func fiberConfig(config *config.Config) fiber.Config {
	if len(config.Server.TrustedProxies) == 0 {
		return fiber.Config{}
	}
	return fiber.Config{
		ProxyHeader:             fiber.HeaderXForwardedFor,
		EnableTrustedProxyCheck: true,
		TrustedProxies:          config.Server.TrustedProxies,
		EnableIPValidation:      true,
	}
}
