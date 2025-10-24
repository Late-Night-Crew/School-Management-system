package api

import (
	"github.com/gofiber/fiber/v2/middleware/limiter"
	"nsms/api/admin"
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
}
