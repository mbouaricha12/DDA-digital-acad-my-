# DDA — Audit de fiabilité de l'authentification (P0)

**Date :** 7 novembre 2026
**Branche :** `fix/auth-login-error-classification`
**Commit :** `a3928c5`
**Projet Supabase réel analysé :** `eqatvsvwohhjvtridyos` (supabase-bronze-kite)
**Déclencheur :** signalement du fondateur — des utilisateurs reçoivent « Mot de passe incorrect » après avoir défini leur mot de passe à l'inscription.
**Contexte :** la PR #217 avait déclaré l'inscription « déjà conforme » sur la seule base d'une lecture de code et de tests de contrat. Cet audit reproduit réellement le comportement (serveur BFF réel + navigateur réel) avant de conclure.

## 1. Cause racine exacte

Dans `bff/src/app.js`, le handler `POST /v1/auth/login` (avant correctif) :

```js
try { provider = await auth.login({ email: validation.email, password: body.password }); }
catch (error) { return sendError(res, 401, 'authentication_failed', 'Authentication failed.', requestId); }
```

**Toute** erreur de connexion — mauvais mot de passe, e-mail non confirmé, rate-limit côté Supabase, panne réseau/provider — était réduite à un unique 401 générique `authentication_failed`. Côté client, `dist/app.js` (avant correctif) :

```js
error.textContent = authError?.status === 401 ? 'E-mail ou mot de passe incorrect.' : '...';
```

**Tout échec de connexion devenait donc « Mot de passe incorrect »**, y compris quand le mot de passe était strictement correct.

Aggravant : GoTrue (le service Auth de Supabase) renvoie **le même code HTTP 400** pour un mauvais mot de passe (`error_code: "invalid_credentials"`) et pour un e-mail non confirmé (`error_code: "email_not_confirmed"`). Seul le champ `error_code` du corps de réponse distingue les deux cas — et `bff/src/supabase-auth.js` ne capturait jamais ce champ (seulement `status` et `message`), donc l'information nécessaire pour distinguer les deux cas n'atteignait même pas le handler.

### Preuve

- **Logs Supabase réels** (`auth_logs`, projet `eqatvsvwohhjvtridyos`, fournis en amont de cette mission) : le compte `digimarketciagence@gmail.com` a utilisé un flux de récupération de mot de passe (`recovery_sent_at`) immédiatement avant sa seule connexion réussie — signature typique d'un utilisateur bloqué par un mot de passe qu'il croyait incorrect (très probablement un e-mail non confirmé masqué sous ce même message), contournant le blocage via « mot de passe oublié » plutôt que de comprendre la vraie cause.
- **Reproduction réelle** (`tests/test_auth_reliability_e2e.js`, scénario 3) : un compte créé puis non confirmé qui tente de se connecter avec son mot de passe **exact** reçoit, avant correctif, le message « E-mail ou mot de passe incorrect. » — strictement identique au symptôme signalé — alors que le mot de passe est correct et que la seule vraie cause est l'absence de confirmation d'e-mail.
- Les rafales de `400 Invalid login credentials` observées dans les logs réels (06/07 novembre, IP de type datacenter) restent, elles, cohérentes avec du trafic CI/Playwright testant un flux signup→login — à vérifier séparément si des échecs similaires réapparaissent après ce correctif (voir §7, écarts ouverts).

## 2. État avant correction

- Email/mot de passe correctement normalisés (trim + lowercase) de façon identique entre inscription et connexion (`bff/src/security.js:normalizeEmail`) — **écarté** comme cause, ce n'était pas le bug.
- Après confirmation d'e-mail (clic sur le lien), l'utilisateur n'est **pas** automatiquement connecté par conception (`/v1/auth/verify-email` ne crée pas de session) — comportement voulu, pas un bug, mais qui rend d'autant plus critique un message d'erreur honnête au premier login qui suit.
- Aucun état de chargement ni anti-double-soumission sur le formulaire de connexion/inscription.
- Aucun bouton pour afficher/masquer le mot de passe saisi.
- Un seul message d'erreur (« Mot de passe incorrect » ou générique) pour : mauvais mot de passe, e-mail non confirmé, rate-limit, panne serveur — aucune distinction.

