package cmd

import (
	"github.com/spf13/cobra"
	"nsms/api"
)

// serverCmd represents the server command
var serverCmd = &cobra.Command{
	Use:   "server",
	Short: "Starts the National School management system server daemon",
	Long:  `Starts the NSMS server daemon`,
	RunE: func(cmd *cobra.Command, args []string) error {
		apiServer := api.NewAPI(nsmsConfig)
		return apiServer.Start(":8080") // fixed port 8080
	},
}

func init() {
	rootCmd.AddCommand(serverCmd)
}
