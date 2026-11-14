# DDA — Smoke test production : prérequis, exécution, preuves

**Date :** 13 novembre 2026
**Script :** `scripts/smoke_test_production.js`
**Statut d'exécution réelle : NON EXÉCUTÉ.** Ce document prépare un test reproductible ; il ne prétend à aucun résultat réel. L'environnement d'exécution de cette session a un accès réseau sortant bloqué vers `dariusdigitalacademy.com` (confirmé via `scripts/check_production_availability.sh`, refus 403 côté proxy egress) — ce script doit être lancé par un humain, ou depuis un environnement CI/poste avec accès réseau réel.

## 1. Pourquoi ce test

L'audit du 10 novembre identifiait comme preuve manquante : « smoke test production avec deux comptes réels ». La suite automatisée (`tests/run.js`) prouve déjà ce comportement contre un BFF **mocké** — ce script reproduit les mêmes vérifications contre l'environnement **réel** (production ou staging), avec de vrais comptes.

## 2. Prérequis

### 2.1 Comptes à créer manuellement avant exécution

| Compte | Rôle requis | Obligatoire ? |
|---|---|---|
| Compte A | Apprenant Free, email/mot de passe réels | Oui |
| Compte B | Apprenant Free, email/mot de passe réels, **distinct** du compte A | Oui |
| Compte Premium | Apprenant avec entitlement Premium réellement confirmé serveur | Non — son absence fait SKIP les contrôles Premium, jamais un faux PASS |
| Compte Admin/Owner | Rôle admin ou owner réel dans `dda_admin_roles` | Non — son absence fait SKIP les contrôles admin, jamais un faux PASS |

Ces comptes doivent être créés via le vrai parcours d'inscription (ou directement en base pour l'attribution du rôle admin/Premium), **jamais** fabriqués par le script — le script ne crée aucun compte.

### 2.2 Environnement

- Node.js avec Playwright installé (déjà une dépendance de ce dépôt).
- Accès réseau sortant vers le domaine testé (`DDA_SITE_URL`) et son BFF (`DDA_BFF_URL`).
- Ne jamais committer les mots de passe de ces comptes dans Git ni dans ce dépôt ; les passer uniquement en variables d'environnement au moment de l'exécution.

## 3. Exécution

```bash
DDA_SMOKE_TEST_CONFIRM=I_UNDERSTAND_THIS_HITS_PRODUCTION \
DDA_SITE_URL=https://dariusdigitalacademy.com \
DDA_BFF_URL=https://api.dariusdigitalacademy.com \
DDA_TEST_ACCOUNT_A_EMAIL=compte-a@exemple.com \
DDA_TEST_ACCOUNT_A_PASSWORD='...' \
DDA_TEST_ACCOUNT_B_EMAIL=compte-b@exemple.com \
DDA_TEST_ACCOUNT_B_PASSWORD='...' \
node scripts/smoke_test_production.js
```

Pour inclure les contrôles Premium/admin, ajouter `DDA_TEST_ACCOUNT_PREMIUM_EMAIL`/`_PASSWORD` et/ou `DDA_TEST_ACCOUNT_ADMIN_EMAIL`/`_PASSWORD`.

**Variante staging recommandée en premier** : lancer d'abord contre un environnement de staging (si disponible) avant la production, pour valider le script lui-même sans risque sur l'environnement réel.

## 4. Contrôles effectués et résultats attendus

| # | Contrôle | Résultat attendu |
|---|---|---|
| 1 | Le site répond en HTTP 200 | PASS |
| 2 | Le compte A se connecte et `/v1/me` renvoie bien l'identité du compte A | PASS |
| 3 | Le compte A (non-admin) reçoit 403 sur `/v1/admin/overview` | PASS |
| 4 | Le compte A (Free) ne voit jamais le vrai contenu Premium (P2.2) | PASS |
| 5 | Le compte B se connecte et voit sa propre identité, jamais celle du compte A | PASS — c'est exactement la classe de bug corrigée par la PR #245 (identité « Richard ») |
| 6 | (si fourni) le compte Premium débloque le vrai contenu P2.1 | PASS ou SKIPPED |
| 7 | (si fourni) le compte admin/owner atteint `admin.html` avec un rôle réel serveur | PASS ou SKIPPED |
| 8 | Comportement BFF indisponible | **Toujours SKIPPED ici** — ne jamais mettre hors ligne le BFF réel de production pour ce test ; la preuve continue de ce comportement est la suite automatisée `tests/run.js` (scénarios BRVM/Premium/admin « BFF indisponible »), déjà PASS en continu. |

Un `FAIL` sur l'un des contrôles 2 à 7 est un signal d'incident réel à investiguer avant toute annonce de disponibilité — jamais à ignorer ni à recatégoriser en SKIP après coup.

## 5. Preuves à conserver

- Le rapport JSON écrit automatiquement dans `reports/smoke-test-production-<horodatage>.json` (aucun mot de passe ni token n'y est écrit).
- La sortie console complète de l'exécution (copier-coller ou redirection vers un fichier log).
- La date, l'heure et l'identité de la personne ayant lancé le test.
- En cas de FAIL : une capture d'écran ou le HTML de la page concernée, pour investigation — sans jamais y laisser de mot de passe en clair.

## 6. Ce que ce test ne couvre pas

- Il ne teste pas Chariow/paiement (hors périmètre — paiement non activé commercialement).
- Il ne mesure pas la performance/latence réelle.
- Il ne remplace pas une revue de sécurité (CodeQL, audit RLS) déjà couverte ailleurs dans le pipeline CI.
