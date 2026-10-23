# DDA AutoTrader — incrément 3A : contrat de données et préparation fournisseur

**Date :** 18 octobre 2026<br>
**Périmètre :** contrat versionné et plan de validation seulement. Aucun fournisseur, stockage, interface, broker, signal ou mécanisme d’exécution n’est ajouté.

## État Git constaté avant modification

Le dépôt est sur `main`; `HEAD` et `origin/main` pointent tous deux vers `f1888e20c8c77e4d5698f5ac7ff2ff9e45a9b6e6`. La branche ne présente aucun commit en avance sur `origin/main`.

Avant la création des livrables de l’incrément 3A, les seuls fichiers suivis modifiés étaient `bff/package.json` et `bff/src/app.js`. Les fichiers non suivis du travail AutoTrader 1–2 étaient :

- `bff/src/autotrader/market-analysis.js`
- `bff/src/autotrader/market-data.js`
- `contracts/autotrader/market-series-v1.schema.json`
- `docs/DDA_AUTOTRADER_PHASE1_MARKET_DATA.md`
- `tests/test_autotrader_analysis_route.js`
- `tests/test_autotrader_market_analysis.js`

Aucun schéma v2 n’existait. Ces fichiers locaux non suivis ne sont pas visibles dans `git diff origin/main`; ils représentent du travail à préserver. Aucun fichier existant n’a été réinitialisé, supprimé ou remplacé dans cette mission. Aucun commit ni push n’a été fait.

`npm test --prefix bff` passe : test de contrat BFF, 11 tests du module marché et 10 tests HTTP AutoTrader. `node tests/run.js` ne démarre pas, car `playwright` est absent (`MODULE_NOT_FOUND`). `git diff --check` passe. Le statut Git final contient uniquement le nouveau schéma v2 et cette note en plus des changements locaux préexistants.

## Contrat v2 proposé

Le nouveau fichier `contracts/autotrader/market-series-v2.schema.json` donne au champ `volume` une structure typée, obligatoire pour chaque barre. Le champ reste obligatoire afin que chaque série dise explicitement si la mesure existe. Il ne contient jamais une valeur de remplacement pour une mesure manquante.

Une mesure connue porte ces champs :

- `semantic` identifie exactement `traded_volume`, `transaction_count` ou `tick_count`;
- `value` est un nombre fini non négatif pour `traded_volume`, et un entier non négatif pour un comptage;
- `unit` est contrôlée par sémantique : `instrument_units`, `contracts`, `lots`, `shares` ou `troy_ounces` pour le volume négocié; `transactions` pour un nombre de transactions; `ticks` pour un nombre de ticks;
- `definition_ref` pointe vers une définition vérifiable du fournisseur, du contrat de données ou du mapping DDA qui confirme l’unité et le sens de la mesure.

Une mesure absente ou non prouvée est représentée exclusivement par :

```json
{ "semantic": "unavailable", "reason": "not_verified" }
```

Les raisons autorisées sont `not_reported`, `not_supported`, `not_verified` et `not_applicable`. Cette variante n’accepte ni `value`, ni `unit`, ni `definition_ref`. Ainsi, une source silencieuse ou inconnue ne devient pas un `volume: 0`. Le zéro reste possible uniquement comme véritable valeur fournie pour une sémantique confirmée; pour un volume négocié, `definition_ref` est obligatoire.

Le contrat reprend les garde-fous d’OHLC du v1 : prix positifs, dates de clôture UTC à la milliseconde, barres triées, sans doublons ni valeur future au runtime, et plage `high`/`low` cohérente. Le JSON Schema exprime les types, les champs obligatoires, les variantes et les unités admises. Les comparaisons entre `high`, `low`, `open` et `close`, l’ordre chronologique, les dates futures, la fraîcheur et la cohérence réelle d’une référence de définition restent des contrôles runtime.

Le v2 sépare aussi le mode de données de la provenance de l’import : un snapshot exige `source.kind = provider`; une série historique accepte `provider` ou `historical_import`; une fixture synthétique exige `synthetic_fixture`. Un fournisseur qui renvoie de l’historique peut ainsi rester identifié comme source fournisseur sans être étiqueté comme simple fichier importé. Pour les sources `provider`, le symbole exact chez le fournisseur (`source.provider_symbol`) est obligatoire, en plus du symbole canonique DDA.

### Limite de validation sémantique

