# DDA — Stratégie Free / Premium / Access

**Statut :** proposition stratégique et audit du prototype — aucune activation commerciale
**Date :** 13 octobre 2026
**Dépôt :** `mbouaricha12/DDA-digital-acad-my-`
**Principe directeur :** **Premium First, Accessible by Design**

> Ce document ne transforme pas le prototype local en produit commercial. Il distingue ce qui existe réellement, ce qui peut constituer une valeur Premium vérifiable, ce qui doit rester différé et les conditions nécessaires avant tout paiement.

---

## 1. Décision de cadrage

DDA peut évoluer vers un modèle **Premium First, Accessible by Design** sans dégrader l’expérience gratuite :

- **Free** doit être une expérience pédagogique autonome et utile, pas une simple page d’attente ;
- **Premium** doit vendre une profondeur et une continuité de pratique réellement opérationnelles ;
- **Access** doit préparer des bourses, tarifs réduits ou accès sponsorisés sans les annoncer comme disponibles avant qu’un financement et des règles existent.

### Décision recommandée maintenant

1. **Ne pas activer le paiement dans cette tranche.** Le prototype n’a pas encore d’authentification serveur complète ni de catalogue commercial administré en production.
2. **Présenter Premium comme une vertical slice pédagogique locale démonstrative**, avec ses capacités réelles : P2 Risk & Discipline, leçons authored, lab guidé, assessment, preuve locale reliée à Progression et Journal.
3. **Conserver Free complet sur ses fondamentaux** : M0, exercices, quiz, feedback, progression, Journal & Plan local, ressources Free et Market Intelligence démonstrative.
4. **Rendre explicite la différence Free / Premium / Access dans `#membership`**, sans prix inventé ni promesse de disponibilité.
5. **Préparer le futur contrôle serveur** : les droits locaux restent une simulation UI et ne doivent jamais être considérés comme une autorisation commerciale.

---

## 2. Audit de l’existant

### 2.1 Ce qui est réellement opérationnel dans le prototype

| Surface / capacité | État réel | Valeur commerciale honnête |
|---|---|---|
| Landing et accès | Construit, accès local | Expliquer DDA et démarrer sans paiement |
| M0 — Fondations | 3 leçons authored, exercices, quiz, feedback | Socle Free autonome |
| M1 — Comprendre les marchés | 3 leçons authored, accès local `advanced_modules` | Profondeur pédagogique démontrable, pas un abonnement serveur |
| Learning Engine | Construit et testé | Progression, gates et prochaine action |
| Terminal pédagogique | Construit, synthétique | Pratique guidée sans données de marché réelles |
| Journal & Plan | Construit localement | Formaliser une observation et un plan sur l’appareil |
| Progression | Construite localement | Preuves et état de progression sur l’appareil |
| Ressources Free | Construites | Checklist et glossaire utilisables sans Premium |
| Market Intelligence | Démonstration, sans données live | Exemple de lecture pédagogique, pas un flux marché |
| P2 Premium Track | Vertical slice locale fonctionnelle | Valeur Premium démontrable sur l’appareil |
| Authentification | BFF préparé, parcours actuel local | Pas encore une identité de production |
| Paiement / abonnement | Adaptateur Chariow préparé, inactif | Aucune condition de paiement publiable |
| Entitlements | Locaux, modifiables par le navigateur | Simulation uniquement, non sécurisée |
| Multi-appareils | Absent | Ne doit pas être promis |
| DDA Family, AI Coach, Weekly Review, Decision Replay, Trader DNA | Futurs / previews | Ne pas les vendre comme inclus |

### 2.2 Risque principal

Le code actuel possède des permissions locales et un `membership.plan` dans `localStorage`. C’est acceptable pour une démonstration, mais **un utilisateur peut modifier cet état**. Il ne faut donc pas présenter le plan local comme une preuve de paiement, une adhésion ou un droit sécurisé.

La règle cible déjà documentée est la bonne :

> Le navigateur est non fiable. L’identité, la propriété des données, les memberships, les expirations et les entitlements Premium doivent être décidés et vérifiés côté serveur.

