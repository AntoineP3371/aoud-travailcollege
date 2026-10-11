#!/usr/bin/env python3
"""Crée les comptes de « Travail collège Gianni » dans PocketBase et importe les corrigés.

Variables d'environnement (rien n'est écrit dans un fichier) :
  PB_URL             ex. http://127.0.0.1:8090
  PB_ADMIN_EMAIL     compte administrateur (superuser) PocketBase
  PB_ADMIN_PASSWORD
  GIANNI_PASSWORD    mot de passe du compte de Gianni (8 caractères minimum)
  PARENT_CODE        code de l'espace parent (celui que vous tapez sur la page)
Argument facultatif : --corriges DOSSIER  (images c-maths-1.jpg, c-emc-2.jpg, c-emcl-1.jpg, c-hg-1.jpg, c-svt-1.jpg…)
"""
import json, os, re, sys, glob, uuid, urllib.request, urllib.error

URL = os.environ.get("PB_URL", "http://127.0.0.1:8090").rstrip("/")


def call(method, path, data=None, token=None, raw=None, ctype="application/json"):
    body = raw if raw is not None else (json.dumps(data).encode() if data is not None else None)
    req = urllib.request.Request(URL + path, data=body, method=method)
    if body is not None:
        req.add_header("Content-Type", ctype)
    if token:
        req.add_header("Authorization", token)
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            t = r.read().decode()
            return json.loads(t) if t else {}
    except urllib.error.HTTPError as e:
        sys.exit(f"Erreur {e.code} sur {method} {path} : {e.read().decode()[:300]}")


def need(name):
    v = os.environ.get(name)
    if not v:
        sys.exit(f"Variable manquante : {name}")
    return v


def main():
    tok = call("POST", "/api/collections/_superusers/auth-with-password",
               {"identity": need("PB_ADMIN_EMAIL"), "password": need("PB_ADMIN_PASSWORD")})["token"]

    accounts = [("gianni@travail.local", need("GIANNI_PASSWORD"), "student"),
                ("parent@travail.local", "parent-" + need("PARENT_CODE"), "parent")]
    for email, pw, role in accounts:
        found = call("GET", "/api/collections/users/records?filter=" + urllib.request.quote(f'email="{email}"'), token=tok)["items"]
        rec = {"email": email, "password": pw, "passwordConfirm": pw, "role": role, "verified": True, "emailVisibility": True}
        if found:
            call("PATCH", f"/api/collections/users/records/{found[0]['id']}", rec, tok)
            print("Compte mis à jour :", email)
        else:
            call("POST", "/api/collections/users/records", rec, tok)
            print("Compte créé       :", email)

    if "--corriges" in sys.argv:
        d = sys.argv[sys.argv.index("--corriges") + 1]
        files = sorted(glob.glob(os.path.join(d, "c-*-*.jpg")))
        if not files:
            sys.exit("Aucune image c-<matière>-<n>.jpg trouvée dans " + d)
        for f in files:
            m = re.match(r"c-([a-z]+)-(\d+)\.jpg$", os.path.basename(f))
            sub, page = m.group(1), int(m.group(2))
            old = call("GET", "/api/collections/corriges/records?filter=" + urllib.request.quote(f'sub="{sub}" && page={page}'), token=tok)["items"]
            for o in old:
                call("DELETE", f"/api/collections/corriges/records/{o['id']}", token=tok)
            b = uuid.uuid4().hex
            parts = []
            for k, v in (("sub", sub), ("page", str(page))):
                parts.append(f'--{b}\r\nContent-Disposition: form-data; name="{k}"\r\n\r\n{v}\r\n'.encode())
            parts.append((f'--{b}\r\nContent-Disposition: form-data; name="img"; filename="{os.path.basename(f)}"\r\n'
                          f'Content-Type: image/jpeg\r\n\r\n').encode() + open(f, "rb").read() + b"\r\n")
            parts.append(f"--{b}--\r\n".encode())
            call("POST", "/api/collections/corriges/records", token=tok, raw=b"".join(parts),
                 ctype=f"multipart/form-data; boundary={b}")
            print("Corrigé importé   :", sub, "page", page)
    print("Terminé.")


main()
