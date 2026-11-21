/// <reference path="../pb_data/types.d.ts" />
// Page « Défis » : progression de l'élève (jours de série, Berries, réussites, trésors) – une seule fiche (key = "game").
migrate((app) => {
  const STUDENT = '@request.auth.role = "student"';
  const AUTH = '@request.auth.id != ""';
  app.save(new Collection({
    type: "base", name: "quest",
    fields: [
      { type: "text", name: "key", required: true },
      { type: "json", name: "data", maxSize: 2000000 },
      { type: "number", name: "ts" },
      { type: "autodate", name: "created", onCreate: true },
      { type: "autodate", name: "updated", onCreate: true, onUpdate: true },
    ],
    indexes: ["CREATE UNIQUE INDEX idx_quest_key ON quest (key)"],
    listRule: AUTH, viewRule: AUTH, createRule: STUDENT, updateRule: STUDENT, deleteRule: null,
  }));
}, (app) => {
  try { app.delete(app.findCollectionByNameOrId("quest")); } catch (e) {}
});
