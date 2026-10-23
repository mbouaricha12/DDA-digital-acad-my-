# DDA AutoTrader — recommandations de signaux v1

**Statut :** moteur d’analyse uniquement. Il peut produire un candidat directionnel et des niveaux ATR théoriques à partir de barres historiques ou synthétiques fournies. Aucun flux de marché temps réel, compte broker, route d’ordre ou mécanisme d’exécution n’est intégré.

## Contrats et appel

Le module [`order-recommendations.js`](../bff/src/autotrader/order-recommendations.js) consomme une série v2, un snapshot risque v1, une politique de risque v1 et, uniquement si un setup existe, une exposition candidate fournie par l’appelant. La règle directionnelle reste `dda.trend-confirmation.v1`; les niveaux relèvent d’un modèle séparé, `dda.autotrader.atr-levels.v1`. La sortie est décrite par le [contrat JSON `dda.order-recommendation.v2`](../contracts/autotrader/order-recommendation-v2.schema.json).

`generateOrderRecommendation({ marketSeries, riskSnapshot, riskPolicy, candidateExposure, options })` n’accepte que les séries `historical` ou `synthetic`; les snapshots fournisseur et séries assimilables à du temps réel sont refusés. Le snapshot risque doit être en mode `simulation`, horodaté au moins à la clôture de la dernière bougie analysée, complet et dans les limites explicites. Son âge est contrôlé par la politique de risque.

`candidateExposure` contient `notional`, `assumed_risk_amount` et `currency`. Ces valeurs sont fournies par l’appelant, positives et déjà dans la devise de base du snapshot. Le risque supposé n’est pas recalculé à partir du stop ATR et n’est pas une perte maximale garantie. Aucune conversion FX n’est réalisée.

## Règle directionnelle et modèle de niveaux

La règle `dda.trend-confirmation.v1` génère un candidat long lorsque les cinq conditions sont simultanément réunies sur les barres complètes : dernière clôture au-dessus de SMA(20), SMA(20) au-dessus de SMA(50), EMA(20) au-dessus de EMA(50), MACD(12,26) positif et histogramme MACD positif. Le candidat short applique les inégalités inverses. Les indicateurs réutilisent les valeurs du moteur d’analyse v2.

Un composant distinct, versionné `dda.autotrader.atr-levels.v1`, propose des **références théoriques non exécutables** à partir de la dernière clôture complète `C` et de l’ATR de Wilder(14) `A`, calculé sur le timeframe fourni :

- entrée de référence : `C` (clôture passée, pas un cours exécutable);
- distance de risque théorique : `R = 1,5 × A`;
- long : stop `C − R`, objectif unique `C + 2R`;
- short : stop `C + R`, objectif unique `C − 2R`;
- ratio brut : distance entrée–objectif divisée par distance entrée–stop, soit environ `2,0` selon la précision flottante.

Le contrat expose l’identifiant et les paramètres du modèle, la valeur/unité de l’ATR, le timeframe et l’horodatage de référence. Aucun arrondi à un tick n’est appliqué faute de spécification vérifiée. Si l’ATR ou la clôture manque, si un niveau est non fini/non positif ou si l’ordre des niveaux est incohérent, les prix et ratios concernés restent non calculables.

Ce modèle de niveaux est une hypothèse pédagogique non validée. Il ne fait pas partie de la règle de tendance, n’a pas été validé comme stratégie profitable et n’est pas simulé par le backtest historique actuel. Un stop théorique ne garantit pas une limite de perte en cas de gap, de glissement ou d’absence de liquidité.

## Modèle de coûts v1 et R/R net

Le R/R brut peut être calculé sans coûts. Le R/R net n’est calculé que si `options.costContext` fournit un contexte complet conforme à [`cost-model-v1.schema.json`](../contracts/autotrader/cost-model-v1.schema.json) :

