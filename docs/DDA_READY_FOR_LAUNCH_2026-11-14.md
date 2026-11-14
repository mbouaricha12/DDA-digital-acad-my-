# DDA — READY FOR LAUNCH : état réel du parcours commercial

**Date :** 14 novembre 2026
**Nature :** rapport d'exécution, pas un nouvel audit général. Chaque constat ci-dessous est vérifié directement (tests locaux, Supabase réel, variables d'environnement Vercel réelles, historique GitHub Actions réel) — rien n'est une supposition reprise d'un document antérieur sans re-vérification.
**Question posée :** un utilisateur peut-il découvrir DDA, s'inscrire, accéder à l'Academy gratuite, comprendre Premium, payer réellement, recevoir son accès Premium et l'utiliser ?

## VERDICT GLOBAL

| Segment | Statut |
|---|---|
| **Découverte + inscription + Academy Free** | **READY** (vérifié en production : site et BFF en ligne, sains, surveillés toutes les 15 min — 5/5 derniers contrôles réussis) |
| **Premium payant (paiement réel → activation réelle)** | **BLOCKED** — le paiement réel n'est pas opérationnel aujourd'hui (voir §2) |
| **Objectif « 100 premiers abonnés payants dès la semaine prochaine »** | **BLOCKED tant que §2 n'est pas levé** — c'est le seul verrou qui empêche un lancement payant, pas un problème de code à corriger, mais des décisions/actions humaines (compte Chariow, prix, secrets) |

## 1. Ce qui est vérifié EN PRODUCTION, maintenant (pas en local)

