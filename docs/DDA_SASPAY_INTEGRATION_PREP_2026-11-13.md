# DDA — Préparation de l'intégration SaSPay

**Date :** 13 novembre 2026
**Statut :** préparation uniquement. Chariow reste le moyen de paiement actif et n'est pas modifié. Aucune bascule de paiement en production. Aucun paiement SaSPay n'est présenté comme opérationnel — rien n'est opérationnel tant que des tests E2E réels (avec de vraies informations SaSPay) n'ont pas réussi.

## 1. Rappel de contexte

SaSPay reste dans la stratégie de paiement DDA. Pour l'instant :

- Le code actuel (`bff/src/chariow.js`, `bff/src/billing-store.js`, `supabase/migrations/0004_chariow_billing.sql`) est construit spécifiquement pour Chariow — schéma, webhook, machine d'état.
- Cette note prépare l'intégration SaSPay **sans toucher** à ce qui fonctionne pour Chariow, et sans rien activer.

## 2. Informations à obtenir auprès de SaSPay avant tout développement réel

Rien ci-dessous n'est confirmé — c'est la liste des informations nécessaires, pas des réponses :

### 2.1 Accès et documentation
- Documentation API officielle à jour (REST ? autre ?).
- Environnement sandbox/test distinct de la production, avec ses propres identifiants.
- Process d'obtention des identifiants API (clé API, secret, ou OAuth) — délai, validation KYC/KYB éventuelle pour DDA en tant que marchand.

### 2.2 Paiement et checkout
- Modalités de paiement supportées exactement (carte, Mobile Money — Orange Money, MTN, Moov, Wave, etc. selon les pays couverts), et lesquelles sont pertinentes pour le marché visé par DDA.
- Flux de checkout : redirection hébergée par SaSPay, ou API d'intégration directe (iframe, SDK) ?
- Devises supportées, et si des conversions sont nécessaires.
- Gestion des abonnements récurrents (Premium DDA est un abonnement) : SaSPay a-t-il un objet « abonnement »/« plan » natif, ou faut-il le construire côté DDA au-dessus de paiements ponctuels ?

### 2.3 Webhooks / notifications serveur
- Existence d'un mécanisme de webhook (notification serveur asynchrone), équivalent du "Pulse" Chariow.
- Méthode de signature/vérification de l'authenticité d'un webhook (HMAC ? autre ?) — **point de sécurité critique**, à documenter avant tout code de vérification.
- Liste exhaustive des types d'événements webhook (paiement réussi, échoué, remboursement, abonnement activé/expiré/annulé, litige).
- Idempotence : SaSPay fournit-il un identifiant de livraison unique rejouable (équivalent `delivery_id`), pour éviter un double traitement ?
- Délai de retry de SaSPay en cas de non-réponse du serveur DDA, et code de réponse HTTP attendu.

### 2.4 Frais et modalités commerciales
- Grille de frais (pourcentage + fixe par transaction), par méthode de paiement (carte vs Mobile Money, qui ont souvent des frais différents).
- Délai de règlement (combien de temps avant que DDA reçoive réellement les fonds).
- Devise de règlement et compte bancaire/mobile destinataire.
- Politique de remboursement (délai, qui initie, impact sur les frais déjà prélevés).
- Conditions contractuelles : durée d'engagement, résiliation, support.

### 2.5 Conformité et sécurité
- Certification PCI-DSS ou équivalent si SaSPay manipule des données de carte directement.
- Politique de conservation des données de paiement (SaSPay doit rester responsable des données sensibles de carte — DDA ne doit jamais stocker de numéro de carte).
- Disponibilité/SLA annoncé.

**Tant que ces informations ne sont pas confirmées par écrit auprès de SaSPay, aucune ligne de code d'intégration réelle (vérification de webhook, appel API réel) ne doit être écrite contre de vraies valeurs — seulement une structure prête à les recevoir (section 3).**

## 3. Architecture d'intégration — selon l'architecture DDA actuelle

### 3.1 Ce qui existe déjà et doit rester intact

- `bff/src/chariow.js` : parsing/vérification des webhooks Chariow (Pulse), mapping vers les événements de monétisation internes.
- `bff/src/billing-store.js` : machine d'état d'entitlement (`dda_billing_memberships`), déduplication des livraisons (`dda_billing_deliveries`), idempotence.
- `supabase/migrations/0004_chariow_billing.sql` : **le `provider` est actuellement verrouillé à `'chariow'` par une contrainte `check (provider = 'chariow')`** sur les deux tables. C'est une protection délibérée — ne jamais la retirer sans migration explicite et validée.