---

## 3. Architecture proposée

```text
DDA PUBLIC
  └── Landing → Access → découverte de la valeur Free

DDA FREE / DÉCOUVERTE
  └── M0 → pratique guidée → feedback → progression → Journal local

DDA PREMIUM
  └── M1+ authored → Premium Track → Labs réellement disponibles
      → Assessment → preuve → Progression / Journal

DDA ACCESS
  └── Bourses / tarifs réduits / accès sponsorisés
      → éligibilité validée → entitlement serveur limité et traçable
```

### 3.1 Free

**Promesse :** commencer sérieusement sans paiement.

Inclure durablement :

- M0 Fondations et ses leçons réellement authored ;
- exercices, quiz, feedback et prochaine action ;
- Progression et preuves disponibles sur le périmètre Free ;
- Journal & Plan local ;
- ressources Free sélectionnées ;
- Market Intelligence clairement marquée comme démonstration lorsqu’elle n’est pas connectée ;
- mode low-data, responsive et hors ligne pour le contenu local.

**Limite honnête :** la progression actuelle reste liée à l’appareil tant que la synchronisation serveur n’est pas activée.

### 3.2 Premium

**Promesse :** approfondir la pratique et rendre le raisonnement plus vérifiable — pas promettre un résultat financier.

Capacités vendables uniquement lorsqu’elles restent opérationnelles :

- modules authored au-delà du socle Free ;
- Premium Track P2 Risk & Discipline ;
- leçons P2.1/P2.2 ;
- Risk Plan Lab avec scénario synthétique ;
- Controlled Decision Assessment ;
- preuve pédagogique locale dans le prototype, puis serveur dans la version commerciale ;
- ressources Premium réellement disponibles ;
- liaison vers Progression et Journal lorsque le parcours est implémenté.

**Ne pas inclure dans la promesse actuelle :** AI Coach, données live, signaux, backtesting, Trading Lab complet, communauté active, certification externe, résultats financiers, coaching humain ou accompagnement personnalisé non opéré.

### 3.3 Access

**Promesse :** rendre Premium progressivement accessible lorsque le modèle est viable.

Statut actuel : **à préparer, non disponible**.

Capacités futures possibles :

- bourses partielles ou complètes ;
- tarifs réduits pour des cohortes ou profils définis ;
- accès sponsorisés par un partenaire identifié ;
- codes d’accès à durée et périmètre limités ;
- règles d’éligibilité et renouvellement documentées.

Conditions de mise en œuvre :

- budget ou sponsor réellement identifié ;
- critères publiables et non discriminatoires ;
- décision et audit côté serveur ;
- expiration explicite ;
- aucun contournement du paiement standard par modification locale.

---

## 4. Comparaison commerciale recommandée

| Dimension | Free | Premium | Access |
|---|---|---|---|
| Objectif | Construire les fondamentaux | Approfondir et pratiquer | Réduire la barrière financière |
| Contenu | M0 authored + ressources Free | M1+ et pistes Premium authored | Accès à un périmètre défini selon l’éligibilité |
| Pratique | Exercices et Terminal pédagogique existants | Labs et assessments effectivement disponibles | Même expérience que le plan accordé |
| Progression | Locale dans le prototype | Locale dans la démo ; serveur requis en production | Serveur requis pour contrôler l’accès |
| Journal | Local, disponible | Relié aux preuves lorsque le flux existe | Dépend du périmètre accordé |
| Données marché | Démonstration non connectée | Aucune donnée live sans infrastructure/licence | Identique au plan accordé |
| Paiement | Aucun | Non activé dans le prototype | Non activé |
| Expiration | Sans abonnement | Future, côté serveur uniquement | Future, côté serveur uniquement |
| Limites | Pas de synchronisation serveur actuelle | Pas de fonctionnalité future incluse automatiquement | Aucun accès automatique sans validation |

### Conditions de paiement à afficher aujourd’hui

