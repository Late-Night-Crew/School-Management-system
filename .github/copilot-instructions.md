## Project snapshot

This repo contains a React + Vite frontend (root-level `package.json`, `src/`) and a Go backend under `backend/` using sqlc-generated DB code. Key areas:

- Frontend: `src/` (routes in `src/router.jsx`, app shell in `src/layout/Appshell.jsx`, views under `src/views/Admin/` and services under `src/views/Admin/services/`)
- Backend: `backend/` (entry points: `backend/main.go`, CLI-like commands in `backend/cmd/`)
- DB: `backend/db/migrations/` (SQL migrations), `database/dbsqlc/` (sqlc-generated code), `backend/sqlc.yaml` (sqlc config)
- Config: `backend/config/config.go` and YAML files `backend/config.yaml` / `backend/config copy.yaml`

## Goals for an AI coding agent

- Be minimal and surgical: change only files relevant to the task unless the user asks otherwise.
- Preserve project structure and naming conventions: Go packages under `backend/`, SQL handled by sqlc, React components under `src/views`.
- When adding DB queries, prefer updating sqlc SQL sources and running `sqlc generate` (see `backend/sqlc.yaml`).

## How to run & verify locally (quick commands)

- Frontend dev: from repo root

  npm install
  npm run dev

- Backend (dev build & run):

  cd backend
  go build -o nsms .
  ./nsms

  Note: configuration is read from `backend/config.yaml` (see `backend/config/config.go`) — inspect it for DB credentials and port defaults.

## DB workflow and sqlc

- Migrations: SQL files live in `backend/db/migrations/`. The code embeds migrations via `backend/db/embed.go`.
- sqlc: `backend/sqlc.yaml` controls where sqlc finds SQL queries and where it writes generated code. Generated client code appears under `database/dbsqlc/` — run `sqlc generate` from repo root or `backend/` (requires sqlc installed).

Example: add a query

1. Add SQL to the location referenced in `backend/sqlc.yaml` (check `queries` path there).
2. Run `sqlc generate` to refresh `database/dbsqlc`.
3. Add service logic in `backend/services/` and a handler under `backend/api/` (see `backend/api/admin/student.go` for an example).

Details (exact values found in the repo):

- `backend/sqlc.yaml`:
  - `queries`: `query.sql` (root-level file containing SQL query definitions for sqlc)
  - `schema`: `db/migrations` (directory with migration SQL files)
  - generated Go client out: `database/dbsqlc`
  - type overrides include: `uuid -> github.com/google/uuid.UUID`, `numeric -> float64`, `timestamptz -> time.Time`.

- Database defaults (from `backend/config.yaml`):
  - host: `localhost`
  - port: `5432`
  - database: `nsms`
  - username: `postgres`
  - password: `parrot1234`

- Server default port: `8080` (the `server` subcommand calls `apiServer.Start(":8080")` in `backend/cmd/server.go`).

Run example for sqlc:

  sqlc generate

## Adding an API endpoint (pattern)

1. Add handler in `backend/api/admin/` (controller style used across admin files).
2. Register the route in `backend/api/routes.go`.
3. Add business logic in `backend/services/` (stateless functions that accept DB client/context).
4. Add SQL (if needed) then run `sqlc generate`.
5. Update frontend: add a service in `src/views/Admin/services/` (follow naming of `studentService.js`), add a view in `src/views/Admin/Manage.../`, and wire the route in `src/router.jsx`.

## Important patterns & conventions (do not assume defaults)

- Authentication: password hashing uses `backend/common/bcrypt.go`; auth endpoints live under `backend/api/admin/auth.go` and `backend/services/auth.go`.
- Middleware: request-level middleware (auth, logging, etc.) is in `backend/api/middleware.go` — register middleware centrally.
- Error model: the repo uses a problem-detail style in `pkg/problemdetail/` and `backend/problemdetail/` — return these structured errors rather than ad-hoc strings.
- Logging: centralized in `backend/logging/logging.go` and used by modules under `logging/loggedmodule/`.
- Validation: input validation helpers are in `backend/validation/validation.go` — reuse these helpers for consistency.

## Files to inspect for context when changing behavior

- `backend/api/routes.go` — routing and grouping of handlers
- `backend/services/*.go` — business logic patterns
- `database/dbsqlc/query.sql.go` and `backend/sqlc.yaml` — where DB client code comes from
- `backend/config/config.go` and `backend/config.yaml` — runtime configuration
- `backend/db/embed.go` and `backend/db/migrations/` — migration embedding and order is significant
- front-end: `src/views/Admin/services/*` and `src/router.jsx` for how UI calls backend

## Tests / static checks

- There are no project-level test runners present by default. For Go, run `go vet` / `go test ./...` in `backend/` where applicable. For frontend, check `package.json` scripts and run `npm run` to list tasks.

## Safety & minimal-change rules for the agent

- Do not modify top-level config files (like `package.json`, `backend/config.yaml`) without explicit instruction from the user.
- When changing DB schema, always add migration files to `backend/db/migrations/` and do not edit existing migration files.
- When adding Go files, follow existing package names and imports; run `go vet` / `go build` before proposing a final patch.

