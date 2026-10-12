package services

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"sort"
	"strings"

	"nsms/common"
	"nsms/database/dbsqlc"
	"nsms/logging"
	"nsms/schema"
)

// ErrInvalidGradingScale wraps the reason a grading scale was rejected; the message is
// safe to show to the user.
var ErrInvalidGradingScale = errors.New("invalid grading scale")

const auditEntityGradingScale = "grading_scale"

// GradingService reads and replaces the grading scale for subject marks.
type GradingService interface {
	GetGradingScale(ctx context.Context) (*schema.GradingScale, error)
	// SaveGradingScale replaces the whole scale. actorID is the super admin saving it.
	SaveGradingScale(ctx context.Context, actorID int64, req *schema.SaveGradingScaleRequest) (*schema.GradingScale, error)
}

type gradingService struct {
	db      *sql.DB
	queries *dbsqlc.Queries
	logger  logging.Logger
}

// NewGradingService needs the database handle as well as the queries, because the
// scale is replaced in a single transaction.
func NewGradingService(db *sql.DB, queries *dbsqlc.Queries, logger logging.Logger) GradingService {
	return &gradingService{
		db:      db,
		queries: queries,
		logger:  logger,
	}
}

func (s *gradingService) GetGradingScale(ctx context.Context) (*schema.GradingScale, error) {
	return getGradingScale(ctx, s.queries)
}

func (s *gradingService) SaveGradingScale(ctx context.Context, actorID int64, req *schema.SaveGradingScaleRequest) (*schema.GradingScale, error) {
	bands, err := normaliseGradeBands(req.Bands)
	if err != nil {
		return nil, err
	}

	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to start transaction: %w", err)
	}
	defer tx.Rollback()
	queries := s.queries.WithTx(tx)

	if err := queries.DeleteAllGradeBands(ctx); err != nil {
		return nil, fmt.Errorf("failed to clear grading scale: %w", err)
	}
	for _, band := range bands {
		var description sql.NullString
		if band.Description != nil {
			description = common.NullString(*band.Description)
		}
		err := queries.CreateGradeBand(ctx, dbsqlc.CreateGradeBandParams{
			Grade:       band.Grade,
			MinMark:     int32(*band.MinMark),
			IsPass:      band.IsPass,
			Description: description,
		})
		if err != nil {
			return nil, fmt.Errorf("failed to save grade %s: %w", band.Grade, err)
		}
	}

	err = queries.CreateAuditLog(ctx, dbsqlc.CreateAuditLogParams{
		EntityType:  auditEntityGradingScale,
		Action:      "Updated",
		ActorUserID: int32(actorID),
		Note:        common.NullString(describeGradeBands(bands)),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to record grading scale change: %w", err)
	}

	scale, err := getGradingScale(ctx, queries)
	if err != nil {
		return nil, err
	}
	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("failed to save grading scale: %w", err)
	}
	return scale, nil
}

func getGradingScale(ctx context.Context, queries *dbsqlc.Queries) (*schema.GradingScale, error) {
	rows, err := queries.ListGradeBands(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to list grade bands: %w", err)
	}
	scale := &schema.GradingScale{Bands: make([]schema.GradeBand, 0, len(rows))}
	// Rows come highest first, so each band ends one below the band before it
	maxMark := 100
	for _, row := range rows {
		var description *string
		if row.Description.Valid {
			description = &row.Description.String
		}
		scale.Bands = append(scale.Bands, schema.GradeBand{
			ID:          int64(row.ID),
			Grade:       row.Grade,
			MinMark:     int(row.MinMark),
			MaxMark:     maxMark,
			IsPass:      row.IsPass,
			Description: description,
		})
		maxMark = int(row.MinMark) - 1
		if row.IsPass {
			scale.PassMark = int(row.MinMark)
		}
		if t := formatNullTime(row.UpdatedAt); t > scale.UpdatedAt {
			scale.UpdatedAt = t
		}
	}
	return scale, nil
}

// normaliseGradeBands trims the bands, sorts them highest first and checks that they
// make a usable scale: unique grades and lower bounds, one band starting at 0, and the
// passing bands all above the failing ones (so a single pass mark separates them).
func normaliseGradeBands(input []schema.GradeBandInput) ([]schema.GradeBandInput, error) {
	invalid := func(format string, args ...any) error {
		return fmt.Errorf("%w: %s", ErrInvalidGradingScale, fmt.Sprintf(format, args...))
	}

	bands := make([]schema.GradeBandInput, len(input))
	grades := map[string]bool{}
	mins := map[int]string{}
	for i, band := range input {
		band.Grade = strings.TrimSpace(band.Grade)
		if band.Grade == "" {
			return nil, invalid("every band needs a grade")
		}
		key := strings.ToUpper(band.Grade)
		if grades[key] {
			return nil, invalid("grade %s is used more than once", band.Grade)
		}
		grades[key] = true
		if other, taken := mins[*band.MinMark]; taken {
			return nil, invalid("grades %s and %s both start at %d", other, band.Grade, *band.MinMark)
		}
		mins[*band.MinMark] = band.Grade
		if band.Description != nil {
			description := strings.TrimSpace(*band.Description)
			band.Description = &description
		}
		bands[i] = band
	}

	sort.Slice(bands, func(i, j int) bool { return *bands[i].MinMark > *bands[j].MinMark })

	if *bands[len(bands)-1].MinMark != 0 {
		return nil, invalid("the lowest grade must start at 0")
	}
	if !bands[0].IsPass {
		return nil, invalid("at least one grade must count as a pass")
	}
	if bands[len(bands)-1].IsPass {
		return nil, invalid("at least one grade must count as a fail")
	}
	for i := 1; i < len(bands); i++ {
		if bands[i].IsPass && !bands[i-1].IsPass {
			return nil, invalid("grade %s counts as a pass but the higher grade %s does not", bands[i].Grade, bands[i-1].Grade)
		}
	}
	return bands, nil
}

// describeGradeBands summarises a scale for the audit log, e.g. "A 90-100, B 80-89, F 0-39 (pass mark 40)".
func describeGradeBands(bands []schema.GradeBandInput) string {
	parts := make([]string, len(bands))
	maxMark, passMark := 100, 0
	for i, band := range bands {
		parts[i] = fmt.Sprintf("%s %d-%d", band.Grade, *band.MinMark, maxMark)
		maxMark = *band.MinMark - 1
		if band.IsPass {
			passMark = *band.MinMark
		}
	}
	return fmt.Sprintf("%s (pass mark %d)", strings.Join(parts, ", "), passMark)
}
