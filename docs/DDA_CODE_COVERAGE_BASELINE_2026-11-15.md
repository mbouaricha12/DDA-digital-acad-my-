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

Les modules d’intégration non instanciés — par exemple Supabase Auth, billing, business store, handler HTTP serverless et store de progression PostgREST — apparaissent encore à 0 %. Cela signale une zone à tester, et non un défaut de l’instrumentation.

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

Cette tranche établit une baseline ; elle ne fixe pas encore de seuil bloquant. Les valeurs seraient artificiellement trompeuses avant l’ajout des scénarios manquants pour :

- OAuth/PKCE et erreurs de fournisseur ;
- webhooks Chariow et idempotence ;
- PostgREST, billing, sessions et rate limiting en erreur ;
- multi-onglets et expiration de session ;
- Firefox/WebKit ;
- pages institutionnelles supplémentaires et états réseau dégradés.

Les rapports sont générés en CI et archivés pendant 14 jours comme artefact GitHub Actions. Le dossier `coverage/` est ignoré par Git et aucun rapport généré n’est commité.

## Étape suivante recommandée

1. Ajouter des pilotes BFF ciblés pour les modules actuellement à 0 %.
2. Ajouter les routes publiques légales et les branches d’erreur Academy.
3. Convertir la couverture V8 brute en rapport source avec les sourcemaps si une métrique ligne par ligne devient nécessaire.
4. Fixer progressivement des seuils séparés, après deux ou trois baselines stables.
