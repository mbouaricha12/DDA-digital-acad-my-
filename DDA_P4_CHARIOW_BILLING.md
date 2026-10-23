# DDA P4 — Chariow Checkout & Billing

## Statut

**BillingStore branché côté BFF, paiement réel non activé.**

DDA utilise maintenant un adaptateur serveur prêt pour Chariow Checkout et les Pulses. Aucun secret, produit réel ou entitlement de production n’est livré dans le dépôt.

## Décision d’architecture

Chariow n’est pas traité comme une source de confiance côté navigateur :

```text
Academy → BFF DDA → Chariow Checkout
                         ↓
              Pulse signé HMAC-SHA256
                         ↓
                  BFF DDA → membership serveur → entitlements
```

La redirection après paiement sert uniquement à l’expérience utilisateur. L’accès Premium est accordé uniquement après un Pulse `successful.sale` accepté et persisté. Le BFF lit ensuite les memberships actifs depuis Supabase pour autoriser les routes Premium.

## Configuration serveur

Ajouter uniquement dans l’environnement du BFF, jamais dans `dist/` :

```bash
CHARIOW_API_KEY=sk_live_...
CHARIOW_PULSE_SECRET=whsec_...
CHARIOW_PREMIUM_PRODUCT_IDS=prd_premium_monthly,prd_premium_yearly
CHARIOW_AUTOTRADER_PRODUCT_IDS=
CHARIOW_CHECKOUT_REDIRECT_URL=https://app.example.com/academy.html#membership
```

`CHARIOW_PULSE_SECRET` est le secret propre au Pulse Chariow, différent de la clé API. L’endpoint Pulse doit être public en HTTPS.

## Pulses à configurer dans Chariow

Dans **Automation → Pulses**, créer un Pulse vers l’endpoint BFF :

```text
POST https://api.example.com/webhooks/chariow
```

Événements utilisés par l’adaptateur :

- `successful.sale` — activation d’un produit Premium explicitement autorisé ;
- `abandoned.sale` — suivi uniquement, aucun accès ;
- `failed.sale` — suivi uniquement, aucun accès ;
- `license.activated` — activation d’un produit Premium de type licence ;
- `license.expired` — expiration ;
- `license.revoked` — révocation.

L’adaptateur vérifie `x-chariow-signature` sur le corps brut, exige `x-pulse-delivery-id` et déduplique les livraisons via la clé primaire `dda_billing_deliveries.delivery_id`. La réclamation de livraison est conditionnelle : un doublon `accepted` récent n’est pas traité en parallèle, un état `failed` peut être repris atomiquement, et un worker interrompu est récupérable après expiration de son bail de dix minutes.

Les transitions `active`, `expired` et `revoked` exigent une date d’événement fournisseur valide. La migration `0008_chariow_event_ordering.sql` conserve `source_occurred_at` et ignore les événements plus anciens; à horodatage égal, `expired`/`revoked` l’emporte sur `active`. Vérifier en staging le nom, le fuseau et la sémantique des timestamps réels Chariow avant d’activer le mapping commercial.

## Tables Supabase ajoutées

- `public.dda_billing_deliveries` — journal minimal des livraisons Pulse, statut `accepted / processed / failed`, hash SHA-256 du payload et idempotence par `delivery_id` ;
- `public.dda_billing_memberships` — état courant par compte DDA et référence Chariow, avec contrainte unique `(provider, external_id)` et snapshot JSON des entitlements actifs.

Les deux tables sont protégées par RLS et n’accordent aucune écriture aux rôles `anon` ou `authenticated`. Seul le BFF utilisant la clé service role les écrit. La source SQL canonique est la séquence `supabase/migrations/` (`0004` pour le billing, `0006`/`0007` pour l’entitlement AutoTrader et ses quotas, `0008` pour l’ordre des événements Chariow) ; l’ancien `bff/supabase/schema.sql` est conservé comme brouillon historique et ne doit pas être appliqué. Rejouer et vérifier les migrations sur un staging PostgreSQL avant tout déploiement réel.

## Modèle Membership DDA

Une adhésion serveur est calculée à partir d’un produit Chariow allowlisté :

| Champ | Règle |
|---|---|
| `provider` | `chariow` |
| `product_id` | ID explicite, jamais recherche par nom |
| `sale_id` | Référence Chariow de la vente |
| `license_id` | Présente si le produit utilise une licence |
| `status` | `pending`, `active`, `expired`, `revoked` |
| `entitlements` | Snapshot serveur en lecture seule |
| `owner_id` | Compte DDA dérivé côté serveur |

Un `proof_id`, un `proof_level` ou un plan local ne peut jamais créer une autorisation.

### Droit AutoTrader séparé

`autotrader.analysis` est un droit distinct du Premium de l’académie. Seuls les IDs explicitement placés dans `CHARIOW_AUTOTRADER_PRODUCT_IDS` l’accordent; les produits de `CHARIOW_PREMIUM_PRODUCT_IDS` ne le donnent pas. Un produit listé dans les deux variables est un bundle intentionnel. La variable AutoTrader reste vide tant que l’offre, le checkout lié à une identité serveur et le cycle de renouvellement/révocation ne sont pas validés. Voir `DDA_AUTOTRADER_PREMIUM_ENTITLEMENT_V1.md` et le contrat `contracts/autotrader/analysis-entitlement-v1.json`.

À l’exécution, le BFF lit et agrège les snapshots `entitlement_snapshot` de toutes les adhésions actives Supabase et vérifie les dates. Chariow demeure l’autorité commerciale; Supabase est la projection serveur d’autorisation. Aucun droit ne provient du navigateur.

## Limite importante sur les abonnements récurrents

La documentation publique Chariow consultée documente Checkout, ventes et Pulses de licences. Elle ne fournit pas un jeu public complet d’événements équivalent à Stripe Billing pour `invoice.paid`, `subscription.updated`, `subscription.cancelled` et `payment_failed` récurrents.

Le modèle P4 est donc volontairement prudent : il représente l’accès comme une adhésion Premium avec expiration/révocation. Avant d’annoncer une facturation mensuelle automatique, il faudra confirmer dans le compte Chariow et auprès de leur support les événements récurrents réellement disponibles pour le produit choisi.

## Fichiers

- `bff/src/chariow.js` — vérification Pulse, déduplication, mapping et Checkout serveur ;
- `bff/src/billing-store.js` — persistance PostgREST, lecture des entitlements actifs et suppression des memberships d’un compte ;
- `contracts/p4-chariow-billing-v1.json` — contrat machine-readable ;
- `tests/test_p4_chariow_billing.js` — tests de sécurité et de mapping ;
- `tests/test_billing_store.js` — test PostgREST simulé du stockage Supabase.

## Activation production — à faire plus tard

1. Créer le produit Premium Chariow et relever ses IDs publics.
2. Créer une clé API serveur dédiée.
3. Créer le Pulse HTTPS et révéler son secret `whsec_...`.
4. Appliquer le schéma Supabase puis vérifier l’audit RLS.
5. Configurer le BFF avec `billingStore` et relier les transitions aux entitlements serveur.
6. Tester les livraisons réelles en environnement de staging.
7. Effectuer la revue juridique, remboursement et suppression avant mise en production.

Aucun paiement ou abonnement n’est créé par cette préparation.
