# Audit de pré-lancement — DDA AutoTrader Premium

**Date :** 19 octobre 2026<br>
**Verdict :** **NO-GO pour vendre AutoTrader comme fonctionnalité de trading opérationnelle.** La prévisualisation pédagogique, clairement marquée comme telle, peut rester visible. Le backend local est amélioré et testé, mais les données, coûts et branchements opérationnels nécessaires à un lancement payant ne sont pas prouvés.

## Résumé de cette tranche

Le générateur v2 produit maintenant, en cas de setup directionnel admissible, des niveaux théoriques séparés de la règle `dda.trend-confirmation.v1` : clôture de la dernière barre complète comme référence, stop à `1,5 × Wilder ATR(14)` et objectif unique à `2R`. Le niveau est masqué si l’ATR/clôture est inexploitable, si le prix calculé n’est pas positif ou si l’ordre des prix n’est pas cohérent. Tous les niveaux restent `executable: false`.

Le modèle [`dda.autotrader.cost-model.v1`](../bff/src/autotrader/cost-model-v1.js) accepte uniquement un contexte explicite : référence, devise, unité et multiplicateur de contrat, horizon en barres, barres annuelles et coûts. Le R/R net reste `null` sans contexte complet; les devises incompatibles, paramètres absents/invalides ou friction transactionnelle inutilisable sont signalés. Un ratio net négatif n’est pas masqué. Les hypothèses sont explicitement marquées comme fournies par l’appelant et non vérifiées indépendamment.

Le backtest historique quotidien utilise maintenant les mêmes six composantes de coût : commission, spread et glissement par côté, financement annuel long, financement annuel short et emprunt annuel short. Le financement est accru au fil des barres, avec convention quotidienne de 252 barres par an. **Le backtest n’emploie toutefois pas les stops/objectifs ATR** : il valide la causalité de la règle directionnelle existante, pas ce nouveau modèle de niveaux.

L’interface conserve un aperçu honnête et propose maintenant, après confirmation serveur de `autotrader.analysis`, l’import d’un CSV historique de 20 à 250 bougies (24 Ko max). Le client BFF envoie la série à `/v1/autotrader/analyze` avec cookies/CSRF; l’API ne produit qu’un contexte descriptif v1 et les résultats affichés ne comprennent aucun signal, niveau d’ordre ou performance. Le fichier est déclaré historique par l’utilisateur mais n’est pas vérifié indépendamment. Le droit Premium générique ne déverrouille pas le formulaire.

## Matrice d’état produit

| Domaine | État vérifié | Conséquence de lancement |
|---|---|---|
| Analyse/risk backend | Bibliothèques locales déterministes; filtres de risque en simulation; aucune route d’exécution | Prototype testable, pas une offre de trading réelle |
| Niveaux ATR | Formules déterministes v1 implémentées; hypothèse pédagogique non validée hors échantillon | Ne pas présenter comme une stratégie éprouvée ni comme une recommandation exécutable |
| R/R brut et net | Brut calculé à partir des niveaux; net disponible seulement avec un contexte explicite | Aucun coût par défaut; les paramètres ne constituent pas un barème vérifié du broker/instrument |
| Backtest | Simulation daily causale, divisions temporelles et sensibilité de coûts; stratégie toujours `unverified` | Pas de preuve de rentabilité; fixtures synthétiques = tests uniquement |
| Coûts du backtest | Composantes long/short partagées avec le modèle v1; coût d’emprunt short distinct | Taux encore statiques, fournis par l’appelant; pas d’historique réel de swaps/financement |
| Interface Premium | Statut d’accès et import historique CSV; droit AutoTrader distinct; route descriptive v1 appelée avec client BFF | Aucun flux live ni recommandation v2; l’historique est une entrée utilisateur non vérifiée indépendamment |
| Entitlement/quota/Chariow | Contrats, migrations et tests locaux présents | L’application des migrations, les événements et révocations n’ont pas été prouvés en staging |
| Marché | Aucun fournisseur live/configuration/autorisation validé dans ce périmètre | Pas de cotation live; les séries admissibles au prototype sont historiques ou synthétiques |
| MT5/exécution | Aucune connexion ni transmission d’ordre; `execution_enabled=false` | Ne pas annoncer « bot automatique », « trading actif » ou exécution MT5 |
| Kill switch/paper événementiel | Non livré/câblé selon la charte produit | Bloquant avant un service paper continu ou une intégration broker ultérieure |

## Critères de lancement honnête

**Acceptable maintenant :** conserver un aperçu éducatif ou un statut « en préparation », expliquer le périmètre, et rappeler qu’aucun signal, niveau, R/R ou résultat simulé ne garantit un gain.

**Non acceptable maintenant :** vendre le calcul net comme s’il utilisait les frais réels d’un instrument; afficher un cours live sans flux autorisé; présenter le backtest de la tendance comme validation des stops ATR; promettre précision, performance ou revenus; laisser entendre que MT5 ou l’exécution automatique sont disponibles; assimiler un abonnement Premium générique au droit AutoTrader.

