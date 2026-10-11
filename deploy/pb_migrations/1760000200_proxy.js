/// <reference path="../pb_data/types.d.ts" />
// Derrière Cloudflare Tunnel, toutes les requêtes arrivent de 127.0.0.1 : PocketBase doit lire l'adresse réelle
// du visiteur dans l'en-tête CF-Connecting-IP, sinon la limite d'essais de mot de passe serait partagée par tout le monde.
migrate((app) => {
  const s = app.settings();
  s.trustedProxy.headers = ["CF-Connecting-IP"];
  s.trustedProxy.useLeftmostIP = false;
  app.save(s);
}, (app) => {
  const s = app.settings();
  s.trustedProxy.headers = [];
  app.save(s);
});
