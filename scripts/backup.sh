#!/bin/sh

# ==============================================
# AUTOMATED BACKUP SCRIPT - Synks Database
# ==============================================

set -e

BACKUP_DIR="/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="synks_backup_${TIMESTAMP}.tar.gz"
RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-30}

echo "[$(date)] Starting backup process..."

# Create backup directory if it doesn't exist
mkdir -p "${BACKUP_DIR}"

# Create backup
echo "[$(date)] Creating backup: ${BACKUP_FILE}"
tar -czf "${BACKUP_DIR}/${BACKUP_FILE}" -C /data .

# Verify backup was created
if [ -f "${BACKUP_DIR}/${BACKUP_FILE}" ]; then
    BACKUP_SIZE=$(du -h "${BACKUP_DIR}/${BACKUP_FILE}" | cut -f1)
    echo "[$(date)] Backup created successfully: ${BACKUP_FILE} (${BACKUP_SIZE})"
else
    echo "[$(date)] ERROR: Backup failed!"
    exit 1
fi

# Clean old backups
echo "[$(date)] Cleaning backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -name "synks_backup_*.tar.gz" -type f -mtime +${RETENTION_DAYS} -delete

# List current backups
BACKUP_COUNT=$(find "${BACKUP_DIR}" -name "synks_backup_*.tar.gz" -type f | wc -l)
echo "[$(date)] Total backups: ${BACKUP_COUNT}"

echo "[$(date)] Backup process completed!"
