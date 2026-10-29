#!/usr/bin/env bash
#
# Create a compressed database backup and optionally copy it off-host.
#
# Usage:
#   ENV_FILE=/path/to/backend/.env ./scripts/backup-database.sh
#
# Cron (daily at 02:15):
#   15 2 * * * cd /srv/hbt/backend && ENV_FILE=/srv/hbt/backend/.env ./scripts/backup-database.sh >> /var/log/hbt-backup.log 2>&1
#
set -euo pipefail
umask 077

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${ENV_FILE:-$SCRIPT_DIR/../.env}"

if [[ -f "$ENV_FILE" ]]; then
    set -a
    # shellcheck disable=SC1090
    source "$ENV_FILE"
    set +a
fi

DB_CONNECTION="${DB_CONNECTION:-}"
if [[ -z "$DB_CONNECTION" ]]; then
    echo "ERROR: DB_CONNECTION is not set (looked in $ENV_FILE)." >&2
    exit 1
fi

BACKUP_DIR="${BACKUP_DIR:-$SCRIPT_DIR/../storage/app/backups}"
BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"
mkdir -p "$BACKUP_DIR"

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
TMP_FILE="$BACKUP_DIR/db-$STAMP.sql"
BACKUP_FILE="$TMP_FILE.gz"

cleanup() {
    rm -f "$TMP_FILE"
}
trap cleanup EXIT

echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] starting $DB_CONNECTION backup"

case "$DB_CONNECTION" in
    mysql|mariadb)
        : "${DB_DATABASE:?DB_DATABASE is required}"
        command -v mysqldump >/dev/null 2>&1 || {
            echo "ERROR: mysqldump is not installed." >&2
            exit 1
        }
        MYSQL_PWD="${DB_PASSWORD:-}" mysqldump \
            --single-transaction \
            --quick \
            --lock-tables=false \
            --no-tablespaces \
            --default-character-set="${DB_CHARSET:-utf8mb4}" \
            --host="${DB_HOST:-127.0.0.1}" \
            --port="${DB_PORT:-3306}" \
            --user="${DB_USERNAME:-root}" \
            "$DB_DATABASE" > "$TMP_FILE"
        ;;
    pgsql|postgres|postgresql)
        : "${DB_DATABASE:?DB_DATABASE is required}"
        command -v pg_dump >/dev/null 2>&1 || {
            echo "ERROR: pg_dump is not installed." >&2
            exit 1
        }
        PGPASSWORD="${DB_PASSWORD:-}" pg_dump \
            --no-owner \
            --no-acl \
            --host="${DB_HOST:-127.0.0.1}" \
            --port="${DB_PORT:-5432}" \
            --username="${DB_USERNAME:-postgres}" \
            --dbname="$DB_DATABASE" > "$TMP_FILE"
        ;;
    sqlite)
        : "${DB_DATABASE:?DB_DATABASE is required}"
        if [[ "$DB_DATABASE" == ":memory:" ]]; then
            echo "ERROR: cannot back up an in-memory SQLite database." >&2
            exit 1
        fi
        DB_PATH="$DB_DATABASE"
        if [[ "$DB_PATH" != /* ]]; then
            DB_PATH="$SCRIPT_DIR/../$DB_PATH"
        fi
        if [[ ! -f "$DB_PATH" ]]; then
            echo "ERROR: SQLite database not found at $DB_PATH." >&2
            exit 1
        fi
        if command -v sqlite3 >/dev/null 2>&1; then
            sqlite3 "$DB_PATH" ".backup '$TMP_FILE'"
        else
            cp "$DB_PATH" "$TMP_FILE"
        fi
        ;;
    *)
        echo "ERROR: unsupported DB_CONNECTION '$DB_CONNECTION'." >&2
        exit 1
        ;;
esac

gzip -c "$TMP_FILE" > "$BACKUP_FILE"
gzip -t "$BACKUP_FILE"

if [[ -n "${BACKUP_GPG_RECIPIENT:-}" ]]; then
    command -v gpg >/dev/null 2>&1 || {
        echo "ERROR: BACKUP_GPG_RECIPIENT is set but gpg is not installed." >&2
        exit 1
    }
    gpg --yes --encrypt --recipient "$BACKUP_GPG_RECIPIENT" "$BACKUP_FILE"
    rm -f "$BACKUP_FILE"
    BACKUP_FILE="$BACKUP_FILE.gpg"
fi

echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] wrote $(du -h "$BACKUP_FILE" | cut -f1) to $BACKUP_FILE"

if [[ -n "${BACKUP_S3_BUCKET:-}" ]]; then
    command -v aws >/dev/null 2>&1 || {
        echo "ERROR: BACKUP_S3_BUCKET is set but the AWS CLI is not installed." >&2
        exit 1
    }
    S3_KEY="${BACKUP_S3_PREFIX:-hbt/database}/$(basename "$BACKUP_FILE")"
    aws s3 cp "$BACKUP_FILE" "s3://$BACKUP_S3_BUCKET/$S3_KEY"
    echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] uploaded s3://$BACKUP_S3_BUCKET/$S3_KEY"
fi

find "$BACKUP_DIR" -maxdepth 1 -type f \
    \( -name 'db-*.sql.gz' -o -name 'db-*.sql.gz.gpg' \) \
    -mtime +"$BACKUP_RETENTION_DAYS" -delete

echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] backup complete"
