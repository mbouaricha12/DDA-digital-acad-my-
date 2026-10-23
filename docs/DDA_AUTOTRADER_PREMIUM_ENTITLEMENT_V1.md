# DDA AutoTrader Premium — droit `autotrader.analysis` v1

**Statut : droit défini et contrôle serveur en préparation locale ; aucun produit, paiement, abonnement ou déploiement n’est activé.** Le contrat machine-readable est [`contracts/autotrader/analysis-entitlement-v1.json`](../contracts/autotrader/analysis-entitlement-v1.json).

## Décision

AutoTrader ne réutilise pas le droit Premium générique de l’académie. La capacité d’analyse est identifiée par le code exact `autotrader.analysis`. Une adhésion académique peut continuer à accorder `premium_track`, `resources_premium`, `certificate_preview` et `advanced_modules`, mais ces droits ne satisfont pas la garde AutoTrader. Un bundle peut accorder les deux catégories seulement si son ID produit est inscrit explicitement dans les deux allowlists.

L’autorisation d’analyse nécessite toujours une session DDA valide **et** `autotrader.analysis` présent dans les adhésions serveur actives. La route protégée v1 est `POST /v1/autotrader/analyze`. Le droit couvre uniquement l’analyse descriptive non exécutable : aucun ordre, accès MT5, trading paper/réel ou garantie de résultat n’en découle.

## Sources de vérité

Deux sources ont des rôles distincts :

1. **Vérité commerciale : Chariow.** L’état d’achat, de licence, de remboursement ou de résiliation doit provenir d’un Pulse signé vérifié par le BFF ou d’une réconciliation serveur autorisée. Une redirection de navigateur ou une page « paiement réussi » ne constitue pas une preuve.
2. **Vérité d’autorisation à la requête : Supabase côté serveur.** `public.dda_billing_memberships` conserve les adhésions et leur `entitlement_snapshot`. Le BFF agrège toutes les adhésions actives d’un compte, filtre les dates de début/fin, puis vérifie le code exact du droit. La clé `service_role` reste uniquement côté serveur ; RLS et les privilèges navigateur restent fermés pour les écritures.

Supabase est une projection opérationnelle de l’état commercial, pas une deuxième caisse indépendante. Chariow est l’autorité de facturation ; le BFF ne fait confiance qu’à son état serveur vérifié et persisté. Les adhésions doivent donc pouvoir être réconciliées avec Chariow et toute correction manuelle doit être auditée.

## Mapping produit

Le BFF conserve l’allowlist académique existante `CHARIOW_PREMIUM_PRODUCT_IDS` et ajoute `CHARIOW_AUTOTRADER_PRODUCT_IDS`, vide par défaut. Un ID AutoTrader dédié donne uniquement `autotrader.analysis`; il ne donne pas `premium_track`. Le chevauchement est réservé à un produit bundle explicitement voulu. Les noms commerciaux, prix ou métadonnées fournies par le navigateur ne remplacent jamais l’ID produit allowlisté.

Les identifiants produits réels ne sont pas connus dans le dépôt et ne doivent pas être inventés. Ils devront être ajoutés aux secrets/configurations du BFF après validation du produit, du checkout et du mapping des événements. Aucun ID de production n’est ajouté à Git.

## Cycle de vie et blocage de la facturation récurrente

Les Pulses acceptés dans le socle P4 sont `successful.sale`, `license.activated`, `license.expired` et `license.revoked`, ainsi que des événements de vente échouée/abandonnée qui ne donnent aucun droit. Les livraisons doivent rester vérifiées sur le corps brut, idempotentes et persistées avant de confirmer leur traitement.

Le code P4 existant ne documente pas un cycle récurrent complet pour le produit choisi : renouvellement payé, paiement échoué, annulation, période de grâce, remboursement et état d’expiration doivent être confirmés. Jusqu’à cette validation, ne pas inscrire dans l’allowlist un produit présenté comme abonnement auto-renouvelé. Un produit à achat unique/lifetime ne peut être activé que si cette nature est explicite et les règles de remboursement/révocation définies.

## Identité et lien de checkout

Le webhook doit rattacher la vente à un `user_id` DDA obtenu d’un checkout créé par le serveur ou d’un identifiant de checkout-intent créé côté serveur. Le BFF doit dériver l’utilisateur de la session ; il ne doit pas accepter un `dda_user_id` arbitraire venu du navigateur ou faire une association de compte fondée uniquement sur un e-mail. La redirection de retour n’accorde rien.

Le dépôt ne possède pas encore un parcours Checkout authentifié complet ni un checkout-intent persistant/rejouable. Ce chaînon reste un prérequis bloquant à l’activation de produits, même si la vérification des Pulses et le BillingStore existent.

## Révocation immédiate et sessions

À réception d’un Pulse signé `license.revoked` ou `license.expired`, le BFF persiste d’abord le statut inactif et un snapshot de droits vide; la prochaine requête AutoTrader est refusée. Le résultat est aussi revalidé après calcul pour jeter une analyse devenue interdite pendant son exécution. Les sessions `dda_sessions` sont globales à l’Académie et ne portent aucun droit AutoTrader : elles ne sont pas détruites lors de la perte d’un abonnement AutoTrader. Le nettoyage doit viser uniquement des sessions AutoTrader dédiées lorsqu’elles existeront. La [procédure de révocation et de nettoyage](DDA_AUTOTRADER_REVOCATION_V1.md) décrit le flux, les reprises webhook et les événements Chariow qui restent à confirmer.

## Quotas — séparés du droit

`autotrader.analysis` répond à la question « l’utilisateur a-t-il accès ? », pas « combien d’analyses peut-il consommer ? ». La politique locale v1 définit 10/50/200 analyses par minute/heure/jour et des plafonds fournisseur partagés; elle reste provisoire jusqu’au choix du fournisseur et à la revue de son barème. Les quotas sont des compteurs serveur atomiques distincts du droit, et aucun état client ne les modifie. Détails : [`DDA_AUTOTRADER_QUOTAS_V1.md`](DDA_AUTOTRADER_QUOTAS_V1.md).

## Conditions avant activation

- IDs produit/plan et nature de l’offre validés ; allowlist AutoTrader distincte configurée côté BFF.
- Checkout authentifié avec identité liée par un checkout-intent serveur ; aucun rattachement basé sur les seules métadonnées client ou l’e-mail.
- Renouvellements, annulations, paiements échoués, remboursements et expiration confirmés pour l’offre choisie, ou offre limitée à un achat unique dont les règles sont documentées.
- Migration Supabase examinée et appliquée séparément en staging ; RLS, sauvegarde, réconciliation, suppression et restauration validées.
- Tests d’intégration avec Pulses de staging, événements hors ordre, doublons, révocations, plusieurs adhésions par utilisateur, dates limites et panne PostgREST.
- Valeurs de quotas v1 revues après choix du fournisseur ; migration 0007 appliquée en staging, tests de concurrence, plafond de coût mappé et alerting sans secrets/PII.

## Fichiers de référence

- `bff/src/entitlement-catalog.js` — catalogue fermé des codes de droits.
- `bff/src/chariow.js` — mapping contrôlé des IDs produit vers les droits.
- `bff/src/billing-store.js` — projection serveur, agrégation des adhésions et calcul des droits actifs.
- `supabase/migrations/0006_autotrader_analysis_entitlement.sql` — contrainte de contrat à appliquer après revue, jamais automatiquement.
- `contracts/autotrader/analysis-entitlement-v1.json` — contrat du droit et de ses sources.
