# PR #121 — Validation des remédiations de sécurité

**Branche :** `fix/chariow-pulse-identity-retry-audit`  
**Date :** 10 novembre 2026  
**PR cible :** #121

## Verdict

Les trois findings HIGH de l’audit sécurité ont été corrigés sur la branche de travail et validés par les tests ciblés, les contrats complets et la suite E2E.

**Verdict technique : GO pour revue et fusion de la PR #121.**

La validation de staging Supabase/Chariow réel, la configuration d’un limiteur distribué et les secrets de production restent des opérations de déploiement distinctes.

## Corrections appliquées

### F-01 — Rate limiting d’authentification

Ajout de `bff/src/rate-limiter.js` avec un limiteur à fenêtre fixe, injectable pour les tests et configurable par variables d’environnement :

- `AUTH_RATE_LIMIT_WINDOW_MS` — défaut `60000` ;
- `AUTH_RATE_LIMIT_MAX` — défaut `10`.

Routes protégées :

- `POST /v1/auth/login` ;
- `POST /v1/auth/register` ;
- `POST /v1/auth/password-reset/request`.

En cas de dépassement :

- HTTP `429` ;
- code d’erreur `rate_limited` ;
- en-tête `Retry-After` en secondes ;
- aucun appel fournisseur n’est effectué.

Le limiteur mémoire convient au BFF mono-instance de validation. Pour une production multi-instance, il doit être remplacé par un quota distribué Redis/edge/provider équivalent.

### F-02 — Sessions des comptes verrouillés ou bannis

`withUser()` vérifie maintenant le statut retourné par `auth.getUser()`.

Tout statut différent de `active` :

- révoque immédiatement la session courante ;
- retourne HTTP `401` ;
- retourne le code générique `account_inactive` ;
- ne donne pas d’information sensible sur le compte.

### F-03 — Machine d’état Billing monotone

`PostgrestBillingStore.applyChariowTransition()` :

- lit l’état fournisseur existant avant l’upsert ;
- persiste `provider_event_at` ;
- rejette les événements dont l’horodatage est antérieur ou égal à l’événement courant ;
- empêche une licence `expired` ou `revoked` de redevenir `active` ou `pending` ;
- autorise une révocation plus forte et plus récente d’une licence expirée ;
- conserve l’idempotence existante par `delivery_id`.

La migration `0004_chariow_billing.sql` ajoute la colonne et son index, y compris pour une table déjà créée grâce à `ADD COLUMN IF NOT EXISTS`.

## Tests exécutés

| Contrôle | Résultat |
|---|---:|
| `tests/test_security_remediations.js` | PASS |
| `tests/test_p4_chariow_billing.js` | PASS |
| `tests/test_billing_store.js` | PASS |
| `tests/test_p3_account_lifecycle.js` | PASS |
| Tous les `tests/test_*.js` | PASS |
| `tests/verify_route_register_consistency.js` | PASS |
| Audit RLS et migration inventory | PASS |
| Syntaxe BFF/frontend | PASS |
| `git diff --check` | PASS |
| Suite Playwright `tests/run.js` | **58 passed, 0 failed** |

## Scénarios négatifs ajoutés

- troisième tentative d’authentification au-delà du quota : HTTP 429 + `Retry-After` ;
- compte retourné comme `locked` avec session existante : HTTP 401 + session révoquée ;
- activation postérieure à une révocation : refusée ;
- événement ancien reçu après un événement plus récent : refusé ;
- révocation plus récente d’un état expiré : acceptée.

## Fichiers principaux

- `bff/src/rate-limiter.js`
- `bff/src/app.js`
- `bff/src/billing-store.js`
- `supabase/migrations/0004_chariow_billing.sql`
- `tests/test_security_remediations.js`
- `tests/test_billing_store.js`
- `bff/README.md`

## Réserves avant production réelle

1. Appliquer et vérifier la migration sur Supabase staging.
2. Tester les permutations réelles de webhooks Chariow signés.
3. Remplacer le limiteur mémoire par une solution distribuée si plusieurs instances BFF sont utilisées.
4. Vérifier les secrets, headers HTTPS, observabilité et rotation de clés dans l’environnement de production.
5. Ne pas activer l’encaissement Premium avant validation opérationnelle Chariow/Supabase.
