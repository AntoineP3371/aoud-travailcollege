/// <reference path="../pb_data/types.d.ts" />
// Icône (emoji) facultative par matière, affichée sur la page Sommaire.
// Sans valeur, le site utilise une icône par défaut (📐 maths, 🤝 EMC, 🏺 histoire-géo, 🌍 SVT, 📘 autre).
migrate((app) => {
  const c = app.findCollectionByNameOrId("subjects");
  if (!c.fields.getByName("icon")) {
    c.fields.add(new TextField({ name: "icon", max: 16 }));
    app.save(c);
  }
}, (app) => {
  const c = app.findCollectionByNameOrId("subjects");
  const f = c.fields.getByName("icon");
  if (f) { c.fields.removeById(f.id); app.save(c); }
});
