# DDA — Instrumentation de couverture BFF et Academy

**Date :** 15 novembre 2026  
**Branche du relevé actuel :** `fix/bff-coverage-residuals` (base `main` à `28decce`)
**Branche de la baseline initiale :** `feat/code-coverage-instrumentation`

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

`coverage:bff` réutilise des contrats HTTP et PostgREST déterministes avec des fournisseurs factices. Il produit :

- `coverage/coverage-final.json` ;
- `coverage/lcov.info` ;
- `coverage/lcov-report/` ;
- un résumé texte dans le terminal.

`coverage:academy` démarre un serveur statique local, ouvre Chromium, active `Profiler.startPreciseCoverage` via CDP, parcourt huit routes et produit :

- `coverage/academy-v8.json` : données brutes V8 par route et script ;
- `coverage/academy-summary.json` : résumé exploitable par CI.

Le collecteur utilise le binaire Playwright téléchargé en CI. En local, il utilise automatiquement `/usr/bin/chromium` ou `/usr/bin/chromium-browser` si le binaire Playwright n’est pas installé. Une variable `PLAYWRIGHT_EXECUTABLE_PATH` permet de choisir explicitement un autre binaire.

## Historique des baselines BFF

### Première collecte locale

| Indicateur | Résultat |
|---|---:|
| Statements | 41,38 % |
| Branches | 67,81 % |
| Functions | 47,16 % |
| Lines | 41,38 % |

Le contrat BFF et le driver déterministe des modules purs passent avant la collecte. Le driver couvre les validations IA, analytics, Chariow, publications BRVM et rate limiting sans appeler de service externe réel.

### Après extension du driver

| Indicateur | Résultat |
|---|---:|
| Statements | 53,62 % |
| Branches | 62,94 % |
| Functions | 57,37 % |
| Lines | 53,62 % |

### Après intégration des contrats billing, progression et Supabase Auth

| Indicateur | Résultat |
|---|---:|
| Statements / Lines | 62,99 % |
| Branches | 63,76 % |
| Functions | 58,47 % |

Les contrats exécutés couvrent notamment les échanges PKCE, les erreurs GoTrue, la conservation du partenaire, les écritures de progression et l’idempotence billing.

### Baseline reproduite au merge de la PR #284

Après couverture complémentaire des stores business, audit, communauté et market-data :

| Indicateur | Baseline au merge #284 |
|---|---:|
| Statements / Lines | 72,74 % |
| Branches | 65,65 % |
| Functions | 65,60 % |

### Baseline locale après les contrats complémentaires intégrés avant cette branche

| Indicateur | Résultat sur `main` (`28decce`) |
|---|---:|
| Statements / Lines | 84,19 % |
| Branches | 73,97 % |
| Functions | 79,05 % |

### Relevé actuel — branche `fix/bff-coverage-residuals`

Mesure c8 produite par `npm run coverage:bff` après ajout des scénarios admin, session et wrapper webhook :

| Indicateur | Résultat actuel |
|---|---:|
| Statements | 86,28 % |
| Branches | 75,54 % |
| Functions | 84,29 % |
| Lines | 86,28 % |

Le pilote `scripts/coverage-bff.js` réutilise les contrats existants, dont `test_admin_store_postgrest_contract.js`, `test_admin_routes_contract.js`, `test_p3_account_lifecycle.js` et `test_p4_chariow_billing.js`, et inclut maintenant `test_serverless_webhook_handler.js`.

Les scénarios ajoutés vérifient :

- les révocations PostgREST de rôles admin : contrôle owner, protection du dernier owner, échec fermé si le compte exact des owners manque, révocation autorisée d’un owner lorsqu’il en reste deux et révocation d’un admin ;
- `session-store` : création, recherche par hash avec filtres d’expiration/révocation, touch, révocation individuelle et globale, listing, compte exact, erreur PostgREST et réponse sans corps ;
- le wrapper `/webhooks/chariow` : secret absent (`503`), signature invalide (`401`), exception de flux (`500`), activation valide signée (`202`) et doublon idempotent (`204`). La branche de succès utilise un faux PostgREST local et vérifie que l’identité et les entitlements sont écrits côté serveur.