- `cost_model_id: dda.autotrader.cost-model.v1` et une référence de source/scénario;
- devise identique à la devise de l’instrument et à celle de l’exposition; aucune conversion FX;
- unité de position et multiplicateur de contrat positifs;
- horizon explicite (`holding_period_bars`, `bars_per_year`), sans horizon par défaut;
- commissions, spread, glissement par côté, financement long, financement short et emprunt short explicitement fournis, y compris `0` si l’appelant pose explicitement cette hypothèse.

Pour le calcul, les unités hypothétiques sont `notional / (entry × contract_multiplier)`. Le spread et le glissement ajustent chaque fill achat/vente; la commission est appliquée par côté au notionnel du fill. Le financement annuel est appliqué au notionnel d’entrée sur `holding_period_bars / bars_per_year`; pour un short, le financement short et l’emprunt short s’ajoutent. Le même horizon explicite est utilisé pour le scénario objectif et le scénario stop. Le modèle calcule le gain net au target et la perte modélisée au stop, puis leur ratio. Les hypothèses de coût et de contrat sont fournies par l’appelant et ne sont pas vérifiées indépendamment. Le backtest quotidien utilise les mêmes six composantes de coût v1, mais son horizon est fondé sur 252 barres daily/an; les deux résultats ne sont comparables que si les références et hypothèses sont identiques. Le backtest ne simule pas les stops/objectifs ATR.

Si le contexte est absent, incomplet, incohérent ou d’une devise incompatible, `net_ratio` reste `null` avec un statut et un motif explicites; le ratio brut et le candidat directionnel peuvent subsister. Un ratio net nul ou négatif est conservé comme tel plutôt que masqué. Le résultat reste une simulation de scénario, pas une prévision.

## Contrôle du risque

1. L’évaluateur vérifie d’abord que le portefeuille simulé de départ est valide, complet et dans les limites configurées.
2. Le module ajoute temporairement au snapshot une position simulée avec le côté du candidat et les montants fournis par l’appelant.
3. Le même validateur et la même politique évaluent le portefeuille projeté. Toute entrée invalide, tout snapshot périmé ou toute limite dépassée bloque le candidat.
4. Les sorties exposent les statuts et breaches agrégés sans recopier les identifiants de positions existantes.

`within_configured_limits` signifie seulement que les montants et hypothèses fournis respectent les seuils configurés. Ce statut n’est ni une approbation ni une garantie de sécurité. En particulier, `assumed_risk_amount` est une hypothèse de l’appelant et n’est pas dérivée de la distance ATR du stop.

## Sortie et garde-fous

Toute proposition reste `proposed_unsubmitted`, `order_ready: false`, `order_plan: null`, `execution_enabled: false` et `is_trade_approval: false`. Les champs d’ordre (quantité, type, prix d’entrée/stop/objectif, durée, frais estimés et perte maximale) restent `null`. Tous les niveaux portent `executable: false`. Le code ne possède aucune route d’exécution ni aucun accès broker.

Un candidat n’est jamais présenté comme un gain assuré. Les cours de clôture et niveaux ATR sont historiques/synthétiques, théoriques et non exécutables. Une vérification humaine indépendante reste nécessaire pour le symbole/venue, le bid/ask courant, le calendrier de marché, la liquidité, la précision de prix, les spécifications de contrat, les frais, la marge et les événements.

## Tests et état d’intégration

Les tests simulés couvrent les candidats long/short, l’ordre des niveaux ATR, le ratio brut, les coûts complets et le R/R net, l’absence de contexte coût, les devises incompatibles, les coûts/horizons invalides, les dépassements de risque, les séries insuffisantes, l’absence de setup, les séries fournisseur et les horodatages incohérents.

Le moteur de recommandations est une bibliothèque backend locale. Les routes produit actuelles d’analyse, l’adaptateur de données live et l’interface ne fournissent pas encore de niveaux ATR ni de contexte de coût validé. Le backtest historique partage les six composantes de coût v1, mais ne simule pas les stops/objectifs ATR. Ne pas annoncer les niveaux ATR ou le R/R net comme une fonctionnalité Premium opérationnelle avant validation du branchement, des données et des coûts applicables à l’instrument.
