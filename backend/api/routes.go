package api

import (
	"nsms/api/admin"
	"nsms/api/school"

	"github.com/gofiber/fiber/v2/middleware/limiter"
)

func (api *API) routes() {
	router := api.app
	rateLimiterMiddleware := limiter.New()

	router.Post("/login", rateLimiterMiddleware, admin.AuthLogin(api.AuthService))

}

func (api *API) adminRoutes() {

	// Protected admin routes
	adminApi := api.app.Group("/admin", RequireAuthentication([]byte(api.Config.Auth.JwtSecretKey)))

	authenticationMiddleware := RequireAuthentication([]byte(api.Config.Auth.JwtSecretKey))

	adminApi.Get("/regions", authenticationMiddleware, admin.GetRegionList(api.RegionService, api.logger))
	adminApi.Get("/regions/:id", authenticationMiddleware, admin.GetRegionByID(api.RegionService, api.logger))
	adminApi.Post("/regions", authenticationMiddleware, admin.CreateRegion(api.RegionService, api.logger))
	adminApi.Put("/regions/:id", authenticationMiddleware, admin.UpdateRegion(api.RegionService, api.logger))
	adminApi.Delete("/regions/:id", authenticationMiddleware, admin.DeleteRegion(api.RegionService, api.logger))

	adminApi.Get("/districts", authenticationMiddleware, admin.GetDistrictList(api.DistrictService, api.logger))
	adminApi.Get("/districts/:id", authenticationMiddleware, admin.GetDistrictByID(api.DistrictService, api.logger))
	adminApi.Post("/districts", authenticationMiddleware, admin.CreateDistrict(api.DistrictService, api.logger))
	adminApi.Put("/districts/:id", authenticationMiddleware, admin.UpdateDistrict(api.DistrictService, api.logger))
	adminApi.Delete("/districts/:id", authenticationMiddleware, admin.DeleteDistrict(api.DistrictService, api.logger))

	adminApi.Get("/schools", authenticationMiddleware, admin.GetSchoolList(api.SchoolService, api.logger))
	adminApi.Get("/schools/:id", authenticationMiddleware, admin.GetSchoolByID(api.SchoolService, api.logger))
	adminApi.Post("/schools", authenticationMiddleware, admin.CreateSchool(api.SchoolService, api.logger))
	adminApi.Put("/schools/:id", authenticationMiddleware, admin.UpdateSchool(api.SchoolService, api.logger))
	adminApi.Delete("/schools/:id", authenticationMiddleware, admin.DeleteSchool(api.SchoolService, api.logger))

	adminApi.Get("/students", authenticationMiddleware, admin.GetStudentList(api.StudentService, api.logger))
	adminApi.Get("/students/:id", authenticationMiddleware, admin.GetStudentByID(api.StudentService, api.logger))
	adminApi.Post("/students", authenticationMiddleware, admin.CreateStudent(api.StudentService, api.logger))
	adminApi.Put("/students/:id", authenticationMiddleware, admin.UpdateStudent(api.StudentService, api.logger))
	adminApi.Delete("/students/:id", authenticationMiddleware, admin.DeleteStudent(api.StudentService, api.logger))

	adminApi.Get("/academic_years", authenticationMiddleware, admin.GetAcademicYearList(api.AcademicYearService, api.logger))
	adminApi.Get("/academic_years/:id", authenticationMiddleware, admin.GetAcademicYearByID(api.AcademicYearService, api.logger))
	adminApi.Post("/academic_years", authenticationMiddleware, admin.CreateAcademicYear(api.AcademicYearService, api.logger))
	adminApi.Put("/academic_years/:id", authenticationMiddleware, admin.UpdateAcademicYear(api.AcademicYearService, api.logger))
	adminApi.Delete("/academic_years/:id", authenticationMiddleware, admin.DeleteAcademicYear(api.AcademicYearService, api.logger))

	// TODO IMPLEMENT ADMIN LEVEL TRANSFER ACTIONS
	// adminApi.Get("/transfers", authenticationMiddleware, admin.GetTransferList(api.TransferService, api.logger))

}

func (api *API) SchoolRoutes() {
	authenticationMiddleware := RequireAuthentication([]byte(api.Config.Auth.JwtSecretKey))

	schoolAdminApi := api.app.Group("/school/:school_id", RequireAuthentication([]byte(api.Config.Auth.JwtSecretKey)))

	// School admin student management
	schoolAdminApi.Get("/dashboard", authenticationMiddleware, school.GetSchoolDashboard(api.SchoolAdminService, api.logger))
	schoolAdminApi.Get("/students", authenticationMiddleware, school.GetStudentsForSchool(api.SchoolAdminService, api.logger))
	schoolAdminApi.Get("/students/:id", authenticationMiddleware, school.GetStudentByIDForSchool(api.SchoolAdminService, api.logger))
	schoolAdminApi.Post("/students", authenticationMiddleware, school.CreateStudentForSchool(api.SchoolAdminService, api.logger))
	schoolAdminApi.Put("/students/:id", authenticationMiddleware, school.UpdateStudentForSchool(api.SchoolAdminService, api.logger))
	schoolAdminApi.Delete("/students/:id", authenticationMiddleware, school.DeleteStudentForSchool(api.SchoolAdminService, api.logger))

	// School admin exam results and reports
	schoolAdminApi.Get("/exam_results", authenticationMiddleware, school.ListExamResultsForSchool(api.SchoolAdminService, api.logger))
	schoolAdminApi.Get("/exam_results/:academic_year_id", authenticationMiddleware, school.GetExamResultForSchoolByAcademicYear(api.SchoolAdminService, api.logger))
	schoolAdminApi.Post("/exam_results", authenticationMiddleware, school.CreateExamResultForSchool(api.SchoolAdminService, api.logger))
	schoolAdminApi.Put("/exam_results/:id", authenticationMiddleware, school.UpdateExamResultForSchool(api.SchoolAdminService, api.logger))

	// School admin transfer management (scoped to school_id)
	schoolAdminApi.Post("/transfers", authenticationMiddleware, school.CreateTransferRequest(api.TransferService, api.logger))
	schoolAdminApi.Get("/transfers/incoming", authenticationMiddleware, school.GetIncomingTransfers(api.TransferService, api.logger))
	schoolAdminApi.Get("/transfers/outgoing", authenticationMiddleware, school.GetOutgoingTransfers(api.TransferService, api.logger))
	schoolAdminApi.Get("/transfers/:id", authenticationMiddleware, school.GetTransferByID(api.TransferService, api.logger))
	schoolAdminApi.Put("/transfers/:id/approve", authenticationMiddleware, school.ApproveTransfer(api.TransferService, api.logger))
	schoolAdminApi.Patch("/transfers/:id/finalize", authenticationMiddleware, school.FinalizeTransfer(api.TransferService, api.logger))
	schoolAdminApi.Patch("/transfers/:id/reject", authenticationMiddleware, school.RejectTransfer(api.TransferService, api.logger))
}
