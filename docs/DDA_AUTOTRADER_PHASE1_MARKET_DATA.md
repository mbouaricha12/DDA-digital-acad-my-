# DDA AutoTrader — incréments 1 et 2 : données, analyse descriptive et API

**Statut :** contrat et analyseur locaux ajoutés; route BFF authentifiée ajoutée. Pas de fournisseur de données, stockage AutoTrader, interface ou connexion broker.

## Périmètre

L’incrément 1 fournit un contrat versionné OHLCV et une analyse déterministe minimale. Il traite des données historiques, des fixtures synthétiques explicitement identifiées ou un snapshot fournisseur transmis par un appelant. Aucun fournisseur n’est configuré ou connecté par ce code.

La sortie est un contexte descriptif (dernière clôture, variation close-à-close, SMA 20 et position de la clôture par rapport à la SMA 20, amplitude observée sur la fenêtre). Elle ne constitue pas un signal ni une proposition d’ordre. Il n’y a ni entrée, ni stop-loss, ni objectif, ni taille de position, ni ordre, ni connexion broker. `execution_enabled` est toujours `false` et `order_recommendation` toujours `null`.

L’incrément 2 expose le moteur par `POST /v1/autotrader/analyze`. La route ne modifie pas le contrat métier d’analyse : elle ajoute une enveloppe HTTP versionnée et l’horodatage de traitement serveur.

## Fichiers

- `contracts/autotrader/market-series-v1.schema.json` : JSON Schema Draft 2020-12 `dda.market-series.v1`.
- `bff/src/autotrader/market-data.js` : validation runtime stricte des clés, types, OHLC, timestamps, modes, source, ordre chronologique et fraîcheur.
- `bff/src/autotrader/market-analysis.js` : analyse descriptive déterministe `dda.descriptive-market-context.v1`.
- `bff/src/app.js` : route HTTP BFF, authentification existante, limite de taille, enveloppe versionnée et erreurs structurées.
- `tests/test_autotrader_market_analysis.js` : tests du module d’analyse.
- `tests/test_autotrader_analysis_route.js` : tests d’intégration HTTP et de sécurité de la route.
- `bff/package.json` : inclut les deux suites AutoTrader dans `npm test --prefix bff`.

## Contrat HTTP

**Endpoint :** `POST /v1/autotrader/analyze`<br>
**Authentification :** session DDA existante requise via `withUser`. Origine doit respecter l’allowlist globale du BFF. Comme l’endpoint est un calcul sans écriture ni effet de bord, il n’exige pas de jeton CSRF; il reste soumis au contrôle global d’origine pour les méthodes POST.<br>
**Taille maximale :** 64 KiB, réutilise le lecteur JSON et la limite BFF existante.<br>
**Requête :** `application/json`, objet strict avec l’unique propriété `series`, conforme à `dda.market-series.v1`. L’appelant ne peut pas choisir `asOf` ni relever la limite de fraîcheur.

Exemple de forme (données schématiques, pas de cotation réelle) :

```json
{
  "series": {
    "contract_version": "dda.market-series.v1",
    "instrument": { "symbol": "EXAMPLE", "venue": "EXAMPLE-X", "asset_class": "equity", "currency": "USD" },
    "timeframe": "1h",
    "data_mode": "historical",
    "source": { "id": "historical-import-1", "kind": "historical_import" },
    "retrieved_at": "2026-10-18T17:00:00.000Z",
    "bars": [
      { "timestamp": "2026-10-18T16:00:00.000Z", "open": 10, "high": 11, "low": 9, "close": 10.5, "volume": 100 }
    ]
  }
}
```

Une série donnée n’a pas besoin d’être suffisamment longue pour chaque indicateur : les mesures insuffisamment documentées sont retournées comme `null`/`insufficient_data`. Un snapshot, lui, est contrôlé avec une fenêtre de fraîcheur par défaut de cinq minutes côté serveur.

**Réponse succès (`200`) :**

```json
{
  "contract_version": "dda.autotrader.analysis-response.v1",
  "analyzed_at": "2026-10-18T17:00:00.000Z",
  "analysis": {
    "contract_version": "dda.market-analysis.v1",
    "execution_enabled": false,
    "order_recommendation": null
  }
}
```

`analysis` contient le résultat métier existant, non réécrit par l’API : instrument, timeframe, mode, source, date de la dernière barre, fraîcheur, métriques, contexte et limites. L’extrait ci-dessus ne montre que les champs qui identifient les deux niveaux de contrat et les garanties de non-exécution.

