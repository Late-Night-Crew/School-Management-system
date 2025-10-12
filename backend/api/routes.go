package api

import (
	"nsms/api/admin"
	"github.com/gofiber/fiber/v2/middleware/limiter"
)
func (api *API) routes() {
	router := api.app
	rateLimiterMiddleware := limiter.New()

	router.Post("/login", rateLimiterMiddleware, admin.AuthLogin(api.AuthService))

}