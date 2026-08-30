# Deploy Guide — Karamad MedTech

## Server facts

- IP: `185.164.72.102` — SSH user `claude`, password auth (see "Known gaps" below).
- Ubuntu 24.04 LTS, 2 vCPU, ~4 GiB RAM.
- App checked out at `~/karamad-medtech` on branch `backend-sina`.
- No domain/DNS points here yet — the site is served over plain HTTP on the
  bare IP. TLS/Certbot and the real `karamadmedtech.ir` domain are a
  follow-up once DNS is pointed at this server.

## First-time bootstrap

Done once already; the full recipe (prerequisite installs, Postgres role/db
creation, systemd unit, PM2, Nginx vhost, ufw) lives in the deploy plan this
was executed from. The one ordering rule that matters if this is ever
redone from scratch: **the backend must be installed, migrated, seeded, and
running (`systemctl start karamad-backend`) before the first `npm run
build`** — `/` and `/cart` are statically prerendered at build time and
fetch real catalog/settings data from the backend synchronously in that
build step (verified via `.next/prerender-manifest.json`: both routes show
`"compute": "static"` with no revalidation). Building against a dead or
empty backend bakes broken data into the homepage permanently until the
next rebuild.

## Routine re-deploy

```
ssh claude@185.164.72.102
~/karamad-medtech/scripts/deploy.sh
```

Pulls `backend-sina`, re-syncs backend deps, runs any new Alembic
migrations, rebuilds the frontend, restarts both services, and health-checks
both before reporting success. Safe to re-run — `alembic upgrade head` and
`scripts/seed.py` are both idempotent.

## Services

- **Backend** (systemd, unit `karamad-backend`):
  `sudo systemctl {status,restart,stop,start} karamad-backend`,
  logs via `journalctl -u karamad-backend -f`.
- **Frontend** (PM2, process `karamad-frontend`):
  `pm2 status`, `pm2 logs karamad-frontend`, `pm2 restart karamad-frontend`.
- **Nginx**: `sudo nginx -t && sudo systemctl reload nginx` after any config
  change to `/etc/nginx/sites-available/karamad-medtech`.

## Environment variables

| File (on server) | Var | Notes |
|---|---|---|
| `backend/.env` | `DATABASE_URL` | `postgresql+asyncpg://karamad:<password>@localhost:5432/karamad_medtech` |
| `backend/.env` | `JWT_SECRET` | Generated at bootstrap (`openssl rand -hex 32`), distinct from local dev's |
| `backend/.env` | `FRONTEND_ORIGIN` | `http://185.164.72.102` — update once the real domain is live |
| `.env.local` (repo root) | `API_BASE_URL` | `http://127.0.0.1:8000/api/v1` — both services run on the same box |
| `.env.local` (repo root) | `BACKEND_PUBLIC_ORIGIN` | Browser-facing backend origin for admin-uploaded product images (e.g. `http://185.164.72.102`, or the real domain once TLS is live) — **not** the loopback `API_BASE_URL` above, the browser must be able to reach it directly |
| `backend/.env` | `JWT_ALGORITHM`, `JWT_EXPIRE_MINUTES`, `UPLOAD_DIR` | Admin-auth/upload config — safe defaults ship in `backend/.env.example`, rarely need overriding |

To rotate a secret: edit the relevant `.env`, then `sudo systemctl restart
karamad-backend` (backend vars) or `pm2 restart karamad-frontend` (frontend
vars — `.env.local` is only read at build/start time, so a frontend var
change also needs `npm run build` first).

## Database

- Role: `karamad`. Database: `karamad_medtech`.
- Connect: `psql -h 127.0.0.1 -U karamad karamad_medtech` (password from
  `backend/.env`'s `DATABASE_URL`, or `~/.pgpass`).
- Migrate: `cd ~/karamad-medtech/backend && ~/.local/bin/uv run alembic upgrade head`.
- Seed (idempotent, safe to re-run): `~/.local/bin/uv run python scripts/seed.py`.

## Backups

`scripts/backup.sh` runs nightly at 03:00 via cron (installed at bootstrap),
`pg_dump`-ing `karamad_medtech` to `~/backups/karamad_medtech-<timestamp>.sql.gz`,
keeping the newest 7. Restore with:
```
gunzip -c ~/backups/karamad_medtech-<timestamp>.sql.gz | psql -h 127.0.0.1 -U karamad karamad_medtech
```
Credentials for the unattended cron run come from `~/.pgpass` (mode 600).

No `backend/uploads/` backup step yet. The admin panel's product-image
uploads (`backend/uploads/`, served at `/api/v1/uploads/*`) now exist in the
codebase but haven't been deployed to this server yet — once they are, add a
step to `scripts/backup.sh` (e.g. `tar`-ing `backend/uploads/` alongside the
nightly `pg_dump`) before real admin-uploaded images accumulate there.

## Firewall

`ufw` allows SSH (22), HTTP (80), and HTTPS (443, pre-opened for when TLS
is added). Check with `sudo ufw status verbose`.

## Known gaps / next steps

- **No TLS/domain yet.** Once `karamadmedtech.ir` DNS points at this
  server: `sudo apt install certbot python3-certbot-nginx`, then
  `sudo certbot --nginx -d karamadmedtech.ir`, and update
  `FRONTEND_ORIGIN`/the Nginx `server_name` accordingly.
- **No uploads backup** — see the Backups section above.
- **Admin panel not yet deployed to this server.** Built and verified
  locally (auth + Products/Categories CRUD, image uploads). The existing
  `scripts/deploy.sh` re-deploy flow is git-pull-based, which won't work
  until a GitHub deploy key is added — the initial deploy used a direct
  `scp` transfer instead (see git history / session notes for why).
- **SSH is password-only.** The current setup uses password auth (shared
  once during initial setup). Good practice going forward: generate a
  keypair locally, `ssh-copy-id claude@185.164.72.102`, confirm key login
  works, then set `PasswordAuthentication no` in `/etc/ssh/sshd_config` and
  `sudo systemctl restart sshd`. Not done as part of the initial deploy —
  optional hardening, do it deliberately with a second session open to
  avoid lockout.
- **Both services run as the `claude` user**, not a dedicated service
  account — a reasonable simplification for now, worth tightening later.
