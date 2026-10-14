# Open Secondary School (OSS)

The school management system for Malawi College of Distance Education's Open Secondary
Schools: school registration, learners, marks, transfers, reports and communication
between MCDE, division offices and schools.

- `backend/`: Go API (Fiber, PostgreSQL, sqlc). Package and command name: `nsms`.
- `src/`: React frontend (Vite). See [src/README.md](src/README.md).

## Development

```sh
cd backend && cp config.example.yaml config.yaml   # then set the database details
go run . migrate && go run . seed                  # demo data and logins: docs/demo-logins.md
go run . server                                    # API on :8080
cd .. && npm install && npm run dev                # frontend; set VITE_NSMS_URL in .env
```

## Production

See [docs/operations.md](docs/operations.md): settings, first admin, backups and
password recovery.
