package api

import (
	"nsms/api/accounts"
	"nsms/api/admin"
	"nsms/api/comms"
	"nsms/api/region"
	"nsms/api/school"
	"nsms/schema"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/limiter"
)

func (api *API) routes() {
	router := api.app
	rateLimiterMiddleware := limiter.New()

	router.Post("/login", rateLimiterMiddleware, admin.AuthLogin(api.AuthService))

}

// authenticated checks the token and that the account is still active (see
// RequireAuthentication).
func (api *API) authenticated() fiber.Handler {
	return RequireAuthentication([]byte(api.Config.Auth.JwtSecretKey), api.AccountService)
}

func (api *API) adminRoutes() {
	// Every /admin route needs a valid token. Reference data that the school screens
	// also use (regions, districts, schools, academic years, subjects) can be read by
	// any role; everything else is restricted to super admins.
	adminApi := api.app.Group("/admin", api.authenticated())

	superAdmin := RequireRole(schema.RoleSuperAdmin)

	adminApi.Get("/regions", admin.GetRegionList(api.RegionService, api.logger))
	adminApi.Get("/regions/:id", admin.GetRegionByID(api.RegionService, api.logger))
	adminApi.Post("/regions", superAdmin, admin.CreateRegion(api.RegionService, api.logger))
	adminApi.Put("/regions/:id", superAdmin, admin.UpdateRegion(api.RegionService, api.logger))
	adminApi.Delete("/regions/:id", superAdmin, admin.DeleteRegion(api.RegionService, api.logger))
	adminApi.Get("/regions/:id/usage", superAdmin, admin.GetRegionUsage(api.RegionService, api.logger))
	adminApi.Post("/regions/:id/move_districts", superAdmin, admin.MoveRegionDistricts(api.RegionService, api.logger))

	adminApi.Get("/districts", admin.GetDistrictList(api.DistrictService, api.logger))
	adminApi.Get("/districts/:id", admin.GetDistrictByID(api.DistrictService, api.logger))
	adminApi.Post("/districts", superAdmin, admin.CreateDistrict(api.DistrictService, api.logger))
	adminApi.Put("/districts/:id", superAdmin, admin.UpdateDistrict(api.DistrictService, api.logger))
	adminApi.Delete("/districts/:id", superAdmin, admin.DeleteDistrict(api.DistrictService, api.logger))
	adminApi.Get("/districts/:id/usage", superAdmin, admin.GetDistrictUsage(api.DistrictService, api.logger))
	adminApi.Post("/districts/:id/move_schools", superAdmin, admin.MoveDistrictSchools(api.DistrictService, api.logger))

	adminApi.Get("/schools", admin.GetSchoolList(api.SchoolService, api.logger))
	adminApi.Get("/schools/:id", admin.GetSchoolByID(api.SchoolService, api.logger))
	adminApi.Post("/schools", superAdmin, admin.CreateSchool(api.SchoolService, api.logger))
	adminApi.Put("/schools/:id", superAdmin, admin.UpdateSchool(api.SchoolService, api.logger))
	adminApi.Delete("/schools/:id", superAdmin, admin.DeleteSchool(api.SchoolService, api.logger))
	adminApi.Get("/schools/:id/usage", superAdmin, admin.GetSchoolUsage(api.SchoolService, api.logger))
	adminApi.Post("/schools/:id/close", superAdmin, admin.CloseSchool(api.SchoolService, api.logger))
	adminApi.Post("/schools/:id/reopen", superAdmin, admin.ReopenSchool(api.SchoolService, api.logger))
	adminApi.Post("/schools/:id/transfer_students", superAdmin, admin.TransferAllStudents(api.SchoolService, api.logger))

	adminApi.Get("/students", superAdmin, admin.GetStudentList(api.StudentService, api.logger))
	adminApi.Get("/students/:id", superAdmin, admin.GetStudentByID(api.StudentService, api.logger))
	adminApi.Post("/students", superAdmin, admin.CreateStudent(api.StudentService, api.logger))
	adminApi.Put("/students/:id", superAdmin, admin.UpdateStudent(api.StudentService, api.logger))
	adminApi.Delete("/students/:id", superAdmin, admin.DeleteStudent(api.StudentService, api.logger))

	adminApi.Get("/academic_years", admin.GetAcademicYearList(api.AcademicYearService, api.logger))
	adminApi.Get("/academic_years/:id", admin.GetAcademicYearByID(api.AcademicYearService, api.logger))
	adminApi.Post("/academic_years", superAdmin, admin.CreateAcademicYear(api.AcademicYearService, api.logger))
	adminApi.Put("/academic_years/:id", superAdmin, admin.UpdateAcademicYear(api.AcademicYearService, api.logger))
	adminApi.Delete("/academic_years/:id", superAdmin, admin.DeleteAcademicYear(api.AcademicYearService, api.logger))

	adminApi.Get("/subjects", admin.GetSubjectList(api.SubjectService, api.logger))
	adminApi.Get("/subjects/:id", admin.GetSubjectByID(api.SubjectService, api.logger))
	adminApi.Post("/subjects", superAdmin, admin.CreateSubject(api.SubjectService, api.logger))
	adminApi.Put("/subjects/:id", superAdmin, admin.UpdateSubject(api.SubjectService, api.logger))
	adminApi.Delete("/subjects/:id", superAdmin, admin.DeleteSubject(api.SubjectService, api.logger))

	// The grading scale is read by every role (marks, reports) and set by super admins
	adminApi.Get("/grading_scale", admin.GetGradingScale(api.GradingService, api.logger))
	adminApi.Put("/grading_scale", superAdmin, admin.SaveGradingScale(api.GradingService, api.logger))

	adminApi.Post("/transfers", superAdmin, admin.CreateTransfer(api.TransferService, api.logger))
	adminApi.Get("/transfers", superAdmin, admin.ListTransferHistory(api.TransferService, api.logger))
	adminApi.Get("/transfers/export", superAdmin, admin.ExportTransferHistory(api.TransferService, api.logger))
	adminApi.Get("/transfers/:id", superAdmin, admin.GetTransferByID(api.TransferService, api.logger))
	adminApi.Get("/transfers/:id/audit", superAdmin, admin.GetTransferAuditLog(api.TransferService, api.logger))
	adminApi.Put("/transfers/:id/approve", superAdmin, admin.ApproveTransfer(api.TransferService, api.logger))
	adminApi.Patch("/transfers/:id/finalize", superAdmin, admin.FinalizeTransfer(api.TransferService, api.logger))
	adminApi.Patch("/transfers/:id/reject", superAdmin, admin.RejectTransfer(api.TransferService, api.logger))

	adminApi.Get("/reports/schools", superAdmin, admin.GetSchoolReport(api.ReportService, api.logger))
}

