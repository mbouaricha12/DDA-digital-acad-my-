# DDA — Instrumentation de couverture BFF et Academy

**Date :** 15 novembre 2026  
**Branche :** `feat/code-coverage-instrumentation`

## Objectif

Le dépôt ne disposait pas de métrique de couverture de code. Cette tranche ajoute deux collecteurs séparés :

- **c8/V8 Node.js** pour le BFF (`bff/src`) ;
- **V8 Precise Coverage via CDP Chromium** pour les scripts réellement chargés par le runtime Academy et les surfaces publiques.

Les collecteurs ne modifient pas le code produit et n’appellent aucun service externe réel.

## Commandes

```bash
npm install --ignore-scripts
npm run coverage:bff
npm run coverage:academy
npm run coverage
```

`coverage:bff` réutilise le contrat HTTP BFF existant avec ses faux fournisseurs déterministes. Il produit :

- `coverage/coverage-final.json` ;
- `coverage/lcov.info` ;
- `coverage/lcov-report/` ;
- un résumé texte dans le terminal.

`coverage:academy` démarre un serveur statique local, ouvre Chromium, active `Profiler.startPreciseCoverage` via CDP, parcourt huit routes et produit :

- `coverage/academy-v8.json` : données brutes V8 par route et script ;
- `coverage/academy-summary.json` : résumé exploitable par CI.

Le collecteur utilise le binaire Playwright téléchargé en CI. En local, il utilise automatiquement `/usr/bin/chromium` ou `/usr/bin/chromium-browser` si le binaire Playwright n’est pas installé. Une variable `PLAYWRIGHT_EXECUTABLE_PATH` permet de choisir explicitement un autre binaire.

## Baseline initiale

### BFF — c8

Résultat de la première collecte locale :

| Indicateur | Résultat |
|---|---:|
| Statements | 41,38 % |
| Branches | 67,81 % |
| Functions | 47,16 % |
| Lines | 41,38 % |

Le contrat BFF et le driver déterministe des modules purs passent avant la collecte. Le driver couvre les validations IA, analytics, Chariow, publications BRVM et rate limiting sans appeler de service externe réel.

Résultat après extension du driver :

| Indicateur | Résultat |
|---|---:|
| Statements | 53,62 % |
| Branches | 62,94 % |
| Functions | 57,37 % |
| Lines | 53,62 % |

Après intégration des contrats existants de billing, progression et Supabase Auth dans le pilote c8 :

| Indicateur | Baseline intégrée |
|---|---:|
| Statements / Lines | 62,99 % |
| Branches | 63,76 % |
| Functions | 58,47 % |

Les contrats exécutés couvrent notamment les échanges PKCE, les erreurs GoTrue, la conservation du partenaire, les écritures de progression et l’idempotence billing.

Après couverture complémentaire des stores business, audit, communauté et market-data, baseline reproduite au merge de la PR #284 :

| Indicateur | Baseline au merge #284 |
|---|---:|
| Statements / Lines | 72,74 % |
| Branches | 65,65 % |
| Functions | 65,60 % |

Résultat après le renforcement local du pilote de couverture (15 novembre 2026) :

| Indicateur | Baseline locale actuelle |
|---|---:|
| Statements / Lines | 74,77 % |
| Branches | 68,45 % |
| Functions | 67,01 % |

Le pilote exerce les contrats Auth, billing, progression, ainsi que des faux PostgREST pour business, access-audit et community, et des faux fournisseurs pour market-data. Les assertions vérifient maintenant les filtres d’owner et méthodes d’export/suppression, l’isolation mémoire inter-utilisateurs, plusieurs réponses d’erreur, les transitions de membership obsolètes/révoquées et l’instanciation valide de `buildHandler` suivie d’une réponse 404 locale. Cette construction n’effectue aucun appel Supabase ; aucun service externe réel n’est utilisé par le pilote.

Ces valeurs ne signifient pas que les modules concernés sont à 0 % : leurs couvertures partielles sont détaillées dans la sortie c8. Elles mesurent l’exécution des scénarios déterministes et ne constituent ni une preuve de conformité RLS sur un projet Supabase distant, ni un test de déploiement réel.

Validation locale de ce suivi : `npm run coverage:bff` reproduit les chiffres ci-dessus ; la suite Product Gate complète (contrats `tests/test_*.js`, cohérence du registre des routes, smoke test et régression navigateur Playwright) termine avec **128 passed, 0 failed**. Les checks GitHub de la PR de suivi restent requis avant toute intégration.

### Academy — V8/CDP

Résultat de la première collecte locale :

| Indicateur | Résultat |
|---|---:|
| Plages runtime couvertes | 29,72 % |
| Plages runtime totales | 4 751 |
| Scripts observés | 14 |
| Routes parcourues | 8 |

Routes initiales : `/`, `/commencer/`, `/launch/`, `/about/`, `academy.html#access`, `academy.html#dashboard`, `academy.html#markets` et `academy.html#intelligence`.

La métrique Academy est une **couverture de plages runtime V8**, pas encore une couverture de lignes source comparable à c8. Elle mesure uniquement les scripts effectivement chargés et exécutés par Chromium dans ces scénarios.

## Limites assumées

Cette tranche établit une baseline sans seuil bloquant. Elle ne couvre pas encore exhaustivement les branches suivantes, même si des contrats ciblés existent déjà pour PKCE, erreurs GoTrue, idempotence des livraisons billing et états fournisseurs :

- `bff/src/admin-roles-store.js` : les chemins assign/revoke et leurs invariants restent très peu exercés par le pilote c8 ;
- `bff/src/session-store.js` : expiration, révocation, reprise et erreurs PostgREST nécessitent des scénarios supplémentaires ;
- `bff/src/handler.js` et `bff/src/app.js` : l’endpoint HTTP du webhook Chariow et plusieurs routes admin/leurs erreurs ne sont pas parcourus par les scénarios actuels ;
- l’aller-retour complet Google OAuth/PKCE en navigateur, les sessions multi-onglets et les expirations côté client ;
- les moteurs Firefox/WebKit, ainsi que davantage de pages institutionnelles et d’états réseau dégradés dans le collecteur Academy ;
- toute validation contre une base Supabase réelle : les tests présents restent locaux, déterministes et fondés sur des mocks.

Le dernier relevé local montre notamment une couverture partielle de `app.js` (59,38 % lignes), `admin-roles-store.js` (48,73 %), `session-store.js` (54,31 %) et `handler.js` (72,50 %). Une ligne couverte ne valide pas à elle seule l’exactitude métier ou la sécurité de toutes les entrées.

Les rapports sont générés en CI et archivés pendant 14 jours comme artefact GitHub Actions. Le dossier `coverage/` est ignoré par Git et aucun rapport généré n’est commité.

## Étape suivante recommandée

1. Ajouter des scénarios ciblés pour les invariants d’assignation/révocation admin et l’expiration/révocation des sessions.
2. Couvrir le handler de webhook Chariow et les routes admin restantes avec des requêtes et fournisseurs factices.
3. Ajouter les routes publiques légales et les branches d’erreur Academy, sans confondre couverture runtime et couverture de source.
4. Convertir la couverture V8 brute en rapport source avec les sourcemaps si une métrique ligne par ligne devient nécessaire, puis fixer progressivement des seuils séparés après deux ou trois baselines stables.
