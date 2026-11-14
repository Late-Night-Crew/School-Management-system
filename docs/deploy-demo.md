# Demo deployment (Render + Vercel)

A public demo for viewing only: the API and database on Render, the frontend on Vercel,
loaded with the demo data and logins from [demo-logins.md](demo-logins.md) (password
`Demo@2026`). **Never put real learners' data in it.** Anyone can sign in with the
published password.

| Part | Where | Defined in |
| --- | --- | --- |
| PostgreSQL `oss-demo-db` | Render | `render.yaml` |
| API `oss-demo-api` (Docker) | Render | `render.yaml`, `backend/Dockerfile`, `backend/deploy/start.sh` |
| Frontend | Vercel | `vercel.json` |

## 1. API and database on Render

1. Push the repository to GitHub.
2. In Render: **New → Blueprint**, pick the repository. Render reads `render.yaml` and
   creates the database and the API. Apply it.
3. On every start, `start.sh` writes `config.yaml` from the environment, runs
   `nsms migrate`, loads the demo seed if it is not there yet (`NSMS_DEMO_SEED=true`),
   and starts the server. The server runs as `PRODUCTION` (so no debugging pages);
   only the seed step runs as `DEVELOPMENT`, because the seed refuses production.
4. When it is live, open `https://<api-name>.onrender.com/public/places`. It should return
   JSON. Note the URL.

`autoDeploy` is off: deploy new commits with **Manual Deploy** on the service.

## 2. Frontend on Vercel

1. In Vercel: **Add New → Project**, import the same repository, root directory `./`.
   It picks up `vercel.json` (Vite, output `dist`, all routes served by `index.html`).
2. Under **Environment Variables** add
   `VITE_NSMS_URL` = `https://<api-name>.onrender.com` (no trailing slash).
3. Deploy. The URL is baked in at build time, so **redeploy** after changing it.

## Limits of the free plans

- The free Render API sleeps after about 15 minutes without traffic. The first request
  after that takes up to a minute. Open the site a minute or two before a demo.
- A free Render database expires after 30 days. To keep the demo longer, move it to a paid
  plan, or delete it and apply the blueprint again (it is seeded again on start).
- The server keeps no files of its own, so restarts and redeploys lose nothing but the
  log file.

## Starting the demo data again

Visitors can change the demo data. To reset it, open the database in the Render dashboard,
connect with the **PSQL Command** shown there and run:

```sql
DROP SCHEMA public CASCADE; CREATE SCHEMA public;
```

Then restart the API (**Manual Deploy → Restart service**): it migrates and seeds again.