## 3. Correctifs réalisés

1. **`bff/src/supabase-auth.js`** — `request()` capture désormais `error.code = body?.error_code || body?.code || null` sur toute erreur GoTrue, en plus de `status` et `message`. C'est la seule donnée qui permet de distinguer `invalid_credentials` de `email_not_confirmed` à statut HTTP identique.
2. **`bff/src/app.js`** — nouvelle fonction `classifyLoginError(error)` : distingue `email_not_confirmed` (403), `rate_limited` (429), `invalid_credentials` (401) et `server_error` (503, pour toute erreur sans statut HTTP — panne réseau/provider, jamais rapportée comme un mauvais mot de passe). Le handler `/v1/auth/login` utilise cette classification. Aucun mot de passe ni corps d'erreur brut du provider n'est jamais loggé (`logger('login_failed', { requestId, status, code })` uniquement).
3. **`dist/app.js`** — nouvelle fonction `authErrorMessage(authError, {signup})` qui traduit le code renvoyé par le BFF en message français honnête et distinct. Ajout d'un état de chargement (« Connexion… » / « Envoi… ») et d'un verrou anti-double-soumission sur le bouton (désactivé pendant la requête, réactivé dans un `finally`).
4. **`dist/academy.html` + `dist/alpha-polish.css`** — bouton « Afficher/Masquer » sur le champ mot de passe de connexion/inscription (un mot de passe mal retenu/mal tapé et invisible est une cause réelle et fréquente de ce symptôme exact).
5. Parcours de récupération de mot de passe, erreurs de validation et anti-enumeration **laissés inchangés** : ils étaient déjà corrects et distincts ; aucune régression introduite.

Aucune protection de sécurité réelle n'a été affaiblie : CSRF, rate-limiting, exigence de confirmation d'e-mail et anti-enumeration (une inscription avec un e-mail déjà existant renvoie toujours le même message générique) sont intacts et testés.

## 4. Fichiers modifiés

- `bff/src/supabase-auth.js`
- `bff/src/app.js`
- `dist/app.js`
- `dist/academy.html`
- `dist/alpha-polish.css`
- `tests/test_supabase_auth_adapter.js`
- `tests/test_bff_implementation.js`
- `tests/test_auth_reliability_e2e.js` (nouveau)

## 5. Tests réellement exécutés (chiffres exacts, sur la branche `fix/auth-login-error-classification`, après rebase propre sur `origin/main`)

| Suite | Résultat |
|---|---|
| `tests/test_*.js` (83 fichiers de contrat/unitaires) | **83 passed, 0 failed** |
| `tests/verify_route_register_consistency.js` | **PASS** |
| `tests/smoke_app_boot.js` | **24 checks PASS** |
| `tests/run.js` (régression Playwright complète) | **106 passed, 0 failed** |
| `tests/test_auth_reliability_e2e.js` (reproduction réelle, nouveau) | **15 passed, 0 failed** |

La reproduction réelle (`test_auth_reliability_e2e.js`) démarre :
- un vrai serveur HTTPS (certificat auto-signé généré à la volée — requis car la CSP de `academy.html` n'autorise `connect-src` qu'en `https:`, exactement comme en production) exécutant le **vrai** module `bff/src/app.js` (`createBff`), le même code que celui déployé sur Vercel ;
- un vrai serveur HTTP statique servant le **vrai** `dist/` ;
- un vrai navigateur Chromium piloté par Playwright, sans aucun mock de `fetch()` côté client — chaque requête HTTP est réelle entre le navigateur et le serveur BFF réel.

Le faux adaptateur Supabase utilisé (`makeFakeGoTrue`) reproduit fidèlement les formes de réponse réelles de GoTrue (statut + `error_code`) pour chaque cas, vérifiées contre les logs réels du projet `eqatvsvwohhjvtridyos`.

## 6. Résultat des 12 parcours demandés (P0.1)

