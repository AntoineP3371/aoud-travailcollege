# Travail collège Gianni : héberger le site sur votre serveur

PocketBase fait tout, avec un seul programme :

- il **sert le site** (le dossier `deploy/pb_public`) ;
- il **garde les données** : comptes (Gianni et parent), cours et cartes, feuilles d'exercices, travaux au Pencil, scores, corrigés ;
- le **tunnel Cloudflare** le rend accessible en HTTPS depuis Internet, sans ouvrir de port sur la box ;
- **GitHub** garde le code : une mise à jour = un `git pull` sur le serveur.

Chaque commande ci-dessous est dans son propre bloc, avec le résultat attendu juste après.
Les commandes sont pour Debian ou Ubuntu (Linux 64 bits). Remplacez `VOTRE_UTILISATEUR` par votre nom de connexion sur le serveur.

---

## 1. Préparer le serveur

Installer les outils nécessaires :

```bash
sudo apt update && sudo apt install -y git curl unzip sqlite3 rsync
```

Résultat attendu : la fin de l'installation, sans ligne `E:` (erreur).

Créer un utilisateur dédié, qui ne peut pas ouvrir de session :

```bash
sudo useradd --system --home /opt/aoud-travailcollege --shell /usr/sbin/nologin pocketbase
```

Résultat attendu : aucune sortie. (Si le message dit que l'utilisateur existe déjà, c'est bon.)

Créer le dossier de travail :

```bash
sudo mkdir -p /opt/aoud-travailcollege && sudo chown pocketbase:pocketbase /opt/aoud-travailcollege
```

Résultat attendu : aucune sortie.

## 2. Récupérer le code depuis GitHub

```bash
sudo -u pocketbase git clone https://github.com/AntoineP3371/aoud-travailcollege.git /opt/aoud-travailcollege/repo
```

Résultat attendu : `Cloning into '/opt/aoud-travailcollege/repo'...` puis `Resolving deltas: 100%`.
Si GitHub répond `Authentication failed`, le dépôt est privé : créez un jeton d'accès (lecture seule) dans GitHub, réglages du compte, puis lancez la commande avec `https://AntoineP3371:LE_JETON@github.com/AntoineP3371/aoud-travailcollege.git`.

## 3. Installer PocketBase

Télécharger le programme (version testée : 0.40.5) :

```bash
sudo -u pocketbase curl -L -o /opt/aoud-travailcollege/pb.zip https://github.com/pocketbase/pocketbase/releases/download/v0.40.5/pocketbase_0.40.5_linux_amd64.zip
```

Résultat attendu : une barre de progression qui finit à 100 %.

Le décompresser :

```bash
sudo -u pocketbase unzip -o /opt/aoud-travailcollege/pb.zip pocketbase -d /opt/aoud-travailcollege
```

Résultat attendu : `inflating: /opt/aoud-travailcollege/pocketbase`.

Vérifier :

```bash
/opt/aoud-travailcollege/pocketbase --version
```

Résultat attendu : `pocketbase version 0.40.5`.

Supprimer l'archive :

```bash
sudo rm /opt/aoud-travailcollege/pb.zip
```

Résultat attendu : aucune sortie.

## 4. Créer le compte administrateur de PocketBase

C'est le compte qui ouvre le tableau de bord (adresse `/_/`). Remplacez l'adresse et le mot de passe (8 caractères minimum) :

```bash
sudo -u pocketbase /opt/aoud-travailcollege/pocketbase superuser upsert votre@adresse.fr UN_MOT_DE_PASSE_LONG --dir=/opt/aoud-travailcollege/pb_data
```

Résultat attendu : `Successfully saved superuser "votre@adresse.fr"!`

## 5. Lancer PocketBase en service

Installer le service :

```bash
sudo cp /opt/aoud-travailcollege/repo/deploy/aoud-travailcollege.service /etc/systemd/system/
```

Résultat attendu : aucune sortie.

Le démarrer, et le faire démarrer avec le serveur :

```bash
sudo systemctl enable --now aoud-travailcollege
```

Résultat attendu : `Created symlink /etc/systemd/system/multi-user.target.wants/aoud-travailcollege.service ...`

Vérifier qu'il tourne :

```bash
sudo systemctl status aoud-travailcollege --no-pager
```

Résultat attendu : une ligne `Active: active (running)`. (Quittez avec `q` si besoin.)

Tester le serveur depuis le serveur lui-même :

```bash
curl http://127.0.0.1:8090/api/health
```

Résultat attendu : `{"message":"API is healthy.","code":200,"data":{}}`

## 6. Créer les comptes, importer les corrigés et les cours

