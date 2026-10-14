#!/usr/bin/env bash
# Daily database backup for the OSS system: one compressed pg_dump per run, older
# copies pruned. Copy the backup folder off the server too (another machine or cloud
# storage); a backup on the same disk does not survive the disk failing.
#
# Connection settings use the standard PostgreSQL variables (PGHOST, PGPORT, PGUSER,
# PGPASSWORD or ~/.pgpass, PGDATABASE). Optional:
#   NSMS_BACKUP_DIR        where dumps go            (default /var/backups/nsms)
#   NSMS_BACKUP_KEEP_DAYS  how many days to keep     (default 30)
#
# Run it daily from cron, e.g.:
#   30 1 * * * PGDATABASE=nsms PGUSER=nsms /opt/nsms/scripts/backup.sh >> /var/log/nsms-backup.log 2>&1
#
# Restore into an empty database (see docs/operations.md):
#   createdb nsms_restored && pg_restore --no-owner -d nsms_restored <dump file>
set -euo pipefail
# The dumps hold learners' personal details: readable by this user only
umask 077

backup_dir="${NSMS_BACKUP_DIR:-/var/backups/nsms}"
keep_days="${NSMS_BACKUP_KEEP_DAYS:-30}"
database="${PGDATABASE:-nsms}"

mkdir -p "$backup_dir"
file="$backup_dir/${database}_$(date +%Y-%m-%d_%H%M%S).dump"

# Write to a temporary name first so a failed run never looks like a good backup
pg_dump --format=custom --no-owner --dbname="$database" --file="$file.partial"
mv "$file.partial" "$file"
echo "$(date -Is) backup written: $file ($(du -h "$file" | cut -f1))"

find "$backup_dir" -name "${database}_*.dump" -type f -mtime +"$keep_days" -print -delete \
  | sed "s/^/$(date -Is) removed old backup: /"