> **Aucun paiement réel, abonnement ou renouvellement automatique n’est activé dans cette version.** Les conditions de prix, devise, périodicité, remboursement et expiration seront publiées uniquement après activation du BFF, du produit de paiement, des webhooks signés et des tests de révocation.

---

## 5. Règles d’accès et de sécurité

### Prototype actuel

- `localStorage` sert uniquement à simuler l’état d’un appareil ;
- `DDA.can()` protège l’expérience UI locale ;
- le plan local Premium peut être falsifié ;
- aucun plan local ne doit être interprété comme un achat.

### Version commerciale cible

1. Session authentifiée via cookie opaque serveur `__Host-dda_session`.
2. Membership et entitlement calculés côté serveur.
3. Le client ne peut jamais écrire `plan`, `status`, `starts_at`, `ends_at`, `proof_level`, `passed` ou `entitlement`.
4. Les routes Premium appellent le BFF et reçoivent une réponse autorisée ou `403`.
5. Une redirection de checkout ne confirme jamais un paiement.
6. L’activation vient uniquement d’un événement fournisseur signé et idempotent.
7. Expiration, révocation, remboursement et échec de paiement retirent l’accès côté serveur.
8. Le Service Worker ne met pas en cache les réponses BFF/API authentifiées.
9. Le mode hors ligne ne doit pas étendre un entitlement expiré ou révocable.
10. Les preuves Premium et le Journal synchronisé appartiennent au compte serveur, pas à un `user_id` fourni par le navigateur.

---

## 6. Matrice KEEP / MODIFY / ADD / DEFER

| Élément | Décision | Justification | Coût relatif |
|---|---|---|---:|
| Routes et shells Public / Access / Academy | **KEEP** | Structure validée et deep-links testés | Faible |
| Learning Engine, Lesson Renderer, `LESSON_REGISTRY` | **KEEP** | Source de vérité pédagogique réutilisable | Faible |
| M0, M1 authored, gates et feedback | **KEEP** | Valeur Free et preuve de qualité existantes | Faible |
| Terminal pédagogique synthétique | **KEEP** | Différenciateur sans données réelles | Faible |
| Journal & Plan local | **KEEP** | Pont concret entre apprentissage et réflexion | Faible |
| PWA/offline/low-data | **KEEP** | Accessibilité et usage sur connexions faibles | Faible |
| Premium local actuel | **MODIFY** | Le présenter explicitement comme démo locale, pas comme abonnement | Faible |
| Écran `#membership` | **MODIFY** | Comparaison Free/Premium/Access, limites et conditions honnêtes | Faible |
| Copy « Premium » | **MODIFY** | Séparer disponible, aperçu, futur et non activé | Faible |
| Catalogue Premium authored | **ADD** | Chaque nouvelle promesse doit avoir contenu, preuve et test avant publication | Moyen à élevé |
| Entitlements serveur | **ADD** | Condition de sécurité non négociable pour vendre | Élevé |
| Auth/synchronisation serveur | **ADD** | Requis pour compte, ownership et multi-device | Élevé |
| Checkout + webhook + ledger | **ADD** | Requis avant prix et paiement réel | Élevé |
| Bourses / sponsor Access | **ADD plus tard** | Dépend d’un budget, de règles et d’un owner opérationnel | Moyen à élevé |
| AI Coach | **DEFER** | Coût, garde-fous, corpus et risque de promesse excessive | Élevé |
| Données live / signaux / backtesting | **DEFER** | Licences, sécurité et risque produit | Très élevé |
| Community / coaching humain | **DEFER** | Ressources opérationnelles non démontrées | Moyen à élevé |
| Certification externe | **DEFER** | Accréditation et gouvernance absentes | Élevé |
| Prix, devises, remises et renouvellement public | **DEFER** | Paiement et règles commerciales non activés | Moyen |

---

## 7. Plan de validation commerciale

### Gate 0 — Vérité produit

- Chaque bénéfice Free/Premium est relié à une route et une fonctionnalité réellement testée.
- Aucun futur n’est présenté comme disponible.
- Une personne peut comprendre en moins d’une minute ce qu’elle peut faire sans payer.

### Gate 1 — Preuve de valeur pédagogique

