#!/usr/bin/env bash
# Copie la base (cours, comptes, travaux, scores) et les fichiers vers un autre disque.
# Usage : backup.sh [dossier_de_destination]   (par défaut /mnt/disque2/sauvegardes-aoud-travailcollege)
set -euo pipefail
SRC=/opt/aoud-travailcollege/pb_data
DEST="${1:-/mnt/disque2/sauvegardes-aoud-travailcollege}"
STAMP="$(date +%Y%m%d-%H%M)"
mkdir -p "$DEST"
sqlite3 "$SRC/data.db" ".backup '$DEST/data-$STAMP.db'"
rsync -a "$SRC/storage/" "$DEST/storage/"
find "$DEST" -maxdepth 1 -name 'data-*.db' -mtime +30 -delete
echo "Sauvegarde faite : $DEST/data-$STAMP.db"