Pour lever le NO-GO, les preuves minimales sont : (1) un profil serveur de coûts traçable par instrument/contrat et frais applicable, (2) une source de données sélectionnée avec droits, symboles, unités, fraîcheur, quotas et limites de coût vérifiés, (3) un backtest hors échantillon des sorties ATR avec gaps, fills et coûts représentés, sur des données historiques dont les droits sont validés, (4) l’intégration contrôlée de la réponse d’analyse à l’interface avec provenance/fraîcheur, (5) un test staging des migrations Supabase, de Chariow, des quotas atomiques, renouvellements, annulations et révocations, et (6) un mécanisme d’arrêt et des contrôles opérationnels avant tout service continu. Toute future exécution MetaTrader constitue un jalon séparé avec revue de sécurité et validation indépendante; elle reste désactivée.

## Vérification effectuée

- `npm test --prefix bff` : réussi.
- Régression des **75 fichiers de test** (tests Node et smoke boot) : réussie.
- AutoTrader : modèle de coûts **4 tests**, recommandations **15 tests**, backtest historique **13 tests** réussis.
- Smoke boot avec jsdom temporaire : **24 vérifications réussies**.
- Parseur CSV historique : **11 tests**; client BFF AutoTrader : **4 tests**; test Chromium final réussi avec entitlement, attestation CSV, appel BFF mocké et affichage descriptif sans signal.
- Tous les schémas Draft 2020-12 : chargés et contrôlés. Des sorties runtime valides et des cas négatifs (ATR non calculable, backtest bloqué) ont également été validés contre les schémas.
- Syntaxe JavaScript et `git diff --check` : réussis.

Ces tests s’exécutent localement et sur fixtures/mocks. Ils ne constituent pas une preuve de déploiement, de staging, de licences de marché, de coûts de courtage, ni de rentabilité. Aucun commit n’a été créé; le travail local existant a été conservé.

## Références modifiées ou consolidées

- [Moteur de recommandations et niveaux ATR](../bff/src/autotrader/order-recommendations.js)
- [Modèle de coûts v1 partagé](../bff/src/autotrader/cost-model-v1.js)
- [Schéma du contexte de coûts](../contracts/autotrader/cost-model-v1.schema.json)
- [Contrat de recommandation v2](../contracts/autotrader/order-recommendation-v2.schema.json)
- [Backtest historique quotidien](../bff/src/autotrader/backtest-historical.js)
- [Spécification et résultat du backtest](../contracts/autotrader/historical-backtest-spec-v1.schema.json) · [contrat de résultat](../contracts/autotrader/historical-backtest-v1.schema.json)
- [Règles fonctionnelles des recommandations](DDA_AUTOTRADER_ORDER_RECOMMENDATIONS_V1.md)
- [Règles du backtest](DDA_AUTOTRADER_HISTORICAL_BACKTEST_V1.md)
- [Client BFF navigateur](../dist/bff-client.js) · [parseur CSV historique](../dist/autotrader-history-import.js) · [test du parseur](../tests/test_autotrader_history_import.js)
- [Charte produit](DDA_AUTOTRADER_PRODUCT_CHARTER.md)


## Addendum — branchement Twelve Data préparé (20 octobre 2026)

L’adaptateur `bff/src/autotrader/twelve-data-market-provider.js`, la route `POST /v1/autotrader/provider-analysis`, le client navigateur et le contrat `provider-analysis-response-v1.schema.json` sont maintenant présents localement. Le chemin exige le droit spécifique `autotrader.analysis`, une allowlist serveur, une référence d’audit de licence, des quotas utilisateur/fournisseur atomiques et une vérification d’entitlement avant réponse. La sortie est une analyse historique descriptive v2; les bougies brutes ne sont pas retournées et aucun signal ou ordre n’est autorisé.

**Toujours non activé :** la clé API, l’allowlist, l’identifiant fournisseur et la référence interne de licence restent non configurés. Aucun appel réel à Twelve Data, aucune validation staging et aucun droit d’affichage/distribution n’ont été prouvés. L’interface n’a pas encore de sélecteur d’instrument; le client BFF expose la méthode mais la vue produit n’appelle pas encore cette route. Le symbole, la place/MIC, la devise, le timeframe et la classification de l’actif restent à confirmer. Le backtest historique refuse toujours les séries provider tant que ses droits et son protocole spécifique ne sont pas approuvés.

**Validation locale additionnelle :** `npm test --prefix bff` passe avec les nouvelles suites simulées Twelve Data (8 tests adaptateur, 10 tests route); le client BFF compte désormais 7 scénarios. Aucun test ne contacte le fournisseur. Le verdict reste **NO-GO** pour la commercialisation d’AutoTrader comme produit de trading opérationnel.
