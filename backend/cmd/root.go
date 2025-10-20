package cmd

import (
	"fmt"
	"os"

	"github.com/gofiber/fiber/v2/log"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"

	"github.com/Joel12r/pgcheck"
	"nsms/config"
)

var (
	cfgFile     string
	nsmsConfig  = &config.Config{}
)

var rootCmd = &cobra.Command{
	Use:   "nsms",
	Short: "nsms Backend CLI",
	Run: func(cmd *cobra.Command, args []string) {
		checkPostgresVersion()
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

func checkPostgresVersion() {
	dbConf := nsmsConfig.Database 

	dsn := fmt.Sprintf(
		"postgres://%s:%s@%s:%d/%s?sslmode=%s",
		dbConf.Username,
		dbConf.Password,
		dbConf.Host,
		dbConf.Port,
		dbConf.Name,
		dbConf.Sslmode,
	)

	if err := pgcheck.CheckVersion(dsn, 18); err != nil {
		log.Errorf("❌ PostgreSQL version check failed: %v", err)
		os.Exit(1)
	}

	log.Info("✅ PostgreSQL version meets minimum requirement")
}
