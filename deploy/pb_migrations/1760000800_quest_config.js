/// <reference path="../pb_data/types.d.ts" />
// Page « Défis » : réglage des jeux visibles par le parent.
// La collection « quest » garde une fiche « game » (progression, écrite par l'élève)
// et désormais une fiche « config » (jeux ouverts / masqués, écrite par le parent).
migrate((app) => {
  const c = app.findCollectionByNameOrId("quest");
  c.createRule = '(@request.auth.role = "student" && @request.body.key = "game") || (@request.auth.role = "parent" && @request.body.key = "config")';
  c.updateRule = '(@request.auth.role = "student" && key = "game") || (@request.auth.role = "parent" && key = "config")';
  app.save(c);
}, (app) => {
  const c = app.findCollectionByNameOrId("quest");
  c.createRule = '@request.auth.role = "student"';
  c.updateRule = '@request.auth.role = "student"';
  app.save(c);
});
