#!/usr/bin/env bash
set -euo pipefail

# Local/operator procedure only. This script does not discover or contact Supabase.
# Point DATABASE_URL at an isolated PostgreSQL test database before execution.
if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "Refusing to run: set DATABASE_URL to an isolated PostgreSQL test database." >&2
  exit 2
fi

case "${DATABASE_URL}" in
  *supabase.co*|*supabase.com*)
    echo "Refusing to run against a Supabase-hosted URL during P3 remediation." >&2
    exit 3
    ;;
esac

command -v psql >/dev/null 2>&1 || { echo "Refusing to run: psql is not installed." >&2; exit 4; }

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
for migration in "${repo_root}"/supabase/migrations/*.sql; do
  echo "Applying ${migration##*/}"
  psql "${DATABASE_URL}" --set ON_ERROR_STOP=1 --file "${migration}"
done

echo "P3 migrations replayed locally. No remote migration was invoked."
