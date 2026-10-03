package db

import "embed"

//go:embed "migrations"
var MigrationsFS embed.FS

// SeedsFS holds the demo dataset loaded by `nsms seed`.
//
//go:embed "seeds"
var SeedsFS embed.FS
