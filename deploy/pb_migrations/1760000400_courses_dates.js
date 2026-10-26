/// <reference path="../pb_data/types.d.ts" />
// Dates sur les cours (created / updated) : l'espace parent affiche le dernier cours ajouté.
migrate((app) => {
  const c = app.findCollectionByNameOrId("courses");
  if (!c.fields.getByName("created")) c.fields.add(new AutodateField({ name: "created", onCreate: true, onUpdate: false }));
  if (!c.fields.getByName("updated")) c.fields.add(new AutodateField({ name: "updated", onCreate: true, onUpdate: true }));
  app.save(c);
}, (app) => {
  const c = app.findCollectionByNameOrId("courses");
  c.fields.removeByName("created");
  c.fields.removeByName("updated");
  app.save(c);
});
