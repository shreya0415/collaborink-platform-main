#!/usr/bin/env bash
# MongoDB backup script — dumps to ./backups/<timestamp>/
set -euo pipefail

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="./backups/${TIMESTAMP}"
MONGO_URI="${MONGO_URI:-mongodb://localhost:27017/collaborink}"

mkdir -p "$BACKUP_DIR"

echo "[backup] Starting dump → ${BACKUP_DIR}"
mongodump --uri="$MONGO_URI" --out="$BACKUP_DIR"

# Compress
tar -czf "${BACKUP_DIR}.tar.gz" -C ./backups "$TIMESTAMP"
rm -rf "$BACKUP_DIR"

echo "[backup] Done: ${BACKUP_DIR}.tar.gz"

# Optional: prune backups older than 30 days
find ./backups -name "*.tar.gz" -mtime +30 -delete