- **Site public (`dariusdigitalacademy.com`) et BFF (`api.dariusdigitalacademy.com`)** : les 5 derniers contrôles automatiques (`production-availability.yml`, toutes les 15 min) sont `success`. Le dernier `healthz` du BFF a été interrogé directement depuis cette session (`{"status":"ok"}`).
- **Supabase (projet réel `eqatvsvwohhjvtridyos`, actif et sain)** : les 9 migrations sont appliquées, y compris `0004_chariow_billing` (tables de facturation déjà en place) et `0008_rate_limiting`. Aucune alerte de sécurité critique sur les tables de facturation (RLS fermée aux rôles `anon`/`authenticated`, confirmée par l'audit automatique Supabase).
- **2 avertissements de sécurité mineurs, sans rapport avec le paiement** : la fonction RPC `dda_rate_limit_hit` est exécutable par les rôles publics (probablement voulu, à confirmer), et la protection « mot de passe compromis » (HaveIBeenPwned) est désactivée dans Supabase Auth — un interrupteur à activer, aucun code à écrire.
- **Variables d'environnement Vercel réelles (projet `dda-digital-acad-my`, pas une supposition)** : `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ALLOWED_ORIGINS`, `EMAIL_REDIRECT_TO`, `SESSION_ENCRYPTION_KEY`, `BFF_COOKIE_SECURE` sont bien configurées en production. **Aucune variable `CHARIOW_API_KEY`, `CHARIOW_PULSE_SECRET` ou `CHARIOW_PREMIUM_PRODUCT_IDS` n'existe sur ce projet.**

## 2. LE blocage réel du lancement payant

### Problème concret
Le paiement Chariow n'est pas configuré en production. Trois éléments manquent, et ils ne peuvent être créés par du code : un produit Premium réel existe-t-il dans le compte Chariow du fondateur ? Une clé API serveur dédiée a-t-elle été émise ? Un Pulse (webhook) HTTPS a-t-il été créé avec son secret ? Rien de tout cela n'a de valeur dans le dépôt — ce sont des actions à faire dans le compte Chariow puis à coller dans les variables d'environnement Vercel.

### Impact commercial
Sans ces trois éléments, un visiteur qui clique « Découvrir Premium » ne peut pas payer réellement. Aucun des 100 premiers abonnés visés ne peut être facturé tant que ce point n'est pas réglé — c'est un blocage total, pas partiel.

### Déjà réalisé (vérifié, pas une affirmation)
- L'architecture serveur complète (`bff/src/chariow.js`, `bff/src/billing-store.js`) : vérification de signature webhook, déduplication par `delivery_id`, mapping produit → entitlement, jamais une autorisation côté client.
- Les tables Supabase (`dda_billing_deliveries`, `dda_billing_memberships`) sont déjà créées et protégées par RLS.
- Les tests de sécurité et de mapping passent tous : `tests/test_p4_chariow_billing.js`, `tests/test_billing_store.js`, `tests/test_chariow_monetization_analytics.js` — PASS.
- La protection serveur de Premium (aucun déverrouillage local sans confirmation serveur) est testée et passe (`tests/run.js`, section « Protection Premium côté serveur »).

### Ce qui nécessite une intervention humaine (le fondateur, pas moi)
1. Créer le produit Premium dans Chariow et relever son ID réel.
2. Créer une clé API Chariow dédiée au serveur.
3. Créer le Pulse HTTPS vers `https://api.dariusdigitalacademy.com/webhooks/chariow` et récupérer son secret.
4. Ajouter `CHARIOW_API_KEY`, `CHARIOW_PULSE_SECRET`, `CHARIOW_PREMIUM_PRODUCT_IDS` dans les variables d'environnement Vercel (production).
5. **Décider et communiquer le prix réel de DDA Premium** — vérification faite : aucun prix n'a jamais été fixé dans ce projet, ni dans le code ni dans la documentation. La page Premium actuelle dit explicitement « aucun prix... n'est activé ». Sans ce chiffre, rien d'autre n'avance (ni le produit Chariow, ni la page de tarification, ni la FAQ).
6. Tester une vraie transaction en conditions réelles une fois 1-5 faits.
7. Revue juridique minimale : conditions de remboursement/annulation — vérification faite, `dist/mentions-legales/` ne contient aujourd'hui aucune clause sur l'abonnement, le remboursement ou l'annulation. À rédiger avant d'encaisser le premier paiement.

**Rien de ce qui précède ne peut être fait depuis cette session** (pas d'accès au compte Chariow, pas de décision de prix possible à ma place, pas d'accès légal pour rédiger des CGV engageantes sans validation du fondateur).

## 3. Ce qui est déjà solide (ne pas re-corriger)

- Inscription, connexion, récupération de mot de passe : couverts bout en bout par `tests/test_signup_reliability_e2e.js`, `tests/test_auth_reliability_e2e.js`, `tests/test_oauth_google_e2e.js` — tous PASS localement.
- Parcours Academy Free (M0-M1, DDA Lab LAB1-3) : testé, aucune anomalie.
- CTA principaux (« Commencer gratuitement », « Découvrir Premium ») : présents et fonctionnels, vérifiés par `tests/run.js`.
- Mobile : aucun débordement horizontal détecté à 360/390/1440px sur les surfaces testées.
- Sécurité Premium côté serveur : un plan local forcé à « premium » ne débloque jamais le vrai contenu sans confirmation serveur — testé.

## 4. Ce que ce rapport ne tranche pas (P1, pas P0)

- Améliorations de la landing (structure de conversion en 9 blocs demandée au §3 de la mission) — à traiter une fois le §2 ci-dessus débloqué, car une landing optimisée pour vendre un prix qui n'existe pas encore ne sert à rien.
- FAQ objections commerciales — dépend elle aussi du prix.
- Choix définitif Chariow vs SaSPay — `docs/DDA_CHARIOW_VS_SASPAY_COMPARISON_2026-11-13.md` existe déjà ; la mission du jour confirme Chariow comme option actuelle, ne pas le casser.

## 5. Prochaine étape concrète recommandée

Le seul vrai verrou est humain, pas technique : **le fondateur doit fixer un prix et créer le produit Chariow**. Une fois ces deux éléments en main, la suite (variables d'environnement, test réel, activation) est une checklist courte et déjà préparée dans `DDA_P4_CHARIOW_BILLING.md` — aucun nouveau code n'est nécessaire pour l'activer.
