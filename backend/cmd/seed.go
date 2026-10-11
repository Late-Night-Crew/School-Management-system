package cmd

import (
	"context"
	"database/sql"
	"fmt"
	"strings"

	"github.com/jmoiron/sqlx"
	"github.com/spf13/cobra"

	"nsms/common"
	"nsms/db"
	"nsms/schema"
)

const demoEmailDomain = "nsms.demo"

var seedPassword string

// seedCmd loads db/seeds/demo.sql plus one login per role, all in one transaction.
var seedCmd = &cobra.Command{
	Use:   "seed",
	Short: "Load the demo dataset and demo logins (development only)",
	// Errors here are data problems, not usage mistakes, so skip the help text
	SilenceUsage: true,
	Long: `Loads demo regions, districts, schools, academic years, students, marks,
exam pass rates and transfers, plus logins for every role:

  admin@` + demoEmailDomain + `                    super admin
  <region>.admin@` + demoEmailDomain + `           regional admin (northern, central, southern)
  manager.demo-001@` + demoEmailDomain + ` ... -012 school manager for each demo school

Run "nsms migrate" first. The command refuses to run if demo data already exists.
Do not run it against a production database.`,
	RunE: func(cmd *cobra.Command, args []string) error {
		if len(seedPassword) < 8 {
			return fmt.Errorf("--password must be at least 8 characters")
		}
		dbConn := nsmsConfig.OpenDB()
		defer dbConn.Close()
		return seedDemoData(cmd.Context(), dbConn, seedPassword)
	},
}

func init() {
	seedCmd.Flags().StringVar(&seedPassword, "password", "Demo@2026", "password for every demo login")
	rootCmd.AddCommand(seedCmd)
}

type demoUser struct {
	email, name, role string
	// SQL selecting (region_id, district_id, school_id) for the user; empty for none
	scopeQuery string
	scopeArg   string
}

func seedDemoData(ctx context.Context, dbConn *sqlx.DB, password string) error {
	var existing int
	if err := dbConn.GetContext(ctx, &existing, `SELECT COUNT(*) FROM schools WHERE school_number LIKE 'DEMO-%'`); err != nil {
		return fmt.Errorf("failed to check for existing demo data (did you run migrate?): %w", err)
	}
	if existing > 0 {
		return fmt.Errorf("demo data is already loaded (%d DEMO- schools found); nothing changed", existing)
	}

	demoSQL, err := db.SeedsFS.ReadFile("seeds/demo.sql")
	if err != nil {
		return err
	}
	passwordHash, err := common.HashPassword(password)
	if err != nil {
		return fmt.Errorf("failed to hash password: %w", err)
	}

	tx, err := dbConn.BeginTxx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback() //nolint:errcheck // no-op after a successful commit

	if _, err := tx.ExecContext(ctx, string(demoSQL)); err != nil {
		return fmt.Errorf("failed to load demo data: %w", err)
	}

	users := []demoUser{{email: "admin@" + demoEmailDomain, name: "Demo Super Admin", role: schema.RoleSuperAdmin}}
	for _, region := range []string{"Northern", "Central", "Southern"} {
		users = append(users, demoUser{
			email:      strings.ToLower(region) + ".admin@" + demoEmailDomain,
			name:       "Demo " + region + " Regional Admin",
			role:       schema.RoleRegionalAdmin,
			scopeQuery: `SELECT id, NULL::int, NULL::int FROM regions WHERE name = $1`,
			scopeArg:   region,
		})
	}
	var schoolNumbers []string
	if err := tx.SelectContext(ctx, &schoolNumbers, `SELECT school_number FROM schools WHERE school_number LIKE 'DEMO-%' ORDER BY school_number`); err != nil {
		return err
	}
	for _, number := range schoolNumbers {
		users = append(users, demoUser{
			email: "manager." + strings.ToLower(number) + "@" + demoEmailDomain,
			name:  "Demo Manager " + number,
			role:  schema.RoleSchoolManager,
			scopeQuery: `SELECT d.region_id, d.id, sc.id FROM schools sc
				JOIN districts d ON d.id = sc.district_id WHERE sc.school_number = $1`,
			scopeArg: number,
		})
	}

	var created, skipped []string
	for _, u := range users {
		var regionID, districtID, schoolID sql.NullInt32
		if u.scopeQuery != "" {
			if err := tx.QueryRowContext(ctx, u.scopeQuery, u.scopeArg).Scan(&regionID, &districtID, &schoolID); err != nil {
				return fmt.Errorf("failed to find scope for %s: %w", u.email, err)
			}
		}
		// DO NOTHING also covers the one-super-admin and one-admin-per-region indexes
		res, err := tx.ExecContext(ctx, `
			INSERT INTO users (name, display_name, email, password, role, region_id, district_id, school_id, is_super_admin, is_activated)
			VALUES ($1, $1, $2, $3, $4, $5, $6, $7, $8, TRUE)
			ON CONFLICT DO NOTHING`,
			u.name, u.email, passwordHash, u.role, regionID, districtID, schoolID, u.role == schema.RoleSuperAdmin)
		if err != nil {
			return fmt.Errorf("failed to create %s: %w", u.email, err)
		}
		if n, _ := res.RowsAffected(); n == 1 {
			created = append(created, fmt.Sprintf("  %-34s %s", u.email, u.role))
		} else {
			skipped = append(skipped, "  "+u.email)
		}
	}

	// The transfers' audit entries, notices, conversations and contacts use the demo users,
	// so they load after them
	for _, file := range []string{"seeds/demo_audit.sql", "seeds/demo_comms.sql", "seeds/demo_contacts.sql"} {
		extraSQL, err := db.SeedsFS.ReadFile(file)
		if err != nil {
			return err
		}
		if _, err := tx.ExecContext(ctx, string(extraSQL)); err != nil {
			return fmt.Errorf("failed to load %s: %w", file, err)
		}
	}

	if err := tx.Commit(); err != nil {
		return err
	}

	fmt.Println("Demo data loaded.")
	fmt.Printf("\nLogins created (password: %s):\n%s\n", password, strings.Join(created, "\n"))
	if len(skipped) > 0 {
		fmt.Printf("\nSkipped because the email or role slot is already taken (e.g. an existing super admin):\n%s\n",
			strings.Join(skipped, "\n"))
	}
	return nil
}
