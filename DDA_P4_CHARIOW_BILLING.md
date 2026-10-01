# DDA P4 — Chariow Checkout & Billing

## Statut

**Socle préparé, paiement réel non activé.**

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

La redirection après paiement sert uniquement à l’expérience utilisateur. L’accès Premium est accordé uniquement après un Pulse `successful.sale` accepté et persisté.

## Configuration serveur

Ajouter uniquement dans l’environnement du BFF, jamais dans `dist/` :

```bash
CHARIOW_API_KEY=sk_live_...
CHARIOW_PULSE_SECRET=whsec_...
CHARIOW_PREMIUM_PRODUCT_IDS=prd_premium_monthly,prd_premium_yearly
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

L’adaptateur vérifie `x-chariow-signature` sur le corps brut, exige `x-pulse-delivery-id` et déduplique les livraisons.

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

## Limite importante sur les abonnements récurrents

La documentation publique Chariow consultée documente Checkout, ventes et Pulses de licences. Elle ne fournit pas un jeu public complet d’événements équivalent à Stripe Billing pour `invoice.paid`, `subscription.updated`, `subscription.cancelled` et `payment_failed` récurrents.

Le modèle P4 est donc volontairement prudent : il représente l’accès comme une adhésion Premium avec expiration/révocation. Avant d’annoncer une facturation mensuelle automatique, il faudra confirmer dans le compte Chariow et auprès de leur support les événements récurrents réellement disponibles pour le produit choisi.

## Fichiers

- `bff/src/chariow.js` — vérification Pulse, déduplication, mapping et Checkout serveur ;
- `contracts/p4-chariow-billing-v1.json` — contrat machine-readable ;
- `tests/test_p4_chariow_billing.js` — tests de sécurité et de mapping.

## Activation production — à faire plus tard

1. Créer le produit Premium Chariow et relever ses IDs publics.
2. Créer une clé API serveur dédiée.
3. Créer le Pulse HTTPS et révéler son secret `whsec_...`.
4. Implémenter le `billingStore` persistant dans Supabase avec idempotency unique sur `x-pulse-delivery-id`.
5. Relier les transitions au membership/entitlement serveur.
6. Tester les livraisons réelles en environnement de staging.
7. Effectuer la revue juridique, remboursement et suppression avant mise en production.

Aucun paiement ou abonnement n’est créé par cette préparation.