Les **corrigés** ne sont volontairement pas dans GitHub (le dépôt est lisible par tous). Ils sont dans le fichier `corriges-travail-college.zip` que Claude vous a envoyé dans la conversation.
Depuis **votre ordinateur**, copiez ce fichier sur le serveur (adaptez l'adresse du serveur) :

```bash
scp corriges-travail-college.zip VOTRE_UTILISATEUR@ADRESSE_DU_SERVEUR:/tmp/
```

Résultat attendu : une ligne avec le nom du fichier et `100%`.

Sur le serveur, le décompresser dans un dossier réservé :

```bash
sudo mkdir -p /opt/aoud-travailcollege/corriges && sudo unzip -o /tmp/corriges-travail-college.zip -d /opt/aoud-travailcollege/corriges && sudo chown -R pocketbase:pocketbase /opt/aoud-travailcollege/corriges
```

Résultat attendu : une liste de `inflating: .../c-maths-1.jpg` etc. (12 fichiers).

Saisir les secrets dans le terminal. Ils restent en mémoire, jamais dans un fichier. Mot de passe administrateur (celui de l'étape 4) :

```bash
read -rsp "Mot de passe admin PocketBase : " PB_ADMIN_PASSWORD; export PB_ADMIN_PASSWORD; echo
```

Résultat attendu : rien ne s'affiche pendant la saisie, puis un retour à la ligne.

Mot de passe du compte de Gianni (8 caractères minimum, c'est ce que vous saisirez une fois sur son iPad) :

```bash
read -rsp "Mot de passe de Gianni : " GIANNI_PASSWORD; export GIANNI_PASSWORD; echo
```

Résultat attendu : idem.

Code de l'espace parent (celui que vous tapez dans « Espace parent », par exemple 0507) :

```bash
read -rsp "Code parent : " PARENT_CODE; export PARENT_CODE; echo
```

Résultat attendu : idem.

Indiquer l'adresse et l'identifiant de l'administrateur :

```bash
export PB_URL=http://127.0.0.1:8090 PB_ADMIN_EMAIL=votre@adresse.fr
```

Résultat attendu : aucune sortie.

Créer les deux comptes et importer les corrigés :

```bash
python3 /opt/aoud-travailcollege/repo/deploy/bootstrap.py --corriges /opt/aoud-travailcollege/corriges
```

Résultat attendu : `Compte créé : gianni@travail.local`, `Compte créé : parent@travail.local`, douze lignes `Corrigé importé : ...`, puis `Terminé.`

Importer les matières et les cours (cartes, feuilles d'exercices, PDF) :

```bash
python3 /opt/aoud-travailcollege/repo/deploy/seed_courses.py
```

Résultat attendu : `Matière créée : maths` (et 3 autres), cinq lignes `Cours créé : ...` avec `fichiers envoyés`, puis `Terminé.`
Relancer cette commande ne crée pas de doublon et ne touche pas aux cartes que vous auriez modifiées.

Effacer les secrets de la session et le fichier copié :

```bash
unset PB_ADMIN_PASSWORD GIANNI_PASSWORD PARENT_CODE; sudo rm /tmp/corriges-travail-college.zip
```

Résultat attendu : aucune sortie.

## 7. Ouvrir le site sur Internet avec Cloudflare Tunnel

Prérequis : le nom de domaine (par exemple `gmpbordeaux.fr`) est géré dans votre compte Cloudflare. Choisissez l'adresse du site, par exemple `travail.gmpbordeaux.fr`.

1. Dans le tableau de bord Cloudflare, ouvrez **Zero Trust**, puis **Réseaux**, puis **Tunnels**, puis **Créer un tunnel**, type **Cloudflared**. Donnez-lui le nom `aoud-travailcollege`.
2. Cloudflare affiche alors une commande d'installation contenant un long jeton. Copiez uniquement la commande pour **Debian** (64 bits). Elle installe `cloudflared` et lance le tunnel en service.
3. Dans l'étape **Nom d'hôte public**, saisissez le sous-domaine (`travail`), le domaine (`gmpbordeaux.fr`), type **HTTP**, URL `localhost:8090`. Enregistrez.

Vérifier que le service du tunnel tourne :

```bash
sudo systemctl status cloudflared --no-pager
```

Résultat attendu : `Active: active (running)`.

Tester depuis votre ordinateur (adaptez l'adresse) :

```bash
curl https://travail.gmpbordeaux.fr/api/health
```

Résultat attendu : `{"message":"API is healthy.","code":200,"data":{}}`

Le serveur n'écoute que sur `127.0.0.1` : le seul chemin d'entrée est le tunnel. PocketBase lit l'adresse réelle du visiteur dans l'en-tête `CF-Connecting-IP` : la limite de 5 essais de mot de passe par minute s'applique donc à chaque visiteur séparément.

## 8. Premier usage sur l'iPad

1. Ouvrez `https://travail.gmpbordeaux.fr` dans Safari (l'adresse de l'étape 7).
2. Touchez **☁ Se connecter**, saisissez le mot de passe de Gianni (étape 6). La pastille passe à **☁ Synchronisé**.
3. Pour avoir l'icône sur l'écran d'accueil : bouton de partage de Safari, puis **Sur l'écran d'accueil**.
4. Espace parent : touchez **Espace parent**, saisissez le code. Après la saisie, le bouton **✎ Modifier ce cours** apparaît.

### Récupérer les travaux déjà faits sur l'ancienne adresse

Le navigateur garde les travaux **par adresse de site**. Ceux qui ont été faits sur `www.gmpbordeaux.fr/travail-college` ne sont pas visibles sur la nouvelle adresse. Pour les transférer :

1. Sur l'**ancienne** adresse, bouton **Exporter mes travaux** (section Sauvegarde) : un fichier `travaux-gianni-AAAAMMJJ.json` est enregistré dans Fichiers.
2. Sur la **nouvelle** adresse, connectez-vous (étape 8.2), puis bouton **Importer une sauvegarde** et choisissez ce fichier.
3. Les travaux apparaissent et partent aussitôt sur le serveur. Vérifiez que la pastille indique **Synchronisé**.

## 9. Modifier les cours

- **Cartes et textes** : espace parent, puis **✎ Modifier ce cours**. Vous pouvez corriger, ajouter, supprimer et réordonner les cartes, puis **Enregistrer**. Le bouton **+ Nouveau cours** crée un cours (et une matière si besoin).
- **Feuille d'exercices (images des pages), PDF à imprimer** : à déposer dans le tableau de bord PocketBase, adresse `https://travail.gmpbordeaux.fr/_/`, collection `courses`, champs `pages` et `pdf`.
- **Corrigé de la feuille** : collection `corriges` : un enregistrement par page, avec `sub` = la clé du cours (visible dans la collection `courses`, champ `key`), `page` = 1, 2, 3… et l'image.
- Pour un cours complet avec feuille et corrigé prêts à l'emploi, envoyez le cours à Claude : il prépare les cartes, la feuille, le corrigé et les fichiers d'import.

## 10. Mettre à jour le site

Quand une nouvelle version est poussée sur GitHub, lancez sur le serveur :

```bash
/opt/aoud-travailcollege/repo/deploy/update.sh
```

Résultat attendu : le résumé du `git pull` (fichiers modifiés), puis `{"message":"API is healthy.","code":200,"data":{}}`.
Les cours, les comptes et les travaux ne sont pas touchés : ils sont dans `/opt/aoud-travailcollege/pb_data`, hors du dépôt.

## 11. Sauvegardes

Le Mac mini a deux disques : utilisez le second. Montez-le (par exemple sur `/mnt/disque2`), puis testez une sauvegarde à la main :

```bash
sudo /opt/aoud-travailcollege/repo/deploy/backup.sh /mnt/disque2/sauvegardes-aoud-travailcollege
```

Résultat attendu : `Sauvegarde faite : /mnt/disque2/sauvegardes-aoud-travailcollege/data-AAAAMMJJ-HHMM.db`.

Programmer une sauvegarde chaque nuit à 3 h :

```bash
echo '0 3 * * * root /opt/aoud-travailcollege/repo/deploy/backup.sh /mnt/disque2/sauvegardes-aoud-travailcollege' | sudo tee /etc/cron.d/travail-college-backup
```

Résultat attendu : la ligne s'affiche en écho.
Les copies de plus de 30 jours sont supprimées automatiquement.
Une sauvegarde sur le même serveur ne protège pas d'un vol ou d'un incendie : copiez de temps en temps le dossier de sauvegarde sur un autre support.

## 12. Dépannage

| Problème | Que faire |
|---|---|
| Le site ne s'ouvre pas | `sudo systemctl status aoud-travailcollege` et `sudo systemctl status cloudflared` : les deux doivent être `active (running)`. |
| « Serveur injoignable » dans la page | Le serveur est éteint ou hors ligne. Les travaux restent sur l'iPad et partiront à la reconnexion. |
| « Trop d'essais » à la connexion | Attendre une minute : la limite est de 5 essais par minute et par visiteur. |
| Voir les messages du serveur | `sudo journalctl -u aoud-travailcollege -n 50 --no-pager` |
| Mot de passe de Gianni oublié | Refaire l'étape 6 (saisie des secrets, puis `bootstrap.py` sans l'option `--corriges`) : le mot de passe est mis à jour. |
| Code parent à changer | Même commande : `PARENT_CODE` avec le nouveau code. |
