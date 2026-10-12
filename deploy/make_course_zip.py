#!/usr/bin/env python3
"""Fabrique le zip d'un cours, à importer depuis le site (éditeur, « Importer un cours (zip) »).

Usage :
  make_course_zip.py cours.json SORTIE.zip [--pages p1.jpg p2.jpg ...] [--pdf exercices.pdf] [--corriges c1.jpg c2.jpg ...]

cours.json :
  { "subject": {"key": "svt", "name": "SVT", "color": "#6b3fa0"},
    "course":  {"key": "svt", "label": "La Terre", "eyebrow": "...", "title": "...", "sub": "...", "exo": "...",
                "file_name": "exercices_svt_la_terre.pdf", "cards": [{"tag": "", "q": "", "o": ["bonne", "m1", "m2", "m3"], "e": ""}]} }
Les corrigés sont rangés dans l'ordre : le premier fichier est la page 1.
Le zip n'est pas compressé (les JPEG ne se compressent pas) : le navigateur le lit directement.
"""
import json, os, re, sys, zipfile


def main():
    a = sys.argv[1:]
    if len(a) < 2:
        sys.exit(__doc__)
    src, out = a[0], a[1]
    groups, cur = {"pages": [], "pdf": [], "corriges": []}, None
    for x in a[2:]:
        if x in ("--pages", "--pdf", "--corriges"):
            cur = x[2:]
        elif cur:
            groups[cur].append(x)
        else:
            sys.exit("Argument inattendu : " + x)
    meta = json.load(open(src, encoding="utf-8"))
    c, s = meta["course"], meta["subject"]
    for k in (c["key"], s["key"]):
        if not re.fullmatch(r"[a-z0-9]{1,24}", k):
            sys.exit(f"Clé invalide (a-z et 0-9 seulement) : {k}")
    for i, x in enumerate(c["cards"], 1):
        if not (x.get("q") and x.get("e") and len(x.get("o", [])) == 4 and all(x["o"])):
            sys.exit(f"Carte {i} invalide (question, 4 réponses, explication)")
    names = [os.path.basename(f) for f in groups["pages"] + groups["pdf"] + groups["corriges"]]
    if len(set(names)) != len(names):
        sys.exit("Deux fichiers portent le même nom.")
    manifest = {"format": 1, "subject": s, "course": c,
                "pages": [os.path.basename(f) for f in groups["pages"]],
                "pdf": os.path.basename(groups["pdf"][0]) if groups["pdf"] else None,
                "corriges": [os.path.basename(f) for f in groups["corriges"]]}
    with zipfile.ZipFile(out, "w", zipfile.ZIP_STORED) as z:
        z.writestr("cours.json", json.dumps(manifest, ensure_ascii=False))
        for f in groups["pages"] + groups["pdf"] + groups["corriges"]:
            z.write(f, os.path.basename(f))
    print(f"{out} : {os.path.getsize(out) // 1024} Ko, {len(c['cards'])} cartes, {len(groups['pages'])} page(s), "
          f"{len(groups['corriges'])} corrigé(s)")


main()