func (api *API) SchoolRoutes() {
	// School routes are only for the school manager of that school.
	schoolAdminApi := api.app.Group("/school/:school_id", api.authenticated())
	schoolAccess := RequireSchoolAccess()

	// School admin student management
	schoolAdminApi.Get("/dashboard", schoolAccess, school.GetSchoolDashboard(api.SchoolAdminService, api.logger))
	schoolAdminApi.Get("/students", schoolAccess, school.GetStudentsForSchool(api.SchoolAdminService, api.logger))
	schoolAdminApi.Get("/students/:id", schoolAccess, school.GetStudentByIDForSchool(api.SchoolAdminService, api.logger))
	schoolAdminApi.Post("/students", schoolAccess, school.CreateStudentForSchool(api.SchoolAdminService, api.logger))
	schoolAdminApi.Put("/students/:id", schoolAccess, school.UpdateStudentForSchool(api.SchoolAdminService, api.logger))
	schoolAdminApi.Delete("/students/:id", schoolAccess, school.DeleteStudentForSchool(api.SchoolAdminService, api.logger))

	// School admin exam results and reports
	schoolAdminApi.Get("/exam_results", schoolAccess, school.ListExamResultsForSchool(api.SchoolAdminService, api.logger))
	schoolAdminApi.Get("/exam_results/:academic_year_id", schoolAccess, school.GetExamResultForSchoolByAcademicYear(api.SchoolAdminService, api.logger))
	schoolAdminApi.Post("/exam_results", schoolAccess, school.CreateExamResultForSchool(api.SchoolAdminService, api.logger))
	schoolAdminApi.Put("/exam_results/:id", schoolAccess, school.UpdateExamResultForSchool(api.SchoolAdminService, api.logger))

	// Per-student, per-subject marks
	schoolAdminApi.Get("/marks", schoolAccess, school.ListMarks(api.MarksService, api.logger))
	schoolAdminApi.Put("/marks", schoolAccess, school.SaveMarks(api.MarksService, api.logger))

	// School admin transfer management (scoped to school_id)
	schoolAdminApi.Post("/transfers", schoolAccess, school.CreateTransferRequest(api.TransferService, api.logger))
	schoolAdminApi.Get("/transfers/incoming", schoolAccess, school.GetIncomingTransfers(api.TransferService, api.logger))
	schoolAdminApi.Get("/transfers/outgoing", schoolAccess, school.GetOutgoingTransfers(api.TransferService, api.logger))
	schoolAdminApi.Get("/transfers/:id", schoolAccess, school.GetTransferByID(api.TransferService, api.logger))
	schoolAdminApi.Put("/transfers/:id/approve", schoolAccess, school.ApproveTransfer(api.TransferService, api.logger))
	schoolAdminApi.Patch("/transfers/:id/finalize", schoolAccess, school.FinalizeTransfer(api.TransferService, api.logger))
	schoolAdminApi.Patch("/transfers/:id/reject", schoolAccess, school.RejectTransfer(api.TransferService, api.logger))
}

