# DDA AutoTrader — moteur d’analyse technique v2

**Statut :** moteur v2 descriptif, isolé du BFF et du moteur v1. Il calcule uniquement des indicateurs à partir des séries `dda.market-series.v2` validées. Aucun fournisseur n’est appelé et aucune stratégie, recommandation ou transmission d’ordre n’est créée.

## Indicateurs

Les périodes comptent les bougies fournies; l’échelle de temps est recopiée comme fréquence. Aucune annualisation n’est calculée faute de calendrier de marché validé. Chaque métrique inclut sa valeur, son unité, sa fenêtre, sa méthode, ses inputs et son statut (`computed` ou `insufficient_data`). Les fenêtres insuffisantes produisent `null`, jamais une donnée inventée.

### Tendance

- **SMA 20 et SMA 50 :** moyenne arithmétique des 20/50 dernières clôtures.
- **Close vs SMA 20 :** `last_close / SMA_20 - 1`, en fraction; position relative descriptive, pas une direction de marché.
- **EMA 20 et EMA 50 :** alpha `2/(n+1)`; la première valeur est la SMA des `n` premières clôtures fournies, ensuite la récurrence EMA s’applique à l’ensemble des données remises au moteur. Une autre profondeur d’historique peut donc changer l’EMA finale.
- **MACD :** EMA 12 moins EMA 26. La ligne signal est l’EMA 9 des observations MACD, initialisée par leur SMA initiale; l’histogramme est ligne MACD moins signal. La ligne exige au moins 26 bougies et la signal/histogramme au moins 34. Aucun croisement ou état “buy/sell” n’est produit.

### Volatilité

- **True Range :** `max(high-low, |high-close_précédent|, |low-close_précédent|)`; première bougie `high-low`.
- **ATR 14 :** lissage de Wilder, initialisé par la moyenne arithmétique des 14 premiers True Ranges; unité de prix. La version fractionnaire est `ATR_14 / last_close`.
- **Bollinger 20, ±2 :** milieu SMA 20, écart-type population sur les 20 clôtures, bandes milieu `± 2σ`; largeur fractionnaire `(bande_haute-bande_basse)/milieu`.
- **Volatilité réalisée 20 :** écart-type échantillonnal (`n-1`) des 20 rendements simples close-to-close récents; 21 clôtures sont donc nécessaires. Elle est par bougie et non annualisée.

## Sécurité et limites

La fonction `analyzeMarketSeriesV2` appelle `validateMarketSeriesV2` et refuse explicitement les séries v1. Elle conserve `execution_enabled = false` et `order_recommendation = null` même en cas de rejet ou de données périmées. Le volume v2 est contrôlé par le validateur, mais aucun indicateur de ce moteur ne le consomme. Il n’est pas assimilé à zéro lorsqu’il est indisponible.

Les indicateurs dépendent de l’ordre, de la profondeur et de la continuité des bougies transmises. Le validateur contrôle l’ordre chronologique, mais ne prouve pas l’absence de trous d’horodatage ni l’authenticité de la source. La fraîcheur snapshot par défaut du validateur reste de cinq minutes; un appelant doit fournir un plafond conforme à l’échelle de temps et au flux avant tout usage. Le moteur n’émet aucun signal de trading, prix exécutable, prévision, stop, objectif, taille de position ou ordre.

## Vérification

La suite simulée couvre les valeurs calculées, les warm-ups, les fenêtres insuffisantes, les données historique/snapshot/synthétique, le rejet v1, les données périmées, les erreurs de validation et les invariants sans exécution. Les résultats de tests sont consignés dans la session d’implémentation; aucune donnée réelle de marché n’est utilisée.
