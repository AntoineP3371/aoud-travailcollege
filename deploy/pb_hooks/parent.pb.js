/// <reference path="../pb_data/types.d.ts" />
// Le compte parent peut fixer un nouveau mot de passe pour Gianni (sans connaître l'ancien).
// POST /api/parent/student-password   { "password": "..." }   (jeton du compte parent obligatoire)
routerAdd("POST", "/api/parent/student-password", (e) => {
  if (!e.auth || e.auth.getString("role") !== "parent") {
    throw new ForbiddenError("Réservé au compte parent.");
  }
  const body = e.requestInfo().body || {};
  const pw = String(body.password || "");
  if (pw.length < 8 || pw.length > 72) {
    throw new BadRequestError("Le mot de passe doit avoir entre 8 et 72 caractères.");
  }
  const stu = e.app.findFirstRecordByData("users", "role", "student");
  stu.setPassword(pw);
  e.app.save(stu);
  return e.json(200, { ok: true });
}, $apis.requireAuth("users"));
