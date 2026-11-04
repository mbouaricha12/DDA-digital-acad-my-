# DDA — Plan d'exécution du réajustement (V1)

**Date : 3 novembre 2026**
**Fait suite à :** `DDA_REAJUSTEMENT_AUDIT_V1.md` (même date, même commit de référence `05671b8`).

Ce plan ne reconstruit rien de ce que l'audit a trouvé opérationnel. Il détaille uniquement les écarts réels identifiés.

## P0 — Corrections bloquantes

Aucune trouvée par l'audit. Rien à planifier ici.

## P1 — Qualité produit

### P1.1 — Protection Premium côté serveur

**Problème :** `DDA.can()` (`dist/dda-core.js`) décide de l'accès Premium uniquement à partir de `prototypeState.membership.plan`, une valeur locale que n'importe qui peut modifier depuis la console du navigateur. Le BFF a déjà `/v1/premium/preview` et `/v1/me`, mais l'Academy ne les appelle jamais pour ce gating.

**Dépendances :** nécessite que le mode BFF soit réellement actif (secrets Supabase configurés) pour être testé en conditions réelles — peut être développé et testé en mode mock dès maintenant.

**Fichiers concernés :**
- `dist/app.js` (bloc de gating dans `showView()`, fonction `lessonGateInfo`)
- `dist/bff-client.js` (ajouter un appel d'entitlement si absent du contrat actuel)
- `bff/src/app.js` (vérifier que `/v1/premium/preview` retourne un entitlement exploitable par le frontend)
- `tests/run.js` + `tests/test_bff_implementation.js`

**Tests nécessaires :**
- Un apprenant Free avec `window.DDA.setPlan(state,'premium')` modifié manuellement en mode BFF ne doit **pas** débloquer de contenu Premium réel sans confirmation serveur.
- Un apprenant Premium confirmé côté serveur (mock BFF) voit le contenu réel.
- Régression : le mode local (sans BFF configuré) continue de fonctionner exactement comme avant (c'est un pilote, pas un produit payant encore).

**Critère d'acceptation :** en mode BFF actif, aucune leçon Premium ne se déverrouille sans une réponse serveur positive ; en mode local (pilote actuel), le comportement actuel honnête (« aperçu local, aucun paiement ») est préservé à l'identique.

**Risque :** si mal exécuté, peut casser le pilote Free actuel pour les apprenants qui n'ont pas de compte BFF — à développer comme une couche additionnelle, jamais en remplaçant le chemin local existant.

### P1.2 — Socle pédagogique BRVM minimal

**Problème :** `#markets` a une structure éditoriale honnête mais aucun module BRVM structuré (leçon, exercice, quiz) — voir audit §4.

**Dépendances :** contenu pédagogique réel à rédiger (décision éditoriale, pas uniquement technique) — probablement co-écrit avec le fondateur pour la justesse du contenu financier.

**Fichiers concernés :**
- `dist/app.js` (`LESSON_REGISTRY` — ajouter un module BRVM, même principe que M0/M1)
- `dist/academy.html` (montage de la/des nouvelle(s) leçon(s))
- `tests/run.js` + `tests/smoke_app_boot.js`

**Proposition de périmètre minimal (1er lot) :** une seule leçon « Introduction à la BRVM » (fonctionnement de la bourse régionale, ce qu'est une action/obligation, capitalisation) avec un exercice et un quiz — suivant exactement le patron déjà utilisé par M1.3, pas une nouvelle architecture.

**Critère d'acceptation :** la leçon apparaît dans le Parcours, respecte le même gating de prérequis que M0/M1, et le sommaire de module (déjà construit, Lot navigation) la liste correctement.

### P1.3 — Intégration d'au moins une vidéo réelle dans une leçon

**Dépendances :** décision éditoriale sur quelle vidéo va avec quelle leçon (les 4 vidéos actuelles sont génériques, pas écrites pour une leçon précise).

**Fichiers concernés :** `dist/app.js` (`LESSON_REGISTRY`, champ `video` d'une entrée existante), `dist/lesson-renderer.js` (déjà prêt, support Vimeo et YouTube léger).

**Critère d'acceptation :** une leçon authored affiche la vidéo réelle via le lecteur léger existant (miniature, clic pour charger, pas d'autoplay) sans aucune modification du moteur de rendu.

### P1.4 — Mise à jour de `manus-routes.json`

**Fichiers concernés :** `dist/manus-routes.json`, `tests/verify_route_register_consistency.js` (vérifier qu'il couvre bien le fichier mis à jour).

**Critère d'acceptation :** chaque route réellement servie par `dist/` (y compris `/commencer/`, `/live/`, `/business/`, `/experts/`, `/community/`, `/ai/`, `admin.html`) apparaît dans le manifeste.

**Risque :** quasi nul — changement purement déclaratif.

### P1.5 — Identité juridique de l'éditeur

**Dépendance :** information à fournir par le fondateur (numéro RCCM ou équivalent, adresse légale, directeur de publication) — ne jamais inventer cette information.

**Fichiers concernés :** `dist/imprint/index.html` et équivalents.

## P2 — Amélioration progressive (non bloquant pour le lancement)

| Item | Dépendance | Remarque |
| --- | --- | --- |
| DDA AI (assistant pédagogique réel) | Fournisseur AI à choisir, budget, garde-fous de contenu | Chantier complet, pas un ajustement — à traiter comme un nouveau produit avec son propre audit de faisabilité |
| Challenge BRVM 7 jours | P1.2 doit exister avant (pas de challenge sur un pôle sans contenu) | — |
| Page partenaires brokers | Attend un vrai programme d'affiliation confirmé (`DDA_AUDIT_BROKER_AFFILIATION.md`) | — |
| Offre annuelle (120 000 FCFA) | Validation explicite du fondateur | — |
| JSON-LD structuré par page | — | Petit chantier technique, aucune dépendance bloquante |
| Variantes de landing `/commencer/` | Un second message marketing validé par le fondateur | Infrastructure seule sans contenu risquerait d'être un travail jeté |

## Méthode d'exécution

Chaque item P1 ci-dessus suit exactement la discipline déjà en place dans ce dépôt depuis les derniers lots : branche dédiée créée fraîche depuis `main`, tests avant commit (`node tests/run.js` + contrats statiques concernés), commit, push, PR sans merge automatique, rapport précis (fichiers modifiés, résultats de tests, ce qui reste à valider).

Aucun lot ne doit mélanger plusieurs items P1 non liés dans une seule PR — chacun doit rester revuable et réversible indépendamment.