func (api *API) regionRoutes() {
	// Read-only region views, only for the regional admin of that region.
	regionApi := api.app.Group("/region/:region_id", api.authenticated())
	regionAccess := RequireRegionAccess()

	regionApi.Get("/dashboard", regionAccess, region.GetDashboard(api.RegionAdminService, api.logger))
	regionApi.Get("/districts", regionAccess, region.ListDistricts(api.RegionAdminService, api.logger))
	regionApi.Get("/schools", regionAccess, region.ListSchools(api.ReportService, api.logger))
	regionApi.Get("/students", regionAccess, region.ListStudents(api.RegionAdminService, api.logger))
	regionApi.Get("/transfers", regionAccess, region.ListTransfers(api.RegionAdminService, api.logger))
}

func (api *API) commsRoutes() {
	// Notices and conversations for every role. The caller's party (ministry, regional
	// office or school) comes from their token; the service enforces who may reach whom.
	commsApi := api.app.Group("/comms", api.authenticated())
	senders := RequireRole(schema.RoleSuperAdmin, schema.RoleRegionalAdmin)
	superAdmin := RequireRole(schema.RoleSuperAdmin)
	service := api.CommsService

	commsApi.Get("/summary", comms.GetSummary(service, api.logger))

	commsApi.Get("/notices/inbox", comms.ListInbox(service, api.logger))
	commsApi.Post("/notices/:id/read", comms.MarkNoticeRead(service, api.logger))
	commsApi.Post("/notices/:id/done", comms.MarkNoticeDone(service, api.logger))
	commsApi.Get("/notices/sent", senders, comms.ListSent(service, api.logger))
	commsApi.Get("/notices/audience", senders, comms.PreviewAudience(service, api.logger))
	commsApi.Post("/notices", senders, comms.SendNotice(service, api.logger))
	commsApi.Get("/notices/:id/recipients", senders, comms.ListRecipients(service, api.logger))
	commsApi.Post("/notices/:id/remind", senders, comms.RemindPending(service, api.logger))
	commsApi.Post("/notices/:id/withdraw", senders, comms.WithdrawNotice(service, api.logger))

	commsApi.Get("/contacts", comms.ListContacts(service, api.logger))
	commsApi.Get("/conversations", comms.ListConversations(service, api.logger))
	commsApi.Get("/conversations/reported", superAdmin, comms.ListReportedConversations(service, api.logger))
	commsApi.Post("/conversations", comms.StartConversation(service, api.logger))
	commsApi.Get("/conversations/:id", comms.GetConversation(service, api.logger))
	commsApi.Post("/conversations/:id/messages", comms.SendMessage(service, api.logger))
	commsApi.Post("/conversations/:id/report", comms.ReportConversation(service, api.logger))
}

func (api *API) accountRoutes() {
	// The signed-in user's own account. These two are the only routes allowed while
	// the account still has a temporary password.
	accountApi := api.app.Group("/account", api.authenticated())
	accountApi.Get("/me", accounts.GetOwnAccount(api.AccountService, api.logger))
	accountApi.Put("/me/contact", accounts.UpdateOwnContact(api.AccountService, api.logger))
	accountApi.Post("/password", accounts.ChangeOwnPassword(api.AccountService, api.logger))

	// Managing other accounts: the super admin manages regional admins and school
	// managers; a regional admin manages the school managers in their region.
	managers := RequireRole(schema.RoleSuperAdmin, schema.RoleRegionalAdmin)
	accountsApi := api.app.Group("/accounts", api.authenticated(), managers)
	accountsApi.Get("", accounts.ListAccounts(api.AccountService, api.logger))
	accountsApi.Post("", accounts.CreateAccount(api.AccountService, api.logger))
	accountsApi.Put("/:id", accounts.UpdateAccount(api.AccountService, api.logger))
	accountsApi.Post("/:id/deactivate", accounts.SetAccountActive(api.AccountService, api.logger, false))
	accountsApi.Post("/:id/activate", accounts.SetAccountActive(api.AccountService, api.logger, true))
	accountsApi.Post("/:id/reset-password", accounts.ResetPassword(api.AccountService, api.logger))

	// The contact directory for every role; who may edit what is checked by the service.
	contactsApi := api.app.Group("/contacts", api.authenticated())
	contactsApi.Get("/directory", accounts.GetDirectory(api.ContactService, api.logger))
	contactsApi.Put("/regions/:id/office", accounts.UpdateRegionOffice(api.ContactService, api.logger))
	contactsApi.Put("/schools/:id/office", accounts.UpdateSchoolOffice(api.ContactService, api.logger))
}
