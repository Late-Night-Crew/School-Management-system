package cmd

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"net/mail"
	"strings"

	"github.com/jmoiron/sqlx"
	"github.com/spf13/cobra"

	"nsms/services"
)

// Account tools for running a deployment: creating the first super admin (there is no
// sign-up), and recovering an account nobody in the app can reset, such as the super
// admin's. Both print a temporary password that must be changed at first sign-in.

var adminName, adminEmail, resetEmail string

var createAdminCmd = &cobra.Command{
	Use:          "create-admin",
	Short:        "Create a super admin (Learner Support Manager) account",
	SilenceUsage: true,
	Long: `Creates the super admin with a temporary password, printed once. They must change
it when they first sign in. Use this to set up a new deployment instead of "nsms seed".
The system has a single super admin.

  nsms create-admin --name "Jane Phiri" --email jane.phiri@mcde.ac.mw`,
	RunE: func(cmd *cobra.Command, args []string) error {
		name := strings.TrimSpace(adminName)
		email, err := checkEmail(adminEmail)
		if err != nil {
			return err
		}
		if name == "" {
			return errors.New("--name is required")
		}
		dbConn := nsmsConfig.OpenDB()
		defer dbConn.Close()
		password, err := createSuperAdmin(cmd.Context(), dbConn, name, email)
		if err != nil {
			return err
		}
		fmt.Printf("Super admin created: %s <%s>\nTemporary password: %s\nIt is shown only once and must be changed at first sign-in.\n", name, email, password)
		return nil
	},
}

var resetPasswordCmd = &cobra.Command{
	Use:          "reset-password",
	Short:        "Give any account a new temporary password",
	SilenceUsage: true,
	Long: `Sets a new temporary password for the account with this email, printed once, and
makes them change it at sign-in. In the app, super admins reset division officers and
division officers reset school users; this covers everyone else, including super admins.

  nsms reset-password --email jane.phiri@mcde.ac.mw`,
	RunE: func(cmd *cobra.Command, args []string) error {
		email, err := checkEmail(resetEmail)
		if err != nil {
			return err
		}
		dbConn := nsmsConfig.OpenDB()
		defer dbConn.Close()
		password, err := resetAccountPassword(cmd.Context(), dbConn, email)
		if err != nil {
			return err
		}
		fmt.Printf("New temporary password for %s: %s\nIt is shown only once and must be changed at sign-in.\n", email, password)
		return nil
	},
}

func init() {
	createAdminCmd.Flags().StringVar(&adminName, "name", "", "the super admin's full name")
	createAdminCmd.Flags().StringVar(&adminEmail, "email", "", "the email they sign in with")
	resetPasswordCmd.Flags().StringVar(&resetEmail, "email", "", "the email of the account to reset")
	rootCmd.AddCommand(createAdminCmd, resetPasswordCmd)
}

func checkEmail(value string) (string, error) {
	email := strings.ToLower(strings.TrimSpace(value))
	if email == "" {
		return "", errors.New("--email is required")
	}
	if _, err := mail.ParseAddress(email); err != nil {
		return "", fmt.Errorf("%q is not a valid email address", value)
	}
	return email, nil
}

func createSuperAdmin(ctx context.Context, dbConn *sqlx.DB, name, email string) (string, error) {
	var taken int
	if err := dbConn.GetContext(ctx, &taken, `SELECT COUNT(*) FROM users WHERE lower(email) = $1`, email); err != nil {
		return "", fmt.Errorf("failed to check the email (did you run migrate?): %w", err)
	}
	if taken > 0 {
		return "", fmt.Errorf("%s already has an account; use reset-password if they cannot sign in", email)
	}
	// The database allows a single super admin
	var existing string
	err := dbConn.GetContext(ctx, &existing, `SELECT email FROM users WHERE role = 'SUPER_ADMIN' LIMIT 1`)
	if err == nil {
		return "", fmt.Errorf("a super admin already exists (%s) and only one is allowed; use reset-password if they cannot sign in", existing)
	}
	if !errors.Is(err, sql.ErrNoRows) {
		return "", fmt.Errorf("failed to check for a super admin: %w", err)
	}
	password, hash, err := services.NewTemporaryPassword()
	if err != nil {
		return "", err
	}
	// Created and audited in one statement, like accounts made in the app
	_, err = dbConn.ExecContext(ctx, `
		WITH created AS (
			INSERT INTO users (name, display_name, email, password, role, is_super_admin, is_activated, must_change_password)
			VALUES ($1, $1, $2, $3, 'SUPER_ADMIN', TRUE, TRUE, TRUE)
			RETURNING id
		)
		INSERT INTO audit_logs (entity_type, entity_id, action, note)
		SELECT 'user', created.id, 'Created', 'Super admin created with nsms create-admin' FROM created`,
		name, email, hash)
	if err != nil {
		return "", fmt.Errorf("failed to create the super admin: %w", err)
	}
	return password, nil
}

func resetAccountPassword(ctx context.Context, dbConn *sqlx.DB, email string) (string, error) {
	password, hash, err := services.NewTemporaryPassword()
	if err != nil {
		return "", err
	}
	var id int
	err = dbConn.GetContext(ctx, &id, `
		WITH reset AS (
			UPDATE users SET password = $2, must_change_password = TRUE, updated_at = CURRENT_TIMESTAMP
			WHERE lower(email) = $1 AND deleted_at IS NULL
			RETURNING id
		),
		logged AS (
			INSERT INTO audit_logs (entity_type, entity_id, action, note)
			SELECT 'user', reset.id, 'PasswordReset', 'Temporary password issued with nsms reset-password' FROM reset
		)
		SELECT id FROM reset`,
		email, hash)
	if errors.Is(err, sql.ErrNoRows) {
		return "", fmt.Errorf("no account found for %s", email)
	}
	if err != nil {
		return "", fmt.Errorf("failed to reset the password: %w", err)
	}
	return password, nil
}
