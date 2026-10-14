package cmd

import (
	"github.com/gofiber/fiber/v2/log"
	"github.com/spf13/cobra"
	"nsms/api"
)

// serverCmd represents the server command
var serverCmd = &cobra.Command{
	Use:   "server",
	Short: "Starts the National School management system server daemon",
	Long:  `Starts the NSMS server daemon`,
	RunE: func(cmd *cobra.Command, args []string) error {
		// Login tokens are signed with this secret; never run with an empty one
		generated, err := nsmsConfig.CheckAuth()
		if err != nil {
			return err
		}
		if generated {
			log.Warn("No JWT secret set (NSMS_JWT_SECRET); using a random one for this run. Everyone is signed out when the server restarts.")
		}
		apiServer := api.NewAPI(nsmsConfig)
		return apiServer.Start(":8080") // fixed port 8080
	},
}

func init() {
	rootCmd.AddCommand(serverCmd)
}
