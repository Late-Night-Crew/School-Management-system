package api

import (
	"github.com/gofiber/fiber/v2/middleware/limiter"
	"nsms/api/admin"
	"nsms/api/school"
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
	schoolAPi := api.app.Group("/school", RequireAuthentication([]byte(api.Config.Auth.JwtSecretKey)))

	authenticationMiddleware := RequireAuthentication([]byte(api.Config.Auth.JwtSecretKey))

	// 1. CREATE Transfer Request (POST)
    schoolAPi.Post("/transfers", authenticationMiddleware, school.CreateTransferRequest(api.TransferService, api.logger))

    // 2. GET SINGLE Transfer by Transfer ID (Dedicated Path)
    // This handles requests like /school/transfers/12
    schoolAPi.Get("/transfers/:id", authenticationMiddleware, school.GetTransferByID(api.TransferService, api.logger)) 

    // 3. GET LIST of Transfers by CONTEXT (Fixed Path Segment)
    // This handles requests like /school/transfers/incoming
    schoolAPi.Get("/transfers/incoming/:id", authenticationMiddleware, school.GetIncomingTransfers(api.TransferService, api.logger))

    // 4. GET LIST of Transfers by CONTEXT (Fixed Path Segment)
    // This handles requests like /school/transfers/outgoing
    // schoolAPi.Get("/transfers/outgoing", authenticationMiddleware, school.GetOutgoingTransfers(api.TransferService, api.logger))
    
    // 5. UPDATE Status (Approve)
    schoolAPi.Put("/transfers/:id/approve", authenticationMiddleware, school.ApproveTransfer(api.TransferService, api.logger))
	schoolAPi.Patch("/transfers/:id/finalize", authenticationMiddleware, school.FinalizeTransfer(api.TransferService, api.logger))

}
