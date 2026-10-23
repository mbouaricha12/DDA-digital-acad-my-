# DDA Academy BFF

BFF Node.js minimal pour la frontière `app.example.dda.academy` → `api.example.dda.academy/v1`.

## Statut

- **Implémenté :** registration, email verification, login, password recovery request, CSRF cookie, `/me`, profile patch, session listing, logout, logout-all, session revocation, export JSON `/v1/account/export` et suppression confirmée `/v1/account`.
- **Adaptateur :** Supabase Auth côté serveur et table `dda_sessions` via PostgREST.
- **Pont frontend :** `dist/bff-client.js` couvre l’inscription, la vérification e-mail, la connexion, la récupération de mot de passe, la restauration de session via `/v1/me` et la synchronisation du nom via `PATCH /v1/me` lorsque `window.DDA_BFF_BASE_URL` est renseigné.
- **Sécurité :** cookies `__Host-`, session opaque hashée, tokens Supabase chiffrés côté serveur, CSRF double-submit, CORS exact, Origin check, réponse anti-énumération, ownership dérivé de la session.
- **Non déployé :** aucun secret, aucun projet Supabase, aucun domaine ou endpoint distant n’est configuré par ce dépôt.
- **Entités métier :** l’export et la suppression BFF ciblent désormais les tables canoniques `lesson_progress`, `journal_entries`, `journal_plans` et `preferences`, créées par les migrations versionnées `0002` et `0003`.
- **Non prouvé pour la production :** aucune migration distante, intégration Chariow, restauration, rate limiting distribué, observabilité de production ou revue DPA/région n’est validée par les tests locaux.

## Lancer en environnement configuré

Le serveur refuse de démarrer si l’une des variables suivantes manque :

```text
BFF_ENVIRONMENT           # development, staging ou production — obligatoire
SUPABASE_URL
SUPABASE_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY
SESSION_ENCRYPTION_KEY   # 32 octets encodés base64url
ALLOWED_ORIGINS          # ex. https://app.example.dda.academy
EMAIL_REDIRECT_TO        # URL de retour, sur une origine allowlistée
BFF_COOKIE_SECURE=true
PORT=8744
```

En staging, il faut aussi renseigner `BFF_PRODUCTION_SUPABASE_URL` et `BFF_PRODUCTION_ALLOWED_ORIGINS` avec les références réelles de production. Le démarrage refuse si le projet Supabase ou une origine autorisée du staging recoupe la production. En production, les origines localhost sont refusées. Les références de comparaison ne sont pas des secrets; elles servent de garde-fou contre une erreur de configuration et ne remplacent pas la séparation des projets, secrets et comptes de déploiement.

La source SQL canonique est `../supabase/migrations/`, à appliquer dans l’ordre sur un environnement Supabase de staging après revue. `bff/supabase/schema.sql` est un ancien brouillon conservé pour historique et ne doit pas être appliqué. Ce dépôt n’exécute aucune migration automatiquement. La `SERVICE_ROLE_KEY` ne doit jamais être livrée au navigateur, au dépôt ou aux logs.

Le health check `/healthz` répond `200` sans créer de cookie. Au démarrage, le serveur valide les variables obligatoires, le mode de déploiement explicite, une clé de chiffrement base64url de 32 octets, des origines exactes HTTPS (localhost HTTP uniquement pour le développement) et un redirect e-mail dont l'origine est allowlistée. Les cookies `__Host-` restent toujours `Secure`.

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
npm test --prefix bff
node tests/test_bff_implementation.js
node tests/test_bff_frontend_integration.js
```

La suite BFF complète utilise des adaptateurs mémoire/faux et n’appelle aucun service distant, y compris les nouveaux tests de l’adaptateur Twelve Data.


## AutoTrader — données Twelve Data en lecture seule

Un adaptateur serveur optionnel existe pour `GET /time_series`. Le BFF expose `POST /v1/autotrader/provider-analysis`, qui accepte uniquement un `instrument_id` préconfiguré côté serveur, exige `autotrader.analysis`, réserve atomiquement les quotas utilisateur et fournisseur, puis renvoie une analyse descriptive historique v2. Les bougies brutes ne sont pas renvoyées par cette route; aucun signal, ordre, stop exploitable ou accès MT5 n’est généré. Le client navigateur n’envoie jamais de symbole arbitraire ni de clé fournisseur.

La source reste désactivée tant qu’aucune allowlist, clé API et référence de licence interne ne sont configurées. À l’activation, il faut aussi définir `DDA_AUTOTRADER_PROVIDER_ID=twelve-data` : cette valeur relie le provider aux quotas globaux. Le BFF refuse maintenant de démarrer si l’adaptateur Twelve Data est actif mais que cet identifiant de quota est absent ou différent. Les réglages sont `TWELVE_DATA_API_KEY` (gestionnaire de secrets uniquement), `DDA_AUTOTRADER_TWELVE_DATA_LICENSE_REF`, `DDA_AUTOTRADER_TWELVE_DATA_INSTRUMENTS_JSON` (allowlist JSON contrôlée par l’opérateur) et `DDA_AUTOTRADER_PROVIDER_ID`. La référence de licence est une étiquette d’audit interne, pas une preuve de droits.

Seuls les intervalles intrajournaliers fixes `1m`, `5m`, `15m`, `30m`, `1h` et `4h` sont normalisés aujourd’hui. Les bougies incomplètes sont exclues; le volume reste marqué `unavailable/not_verified` jusqu’à validation de son unité. Les intervalles quotidiens et hebdomadaires sont refusés tant que l’heure locale et le calendrier de place ne sont pas définis. Les tests utilisent uniquement des réponses simulées et n’appellent aucun endpoint Twelve Data.

Avant toute activation pour des utilisateurs DDA, l’exploitant doit confirmer contractuellement les droits d’affichage ou de distribution externe pour les instruments et les données dérivées réellement présentés, configurer les limites fournisseur selon son offre et définir le premier symbole, la place/MIC et le timeframe. La page Business Twelve Data distingue l’usage interne Basic de l’affichage externe Venture et de la distribution externe Enterprise; une clé API seule ne donne pas la permission commerciale requise.
