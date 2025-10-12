package common

import (
	"database/sql"
	"path/filepath"
	"time"
)

func NullString(value string) sql.NullString {
	return sql.NullString{String: value, Valid: value != ""}
}

func TrueNullBool() sql.NullBool {
	return sql.NullBool{Bool: true, Valid: true}
}

func FalseNullBool() sql.NullBool {
	return sql.NullBool{Bool: false, Valid: true}
}

func NewNullBool(b bool) sql.NullBool {
	return sql.NullBool{Bool: b, Valid: true}
}

func NewNullInt32(i int32) sql.NullInt32 {
	return sql.NullInt32{Int32: i, Valid: true}
}

func NewNullInt64(i int64) sql.NullInt64 {
	return sql.NullInt64{Int64: i, Valid: true}
}

func NullTime(t time.Time) sql.NullTime {
	return sql.NullTime{
		Time:  t,
		Valid: !t.IsZero(),
	}
}

func NewNullFloat64(f float64) sql.NullFloat64 {
	return sql.NullFloat64{Float64: f, Valid: true}
}

func Float64OrZero(f sql.NullFloat64) float64 {
	if f.Valid {
		return f.Float64
	}
	return 0
}

func ForceValidString(value string) sql.NullString {
	return sql.NullString{String: value, Valid: true}
}

func NormalizeImagePath(raw string) string {
	return filepath.ToSlash(raw)
}
