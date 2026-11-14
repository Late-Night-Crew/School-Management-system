#!/bin/sh
# Starts the demo API on Render (or any container host).
#
# Database settings come from environment variables (Render fills them from the
# database in render.yaml):
#   NSMS_DB_HOST, NSMS_DB_PORT, NSMS_DB_NAME, NSMS_DB_USER, NSMS_DATABASE_PASSWORD
#   NSMS_DB_SSLMODE      disable | prefer (default) | require
#   NSMS_JWT_SECRET      32+ characters, required (the server runs as PRODUCTION)
#   NSMS_DEMO_SEED       "true" loads the demo data and logins if not loaded yet
#   NSMS_DEMO_PASSWORD   password for every demo login (default Demo@2026)
#   NSMS_TRUSTED_PROXIES the host's load balancer range (default 10.0.0.0/8, Render)
#   PORT                 set by Render
set -eu

: "${NSMS_DB_HOST:?set NSMS_DB_HOST}"
: "${NSMS_DB_NAME:?set NSMS_DB_NAME}"
: "${NSMS_DB_USER:?set NSMS_DB_USER}"
: "${NSMS_DATABASE_PASSWORD:?set NSMS_DATABASE_PASSWORD}"
: "${NSMS_JWT_SECRET:?set NSMS_JWT_SECRET}"

cd /app
cat > config.yaml <<EOF
environment: PRODUCTION
database:
  host: "${NSMS_DB_HOST}"
  port: ${NSMS_DB_PORT:-5432}
  database: "${NSMS_DB_NAME}"
  username: "${NSMS_DB_USER}"
  sslmode: "${NSMS_DB_SSLMODE:-prefer}"
server:
  host: 0.0.0.0
  port: ${PORT:-8080}
  trusted_proxies: ["${NSMS_TRUSTED_PROXIES:-10.0.0.0/8}"]
storage:
  type: "local"
  localStorage:
    rootDirectory: ./data
    enabled: true
logging:
  log_file: ./data/NSMS.log
  log_level: info
EOF

echo "==> Migrating the database"
./nsms migrate

if [ "${NSMS_DEMO_SEED:-false}" = "true" ]; then
  # The seed refuses PRODUCTION, so it alone runs as DEVELOPMENT. It runs in one
  # transaction and refuses to load twice, so restarts leave the data as it is.
  echo "==> Loading the demo data (skipped if already loaded)"
  if ! NSMS_ENVIRONMENT=DEVELOPMENT ./nsms seed --password "${NSMS_DEMO_PASSWORD:-Demo@2026}"; then
    echo "    Seed did not run (see above); starting the server anyway"
  fi
fi

echo "==> Starting the API on port ${PORT:-8080}"
exec ./nsms server
