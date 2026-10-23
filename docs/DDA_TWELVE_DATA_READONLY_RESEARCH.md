# Intégration Twelve Data — recherche et garde-fous

**Mise à jour :** 20 octobre 2026<br>
**État :** conception documentée; aucun appel fournisseur ni accès de production configuré.

## Décisions d’architecture

Le premier adaptateur doit rester côté BFF, en lecture seule. La clé Twelve Data ne doit jamais entrer dans le navigateur, les logs, le dépôt ou une URL. La documentation recommande l’en-tête `Authorization: apikey <clé>` et indique comme base REST `https://api.twelvedata.com`; le paramètre de requête `apikey` existe aussi, mais l’en-tête évite de placer le secret dans l’URL [1].

L’opération de marché ciblée est `GET /time_series`, avec un symbole et un intervalle explicites. La réponse fournit des métadonnées (`symbol`, `interval`, `currency`, `exchange_timezone`, `exchange`, `mic_code`, `type`) et des valeurs OHLCV sous forme de chaînes. La documentation décrit `datetime` comme l’heure locale d’ouverture de la barre et l’ordre par défaut comme décroissant; l’adaptateur devra demander `order=asc`, convertir les nombres strictement, contrôler l’instrument retourné et produire l’ordre chronologique exigé par DDA [1].

Le contrat DDA attend un horodatage UTC de clôture. Pour les intervalles intrajournaliers, la requête peut demander `timezone=UTC`; l’adaptateur pourra ensuite convertir les heures d’ouverture en clôtures selon une durée d’intervalle fixe, après tests dédiés. L’API précise que `timezone` est ignoré pour `1day`, `1week` et `1month`, qui restent en heure locale de place. Ces intervalles sont donc à refuser tant que la conversion de calendrier et la sémantique de clôture de la place n’ont pas été définies; aucune heure UTC ne doit être inventée [1].

La réponse documente un champ `volume`, mais ne garantit pas dans cet endpoint une unité commune à toutes les classes d’actifs. Le contrat de marché v2 exige une sémantique et une unité documentées. Tant que la définition pour le couple fournisseur/instrument n’est pas confirmée, le volume v2 doit rester `unavailable` avec `reason: not_verified`, ou la conversion doit échouer si une route v1 exige une valeur numérique. Il est interdit de convertir une absence en zéro [1].

## Quotas, erreurs et droits d’usage

Le coût documenté de `/time_series` est d’un crédit par symbole. Les crédits API sont limités selon l’offre et réinitialisés chaque minute; l’offre Basic affiche aussi une limite quotidienne. L’endpoint `GET /api_usage` fournit l’usage et les limites, mais coûte lui-même un crédit : il ne faut pas le sonder à chaque analyse. Les en-têtes de réponse `api-credits-used` et `api-credits-left` peuvent alimenter un compteur agrégé sans conserver les données de marché [2] [3].

Twelve Data documente notamment les erreurs 400 (paramètre invalide), 401 (clé invalide), 403 (permission ou offre insuffisante), 404 (instrument/données introuvables), 429 (quota atteint) et 500 (erreur fournisseur). L’adaptateur devra les convertir en codes internes bornés et ne pas renvoyer au navigateur le corps brut du fournisseur [1].

Le point le plus important avant un lancement Premium concerne la licence. La page Business distingue Basic, réservé à l’usage interne non-display, Venture qui inclut l’affichage externe, et Enterprise qui annonce la distribution externe de données de marché. Les conditions générales limitent l’usage aux droits de l’offre, interdisent la redistribution sans droit explicite et excluent l’usage commercial du Free Tier [4] [5]. DDA ne doit donc pas afficher des données Twelve Data à ses abonnés sur la seule base d’une clé gratuite. Le plan exact, les places, l’affichage de prix bruts, les données dérivées, l’attribution et les règles de conservation doivent être confirmés avec Twelve Data avant toute exposition aux utilisateurs.

## Entrées encore requises

Aucun instrument, code de place/MIC, intervalle ni devise n’est fixé dans le dépôt. L’utilisateur doit fournir le premier symbole, la place ou le MIC et l’unité de temps. Pour des bougies quotidiennes ou hebdomadaires, il faudra aussi valider la convention de timestamp liée à la séance locale. La politique de risque de simulation reste également à définir avant qu’une recommandation v2 puisse être exposée.

Le prochain adaptateur testable peut être écrit sans clé réelle, avec `fetch` injecté, fixtures documentées et erreurs simulées. Un appel réel ne sera effectué qu’après configuration sécurisée d’une clé et confirmation que son offre permet l’usage prévu. L’intégration ne doit ni ouvrir de WebSocket, ni exécuter d’ordre, ni conserver de bougies en base avant validation des droits de stockage.

## Références

[1]: https://twelvedata.com/docs "Twelve Data API Documentation"
[2]: https://support.twelvedata.com/en/articles/5615854-credits "Twelve Data Support: Credits"
[3]: https://twelvedata.com/docs/advanced/api-usage "Twelve Data API Documentation: API Usage"
[4]: https://twelvedata.com/pricing-business "Twelve Data Business Pricing"
[5]: https://twelvedata.com/terms "Twelve Data Terms of Use"
[6]: https://support.twelvedata.com/en/articles/5620513-how-to-find-all-available-symbols-at-twelve-data "Twelve Data Support: Finding Available Symbols"


## État d’implémentation locale — 20 octobre 2026

Le module [`twelve-data-market-provider.js`](../bff/src/autotrader/twelve-data-market-provider.js) et la route BFF `POST /v1/autotrader/provider-analysis` sont maintenant implémentés. La route n’accepte qu’un `instrument_id` présent dans l’allowlist serveur, exige `autotrader.analysis`, réserve ensemble le quota utilisateur et le quota Twelve Data dans une transaction RPC, puis revalide le droit avant de renvoyer les indicateurs descriptifs v2. Elle ne retourne pas les bougies brutes, ne crée aucun signal ni ordre et garde `execution_enabled=false`.

La configuration reste inactive dans les deux exemples d’environnement : clé API, allowlist, identifiant fournisseur `twelve-data` et référence interne de licence non renseignés. La référence `license_ref` ne certifie pas les droits; elle permet seulement de rattacher la sortie à une preuve interne à fournir par l’exploitant. Le client BFF expose l’appel, mais l’interface n’a pas encore de sélecteur d’instrument. Aucun appel HTTP réel à Twelve Data ni aucun test staging n’a été exécuté.

Les tests simulés couvrent l’authentification serveur, la validation métadonnées/séries, les intervalles, bougies incomplètes, quotas atomiques, révocation, erreurs masquées et invariants sans exécution. Ils ne prouvent ni la disponibilité du symbole choisi, ni les unités de volume, ni les droits d’affichage externe. Avant activation, il reste à décider le symbole, le code de place/MIC, le timeframe intrajournalier, la classification de l’actif, l’offre Twelve Data et les droits contractuels associés.
