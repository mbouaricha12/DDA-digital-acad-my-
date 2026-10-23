# DDA AutoTrader — Backtest historique v1

## Objet et statut

Ce module exécute une simulation historique hors ligne de la règle fixe `dda.trend-confirmation.v1`. Il ne passe aucun ordre, n’appelle aucun broker ou fournisseur de données, ne crée aucune recommandation d’ordre et ne constitue pas une preuve de rentabilité. L’état `complete`/`provisional` décrit l’exécution et les gates de la simulation, pas la qualité d’un investissement. Le champ `strategy_validation_status` reste `unverified`.

Cette phase ne modifie ni les droits AutoTrader Premium, ni l’adaptateur de marché. Les droits liés aux paiements/abonnements et les conditions du fournisseur restent des chantiers distincts.

## Règle de stratégie reproduite

Le moteur importe la définition partagée `trend-rule-v1.js`, également utilisée par le générateur de recommandations :

- **Long** si le cours de clôture est supérieur à la SMA 20, que SMA 20 > SMA 50, EMA 20 > EMA 50, MACD (12,26) > 0 et histogramme MACD (12,26,9) > 0.
- **Short** si les cinq relations sont inversées.
- Sinon, le résultat de la règle est `none`.

Les indicateurs sont calculés en un seul passage, avec les mêmes fenêtres et graines SMA/EMA que l’analyse v2. Les premières 50 barres avant le début du test servent uniquement au warm-up et ne sont pas négociées.

## Convention d’exécution simulée

La règle est évaluée à la clôture d’une barre daily complète. L’entrée ou le changement de sens se fait à l’open de la prochaine barre observée, jamais au cours de clôture qui a produit le signal. Un signal devenu `none` ferme la position à l’open suivant. Un signal opposé ferme puis inverse la position au même open. Il n’y a qu’une position à la fois sur un seul instrument.

Tout reliquat est liquidé à la clôture de la dernière barre incluse. Le signal de cette dernière barre n’est pas exécuté. Les horodatages des bougies représentent leur clôture UTC; le champ `entry_bar_timestamp`/`exit_bar_timestamp` désigne la bougie contenant le fill simulé à l’open, pas un horodatage d’exécution tick par tick.

La taille cible est `position_fraction × equity marquée`, avec `0 < position_fraction ≤ 1`, puis convertie en quantité par `price × contract_multiplier`. L’appelant doit fournir `position_unit` et un `contract_multiplier` positif; aucun multiplicateur n’est déduit ni supposé. La devise de capital doit correspondre à celle déclarée pour la série; aucune conversion FX n’est faite. Le moteur n’applique pas de levier et ne modélise pas les appels de marge. Le modèle partagé `dda.autotrader.cost-model.v1` accrûe chaque barre daily le financement long ou short et, pour le short, l’emprunt short sur le notionnel d’entrée; ces montants sont déduits de l’equity marquée au fil de la détention. Les ventes à découvert supposent explicitement que l’emprunt est disponible; disponibilité historique, recalls et locate fees ne sont pas vérifiés.

## Données et coûts requis

L’entrée est un objet conforme à `contracts/autotrader/market-series-v2.schema.json` et à `dda.autotrader.backtest-spec.v1`. Le module v1 accepte seulement `timeframe: 1d` et `data_mode: historical` avec `source.kind: historical_import`. Les données `provider` sont bloquées tant que leurs droits et conditions d’usage ne sont pas examinés séparément. Les données synthétiques ne sont acceptées qu’avec `options.allowSyntheticFixture=true` et restent des fixtures, jamais une preuve historique.

La spécification doit déclarer explicitement : dates UTC exactes et split `start` / `in_sample_end` / `end`, capital initial, devise, fraction d’exposition, taux sans risque, MAR, base d’ajustement des prix, politique de dividendes, hypothèse d’emprunt short, références aux droits/source et au modèle de coûts, puis les six coûts v1 : commission, spread et slippage par côté; financement annuel long; financement annuel short; emprunt annuel short. Ces coûts sont exprimés en points de base et sans conversion de devise. Aucun coût nul n’est supposé par défaut; au moins une friction de transaction doit être positive. Le moteur de backtest est quotidien (252 barres/an) et produit aussi des sensibilités 1×, 1,5× et 2×.

`data_rights_reference` et les champs de base d’ajustement sont des déclarations de l’appelant; le code ne vérifie ni licence, ni ajustements, ni traitement des dividendes. Pour une action, les rendements sont marqués incomplets si les prix ne sont pas déclarés en total return avec dividendes inclus.

## Résultats

Chaque fenêtre renvoie une equity curve quotidienne et un trade log hypothétique : période complète, in-sample et out-of-sample. Les deux sous-périodes sont réinitialisées à plat; l’historique antérieur reste disponible pour le warm-up des indicateurs. La règle n’est pas ajustée sur l’in-sample : la séparation est un diagnostic temporel, pas une procédure d’apprentissage ou une garantie d’indépendance statistique. Le benchmark est un buy-and-hold long sur la même fenêtre, avec la même fraction et le même modèle de coûts.

Les mesures incluent rendement total, CAGR (avec indication de fenêtre courte), volatilité annualisée, Sharpe, Sortino, drawdown maximal avec dates, Calmar, win rate, profit factor, gain/perte moyens, expectancy, coûts totaux, turnover et fraction d’observations avec exposition. Les rendements de risque sont annualisés avec `A=252`, réservé aux barres daily. Les ratios qui ne peuvent pas être calculés restent `null`, notamment lorsqu’il n’existe aucun trade ou aucune perte.

Le détecteur de gaps signale les intervalles adjacents supérieurs à 10 jours calendaires. C’est un heuristique, pas un calendrier de marché, et il ne prouve pas la complétude de la série.

## Limites et gates

Le résultat reste `provisional` quand un gate matériel est `unknown_gate`. En v1, les droits de données et la disponibilité/recall de l’emprunt short ne sont pas vérifiés; le résultat reste donc provisoire et `strategy_validation_status` toujours `unverified`, même si `computational_status` est `complete`. Un échantillon inférieur à deux ans, un in-sample ou out-of-sample inférieur à un an, des gaps suspects ou des ajustements d’actions non vérifiés sont aussi signalés.

Ne sont pas modélisés : calendrier de cotation, séances, bid/ask observés, liquidité/volume, fills partiels, limites de prix, market impact au-delà du slippage saisi, fiscalité, dividendes/corporate actions en tant que flux séparés, marge, gaps d’exécution, stops et objectifs ATR, recall de titres empruntés, survivorship/delisting bias et données point-in-time externes. Les taux de financement sont des hypothèses constantes fournies par l’appelant, pas un historique de swaps effectivement observés. Le moteur ne cherche pas de paramètres et ne choisit pas la meilleure combinaison; il faut éviter toute optimisation a posteriori.

Avant d’interpréter une performance réelle, il faudra : obtenir un historique dont les droits d’usage sont approuvés; vérifier calendrier, ajustements, trous, instrument et unité; documenter des coûts traçables; examiner la performance par régimes et en out-of-sample; tester les sensibilités; puis une revue indépendante. Aucune promesse de gain ne doit en être tirée.

## Vérification locale

Lancement depuis le dépôt :

```bash
npm test --prefix bff
```

Les tests utilisent uniquement des fixtures synthétiques marquées comme telles. Aucune série multi-années réelle n’a été simulée dans cet incrément.
