#!/usr/bin/env bash
# Run daily via cron on the OCI VM:
#   0 3 * * * /opt/community/scripts/db-backup.sh
set -euo pipefail

BACKUP_DIR="/opt/backups/postgres"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
DB_NAME="community_db"
DB_USER="community_user"
RETENTION_DAYS=30

mkdir -p "$BACKUP_DIR"

docker exec community-db pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$BACKUP_DIR/${DB_NAME}-${TIMESTAMP}.sql.gz"

# Upload to MinIO for off-server redundancy
docker exec community-storage mc alias set local http://localhost:9000 minioadmin "${MINIO_ROOT_PASSWORD}"
docker exec community-storage mc cp "/data/backups/${DB_NAME}-${TIMESTAMP}.sql.gz" local/community-backups/

# Remove backups older than retention period
find "$BACKUP_DIR" -name "${DB_NAME}-*.sql.gz" -mtime +$RETENTION_DAYS -delete

# Keep only last 30 in MinIO too (list + filter via mc)
docker exec community-storage mc rm --older-than ${RETENTION_DAYS}d --recursive local/community-backups/

echo "Backup complete: ${DB_NAME}-${TIMESTAMP}.sql.gz"