- Test utilisateur sur M0 : compréhension, pratique, feedback et prochaine action.
- Test utilisateur sur P2 : compréhension du risque, lab, assessment et preuve.
- Mesurer une boucle d’amélioration pédagogique, pas le temps passé ni un nombre artificiel de clics.

### Gate 2 — Intention Premium

- Présenter la comparaison sans pression ni promesse financière.
- Tester compréhension de ce que Premium débloque réellement.
- Mesurer : clic vers l’aperçu, démarrage d’un module, complétion d’un lab, compréhension des limites.
- Ne pas collecter de données de paiement à ce stade.

### Gate 3 — Infrastructure commerciale

Avant tout paiement :

- BFF déployé avec session serveur, CSRF, CORS fermé et rate limits ;
- memberships et entitlements serveur ;
- stockage et ownership des données ;
- export, suppression et révocation ;
- fournisseur de paiement choisi et produit allowlisté ;
- webhook signé, idempotence et transitions `active / expired / revoked` ;
- tests négatifs : modification de `localStorage`, expiration, remboursement, double webhook, deux comptes.

### Gate 4 — Pilote limité

- petit groupe volontaire ;
- un seul produit Premium clairement délimité ;
- support et remboursement réellement opérables ;
- revue des incidents et des demandes de suppression ;
- validation humaine avant élargissement.

### Gate 5 — Accessibilité progressive

- vérifier que Free reste utile sans conversion ;
- décider si Access finance des bourses, des tarifs réduits ou des sponsors ;
- publier critères, durée, nombre de places et responsable ;
- contrôler les droits côté serveur ;
- mesurer la viabilité avant d’augmenter l’engagement.

---

## 8. Coûts et dépendances

| Chantier | Coût | Bloque le paiement ? | Dépendances |
|---|---:|---:|---|
| Clarification de l’offre et copy | Faible | Oui, pour éviter les promesses fausses | Décision nomenclature Free/Premium |
| Première expérience Premium authored | Moyen | Oui, pour démontrer la valeur | Auteur pédagogique, tests de contenu |
| Auth + BFF production | Élevé | Oui | Domaine, fournisseur, région, sécurité |
| Synchronisation progression/Journal | Élevé | Oui pour une promesse multi-device | Ownership, RLS, migration v4 |
| Entitlements serveur | Élevé | Oui | Membership store, API authorization |
| Paiement et webhooks | Élevé | Oui | Produit fournisseur, remboursements, ledger |
| Access / bourses | Moyen à élevé | Non pour Free/Premium initial | Budget, sponsor, règles d’éligibilité |
| AI / données live / communauté | Très élevé | Non, à différer | Licences, gouvernance, opérations |

---

## 9. Modifications minimales recommandées au prototype

Cette tranche doit rester limitée à :

1. clarifier visuellement `#membership` avec Free, Premium Demo et Access à préparer ;
2. afficher les limites actuelles : local, aucun paiement, aucune synchronisation serveur ;
3. rattacher chaque bénéfice Premium à une capacité réellement opérationnelle ou la marquer `À venir` ;
4. conserver les routes, les données, les entitlements locaux, les tests, le design et la navigation ;
5. versionner ce document et ajouter un contrat de copy pour empêcher les promesses futures non marquées.

**Ne pas modifier maintenant :** schéma v5, paiement, prix, checkout, données live, AI Coach, communauté, système de bourses opérationnel.

---

## 10. Critère de sortie de cette stratégie

La stratégie est suffisamment validée pour une prochaine tranche uniquement si :

- Free est compris comme une expérience utile en soi ;
- Premium est compris comme une profondeur pédagogique vérifiable ;
- Access est compris comme un futur mécanisme d’accessibilité, pas une remise fictive ;
- aucun écran ne suggère qu’un paiement ou un droit serveur existe déjà ;
- les équipes savent exactement ce qui doit être construit avant une ouverture commerciale.

**Prochaine tranche recommandée :** appliquer la clarification éditoriale de `#membership` et ajouter les contrats de copy, sans activer le paiement.
