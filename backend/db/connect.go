package db

import (
	"context"
	"log"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

var Pool *pgxpool.Pool

// Connect creates and returns a connection pool
func Connect(dsn string) *pgxpool.Pool {
	if Pool != nil {
		return Pool
	}

	pool, err := pgxpool.New(context.Background(), dsn)
	if err != nil {
		log.Fatalf("Unable to create database pool: %v", err)
	}

	// Optional: set pool configs
	pool.Config().MaxConns = 10
	pool.Config().MinConns = 2
	pool.Config().MaxConnLifetime = time.Hour

	Pool = pool
	return Pool
}
