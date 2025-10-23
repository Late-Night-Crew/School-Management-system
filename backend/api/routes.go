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
}
