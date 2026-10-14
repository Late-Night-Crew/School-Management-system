# Running the OSS system in production

How to set up, run and look after a live deployment. For local development and demo
data, see [demo-logins.md](demo-logins.md).

## Settings

Copy `backend/config.example.yaml` to `backend/config.yaml` and fill it in. Keep secrets
out of the file and set them as environment variables:

| Variable | What it is |
| --- | --- |
| `NSMS_ENVIRONMENT` | `PRODUCTION` on the live server. |
| `NSMS_JWT_SECRET` | Signs login tokens. At least 32 characters; generate with `openssl rand -hex 32`. The server refuses to start in production without it. Changing it signs everyone out. |
| `NSMS_DATABASE_PASSWORD` | The database password. |

Set `NSMS_ENVIRONMENT=PRODUCTION` on the live server. Without it the server accepts a
weak or missing JWT secret, allows `nsms seed` to load demo logins, and serves debugging
pages at `/debug/pprof`.

## Network and proxy

The API listens on `server.host` and `server.port`, by default `127.0.0.1:8080`: only
the same machine can reach it, which suits a reverse proxy (nginx, Apache) on that
machine. If the proxy runs on another machine, set `host: 0.0.0.0` and firewall the port
so only the proxy can reach it. Users should only ever reach the API through the proxy,
over HTTPS.

The proxy should:

- serve the site over HTTPS only, redirecting plain HTTP, with an HSTS header;
- add the usual security headers: `X-Content-Type-Options: nosniff`,
  `Referrer-Policy: same-origin`, and `X-Frame-Options: DENY` (or a CSP with
  `frame-ancestors 'none'`);
- **replace** `X-Forwarded-For` with the client's address rather than append to it
  (nginx: `proxy_set_header X-Forwarded-For $remote_addr;`). Otherwise anyone can claim
  any address and get round the sign-in attempt limits.

List the proxy's address under `server.trusted_proxies`. Without it every user appears
to come from the proxy, and a few failed sign-ins would block sign-in for everyone.

If the database is on another machine, set `database.sslmode: require`.

The frontend is built with the API address baked in:

```sh
VITE_NSMS_URL=https://oss.example.mw/api npm run build   # output in dist/
```

## First-time setup

```sh
cd backend
go build -o nsms .
./nsms migrate                                                   # create the tables
./nsms create-admin --name "Full Name" --email name@mcde.ac.mw   # prints a temporary password
NSMS_ENVIRONMENT=PRODUCTION NSMS_JWT_SECRET=... ./nsms server
```

Never run `nsms seed` on the live database: it loads demo schools and logins with a
published password. In production it refuses to run.

The super admin (Learner Support Manager) signs in with the temporary password and must
choose their own. They then create the division officers' accounts; divisions create
school accounts, and accepted school requests create the coordinators' accounts.

## MCDE accounts and the activity log

MCDE can have several Learner Support Managers. Any of them adds another on the
Accounts page (role "MCDE: Learner Support Manager"), or on the server with
`./nsms create-admin`. They all have the same access. One cannot deactivate or reset
their own account from the Accounts page, and the last active one cannot be
deactivated.

Every change is recorded with the name of the person who made it: accounts, learners
(created, edited, deleted, left, transferred, downloaded), marks corrected in closed
terms (each old and new mark), year ends, schools, districts, divisions, years,
subjects, settings and sign-ins. MCDE sees the record under Activity Log, filtered by
person, role, type of record, dates or a search ("Show sign-ins" adds sign-ins), and can
download it as CSV (up to 5,000 entries at a time).

The app never edits or deletes entries. To make that a guarantee, run the server with a
database user that cannot either:

```sql
REVOKE UPDATE, DELETE, TRUNCATE ON audit_logs FROM nsms;   -- the app's database user
```

Run migrations (`./nsms migrate`) with the database owner, not that user.

## Upgrades

Back up first, then run `./nsms migrate` with the new build before restarting the server.

## Backups

`backend/scripts/backup.sh` writes one compressed `pg_dump` per run and deletes copies
older than `NSMS_BACKUP_KEEP_DAYS` (default 30) from `NSMS_BACKUP_DIR` (default
`/var/backups/nsms`). It uses the standard PostgreSQL connection variables. Run it
daily from cron:

```cron
30 1 * * * PGDATABASE=nsms PGUSER=nsms /opt/nsms/scripts/backup.sh >> /var/log/nsms-backup.log 2>&1
```

Copy the backup folder to another machine or cloud storage as well; a backup on the same
disk is lost with the disk. The dumps hold learners' personal details: the script makes
them readable by its own user only, and copies kept elsewhere should be encrypted (for
example `gpg --symmetric`, or encrypted storage).

To restore, into a new empty database:

```sh
createdb nsms_restored
pg_restore --no-owner -d nsms_restored /var/backups/nsms/nsms_YYYY-MM-DD_HHMMSS.dump
```

Then point `database.database` at it (or rename the databases) and restart the server.
Try a restore once before going live, and now and then after, so you know it works.

## Term reminders

A new academic year is created with the dates of its three terms (Manage → Academic
Years); editing a year changes its dates and its terms' dates together. Schools cannot move
to the next term, or finish the year, before the current term's end date.

The server checks every hour and sends automatic notices to each school still in a
term: some days before it ends, on the day it ends, and an urgent one some days after.
Later still, each division office gets one summary of its schools that have not closed
the term. The number of days for each is set on the Promotion page (defaults 7, 7 and
14). Each reminder is sent once per school and term; nothing is sent for a term
without dates.

The Promotion page has "Send reminders now", and the same check can be run from the
server, for example from cron instead of the built-in hourly check, or to try a date:

```sh
./nsms send-reminders                   # what is due today (Malawi time)
./nsms send-reminders --date 2026-12-11 # as if it were that day (sends for real)
```

## Forgotten passwords

- **School users and division officers** use "Forgot your password?" on the sign-in
  page. The request goes to the office above them (a school's division, or MCDE for
  division officers), which sees it at the top of the Accounts page. Anyone who knows an
  email address can send a request, so the office calls the phone number on the account
  (never one given in the request's message), checks it is really them, then resets the
  password and reads it out on that call.
- **MCDE staff** reset each other's passwords on the Accounts page.
- **The last MCDE account**, or anyone who cannot be reached that way, is reset on the server:

  ```sh
  ./nsms reset-password --email name@mcde.ac.mw   # prints a temporary password
  ```