Erreurs : `400 validation_error` si le corps JSON/requête est invalide, `400 invalid_market_series` si les données ne passent pas le contrat, `401 unauthenticated` sans session, `413 validation_error` au-delà de 64 KiB, `415` pour un type de contenu non pris en charge, `422 stale_market_data` pour un snapshot périmé, `403 csrf_failed` si l’origine POST n’est pas permise, et `500 internal_error` si un défaut interne survient. Les réponses sont JSON et comprennent `request_id`; les exceptions brutes ne sont ni renvoyées ni consignées.

## Permissions et statut Premium

Cette route exige une session authentifiée, mais **ne vérifie pas un entitlement AutoTrader/Premium spécifique** : le dépôt n’en définit pas. L’endpoint n’affirme pas non plus que la session a une offre Premium Trading. Avant un lancement commercial, DDA devra définir un entitlement serveur propre à AutoTrader, ses quotas et sa révocation; ne pas réutiliser le faux état Premium local. Les analyses n’étant ni persistées ni rattachées à un compte dans cette tranche, l’authentification limite l’accès au service sans établir de droit commercial.

## Contrat d’entrée et méthodes de calcul

Une série porte l’instrument (symbole, venue, classe d’actifs, devise), le timeframe (`1m`, `5m`, `15m`, `30m`, `1h`, `4h`, `1d`, `1w`), le mode, les métadonnées de source, l’instant de récupération et un tableau OHLCV. Chaque `timestamp` est l’instant UTC de clôture de la bougie, au format ISO canonique à millisecondes. Les timestamps doivent être strictement croissants et uniques. Les prix sont finis et strictement positifs; le volume est fini et non négatif; high/low doivent encadrer la bougie.

Le mode et la source doivent concorder : `snapshot`/`provider`, `historical`/`historical_import`, `synthetic`/`synthetic_fixture`. Le contrat est limité à 100 000 barres; la limite HTTP de 64 KiB est plus restrictive pour les requêtes API. Les modes historiques et synthétiques ne sont pas évalués comme des données live.

Les métriques comprennent `value`, `unit`, `window`, `method`, `inputs` et `status`. Les métriques SMA/retour manquantes restent `null` avec `insufficient_data`; le module ne comble pas les données absentes. La variation est le rendement simple `close_t / close_(t-1) - 1`; la SMA est la moyenne arithmétique des 20 dernières clôtures. Les méthodes et fenêtres sont retournées avec les métriques.

## Tests exécutés et limites

`npm test --prefix bff` a été exécuté après l’incrément 2 : tests BFF existants PASS, 11 tests du moteur PASS et 10 tests HTTP AutoTrader PASS. Les nouveaux tests couvrent succès historique et synthétique, authentification, réponse versionnée et invariants non-exécution, données OHLCV invalides, timestamp dupliqué/non-croissant/futur, snapshot périmé, corps supérieur à 64 KiB, erreur interne masquée et forme stricte de requête. Syntaxe Node des fichiers modifiés et `git diff --check` passent.

Cette suite s’exécute avec des adapters d’identité/session mémoire; elle n’interroge ni Supabase distant ni un fournisseur. Le runner navigateur complet n’est pas concerné par la route et reste dépendant de Playwright, non installé localement.

- `source.id` ne prouve ni la fiabilité ni la licence des données. L’identité du fournisseur, la qualité, les calendriers, unités de volume et ajustements corporate restent à valider par un futur adaptateur.
- La fraîcheur des snapshots compare la dernière clôture reçue au temps serveur; elle ne valide pas la continuité, les horaires de marché ni les événements de marché.
- La route ne stocke pas les analyses, ne gère aucune config de risque et ne fournit pas de calcul de taille de position.
- L’authentification seule ne constitue pas l’autorisation Premium spécifique AutoTrader; cette permission doit être ajoutée côté serveur avant d’exposer le produit comme avantage Premium.
- Aucun fournisseur de données, stockage, interface, broker, compte démo ou exécution d’ordres n’est branché.

**Prochaine étape recommandée :** décider l’entitlement serveur AutoTrader, le quota et le provider/instrument initial; ensuite construire uniquement l’adaptateur de marché en lecture seule avec son contrat source/licence. L’exécution d’ordres demeure exclue.