| # | Parcours | Résultat |
|---|---|---|
| 1 | Inscription avec e-mail valide | PASS — formulaire accepté, message « vérification » affiché |
| 2 | Définition du mot de passe | PASS — compte créé côté serveur, non confirmé |
| 3 | Confirmation e-mail (flux `/verify`) | PASS — clic sur le lien réel confirme l'e-mail côté serveur |
| 4 | Connexion avec le mot de passe défini | PASS — **c'est le cœur de la régression** : avant correctif, ce parcours échouait avec « Mot de passe incorrect » si l'e-mail n'était pas encore confirmé ; le message est désormais honnête, et une fois confirmé, la connexion réussit et mène à l'Academy |
| 5 | Connexion avec mauvais mot de passe | PASS — message honnête « E-mail ou mot de passe incorrect » |
| 6 | Connexion avec e-mail non confirmé | PASS — message distinct « Confirme ton adresse e-mail… », jamais « mot de passe incorrect » |
| 7 | Connexion après déconnexion | PASS — session réellement révoquée côté serveur (`/v1/me` → 401 après logout), puis reconnexion réussie |
| 8 | Récupération du mot de passe | PASS — jeton de récupération réel émis côté serveur |
| 9 | Réinitialisation du mot de passe | PASS — ancien mot de passe rejeté après reset, nouveau mot de passe accepté |
| 10 | Connexion avec le nouveau mot de passe | PASS — inclus dans le même scénario que 8-9 |
| 11 | Session persistante + rafraîchissement de page | PASS — `/v1/me` reste à 200 après un rechargement complet de la page |
| 12 | Connexion mobile (viewport 390px) | PASS — parcours signup → confirmation → login complet en viewport 390×844 |

Contrôles complémentaires (P0.4/P0.5/P0.7) également vérifiés par le même test réel : bouton afficher/masquer le mot de passe fonctionnel, bouton de connexion désactivé pendant la requête puis réactivé après un échec, aucun mot de passe ni texte d'erreur brut du provider dans les logs du BFF, et l'anti-enumeration à l'inscription (e-mail déjà existant) reste intacte.

## 7. Écarts encore ouverts (honnêteté)

- Les rafales de `400 Invalid login credentials` observées dans les vrais logs Supabase (06-07 novembre, IP de type datacenter) n'ont **pas** pu être attribuées avec certitude à la suite CI/Playwright de ce dépôt faute d'accès direct, dans cette session, aux secrets réels (`SUPABASE_URL`/clés) ou à la configuration des workflows GitHub Actions exécutés en production. Il est recommandé de vérifier, côté fondateur, que `.github/workflows/e2e.yml` et tout script de test exécuté en CI ne pointent jamais vers le projet Supabase de production `eqatvsvwohhjvtridyos` mais vers un projet de test dédié ou un mock.
- Le message « panne serveur temporaire » (`server_error`, 503) n'a pas pu être déclenché contre un vrai GoTrue en panne (aucune panne provoquée sur l'infrastructure de production) ; sa couverture reste une reproduction fidèle du contrat (statut/`error_code` absents), testée aux deux niveaux (adaptateur et E2E réel), mais pas observée en conditions de panne réelle.
- Aucune modification n'a été apportée à la logique de `password-reset/confirm` (déjà correcte) ni au flux d'inscription (déjà jugé minimal par un audit précédent) — conformément à la consigne de ne pas complexifier un parcours déjà sobre en l'absence de preuve de friction de volume.

## 8. Lien de commit / PR

- Commit : `a3928c5` sur la branche `fix/auth-login-error-classification`
- Pull Request : voir lien ouvert dans ce même échange (créée après cet audit, tests confirmés verts). Le fondateur a autorisé explicitement la fusion sans attendre sa validation pour cette mission ; c'est lui qui exécute le merge.

## Confirmation

Aucun des 3 comptes réels existants (`mbouarichard01@gmail.com`, `digimarketciagence@gmail.com`, `soroalex46@gmail.com`) n'a été lu, modifié ou supprimé pendant cette mission. Tous les tests de reproduction tournent contre un faux adaptateur GoTrue en mémoire ; aucun appel d'écriture n'a été fait contre le projet Supabase de production `eqatvsvwohhjvtridyos`.

---
🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01YSFTagpMU5XhyhCmRiGKeR
