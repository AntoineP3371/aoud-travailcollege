#!/usr/bin/env bash
# Met à jour le site depuis GitHub, puis redémarre PocketBase (les nouvelles migrations s'appliquent au démarrage).
set -euo pipefail
sudo -u pocketbase git -C /opt/travail-college/repo pull --ff-only
sudo systemctl restart travail-college
sleep 3
curl -fsS http://127.0.0.1:8090/api/health && echo