## Example commit message style

Add concise, imperative messages and reference files changed, e.g.:

  backend: add student search endpoint
  - add SQL query in `database/...` and run `sqlc generate`
  - add handler `backend/api/admin/student_search.go`
  - add service `backend/services/student_search.go`

---

If anything here looks incorrect or incomplete, tell me which area you want expanded (DB, backend, or frontend) and I will iterate.
## Project snapshot

This repo contains a React + Vite frontend (root-level `package.json`, `src/`) and a Go backend under `backend/` using sqlc-generated DB code. Key areas:

- Frontend: `src/` (routes in `src/router.jsx`, app shell in `src/layout/Appshell.jsx`, views under `src/views/Admin/` and services under `src/views/Admin/services/`)
- Backend: `backend/` (entry points: `backend/main.go`, CLI-like commands in `backend/cmd/`)
- DB: `backend/db/migrations/` (SQL migrations), `database/dbsqlc/` (sqlc-generated code), `backend/sqlc.yaml` (sqlc config)
- Config: `backend/config/config.go` and YAML files `backend/config.yaml` / `backend/config copy.yaml`

## Goals for an AI coding agent

- Be minimal and surgical: change only files relevant to the task unless the user asks otherwise.
- Preserve project structure and naming conventions: Go packages under `backend/`, SQL handled by sqlc, React components under `src/views`.
- When adding DB queries, prefer updating sqlc SQL sources and running `sqlc generate` (see `backend/sqlc.yaml`).

## How to run & verify locally (quick commands)

- Frontend dev: from repo root

  npm install
  npm run dev

- Backend (dev build & run):

  cd backend
  go build -o nsms .
  ./nsms

  Note: configuration is read from `backend/config.yaml` (see `backend/config/config.go`) — inspect it for DB credentials and port defaults.

## DB workflow and sqlc

- Migrations: SQL files live in `backend/db/migrations/`. The code embeds migrations via `backend/db/embed.go`.
- sqlc: `backend/sqlc.yaml` controls where sqlc finds SQL queries and where it writes generated code. Generated client code appears under `database/dbsqlc/` — run `sqlc generate` from repo root or `backend/` (requires sqlc installed).

Example: add a query

1. Add SQL to the location referenced in `backend/sqlc.yaml` (check `queries` path there).
2. Run `sqlc generate` to refresh `database/dbsqlc`.
3. Add service logic in `backend/services/` and a handler under `backend/api/` (see `backend/api/admin/student.go` for an example).

## Adding an API endpoint (pattern)

1. Add handler in `backend/api/admin/` (controller style used across admin files).
2. Register the route in `backend/api/routes.go`.
3. Add business logic in `backend/services/` (stateless functions that accept DB client/context).
4. Add SQL (if needed) then run `sqlc generate`.
5. Update frontend: add a service in `src/views/Admin/services/` (follow naming of `studentService.js`), add a view in `src/views/Admin/Manage.../`, and wire the route in `src/router.jsx`.

## Important patterns & conventions (do not assume defaults)

- Authentication: password hashing uses `backend/common/bcrypt.go`; auth endpoints live under `backend/api/admin/auth.go` and `backend/services/auth.go`.
- Middleware: request-level middleware (auth, logging, etc.) is in `backend/api/middleware.go` — register middleware centrally.
- Error model: the repo uses a problem-detail style in `pkg/problemdetail/` and `backend/problemdetail/` — return these structured errors rather than ad-hoc strings.
- Logging: centralized in `backend/logging/logging.go` and used by modules under `logging/loggedmodule/`.
- Validation: input validation helpers are in `backend/validation/validation.go` — reuse these helpers for consistency.

## Files to inspect for context when changing behavior

- `backend/api/routes.go` — routing and grouping of handlers
- `backend/services/*.go` — business logic patterns
- `database/dbsqlc/query.sql.go` and `backend/sqlc.yaml` — where DB client code comes from
- `backend/config/config.go` and `backend/config.yaml` — runtime configuration
- `backend/db/embed.go` and `backend/db/migrations/` — migration embedding and order is significant
- front-end: `src/views/Admin/services/*` and `src/router.jsx` for how UI calls backend

## Tests / static checks

- There are no project-level test runners present by default. For Go, run `go vet` / `go test ./...` in `backend/` where applicable. For frontend, check `package.json` scripts and run `npm run` to list tasks.

## Safety & minimal-change rules for the agent

- Do not modify top-level config files (like `package.json`, `backend/config.yaml`) without explicit instruction from the user.
- When changing DB schema, always add migration files to `backend/db/migrations/` and do not edit existing migration files.
- When adding Go files, follow existing package names and imports; run `go vet` / `go build` before proposing a final patch.

## Example commit message style

Add concise, imperative messages and reference files changed, e.g.:

  backend: add student search endpoint
  - add SQL query in `database/...` and run `sqlc generate`
  - add handler `backend/api/admin/student_search.go`
  - add service `backend/services/student_search.go`

---

If anything here looks incorrect or incomplete, tell me which area you want expanded (DB, backend, or frontend) and I will iterate.
