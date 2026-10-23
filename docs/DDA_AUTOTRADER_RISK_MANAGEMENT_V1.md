# DDA AutoTrader — gestion du risque v1

**Statut :** évaluateur déterministe de snapshots en mode `simulation` uniquement et de limites explicitement fournies. Tout mode réel est refusé. Le module ne se connecte ni à un compte, ni à un broker, ni à un flux de marché; il ne crée aucun ordre ou sizing.

## Contrats d’entrée

- [Snapshot risque v1](../contracts/autotrader/risk-snapshot-v1.schema.json) : `data_mode: simulation`, horodatage UTC, devise de base, equity, `positions_complete: true`, P&L signé de la session et positions. Les entrées `notional`, `assumed_risk_amount`, `equity` et `daily_pnl` sont toutes dans `base_currency`; chaque position ouverte exige un `assumed_risk_amount` strictement positif. Le module refuse les devises mixtes; il ne fait aucune conversion FX.
- [Politique risque v1](../contracts/autotrader/risk-policy-v1.schema.json) : les seuils sont tous obligatoires, configurés par l’appelant; aucune valeur par défaut de production n’est définie. Les fractions sont décimales (par exemple `0.10` = 10 % de l’equity) et sont évaluées sans arrondi; l’égalité au plafond est admise.

`instrument` doit être un identifiant canonique et stable fourni par l’appelant. Les alias ne sont pas fusionnés; l’exposition agrégée par instrument peut donc être incomplète si l’amont donne des identifiants différents au même actif. Il faut un mapping approuvé avant d’utiliser les métriques comme contrôle de portefeuille réel.

## Calculs et contrôles

- **Exposition brute** : somme des notionnels positifs, indépendamment du côté; comparée à `max_gross_exposure_fraction`.
- **Exposition nette absolue** : valeur absolue de la somme des notionnels signés (long positif, short négatif); comparée à `max_abs_net_exposure_fraction`.
- **Concentration instrument/classe d’actif** : somme brute des positions de même identifiant exact, rapportée à l’equity; comparée au plafond global correspondant.
- **Risque supposé par position et agrégé** : le module compare les `assumed_risk_amount` positifs fournis à leurs plafonds individuels et agrégés. Il ne calcule pas une perte depuis un stop, un multiplicateur contractuel, un delta ou une marge.
- **Perte quotidienne** : `max(0, -daily_pnl) / equity`, à partir du P&L signé session-to-date fourni; ce n’est pas un drawdown depuis un sommet.
- **Âge du snapshot** : `evaluation_as_of - snapshot.as_of`; un snapshot plus ancien que `max_snapshot_age_ms` est refusé sans produire de métriques.

Un contrôle au-dessus de son seuil donne `limits_exceeded`; un snapshot incomplet, invalide ou périmé ne donne pas de décision exploitable. Les réponses n’utilisent pas de statut `approved` : `within_configured_limits` signifie uniquement que les calculs fournis ne dépassent pas les seuils configurés.

## Garde-fous et exclusions

La sortie expose `is_trade_approval: false`, `execution_enabled: false` et `order_recommendation: null`. Elle n’émet ni ordre, ni entrée, ni stop, ni objectif, ni taille de position. Un résultat sans dépassement ne garantit pas qu’un placement serait sûr; gaps, liquidité, levier, marge, coûts, corrélations, risque de contrepartie, qualité des données et pertes supérieures au risque supposé ne sont pas modélisés.

Le snapshot est fourni par l’appelant et n’est pas authentifié. `positions_complete: true` est une attestation d’amont, pas une preuve d’accès à l’ensemble du portefeuille. Les valeurs financières réelles sont des données sensibles; les fixtures et tests de ce module n’emploient que des identifiants synthétiques.