### 3.2 Principe directeur : un adaptateur par fournisseur, un seul billing-store

Le `billing-store.js` actuel est déjà conçu autour d'un modèle générique (`provider`, `external_id`, `provider_event_at`, `status`) — il n'a **aucune logique spécifique à Chariow** dans sa machine d'état (`acceptsTransition`). Le travail propre à un fournisseur (vérification de signature, parsing du payload brut, mapping vers les événements internes) vit entièrement dans son propre fichier adaptateur (`chariow.js`). SaSPay suivrait exactement le même schéma :

```
bff/src/saspay.js   (nouveau, miroir de chariow.js)
  - saspayConfigFromEnv()
  - verifySaspayWebhook(rawBody, signature, secret)   ← selon le schéma réel de signature SaSPay (section 2.3)
  - parse du payload SaSPay → même forme d'événement interne que chariow.js produit déjà
      (eventName, externalCustomerId, email, productId, metadata, occurredAt)

bff/src/billing-store.js   (inchangé dans sa logique — seule la contrainte SQL change)
  - claim(deliveryId, { ...,  provider: 'saspay' })   ← déjà paramétrable, juste jamais appelé avec autre chose que 'chariow' aujourd'hui

supabase/migrations/00XX_saspay_billing_provider.sql   (NOUVELLE migration, préparée mais PAS appliquée)
  - check (provider in ('chariow', 'saspay'))  au lieu de check (provider = 'chariow')
  - toute colonne spécifique à SaSPay si son modèle l'exige (ex. référence Mobile Money)
```

Aucune modification du chemin Chariow existant n'est nécessaire : `chariow.js` continue de fonctionner à l'identique, `saspay.js` est un fichier **additif**, et la route BFF qui reçoit les webhooks resterait, pendant la phase de test, strictement séparée (une route `/v1/billing/chariow/webhook` existante, une nouvelle route `/v1/billing/saspay/webhook` ajoutée — jamais la même route pour les deux).

### 3.3 Comment tester SaSPay sans jamais risquer Chariow

1. **Migration additive et réversible** : la nouvelle contrainte `provider in ('chariow', 'saspay')` n'affecte aucune ligne existante (toutes restent `'chariow'`) — elle élargit l'ensemble autorisé, elle ne le restreint jamais. Elle doit être revue et approuvée avant application, comme toute migration (voir `supabase/migrations/0005_brvm_publications.sql` pour le précédent exact de ce type de migration « préparation, ne pas appliquer sans validation »).
2. **Variable d'environnement de bascule, jamais un remplacement en dur** : `CHARIOW_PREMIUM_PRODUCT_IDS` et les variables Chariow existantes restent seules lues pour le chemin de paiement actif. Un éventuel `SASPAY_ENABLED=false` par défaut garantirait que le code SaSPay reste inerte jusqu'à activation explicite.
3. **Staging d'abord, avec le sandbox SaSPay** : toute vérification de webhook réelle, tout appel API réel, se teste d'abord contre l'environnement sandbox de SaSPay (section 2.1) sur un environnement de staging DDA — jamais directement en production.
4. **Tests automatisés avant toute activation réelle** : un fichier `tests/test_saspay_webhook_contract.js` (à écrire une fois le format réel de webhook SaSPay connu), miroir de la couverture déjà existante pour Chariow (signature invalide rejetée, événements dupliqués dédupliqués, événements hors séquence gérés) — doit passer avant toute connexion à de vraies clés API.
5. **Chariow reste le chemin de production jusqu'à décision explicite du fondateur** : même une fois SaSPay testé avec succès en sandbox/staging, le routage réel de production (quel fournisseur reçoit un paiement réel) ne change pas sans validation explicite — ce n'est pas une décision technique mais commerciale.

## 4. Ce qui N'EST PAS fait par cette préparation

- Aucun fichier `bff/src/saspay.js` fonctionnel n'est créé tant que le schéma réel de signature/webhook SaSPay n'est pas confirmé (section 2.3) — l'écrire contre des suppositions créerait un faux sentiment de sécurité (vérification de signature qui semble correcte mais ne protège rien).
- Aucune migration n'est appliquée.
- Aucune route BFF SaSPay n'est ajoutée au serveur actif.
- Aucune annonce de disponibilité SaSPay n'est faite nulle part dans le produit.

## 5. Prochaine étape concrète

Obtenir de SaSPay les réponses à la section 2 (en particulier 2.3, le schéma de webhook/signature — c'est le prérequis de sécurité bloquant). Une fois obtenues, l'écriture de `bff/src/saspay.js` et de ses tests peut commencer, en suivant exactement le schéma de la section 3.2.