Un JSON Schema peut refuser une forme incohérente, une unité non admise, une chaîne `definition_ref` vide ou une variante `unavailable` munie d’une valeur. Il ne peut pas prouver qu’une référence décrit réellement les données ni qu’un fournisseur respecte sa définition. Le validateur runtime futur devra comparer le triplet source/instrument/sémantique à un mapping documenté et approuvé par DDA. Une valeur `0` marquée `traded_volume` ne doit pas être acceptée sur la seule foi du JSON : la définition de la source et l’unité doivent être établies auparavant.

## Différences par rapport au v1 et compatibilité

Le contrat v1 reste intact. Il exige `volume: number` et ne peut représenter ni « indisponible » ni la différence entre volume négocié, transaction et tick. Il reste la seule version acceptée par `bff/src/autotrader/market-data.js` et l’analyseur existant.

Le v2 remplace ce nombre scalaire par un objet typé, ajoute `source.provider_symbol` pour préserver le symbole externe, et assouplit la paire `historical`/`source.kind` afin qu’une source historique fournisseur reste identifiable. Les versions ne sont pas interchangeables : un consommateur v1 doit rejeter v2, et le nombre `volume` v1 ne doit jamais être requalifié automatiquement comme `traded_volume`.

La décision recommandée est une coexistence versionnée, sans migration globale : conserver le validateur et le moteur actuels v1; implémenter plus tard un validateur v2 distinct et un dispatch explicite par `contract_version` uniquement lorsqu’un producteur v2 est prêt. L’analyse descriptive ne lit pas le volume aujourd’hui. Sa logique de prix peut donc rester identique, mais elle doit valider la série selon la version appropriée avant de calculer, propager la sémantique du volume dans les résultats et ne jamais lui attribuer une interprétation technique. Le schéma v2 ajouté ici n’est pas encore branché au runtime et n’autorise pas l’API à accepter des séries v2.

Les invariants demeurent absolus pour les deux versions : `execution_enabled = false` et `order_recommendation = null`.

## Tests à ajouter lors du support runtime v2

Cette mission définit les scénarios; elle ne modifie pas les suites de tests existantes.

1. Une série valide avec `traded_volume`, une valeur non négative, une unité admise et une référence de définition vérifiée.
2. Une série valide avec `transaction_count` ou `tick_count`, unités respectives et valeurs entières.
3. Une série valide avec `unavailable` et une raison admise, sans champ `value`.
4. Rejeter `unavailable` combiné à `value: 0`, une unité ou des propriétés additionnelles.
5. Rejeter les unités croisées (`transaction_count` avec `ticks`, `tick_count` avec `transactions`), les fractions dans un comptage, les valeurs négatives, les références vides et les propriétés inconnues.
6. Rejeter prix non numériques/non finis, valeurs OHLC incohérentes, dates invalides/futures, timestamps dupliqués ou non croissants, et mode/source incompatible.
7. Vérifier `snapshot/provider`, `historical/provider`, `historical/historical_import` et `synthetic/synthetic_fixture`; refuser une fixture donnée comme réelle.
8. Vérifier que le routeur de versions ne transforme jamais le volume scalaire v1 en une sémantique v2 présumée. Garder les tests v1 existants verts.
9. Vérifier que l’analyseur donne les mêmes métriques de prix sur jeux v1/v2 équivalents, n’utilise aucune mesure de volume non demandée, et conserve les invariants non-exécution.
10. Ajouter ultérieurement un test de registre runtime : une paire fournisseur/symbole dont la sémantique ou l’unité n’est pas approuvée est rejetée, même si le JSON est structurellement valide.

## Préparation Twelve Data, sans connexion

Twelve Data reste un candidat, pas une intégration opérationnelle. Sa documentation indique le symbole `XAU/USD` pour l’or spot, une série OHLC, l’intervalle `1h`, un maximum documenté de 5 000 points et un coût de `time_series` d’un crédit par symbole.[1] Cela confirme la présence du symbole et la forme générale de la série, pas la fraîcheur garantie, le droit de redistribution, ni la sémantique de `volume` pour ce flux.

La page Business Pricing consultée affiche des forfaits commerciaux avec « external display » ou « external distribution » et des crédits par minute; la même page présente aussi des valeurs de Venture contradictoires entre ses cartes tarifaires et son tableau comparatif. Ces montants ne suffisent donc pas à conclure qu’un plan autorise la republication de XAU/USD dans DDA. Les conditions Twelve Data réservent la redistribution à une autorisation explicite de l’offre, d’un add-on ou d’un accord écrit et peuvent imposer des droits de tiers.[2] [3]

