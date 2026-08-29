#!/usr/bin/env bash
# Idempotent re-deploy script, run on the server: ~/karamad-medtech/scripts/deploy.sh
#
# Assumes the first-time bootstrap (docs/DEPLOY.md) has already happened —
# in particular that the karamad-backend systemd service and the
# karamad-frontend PM2 process already exist. On a routine re-deploy the
# previous deploy's backend keeps running the whole time `npm run build`
# executes below, so the "backend must be up before the first build" ordering
# issue from the initial bootstrap doesn't recur here.
set -euo pipefail

REPO_DIR="$HOME/karamad-medtech"
BACKEND_DIR="$REPO_DIR/backend"
BRANCH="backend-sina"

echo "==> Pulling latest ($BRANCH)..."
cd "$REPO_DIR"
git fetch origin
git checkout "$BRANCH"
git pull origin "$BRANCH"

echo "==> Backend: uv sync..."
cd "$BACKEND_DIR"
~/.local/bin/uv sync

echo "==> Backend: alembic upgrade head..."
~/.local/bin/uv run alembic upgrade head

echo "==> Frontend: npm ci..."
cd "$REPO_DIR"
npm ci

echo "==> Frontend: npm run build..."
npm run build

echo "==> Restarting backend (systemd)..."
sudo systemctl restart karamad-backend

echo "==> Restarting frontend (pm2)..."
pm2 restart karamad-frontend

echo "==> Health check: backend..."
for i in $(seq 1 10); do
  curl -sf http://127.0.0.1:8000/health > /dev/null && break
  sleep 1
done
curl -sf http://127.0.0.1:8000/health || { echo "Backend health check FAILED"; exit 1; }

echo "==> Health check: frontend..."
for i in $(seq 1 10); do
  curl -sf http://127.0.0.1:3000/ > /dev/null && break
  sleep 1
done
curl -sf http://127.0.0.1:3000/ > /dev/null || { echo "Frontend health check FAILED"; exit 1; }

echo "==> Deploy complete."
