#!/usr/bin/env bash
# Met à jour le site depuis GitHub, puis redémarre PocketBase (les nouvelles migrations s'appliquent au démarrage).
set -euo pipefail
sudo -u pocketbase git -C /opt/aoud-travailcollege/repo pull --ff-only
# Les scripts serveur (changement du mot de passe de Gianni depuis l'espace parent) vivent dans le dépôt
sudo ln -sfn /opt/aoud-travailcollege/repo/deploy/pb_hooks /opt/aoud-travailcollege/pb_hooks
sudo systemctl restart aoud-travailcollege
sleep 3
curl -fsS http://127.0.0.1:8090/api/health && echo
