package cmd

import (
	"os"

	"github.com/gofiber/fiber/v2/log"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
	"nsms/config"
)

var (
	cfgFile         string
	nsmsConfig   = &config.Config{}
)

// rootCmd is the base command
var rootCmd = &cobra.Command{
	Use:   "nsms",
	Short: "nsms Backend CLI",
	Run: func(cmd *cobra.Command, args []string) {
		os.Exit(1)
	},
}

func Execute() error {
	return rootCmd.Execute()
}

func init() {
	cobra.OnInitialize(initConfig)

	rootCmd.PersistentFlags().StringVar(&cfgFile, "config", "", "config file (default is ./config.yaml)")

	rootCmd.AddCommand(migrateCmd)
	// later: rootCmd.AddCommand(serverCmd)
}

func initConfig() {
	if cfgFile != "" {
		viper.SetConfigFile(cfgFile)
	} else {
		viper.SetConfigName("config")
		viper.SetConfigType("yaml")
		viper.AddConfigPath(".")
	}

	if err := viper.ReadInConfig(); err != nil {
		log.Error("Can't read config:", err)
		os.Exit(1)
	}

	if err := viper.Unmarshal(nsmsConfig); err != nil {
		log.Error("Can't unmarshal config:", err)
		os.Exit(1)
	}
}