Avant toute clé ou intégration, DDA devra obtenir et vérifier :

- la disponibilité effective de bougies XAU/USD H1 dans l’offre retenue;
- la syntaxe exacte de réponse et le fuseau, ainsi que le fait que les timestamps repèrent le début ou la clôture d’une bougie;
- le traitement des chandelles incomplètes et l’intervalle réel d’actualisation;
- si `volume` existe pour XAU/USD, son unité, sa définition et une référence documentaire propre à ce flux; aucun volume négocié n’est présumé;
- les quotas de crédits et les limites du plan, la latence, le comportement 429, la rétention et le cache;
- l’autorisation écrite d’afficher ou redistribuer à des utilisateurs DDA le flux et les données historiques/ dérivées, avec conditions de source tierce.

Aucune clé API n’a été créée, recherchée ou utilisée; aucun service externe n’a été appelé dans cette mission.

## Fichiers créés ou touchés

Créés dans cette mission :

- `contracts/autotrader/market-series-v2.schema.json` — nouveau contrat Draft 2020-12, autonome;
- `docs/DDA_AUTOTRADER_INCREMENT_3A_DATA_CONTRACT.md` — état pré-modification, choix de schéma, compatibilité, conditions fournisseur et tests proposés.

Non modifiés : contrat v1, validateur runtime, analyseur, route BFF, configuration, fixtures et tests existants. Aucun fichier antérieur n’a été remplacé.

## Questions et prochaine étape recommandée

1. Validez-vous le modèle v2 où l’objet `volume` est toujours présent, mais où `unavailable` ne contient aucun nombre? La classification `unavailable/not_verified` est recommandée tant que la documentation du fournisseur ne confirme pas la sémantique.
2. Validez-vous les unités restreintes du volume négocié (`instrument_units`, `contracts`, `lots`, `shares`, `troy_ounces`), ou faut-il ajouter une unité propre à une source/instrument après confirmation documentaire?
3. Confirmez-vous la coexistence v1/v2 avec support runtime différé, plutôt qu’une migration du moteur actuel maintenant?
4. Qui approuvera le mapping source/symbole/unité et la référence de licence avant qu’un flux réel puisse produire un contrat v2?

Prochaine étape à la clôture de l’incrément 3A : revue du schéma v2 et de ces règles, puis ajout d’un validateur v2 autonome et de tests simulés. Aucun connecteur, stockage, interface, broker, risque de position ou mécanisme d’ordre ne faisait partie de cette étape.

## Mise à jour — incrément 3B

L’incrément 3B ajoute `bff/src/autotrader/market-data-v2.js`, un validateur indépendant du validateur v1, et `tests/test_autotrader_market_data_v2.js`, avec 16 tests simulés. Le contrat v2 rejette une valeur numérique jointe à `semantic: unavailable`, impose des unités distinctes pour `transaction_count` et `tick_count`, et exige une référence de définition pour les valeurs mesurées. Cette référence est contrôlée structurellement seulement; sa vérification auprès d’une source autorisée reste à faire.

Le schéma passe la vérification Draft 2020-12 et des exemples de variantes. `npm test --prefix bff` passe, incluant les tests BFF, 11 tests d’analyse, 10 tests HTTP et 16 nouveaux tests v2. Le validateur et les tests v2 ne changent pas l’API : la route et l’analyseur restent v1 et ne dispatchent pas encore sur `contract_version`. Aucun fournisseur ou broker n’est connecté.

## Références

[1]: https://twelvedata.com/docs "Twelve Data API documentation"
[2]: https://twelvedata.com/pricing-business "Twelve Data business pricing"
[3]: https://twelvedata.com/terms "Twelve Data Terms of Use"

## Important Notice

This analysis is based on the data and assumptions stated above and does not guarantee future performance. It does not constitute legal, tax, accounting, or personalized investment advice. The SKILL did not and cannot place, modify, cancel, sign, transmit, or submit a financial transaction. This capability limit applies only to the SKILL and the tools or agents operating within it; it does not restrict the user's independent activity outside the SKILL. If the user chooses to transact, they may do so independently on the relevant broker, exchange, wallet, or other platform.
