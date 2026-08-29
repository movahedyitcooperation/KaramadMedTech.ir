#!/usr/bin/env bash
# Nightly Postgres backup, run via cron: see docs/DEPLOY.md for the crontab
# line. Reads credentials from ~/.pgpass so it runs unattended with no
# password on the command line.
set -euo pipefail

BACKUP_DIR="$HOME/backups"
KEEP=7
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
DUMP_FILE="$BACKUP_DIR/karamad_medtech-$TIMESTAMP.sql.gz"

mkdir -p "$BACKUP_DIR"

pg_dump --host=localhost --username=karamad --dbname=karamad_medtech --no-password \
  | gzip > "$DUMP_FILE"

echo "Backup written: $DUMP_FILE"

cd "$BACKUP_DIR"
ls -1t karamad_medtech-*.sql.gz | tail -n +$((KEEP + 1)) | xargs -r rm -f --
echo "Rotation complete — keeping newest $KEEP dumps."

# No /public/uploads tarball here: this app has no file-upload feature yet
# (backend/app/api/v1/ has only read-only/stub routers, product images are
# static SVGs committed to the repo, not runtime uploads). Add an uploads
# step here once an upload feature ships.
