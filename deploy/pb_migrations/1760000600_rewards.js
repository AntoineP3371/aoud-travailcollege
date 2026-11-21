/// <reference path="../pb_data/types.d.ts" />
// Coffre de récompenses de la page « Défis » :
//  - rewards : les récompenses choisies par les parents (lecture : tout compte connecté ; écriture : parent)
//  - claims  : les récompenses débloquées par l'élève avec ses Berries (création : élève ; « donnée » / suppression : parent)
migrate((app) => {
  const PARENT = '@request.auth.role = "parent"';
  const STUDENT = '@request.auth.role = "student"';
  const AUTH = '@request.auth.id != ""';
  app.save(new Collection({
    type: "base", name: "rewards",
    fields: [
      { type: "text", name: "icon", max: 16 },
      { type: "text", name: "label", required: true, max: 120 },
      { type: "number", name: "cost", required: true, min: 1, onlyInt: true },
      { type: "number", name: "position" },
      { type: "autodate", name: "created", onCreate: true },
      { type: "autodate", name: "updated", onCreate: true, onUpdate: true },
    ],
    listRule: AUTH, viewRule: AUTH, createRule: PARENT, updateRule: PARENT, deleteRule: PARENT,
  }));
  app.save(new Collection({
    type: "base", name: "claims",
    fields: [
      { type: "text", name: "icon", max: 16 },
      { type: "text", name: "label", required: true, max: 120 },
      { type: "number", name: "cost", required: true, min: 0, onlyInt: true },
      { type: "bool", name: "done" },
      { type: "autodate", name: "created", onCreate: true },
      { type: "autodate", name: "updated", onCreate: true, onUpdate: true },
    ],
    listRule: AUTH, viewRule: AUTH, createRule: STUDENT, updateRule: PARENT, deleteRule: PARENT,
  }));
}, (app) => {
  ["claims", "rewards"].forEach((n) => { try { app.delete(app.findCollectionByNameOrId(n)); } catch (e) {} });
});
