#!/usr/bin/env bash
# Idempotent re-deploy script, run on the server: ~/karamad-medtech/scripts/deploy.sh
#
# Assumes the first-time bootstrap (docs/DEPLOY.md) has already happened — in
# particular that the karamad-backend systemd service already exists. The
# previous deploy's backend keeps serving until `systemctl restart` below.
set -euo pipefail

REPO_DIR="$HOME/karamad-medtech"
BRANCH="main"

echo "==> Pulling latest ($BRANCH)..."
cd "$REPO_DIR"
git fetch origin
git checkout "$BRANCH"
git pull origin "$BRANCH"

echo "==> uv sync..."
~/.local/bin/uv sync

echo "==> alembic upgrade head..."
~/.local/bin/uv run alembic upgrade head

echo "==> Restarting backend (systemd)..."
sudo systemctl restart karamad-backend

echo "==> Health check: backend..."
for i in $(seq 1 10); do
  curl -sf http://127.0.0.1:8000/health > /dev/null && break
  sleep 1
done
curl -sf http://127.0.0.1:8000/health || { echo "Backend health check FAILED"; exit 1; }

echo "==> Deploy complete."
