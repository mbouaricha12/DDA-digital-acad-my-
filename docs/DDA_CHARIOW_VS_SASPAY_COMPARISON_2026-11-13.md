# DDA — Comparatif Chariow / SaSPay (préparation, sans décision)

**Date :** 13 novembre 2026
**Nature :** comparatif préparatoire. Chariow reste actif ; aucune migration n'est effectuée. Les lignes marquées « à confirmer » ne doivent pas être traitées comme des faits établis — elles nécessitent une vérification directe auprès de SaSPay et/ou de Chariow avant toute décision commerciale.

## 1. Ce qui est vérifié (Chariow, depuis le code du dépôt)

| Aspect | Chariow (constaté dans le code) |
|---|---|
| Intégration actuelle | Déjà construite et active : `bff/src/chariow.js`, `bff/src/billing-store.js`, migration `0004_chariow_billing.sql` |
| Mécanisme webhook | « Pulse » — HMAC SHA-256, en-tête de signature `sha256=...`, vérifié en temps constant (`crypto.timingSafeEqual`) |
| Événements gérés | `successful.sale`, `abandoned.sale`, `failed.sale`, `license.activated`, `license.expired`, `license.revoked` |
| Idempotence | Table `dda_billing_deliveries`, dédoublonnage par `delivery_id`, retry uniquement depuis un statut `failed` |
| Produit | Plateforme de vente de produits numériques/abonnements orientée créateurs, avec checkout hébergé |
| État d'activation DDA | Construit et testé (58/58 E2E au dernier audit), mais Premium reste **non activé commercialement** — aucun paiement réel n'est pris aujourd'hui |

## 2. Ce qui reste à confirmer (SaSPay)

**Aucune ligne ci-dessous n'est vérifiée dans ce dépôt ou par un test réel — toutes nécessitent une confirmation directe auprès de SaSPay avant d'être considérées comme fiables pour une décision.**

| Aspect | SaSPay — statut |
|---|---|
| Documentation API | À obtenir (voir `DDA_SASPAY_INTEGRATION_PREP_2026-11-13.md`, section 2.1) |
| Mécanisme webhook et signature | À confirmer — inconnu tant que la documentation n'est pas consultée |
| Couverture Mobile Money | Généralement positionné sur l'agrégation de paiement Mobile Money en Afrique francophone (positionnement marché à vérifier précisément : opérateurs couverts, pays) — **à confirmer**, ne pas présenter comme acquis |
| Couverture carte bancaire | À confirmer |
| Abonnements récurrents natifs | À confirmer — point structurant, car Premium DDA est un abonnement, pas un achat ponctuel |
| Frais | À confirmer (grille par méthode de paiement) |
| Délai de règlement | À confirmer |
| Sandbox/environnement de test | À confirmer |

## 3. Axes de comparaison une fois les informations SaSPay obtenues

Compléter ce tableau dès que la section 2 de `DDA_SASPAY_INTEGRATION_PREP_2026-11-13.md` est renseignée :

| Critère | Chariow | SaSPay | Avantage pour DDA |
|---|---|---|---|
| Couverture Mobile Money locale (marché cible DDA) | à vérifier | à vérifier | — |
| Frais par transaction | à vérifier | à vérifier | — |
| Support des abonnements récurrents | natif (déjà utilisé par DDA) | à vérifier | — |
| Simplicité d'intégration webhook | déjà faite, connue | à vérifier | — |
| Délai de règlement des fonds | à vérifier | à vérifier | — |
| Support/SLA | à vérifier | à vérifier | — |
| Conformité/sécurité (PCI-DSS ou équivalent) | à vérifier | à vérifier | — |

## 4. Recommandation à ce stade

Aucune recommandation chiffrée n'est possible sans les informations de la section 2 du document de préparation SaSPay. Ce qui peut être dit sans ambiguïté :

- **Chariow reste le moyen de paiement actif de DDA** — rien dans ce comparatif ne justifie de le modifier.
- **SaSPay reste dans la stratégie** — la priorité immédiate est l'obtention de sa documentation et de ses conditions réelles, pas un choix entre les deux.
- Si Mobile Money local est un critère décisif pour le marché visé par DDA et que Chariow le couvre moins bien que SaSPay sur ce point précis, cela pourrait justifier une intégration SaSPay **en complément** (pas forcément en remplacement) — à valider une fois les faits connus, jamais sur une impression de positionnement marché.

## 5. Prochaine étape

Identique à celle du document de préparation technique : obtenir les réponses de SaSPay (section 2 de `DDA_SASPAY_INTEGRATION_PREP_2026-11-13.md`), puis compléter le tableau de la section 3 ci-dessus avec des faits, pas des suppositions.
