/// <reference path="../pb_data/types.d.ts" />
// Collections de « Travail collège Gianni » :
//   users     : deux comptes (rôle student ou parent), inscription fermée
//   ink       : tracés au Pencil, une fiche par matière
//   scores    : meilleur score par matière
//   runs      : historique des QCM terminés
//   corriges  : pages de corrigé, visibles uniquement du parent (fichiers protégés)
migrate((app) => {
  const users = app.findCollectionByNameOrId("users");
  users.fields.add(new SelectField({ name: "role", required: true, maxSelect: 1, values: ["student", "parent"] }));
  users.createRule = null;                 // personne ne peut créer de compte depuis le site
  users.authToken.duration = 31536000;     // connexion conservée 1 an (renouvelée à chaque ouverture)
  app.save(users);

  const STUDENT = '@request.auth.role = "student"';
  const PARENT = '@request.auth.role = "parent"';
  const AUTH = '@request.auth.id != ""';

  app.save(new Collection({
    type: "base", name: "ink",
    fields: [
      { type: "text", name: "sub", required: true },
      { type: "json", name: "strokes", maxSize: 8000000 },
      { type: "number", name: "ts" },
      { type: "autodate", name: "created", onCreate: true },
      { type: "autodate", name: "updated", onCreate: true, onUpdate: true },
    ],
    indexes: ["CREATE UNIQUE INDEX idx_ink_sub ON ink (sub)"],
    listRule: AUTH, viewRule: AUTH, createRule: STUDENT, updateRule: STUDENT, deleteRule: null,
  }));

  app.save(new Collection({
    type: "base", name: "scores",
    fields: [
      { type: "text", name: "key", required: true },
      { type: "number", name: "best" },
      { type: "autodate", name: "updated", onCreate: true, onUpdate: true },
    ],
    indexes: ["CREATE UNIQUE INDEX idx_scores_key ON scores (key)"],
    listRule: AUTH, viewRule: AUTH, createRule: STUDENT, updateRule: STUDENT, deleteRule: null,
  }));

  app.save(new Collection({
    type: "base", name: "runs",
    fields: [
      { type: "text", name: "key", required: true },
      { type: "number", name: "pts" },
      { type: "number", name: "total" },
      { type: "autodate", name: "created", onCreate: true },
    ],
    listRule: AUTH, viewRule: AUTH, createRule: STUDENT, updateRule: null, deleteRule: null,
  }));

  app.save(new Collection({
    type: "base", name: "corriges",
    fields: [
      { type: "text", name: "sub", required: true },
      { type: "number", name: "page", required: true },
      { type: "file", name: "img", required: true, maxSelect: 1, maxSize: 8000000, protected: true,
        mimeTypes: ["image/jpeg", "image/png"] },
    ],
    indexes: ["CREATE UNIQUE INDEX idx_corriges_sub_page ON corriges (sub, page)"],
    listRule: PARENT, viewRule: PARENT, createRule: null, updateRule: null, deleteRule: null,
  }));

  // Limiter les essais de mot de passe (le code parent est court)
  const s = app.settings();
  s.rateLimits.enabled = true;
  s.rateLimits.rules = [
    { label: "*:auth", maxRequests: 5, duration: 60 },
    { label: "*:create", maxRequests: 60, duration: 60 },
    { label: "/api/", maxRequests: 600, duration: 10 },
  ];
  app.save(s);
}, (app) => {
  for (const n of ["corriges", "runs", "scores", "ink"]) {
    try { app.delete(app.findCollectionByNameOrId(n)); } catch (e) {}
  }
});
