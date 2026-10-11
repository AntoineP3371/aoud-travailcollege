/// <reference path="../pb_data/types.d.ts" />
// Cours de « Travail collège Gianni » :
//   subjects : les matières (onglets) et leur couleur
//   courses  : un cours = cartes (JSON), feuille d'exercices (images des pages), PDF à imprimer
// Lecture publique (le contenu des cours n'a rien de secret : les corrigés sont dans « corriges », réservés au parent).
// Création, modification et suppression : compte parent uniquement.
migrate((app) => {
  const PARENT = '@request.auth.role = "parent"';

  app.save(new Collection({
    type: "base", name: "subjects",
    fields: [
      { type: "text", name: "key", required: true },
      { type: "text", name: "name", required: true },
      { type: "text", name: "color" },
      { type: "number", name: "position" },
    ],
    indexes: ["CREATE UNIQUE INDEX idx_subjects_key ON subjects (key)"],
    listRule: "", viewRule: "", createRule: PARENT, updateRule: PARENT, deleteRule: PARENT,
  }));

  app.save(new Collection({
    type: "base", name: "courses",
    fields: [
      { type: "text", name: "key", required: true },
      { type: "text", name: "subject", required: true },
      { type: "text", name: "label" },
      { type: "text", name: "eyebrow" },
      { type: "text", name: "title" },
      { type: "text", name: "sub" },
      { type: "text", name: "exo" },
      { type: "number", name: "position" },
      { type: "text", name: "file_name" },
      { type: "json", name: "cards", maxSize: 5000000 },
      { type: "file", name: "pages", maxSelect: 30, maxSize: 10000000, mimeTypes: ["image/jpeg", "image/png", "image/webp"] },
      { type: "file", name: "pdf", maxSelect: 1, maxSize: 30000000, mimeTypes: ["application/pdf"] },
    ],
    indexes: ["CREATE UNIQUE INDEX idx_courses_key ON courses (key)"],
    listRule: "", viewRule: "", createRule: PARENT, updateRule: PARENT, deleteRule: PARENT,
  }));
}, (app) => {
  for (const n of ["courses", "subjects"]) {
    try { app.delete(app.findCollectionByNameOrId(n)); } catch (e) {}
  }
});
