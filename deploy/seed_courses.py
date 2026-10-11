#!/usr/bin/env python3
"""Importe (ou met à jour) les matières et les cours de « Travail collège Gianni » dans PocketBase.

Idempotent : on peut le relancer sans créer de doublons (un cours est identifié par sa clé).
Il lit  seed/catalog.json  et les fichiers de  seed/files/ .

Variables d'environnement (rien n'est écrit dans un fichier) :
  PB_URL             ex. http://127.0.0.1:8090
  PB_ADMIN_EMAIL     compte administrateur (superuser) PocketBase
  PB_ADMIN_PASSWORD
Options :
  --cards-only       ne met à jour que le texte et les cartes (n'envoie pas les images ni les PDF)
  --force            écrase les cartes d'un cours déjà présent (par défaut elles sont conservées : elles ont pu être modifiées dans l'éditeur)
"""
import json, os, sys, uuid, urllib.request, urllib.error, urllib.parse

URL = os.environ.get("PB_URL", "http://127.0.0.1:8090").rstrip("/")
HERE = os.path.dirname(os.path.abspath(__file__))


def call(method, path, data=None, token=None, raw=None, ctype="application/json"):
    body = raw if raw is not None else (json.dumps(data).encode() if data is not None else None)
    req = urllib.request.Request(URL + path, data=body, method=method)
    if body is not None:
        req.add_header("Content-Type", ctype)
    if token:
        req.add_header("Authorization", token)
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            t = r.read().decode()
            return json.loads(t) if t else {}
    except urllib.error.HTTPError as e:
        sys.exit(f"Erreur {e.code} sur {method} {path} : {e.read().decode()[:400]}")


def need(name):
    v = os.environ.get(name)
    if not v:
        sys.exit(f"Variable manquante : {name}")
    return v


def multipart(fields, files):
    """fields : liste de (nom, valeur) ; files : liste de (champ, nom_de_fichier, octets, type_mime)."""
    b = uuid.uuid4().hex
    parts = []
    for k, v in fields:
        parts.append(f'--{b}\r\nContent-Disposition: form-data; name="{k}"\r\n\r\n{v}\r\n'.encode())
    for k, fn, data, mime in files:
        parts.append((f'--{b}\r\nContent-Disposition: form-data; name="{k}"; filename="{fn}"\r\n'
                      f'Content-Type: {mime}\r\n\r\n').encode() + data + b"\r\n")
    parts.append(f"--{b}--\r\n".encode())
    return b"".join(parts), f"multipart/form-data; boundary={b}"


def main():
    cards_only = "--cards-only" in sys.argv
    force = "--force" in sys.argv
    cat = json.load(open(os.path.join(HERE, "seed", "catalog.json"), encoding="utf-8"))
    tok = call("POST", "/api/collections/_superusers/auth-with-password",
               {"identity": need("PB_ADMIN_EMAIL"), "password": need("PB_ADMIN_PASSWORD")})["token"]

    for s in cat["subjects"]:
        f = urllib.parse.quote(f'key="{s["key"]}"')
        old = call("GET", f"/api/collections/subjects/records?filter={f}", token=tok)["items"]
        if old:
            print("Matière déjà présente :", s["key"])
        else:
            call("POST", "/api/collections/subjects/records", s, tok)
            print("Matière créée         :", s["key"])

    for c in cat["courses"]:
        f = urllib.parse.quote(f'key="{c["key"]}"')
        old = call("GET", f"/api/collections/courses/records?filter={f}", token=tok)["items"]
        meta = {k: c[k] for k in ("key", "subject", "label", "position", "eyebrow", "title", "sub", "exo", "file_name")}
        if old:
            rec = old[0]
            upd = {} if not force else {"cards": c["cards"]}
            if upd:
                call("PATCH", f"/api/collections/courses/records/{rec['id']}", upd, tok)
            print(("Cours remis à zéro    :" if force else "Cours déjà présent    :"), c["key"],
                  "(cartes écrasées)" if force else "(cartes conservées)")
            need_files = not cards_only and (not rec.get("pages") or not rec.get("pdf"))
            rid = rec["id"]
        else:
            rec = call("POST", "/api/collections/courses/records", dict(meta, cards=c["cards"]), tok)
            rid = rec["id"]
            print("Cours créé            :", c["key"], f"({len(c['cards'])} cartes)")
            need_files = not cards_only
        if need_files:
            files = []
            for n in c["pages"]:
                files.append(("pages", n, open(os.path.join(HERE, "seed", "files", n), "rb").read(), "image/jpeg"))
            if c.get("pdf"):
                files.append(("pdf", c["pdf"], open(os.path.join(HERE, "seed", "files", c["pdf"]), "rb").read(), "application/pdf"))
            body, ct = multipart([], files)
            call("PATCH", f"/api/collections/courses/records/{rid}", token=tok, raw=body, ctype=ct)
            print("   fichiers envoyés  :", len(c["pages"]), "page(s) + PDF")
    print("Terminé.")


main()