Ces scénarios ne nécessitent ni connexion Supabase distante, ni appel à Chariow/PostHog. Les tentatives de réseau inattendues échouent explicitement dans le contrat serverless.

La sortie c8 actuelle indique `admin-roles-store.js`, `session-store.js` et `handler.js` à **100 % en statements/lignes**. `session-store.js` et `handler.js` atteignent également **100 % des branches** ; `admin-roles-store.js` conserve des branches non parcourues sur des chemins distincts de la révocation, notamment les erreurs et replis de réponse. `handler.js` affiche aussi 80 % de fonctions, sans ligne ou branche non couverte dans ce relevé.

Ces valeurs ne signifient pas que les autres modules sont à 0 % : leurs couvertures partielles sont détaillées dans la sortie c8. Elles mesurent l’exécution des scénarios déterministes et ne constituent ni une preuve de conformité RLS sur un projet Supabase distant, ni un test de déploiement réel.

## Validation locale

La commande `npm run coverage:bff` termine avec succès et reproduit les pourcentages ci-dessus. Le Product Gate exécuté localement comprend les 112 scripts `tests/test_*.js`, la vérification de cohérence du registre des routes, le smoke test JSDOM et le harness Playwright : **128 passed, 0 failed**. Les checks GitHub de la PR de suivi resteront requis avant toute intégration.

Aucune migration Supabase distante n’a été exécutée dans ce suivi. Aucun schéma ni code produit n’a été modifié : les changements portent sur des contrats de test, le pilote c8 et ce rapport.

## Academy — V8/CDP

Résultat de la première collecte locale :

| Indicateur | Résultat |
|---|---:|
| Plages runtime couvertes | 29,72 % |
| Plages runtime totales | 4 751 |
| Scripts observés | 14 |
| Routes parcourues | 8 |

Routes initiales : `/`, `/commencer/`, `/launch/`, `/about/`, `academy.html#access`, `academy.html#dashboard`, `academy.html#markets` et `academy.html#intelligence`.

La métrique Academy est une **couverture de plages runtime V8**, pas encore une couverture de lignes source comparable à c8. Elle mesure uniquement les scripts effectivement chargés et exécutés par Chromium dans ces scénarios.

## Limites restantes

Cette tranche établit une baseline sans seuil bloquant et réduit plusieurs lacunes sans rendre la couverture exhaustive :

- `bff/src/admin-roles-store.js` : les branches de révocation et de protection du dernier owner sont couvertes ; restent des branches de validation/constructeur et d’erreur ou de réponse vide du store ;
- `bff/src/app.js` : une grande partie des routes et erreurs reste à couvrir (`70,35 %` statements/lignes dans la mesure actuelle) ;
- `bff/src/billing-store.js`, `supabase-auth.js`, `security.js` et d’autres modules conservent des branches non parcourues ;
- l’aller-retour complet Google OAuth/PKCE en navigateur, les sessions multi-onglets et les expirations côté client ;
- les moteurs Firefox/WebKit, ainsi que davantage de pages institutionnelles et d’états réseau dégradés dans le collecteur Academy ;
- toute validation contre une base Supabase réelle : les tests présents restent locaux, déterministes et fondés sur des mocks.

Une ligne couverte ne valide pas à elle seule l’exactitude métier ou la sécurité de toutes les entrées. Le dernier relevé ne vaut pas preuve RLS et ne remplace pas les tests d’intégration sur un environnement de préproduction dûment autorisé.

## Étapes suivantes recommandées

1. Revoir les lacunes de `app.js` et `billing-store.js` par risque P0/P1, en ajoutant uniquement les contrats déterministes utiles sans chercher un 100 % artificiel.
2. Garder la baseline c8 comme contrôle reproductible de CI et faire passer les checks GitHub de la PR avant fusion.
3. Traiter ensuite les scénarios navigateur Academy et les moteurs additionnels en lots séparés.
4. N’effectuer aucune migration Supabase distante sans autorisation explicite distincte et sans réconciliation préalable du contrat, du SQL, des RLS, de l’API et des tests.
