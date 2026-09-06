#!/usr/bin/env bash
# Dev-only helper: run the pip-bundled PostgreSQL (pgserver's binaries) on a
# fixed local port so DATABASE_URL in backend/.env stays stable. Used only
# where no system PostgreSQL is installed. Not part of the deployed stack.
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BIN="$HERE/.venv/Lib/site-packages/pgserver/pginstall/bin"
DATA="$HERE/.pgdata"
PORT=55432
export PATH="$BIN:$PATH"
case "${1:-start}" in
  init)
    rm -rf "$DATA"; mkdir -p "$DATA"
    "$BIN/initdb.exe" -D "$DATA" -U postgres -A trust -E UTF8 >/dev/null
    ;;
  start)
    "$BIN/pg_ctl.exe" -D "$DATA" -o "-p $PORT -k \"\" -h 127.0.0.1" -l "$HERE/.pgdata/server.log" -w start
    ;;
  stop)
    "$BIN/pg_ctl.exe" -D "$DATA" -m fast -w stop
    ;;
  status)
    "$BIN/pg_isready.exe" -h 127.0.0.1 -p $PORT
    ;;
esac
