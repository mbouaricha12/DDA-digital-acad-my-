# DDA Academy BFF

BFF Node.js minimal pour la frontière `app.example.dda.academy` → `api.example.dda.academy/v1`.

## Statut

- **Implémenté :** registration, email verification, login, password recovery request, CSRF cookie, `/me`, profile patch, session listing, logout, logout-all et session revocation.
- **Adaptateur :** Supabase Auth côté serveur et table `dda_sessions` via PostgREST.
- **Pont frontend :** `dist/bff-client.js` couvre l’inscription, la vérification e-mail, la connexion, la récupération de mot de passe, la restauration de session via `/v1/me` et la synchronisation du nom via `PATCH /v1/me` lorsque `window.DDA_BFF_BASE_URL` est renseigné.
- **Sécurité :** cookies `__Host-`, session opaque hashée, tokens Supabase chiffrés côté serveur, CSRF double-submit, CORS exact, Origin check, réponse anti-énumération, ownership dérivé de la session.
- **Non déployé :** aucun secret, aucun projet Supabase, aucun domaine ou endpoint distant n’est configuré par ce dépôt.
- **Schéma P3.1 préparé :** `dda_lesson_progress`, `dda_journal_entries`, `dda_journal_plans` et `dda_preferences` sont définies avec ownership serveur, bornes de taille, index et RLS ; elles ne sont pas encore appliquées au projet distant.
- **À compléter avant production :** endpoints d’export/suppression, profils/entitlements métier Postgres, migration distante P3.1, rate limiting distribué, observabilité redacted, tests de restauration et revue DPA/région.

## Lancer en environnement configuré

Le serveur refuse de démarrer si l’une des variables suivantes manque :

```text
SUPABASE_URL
SUPABASE_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY
SESSION_ENCRYPTION_KEY   # 32 octets encodés base64url
ALLOWED_ORIGINS          # ex. https://app.example.dda.academy
BFF_COOKIE_SECURE=true
PORT=8744
```

Le fichier `bff/supabase/schema.sql` doit être relu et appliqué manuellement dans un projet Supabase validé. La `SERVICE_ROLE_KEY` ne doit jamais être livrée au navigateur, au dépôt ou aux logs.

## Intégration frontend progressive

Le prototype reste local par défaut. Pour activer uniquement le pont session/profil sur une surface déployée, définir avant le chargement de `bff-client.js` :

```html
<script>window.DDA_BFF_BASE_URL = 'https://api.example.dda.academy';</script>
```

Le client frontend utilise `credentials: include`, demande le cookie CSRF via `/v1/security/csrf` avant toute mutation et appelle `/v1/me` pour restaurer la session. Le parcours Access expose alors **Créer un compte**, **Se connecter**, le traitement automatique de `token_hash`/`token` de vérification et **Mot de passe oublié ?**. Les réponses d’inscription et de récupération restent génériques afin de ne pas révéler l’existence d’une adresse.

En l’absence d’URL, ou en cas d’absence de session distante, `localStorage` et le parcours P2 restent inchangés. Le navigateur ne reçoit jamais `SUPABASE_SERVICE_ROLE_KEY`. Le serveur BFF doit autoriser exactement l’origine frontend dans `ALLOWED_ORIGINS` et utiliser `BFF_COOKIE_SECURE=true` en production.

## Tests

Depuis la racine :

```bash
node tests/test_bff_implementation.js
node tests/test_bff_frontend_integration.js
```

Le test utilise des adaptateurs mémoire/faux et n’appelle aucun service distant.
