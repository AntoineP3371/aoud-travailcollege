/// <reference path="../pb_data/types.d.ts" />
// Le compte parent peut déposer, remplacer et supprimer les corrigés (import d'un cours depuis le site).
// La lecture reste réservée au parent, et les fichiers restent protégés.
migrate((app) => {
  const PARENT = '@request.auth.role = "parent"';
  const c = app.findCollectionByNameOrId("corriges");
  c.createRule = PARENT;
  c.updateRule = PARENT;
  c.deleteRule = PARENT;
  app.save(c);
}, (app) => {
  const c = app.findCollectionByNameOrId("corriges");
  c.createRule = null;
  c.updateRule = null;
  c.deleteRule = null;
  app.save(c);
});
