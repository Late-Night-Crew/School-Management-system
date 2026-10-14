package cmd

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/spf13/cobra"

	"nsms/database/dbsqlc"
	"nsms/logging"
	"nsms/services"
)

var reminderDate string

// sendRemindersCmd runs the term reminder check once. The server already runs it
// every hour; this is for testing a date or running it from cron instead.
var sendRemindersCmd = &cobra.Command{
	Use:          "send-reminders",
	Short:        "Send the term reminders due today (or on --date)",
	SilenceUsage: true,
	RunE: func(cmd *cobra.Command, args []string) error {
		today := services.TodayInMalawi()
		if reminderDate != "" {
			parsed, err := time.Parse(time.DateOnly, reminderDate)
			if err != nil {
				return fmt.Errorf("--date must look like 2026-12-11: %w", err)
			}
			today = parsed
		}
		dbConn := nsmsConfig.OpenDB()
		defer dbConn.Close()
		queries := dbsqlc.New(dbConn)
		logger := logging.NewFromConfig(&nsmsConfig.Logging)
		reminders := services.NewReminderService(dbConn.DB, queries, services.NewPromotionService(dbConn.DB, queries, logger), logger)
		run, err := reminders.SendDue(cmd.Context(), today)
		if err != nil {
			return err
		}
		out, _ := json.MarshalIndent(run, "", "  ")
		fmt.Println(string(out))
		return nil
	},
}

func init() {
	sendRemindersCmd.Flags().StringVar(&reminderDate, "date", "", "pretend today is this date (YYYY-MM-DD), for testing")
	rootCmd.AddCommand(sendRemindersCmd)
}
