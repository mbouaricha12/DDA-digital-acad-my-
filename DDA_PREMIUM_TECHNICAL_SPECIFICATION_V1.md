# DDA PREMIUM — TECHNICAL SPECIFICATION v1

**Produit :** Darius Digital Academy (DDA)  
**Statut :** spécification d’architecture et de roadmap — aucune activation commerciale engagée  
**Date :** 27 septembre 2026  
**Base inspectée :** commit `a7a6819`, branche `feat/premium-visual-finish`  
**Référence de déploiement :** `main` / GitHub Pages  
**Autorité produit :** Richard Darius, CEO

> **Règle de lecture :** ce document sépare toujours **VISION**, **PRODUCT** et **IMPLEMENTATION**. Une idée du Blueprint Premium ne devient pas automatiquement une fonctionnalité codée.

---

## 0. Décision de cadrage

La prochaine tranche ne doit pas commencer par un paiement, une authentification serveur, une IA ou un marché en temps réel. Le repository actuel possède déjà un noyau pédagogique jouable et testable. La priorité est de construire une première unité Premium cohérente autour de la boucle :

**BUILD → PRACTICE → VALIDATE → REVIEW → PROVE PROGRESS**

Cette unité doit réutiliser le Learning Engine, le rendu de leçons par blocs, le Terminal pédagogique, le Journal & Plan et les preuves locales existantes. Elle doit être démontrable sans prétendre être une plateforme Premium de production.

### Proposition de périmètre Premium MVP

Le MVP Premium recommandé est un **Premium Learning Track local et démonstratif**, limité à :

1. une zone Premium clairement identifiée dans `#membership` ;
2. un premier module Premium authored, idéalement **Risk & Discipline / Professional Risk Foundations**, avec 1 à 2 leçons réellement écrites ;
3. une mission Practice réutilisant le Terminal pédagogique existant ;
4. une preuve locale reliée à Progression et Journal & Plan ;
5. un état verrouillé Free et un état aperçu Premium honnêtes ;
6. aucune métrique de performance, donnée marché, certification officielle ou transaction réelle.

Tout le reste — backtesting, Strategy Builder complet, AI Coach, communauté, paiements et synchronisation — reste hors de l’implémentation immédiate.

---

# A. Current State

## A.1 Stack et architecture réelle

Le repository n’est pas une application React malgré les consignes génériques du template statique. Il s’agit d’un **site statique vanilla HTML/CSS/JavaScript**, déployé comme un dossier `dist/` sur GitHub Pages.

| Couche | Réalité actuelle |
|---|---|
| Rendu | `dist/index.html` contient les vues SPA et les mount points |
| Style | `dist/styles.css` + `dist/alpha-polish.css` |
| Routing | Hash-based, un niveau, `showView(id)` dans `dist/app.js` |
| Navigation | Boutons `[data-view]`, état de vue actif, `history.replaceState` |
| Données | `localStorage`, état v4 sous `dda-prototype-state-v4` |
| Backend | Absent |
| API externe | Absente du produit actuel |
| Authentification | Locale, mode `device-demo` |
| Paiement | Absent ; Premium simulé localement |
| Déploiement | GitHub Actions → GitHub Pages |
| Tests | Playwright E2E, smoke boot jsdom, contrats Node, contrôles de syntaxe |
| PWA | Manifest, service worker et mode low-data/offline présents |

## A.2 Vues présentes

### Surface publique

- `#landing` — entrée publique Acquisition V1.
- `#access` — inscription/onboarding local.

### App apprenant

- `#dashboard` — Darius Terminal / Aujourd’hui.
- `#path` — Parcours.
- `#lesson`, `#lesson-m02`, `#lesson-m03` — leçons M0 authored.
- `#lesson-m11`, `#lesson-m12`, `#lesson-m13` — leçons M1 authored et gated.
- `#progress` — preuves de progression et récapitulatif.
- `#journal` — Journal & Plan local.
- `#resources` — Bibliothèque et ressources.
- `#markets` — Market Intelligence / BRVM en démonstration.
- `#brokers` — Broker Hub factuel sans activation commerciale.
- `#membership` — aperçu Premium local.
- `#support` — support local non envoyé.
- `#profile` — identité et préférences locales.
- `#community`, `#intelligence` — surfaces futures / aperçu, sans capacité active équivalente à une communauté ou à une IA réelle.

## A.3 Curriculum actuel

Le curriculum réel est déclaré dans `dist/dda-core.js` :

| Module | Contenu actuel | Statut |
|---|---|---|
| M0 | Fondations des marchés | 3 leçons authored : M0.1, M0.2, M0.3 |
| M1 | Comprendre les marchés financiers | 3 leçons authored : M1.1, M1.2, M1.3, gated par `advanced_modules` |
| M2 | Risque et discipline | Module déclaré, aucune leçon authored |
| M3–M9 | Titres à venir | Aucun contenu authored |

Le système ne doit pas transformer les titres M2–M9 en modules Premium fonctionnels tant que les leçons et preuves n’existent pas réellement.

## A.4 Learning Engine

`dist/learning-engine.js` est curriculum-agnostic et expose actuellement :

- `getLessonProgress` ;
- `findLesson` ;
- `lessonStatus` ;
- `lessonStatusInModule` ;
- `exerciseStatus` ;
- `evaluationStatus` ;
- `lessonNextStep` ;
- `lessonProgressPercent` ;
- `lessonXp` ;
- `totalXp` ;
- `moduleStatus` ;
- `moduleProgressPercent` ;
- `moduleSnapshot` ;
- `nextActionable`.

La progression actuelle prouve une leçon au travers de trois booléens durables : `lessonViewed`, `exerciseComplete`, `quizComplete`, avec une étape `review` dérivée.

## A.5 Lesson Renderer

`dist/lesson-renderer.js` rend des blocs typés, notamment :

- texte court ;
- image explicative ;
- vidéo déclarative ;
- diagramme ;
- mini-simulation ;
- scénario ;
- étude de cas ;
- exercice graphique ;
- choix de décision ;
- quiz ;
- résumé ;
- lien Journal ;
- vérification de compétence ;
- observation de graphique ;
- identification de zone.

M0.1, M0.2 et M0.3 démontrent que le moteur peut déjà produire des expériences différentes sans dupliquer une page par leçon.

## A.6 État et persistance

Le schéma courant est `SCHEMA_VERSION = 4` :

```text
{
  schemaVersion,
  user,
  membership: { plan: 'free'|'premium', status: 'demo' },
  onboarding,
  lessons: { [lessonId]: { lessonViewed, exerciseComplete, quizComplete } },
  terminal: { instrument, timeframe, zoom, pan, drawings, observation, practice },
  journal: { entries[], plan },
  preferences: { lowData, reminders },
  events[],
  acquisition,
  updatedAt
}
```

La sanitation limite les textes, les dessins, les entrées Journal, les événements et les valeurs d’attribution. Les migrations v1/v2/v3 vers v4 sont déjà présentes.

## A.7 Permissions actuelles

| Tier | Permissions réelles |
|---|---|
| Visitor | `dashboard_preview`, `access` |
| Free | Dashboard, Parcours, M0, Progression, Profil, ressources Free, Membership, Market Room, Broker Hub, Support, Journal, Practice, Intelligence |
| Premium | Permissions Free + ressources Premium, aperçu de certification, `advanced_modules` |

Le tier Premium est local et démonstratif. Il ne représente ni un achat, ni une facture, ni un abonnement serveur.

## A.8 Ce qui doit absolument être conservé

- Le routing hash-based et ses deep-links.
- `LESSON_REGISTRY` comme source de vérité des leçons et prérequis.
- `DDALearning.nextActionable()` comme seule source de la prochaine action.
- Les blocs pédagogiques typés et le Lesson Renderer.
- Les preuves réelles M0/M1 et leurs gates.
- Le Terminal pédagogique synthétique sans données de marché réelles.
- Le Journal & Plan local et le transfert Terminal → Journal.
- Le schéma de sanitation et la migration de l’état v4.
- Les entitlements locaux et les distinctions Visitor/Free/Premium.
- Le mode low-data, reduced motion, PWA et le responsive mobile-first.
- Les tests commis et les workflows CI/CD.
- La transparence : aucune promesse financière, statistique, certification ou fonctionnalité future présentée comme active.

---

# B. Gap Analysis

## B.1 Gaps produit

| Gap | Impact | Priorité |
|---|---|---|
| Aucun module Premium dédié entièrement authored | Impossible de prouver une vraie valeur Premium | P0 |
| Premium actuel surtout présenté comme aperçu local | Confusion entre différenciation produit et entitlement réel | P0 |
| Compétences limitées aux compétences des leçons authored | Pas encore de Skill Passport transversal | P1 |
| Terminal Practice concentré sur M0.2 | Pas de mission Premium structurée réutilisable | P0 |
| Journal sans review structurée | Pas de boucle Weekly Review / Decision Replay | P1 |
| Aucun score de progression décomposable | Bonne décision actuelle ; il manque seulement une architecture future | P1 |
| Market Intelligence démonstrative | Ne doit pas être branchée avant sources validées | P2 |
| Pas d’authentification serveur ni sync | Premium ne peut pas être un service multi-device | P2 |
| Pas de paiement | Pas d’activation commerciale autorisée | P2 |
| Pas de CMS/back-office | Contenu Premium difficile à éditer à grande échelle | P2 |
| Pas d’AI Coach réel | À garder en vision tant que les données et garde-fous ne sont pas prêts | P3 |

## B.2 Gaps techniques

1. **État global impératif :** `prototypeState` est maintenu dans `app.js` et mis à jour par façade `saveState/update`. Cela fonctionne pour le prototype mais deviendra fragile avec plusieurs labs et entités.
2. **Persistance locale unique :** absence d’identité serveur, d’ownership vérifiable et de synchronisation.
3. **Schema v4 limité :** aucun objet explicite `skills`, `assessments`, `challenges`, `reviews` ou `premiumTrack`.
4. **Permissions déclaratives mais locales :** l’entitlement n’est pas une autorisation de sécurité.
5. **Curriculum partiellement authored :** M2 est déclaré mais vide ; il faut éviter de créer un faux module par simple configuration.
6. **Tests orientés surfaces existantes :** l’ajout d’un Premium Track devra ajouter des contrats spécifiques avant toute UI importante.
7. **Assets locaux :** le site statique conserve des médias dans `dist/images`, contrairement au template WebDev générique ; c’est acceptable pour ce dépôt GitHub Pages existant mais doit être surveillé côté poids et cache.
8. **Navigation sans `pushState` :** le back navigateur natif n’est pas un vrai historique interne ; le back-link applicatif compense certaines vues.
9. **Service worker :** chaque modification distribuée doit incrémenter/contrôler le cache pour éviter de servir une ancienne version.
10. **CI :** les workflows déploient `dist/` et doivent rester le Product Gate avant chaque fusion.

## B.3 Gaps de modèle

Le système actuel mélange volontairement dans un état local : identité de démonstration, curriculum, progression, Terminal, Journal et acquisition. Pour Premium, il faut introduire des entités additives et normalisées, mais sans migration v5 avant que le premier cas d’usage soit validé.

---

# C. Product Architecture

## C.1 Architecture logique cible

```text
DDA PUBLIC
  └── Discover / Access / Onboarding

DDA LEARN
  └── Track → Module → Lesson → Block → Practice → Assessment → Proof

DDA TERMINAL
  └── Mission → Observation → Annotation → Decision → Feedback → Proof

DDA JOURNAL
  └── Plan → Observation → Decision → Result → Review

DDA PROGRESSION
  └── Skill → Level → Evidence → Next Best Action

DDA PREMIUM
  └── Premium Track → Labs → Challenges → Reviews

INFRASTRUCTURE FUTURE
  └── Auth → API → Database → Billing → Analytics → CMS
```

## C.2 Premium MVP recommandé

Le Premium MVP ne doit pas essayer de livrer les 24 modules du Blueprint. Il doit prouver une seule boucle verticale :

```text
Premium entry
  → Premium track overview
  → authored lesson
  → guided lab
  → assessment
  → local proof
  → Progression
  → Journal review prompt
```

### Proposition de module initial

**P2 — Trading Environment / Risk Foundations** est préférable à P12 Strategy Builder ou P15 Backtesting pour le premier MVP, car :

- le produit actuel possède déjà des notions de marché et des exercices ;
- le risque et la discipline sont cohérents avec la promesse de non-signal ;
- il permet d’utiliser des scénarios synthétiques sans données réelles ;
- il prépare le futur journal et les futures reviews ;
- il évite de construire trop tôt un moteur de backtest ou de stratégie.

La nomenclature finale du module doit être validée avant création du contenu authored.

## C.3 Phases du produit Premium

| Phase produit | Contenu |
|---|---|
| Discover | Landing, access, premier M0 et compréhension du produit |
| Build | Parcours structuré, modules authored, ressources organisées |
| Practice | Labs et missions pédagogiques sans exécution réelle |
| Validate | Assessments, feedback et preuves de compétence |
| Perform | Journal, review et indicateurs explicables lorsque les données existent |
| Professionalize | Certification interne, portfolios et workflow professionnel après validation séparée |

`Perform` ne signifie pas promettre une performance financière. Il signifie analyser la qualité du processus lorsque les données collectées sont suffisantes.

## C.4 Motion design et animation 3D

L’animation 3D est bien retenue comme **couche de finition et de différenciation visuelle**, mais elle ne doit pas devenir une fonctionnalité Premium autonome ni retarder la boucle pédagogique.

### Rôle prévu

- renforcer l’identité DDA sur la landing et les transitions de produit ;
- donner de la profondeur au Terminal, aux fils de maîtrise et aux preuves ;
- visualiser une relation pédagogique — progression, structure, flux, zones — plutôt qu’ajouter un décor gratuit ;
- rendre les états `loading`, `locked`, `validated` et `review` plus lisibles.

### Séquence recommandée

1. **Phase de finition du site actuel :** une scène 3D légère sur la landing ou un objet institutionnel DDA, avec fallback statique.
2. **Phase Premium MVP :** micro-animation 3D ou pseudo-3D limitée à un moment de preuve ou de progression, sans dépendance à des données réelles.
3. **Phase ultérieure :** expériences 3D interactives uniquement si elles améliorent réellement l’apprentissage et restent utilisables sur mobile.

### Contraintes techniques

- privilégier CSS 3D, SVG animé ou Canvas léger avant d’ajouter une dépendance WebGL lourde ;
- ne pas charger de modèle 3D volumineux dans le chemin critique mobile ;
- prévoir une image ou une composition CSS de remplacement si WebGL est indisponible ;
- respecter `prefers-reduced-motion` et le mode low-data ;
- limiter l’animation aux propriétés performantes quand c’est possible (`transform`, `opacity`) ;
- ne transmettre aucune information essentielle par le mouvement seul ;
- tester 320/360/390/428/768/1024/1440 px, appareils modestes et installation PWA ;
- mesurer le poids, le temps de chargement et l’impact batterie avant publication.

### Décision de produit

La 3D doit servir **la compréhension et la preuve de progression**. Elle ne doit pas transformer DDA en vitrine décorative, casino visuel, clone de plateforme de trading ou expérience inaccessible. Elle appartient à la finition visuelle de la Phase 1 et à une extension pédagogique éventuelle, pas au modèle de données Premium.

---

# D. Information Architecture

## D.1 Navigation cible compatible avec les routes actuelles

```text
PUBLIC
├── Accueil              #landing
├── Commencer            #access
└── Vision Premium       #membership / aperçu local

APP APPRENANT
├── Aujourd’hui          #dashboard
├── Mon parcours         #path
├── Leçons               #lesson*
├── Progression          #progress
├── Journal & Plan       #journal
├── Ressources           #resources
├── Marchés & BRVM       #markets / démonstration
├── Broker Hub           #brokers / comparaison factuelle
└── Profil               #profile

PREMIUM — FUTUR ACTIF APRÈS MVP
├── Premium Track        nouvelle vue seulement après validation
├── Labs                 sous-vues ou composants du Track
├── Assessments          sous-vues du Track
└── Weekly Review        extension du Journal

FUTUR
├── AI Coach
├── Community
├── Expert ecosystem
└── Billing / account server
```

## D.2 Règles de création de route

Aucune nouvelle route ne doit être créée pour un simple placeholder. Toute future route devra documenter :

- son owner produit ;
- sa permission ;
- sa source de vérité ;
- son état vide ;
- son état verrouillé ;
- son analytics local ;
- sa stratégie mobile ;
- sa migration de données ;
- son rollback ;
- son statut `CONSTRUIT`, `PARTIEL`, `SIMULÉ` ou `FUTUR`.

Le premier Premium MVP peut être monté dans `#membership` et/ou `#path` avant de créer une route dédiée, afin de démontrer la boucle sans multiplier les surfaces.

---

# E. User Flow

## E.1 Free

```text
Landing
  → Access
  → Onboarding local
  → Dashboard / Terminal
  → M0.1
  → M0.2
  → M0.3
  → Progression
  → Journal & Plan
```

## E.2 Premium aperçu actuel

```text
Free user
  → Membership
  → Aperçu Premium local
  → Revenir à Free ou basculer en simulation locale
```

Ce flow ne doit pas être décrit comme un achat.

## E.3 Premium MVP proposé

```text
Free learner
  → Membership / Premium overview
  → Premium Track locked or preview
  → Local demo entitlement only
  → Premium module
  → Lesson
  → Guided Lab
  → Assessment
  → Proof
  → Progression
  → Journal review prompt
```

## E.4 États obligatoires d’une future fonctionnalité Premium

1. **Visitor :** ne voit pas de contenu apprenant privé.
2. **Free locked :** comprend la valeur sans accès au contenu premium complet.
3. **Premium preview :** peut voir une démonstration locale clairement marquée.
4. **Premium active local :** accès simulé dans le prototype, sans prétention de paiement.
5. **Empty state :** aucun contenu authored disponible.
6. **Completed state :** preuve réelle et révisable.
7. **Error/degraded state :** données locales indisponibles ou migration refusée.

---

# F. Feature Matrix

| Feature | Free | Premium | Future | Priority |
|---|---|---|---|---|
| Landing / découverte | Oui, construit | Même entrée | — | P0 |
| Onboarding | Oui, local | Même flux au MVP | Auth serveur | P0 |
| M0 authored | Oui | Oui | — | Existant |
| M1 authored gated | Aperçu/accès selon permission locale | Oui en simulation locale | Droits serveur | Existant/P0 |
| Premium Track | Non | Aperçu local puis MVP local | Route dédiée après validation | P0 |
| Premium authored lesson | Non | 1–2 leçons au MVP | Curriculum multi-modules | P0 |
| Guided Lab | Terminal pédagogique existant | Première mission Premium | Labs multiples | P0 |
| Assessment | Quiz/blocks existants | Assessment dédié au module MVP | Banque d’évaluations | P0 |
| Skill Passport | Preuves des leçons authored | Extension aux preuves Premium | Skill Graph transversal | P1 |
| Journal & Plan | Oui, local | Réutilisé au MVP | Sync, replay, review | P0/P1 |
| Weekly Review | Non | Non au MVP, structure réservée | V2 | P1 |
| Decision Replay | Non | Non au MVP | V2 | P1 |
| DDA Progress Score | Aucun score arbitraire | Aucun score arbitraire | V2 après données suffisantes | P1 |
| Animation 3D / motion design | Finition visuelle progressive | Micro-interaction de preuve au MVP | Expériences 3D pédagogiques avancées | P1 |
| Strategy Builder | Non | Vision seulement | V3 | P3 |
| Backtesting Lab | Non | Vision seulement | V3 | P3 |
| Performance metrics | Non | Non tant que les données ne sont pas collectées | V2/V3 | P2 |
| Market Intelligence | Démonstration non connectée | Même état | Sources validées | P2 |
| AI Coach | Non | Vision uniquement | V3 | P3 |
| Community Premium | Non | Vision uniquement | V3 | P3 |
| Expert ecosystem | Non | Non | V3+ | P3 |
| Paiement / abonnement | Non | Non | Infrastructure après validation | P2 |
| Auth / multi-device | Non | Non | Infrastructure après validation | P2 |
| Admin / CMS | Non | Non | Infrastructure après validation | P2 |

---

# G. Data Model

## G.1 Principe

Le modèle actuel v4 doit rester compatible. Aucun champ ne doit être ajouté uniquement pour afficher une métrique. Les données doivent être collectées avant d’être agrégées.

## G.2 Entités produit futures

```text
User
  └── Membership
  └── OnboardingProfile
  └── LessonProgress[]
  └── SkillEvidence[]
  └── PracticeAttempt[]
  └── JournalEntry[]
  └── Review[]

Track
  └── Module[]
       └── Lesson[]
            └── Block[]
            └── Assessment[]

PracticeMission
  └── MissionAttempt[]
       └── Annotation[]
       └── Decision[]
       └── Feedback
       └── Proof

Skill
  └── SkillEvidence[]
  └── SkillLevelHistory[]
```

## G.3 Extension proposée, sans migration immédiate

Lorsque le premier Premium MVP sera validé, ajouter une structure additive sous un namespace explicite :

```js
premium: {
  trackId: null,
  modules: {},
  labs: {},
  assessments: {},
  proofs: {},
  reviews: {}
}
```

Cette structure ne doit pas remplacer `lessons`, `terminal` ou `journal`. Elle doit référencer leurs identifiants et utiliser les mêmes fonctions de sanitation.

### Objets minimaux

```text
premium.modules[moduleId] = {
  status: 'locked'|'available'|'in_progress'|'completed',
  startedAt,
  completedAt
}

premium.labs[labId] = {
  status: 'not_started'|'retry'|'validated',
  attempts,
  lastFeedback,
  sourceLesson,
  proofId
}

premium.assessments[assessmentId] = {
  attempts,
  passed,
  completedAt
}

premium.proofs[proofId] = {
  type,
  source,
  competencyId,
  createdAt
}
```

Les timestamps doivent rester des chaînes sanitation-safe. Les résultats ne doivent pas contenir de score financier ou de gain si le système ne les mesure pas réellement.

## G.4 Skill Passport

Le Skill Passport doit mesurer une **progression pédagogique**, jamais une valeur personnelle. Le niveau doit être dérivé de preuves et rester explicable :

| Niveau | Signification |
|---|---|
| 1 — Understand | La notion a été présentée et la leçon est réellement ouverte |
| 2 — Identify | L’apprenant reconnaît la notion dans une situation guidée |
| 3 — Apply | L’apprenant l’applique dans une pratique évaluée |
| 4 — Execute | Réservé à une future preuve plus exigeante, pas automatique |
| 5 — Explain | L’apprenant peut expliquer son raisonnement avec une preuve authored |

Le code actuel atteint principalement les niveaux 1–3 et un niveau 4 local pour certaines leçons via quiz complet. Il ne faut pas renommer cet état en « expert » ou « performant ».

## G.5 Progress Score

Ne pas ajouter `progressScore: 72` sans modèle explicable. Une future formule devra publier ses dimensions et ses données d’entrée :

```text
Knowledge       ← leçons/assessments validés
Practice        ← missions et tentatives réellement enregistrées
Consistency     ← sessions ou reviews observables, avec fenêtre explicitée
Risk            ← règles de risque authored et preuves de compréhension
Execution       ← uniquement si une définition pédagogique existe
Review          ← reviews complétées
```

Avant tout score, afficher d’abord les dimensions séparées et leur couverture de données.

---

# H. Component Architecture

## H.1 Composants actuels à réutiliser

- `LESSON_REGISTRY` dans `app.js`.
- `DDALearning` dans `learning-engine.js`.
- `DDALessonRenderer` dans `lesson-renderer.js`.
- `DDA` dans `dda-core.js`.
- `showView()` et les permissions de `app.js`.
- `renderPathJourney()`.
- `renderProgress()` / Fil de maîtrise.
- Terminal pédagogique et ses contrôles d’annotation.
- Journal composer en trois étapes.
- Entitlements `DDA.can()`.
- Patterns `.premium-gate`, `.panel`, `.journal-entry-card`, `.mastery-row`.

## H.2 Composants à créer pour le MVP

1. **Premium Track Header** — état de l’offre, sans prix ni paiement inventé.
2. **Premium Module Rail** — module, statut, prérequis, progression réelle.
3. **Lab Mission Brief** — objectif, données synthétiques, règle de validation.
4. **Assessment Gate** — exercice/assessment lié à la preuve.
5. **Proof Receipt** — compétence, source, date locale, prochaine action.
6. **Premium Locked State** — valeur expliquée, contenu non exposé, CTA vers aperçu.
7. **Skill Evidence Adapter** — adaptateur des preuves M0/M1/ Premium vers Progression.
8. **Review Prompt** — pont vers Journal & Plan, sans Weekly Review complète au MVP.

## H.3 Règles de réutilisation

- Un nouveau bloc pédagogique doit passer par le Lesson Renderer s’il est générique.
- Une nouvelle preuve doit être créée par une fonction commune et sanitation-safe.
- Aucun HTML Premium ne doit dupliquer la logique d’évaluation déjà portée par le Learning Engine.
- Les composants doivent proposer focus, clavier, état vide, locked, retry et reduced motion.
- Les nouvelles classes CSS doivent respecter les deux registres : Learning éditorial clair et Terminal sombre précis.

---

# I. State Management

## I.1 Court terme — rester compatible avec v4

Pour le MVP local :

- conserver `prototypeState` comme façade d’état ;
- passer toutes les écritures par `DDA.save()` ou une méthode additive ;
- ajouter une fonction `sanitizePremium()` avant d’ajouter les objets Premium ;
- ne jamais muter directement un objet issu de `DDA.load()` sans sauvegarde ;
- réutiliser `DDA.track()` seulement pour des événements autorisés ;
- plafonner les tableaux d’essais et de preuves comme le Journal et les dessins Terminal ;
- versionner la future extension dans un test de migration avant de passer à v5.

## I.2 Moyen terme — séparer les responsabilités

Lorsque deux ou plusieurs labs existeront, extraire progressivement :

```text
state/
  identity
  membership
  curriculum
  progress
  terminal
  journal
  premium
  analytics
```

Cette extraction peut rester dans des fichiers vanilla JS tant qu’une migration framework n’est pas décidée. Il n’y a aucune justification pour remplacer tout le site par React uniquement pour créer le Premium MVP.

## I.3 Événements locaux à prévoir

Ajouter uniquement après validation de la feature :

- `premium_track_viewed`
- `premium_module_started`
- `premium_lab_attempted`
- `premium_lab_validated`
- `premium_assessment_completed`
- `premium_proof_created`
- `premium_review_opened`

Chaque événement doit avoir une allowlist de metadata minimale et ne pas contenir d’email, de nom ou de journal texte.

---

# J. Responsive Architecture

DDA est mobile-first. Toute nouvelle surface Premium doit être testée au minimum à :

- 320 px ;
- 360 px ;
- 390 px ;
- 428 px ;
- 768 px ;
- 1024 px ;
- 1440 px.

## Règles

- Une mission doit être utilisable au tactile sans précision au pixel.
- Les zones interactives doivent faire au moins 44 × 44 px.
- Les graphiques synthétiques doivent avoir une alternative textuelle et un feedback non fondé uniquement sur la couleur.
- Le rail Premium devient une séquence verticale sur mobile.
- Les side panels deviennent des sections empilées ou des drawers accessibles.
- Le CTA principal reste unique et ne recouvre jamais une preuve ou une action.
- Les états locked et empty doivent être lisibles sans dépendre d’un hover.
- Le mode low-data doit désactiver les images non essentielles et les animations décoratives.
- Les transitions doivent respecter `prefers-reduced-motion`.

## J.1 Règles spécifiques à la 3D

- Une animation 3D doit avoir une fonction narrative identifiable avant d’être développée.
- La landing peut recevoir une scène 3D institutionnelle, mais le contenu principal doit rester immédiatement lisible sans elle.
- Dans l’app apprenant, la 3D doit être subordonnée à un état réel : compétence, lab, preuve, verrou ou progression.
- Les modèles lourds, textures haute résolution et bibliothèques WebGL ne doivent pas entrer dans le bundle principal sans budget de performance validé.
- Le fallback statique est une expérience supportée, pas une erreur.
- Une capture mobile, un test reduced-motion et un test réseau dégradé sont obligatoires avant publication.

## J.1 Animation 3D et motion design

L’animation 3D fait bien partie de la direction de finition de DDA, mais elle doit
rester une **couche d’expérience**, pas une dépendance du moteur pédagogique.

### Emplacements recommandés

1. **Landing / hero :** objet ou composition 3D abstraite représentant le flux
   apprendre → pratiquer → prouver ; aucune fausse donnée de marché.
2. **Fenêtre produit de la landing :** profondeur légère sur le cockpit DDA,
   avec parallax très limité et désactivable.
3. **Terminal pédagogique :** transitions de panneaux, focus d’annotation et
   feedback de mission ; la géométrie du graphique reste lisible et prioritaire.
4. **Premium Track :** marqueur spatial de progression ou scène d’introduction,
   uniquement après qu’un contenu authored réel existe derrière l’écran.

### Ce qui est exclu

- Pas de 3D décorative lourde sur chaque page.
- Pas de WebGL obligatoire pour ouvrir une leçon, un exercice ou le Journal.
- Pas de rotation permanente qui détourne l’attention.
- Pas de modèle 3D utilisé pour suggérer une performance, un prix ou une donnée
  de marché réelle.
- Pas de dépendance à une bibliothèque volumineuse avant mesure de son coût.

### Architecture technique proposée

- **Progression recommandée :** CSS 3D / transforms et SVG pour les premières
  signatures ; WebGL/Canvas uniquement si l’effet apporte une vraie valeur et
  si le budget de performance est démontré.
- **Chargement différé :** la scène 3D ne doit pas bloquer le premier rendu, le
  CTA, l’accès ou le lecteur de leçon.
- **Fallback obligatoire :** image ou composition HTML/CSS statique équivalente
  si WebGL est absent, si le réseau est lent ou si le mode low-data est actif.
- **Reduced motion :** `prefers-reduced-motion: reduce` supprime rotations,
  parallax et transitions non essentielles ; le sens de l’état reste transmis
  par le texte, la structure et la couleur.
- **Mobile-first :** qualité, nombre de particules, résolution et fréquence de
  rendu doivent être réduits sur mobile ; l’animation doit rester optionnelle.
- **Accessibilité :** aucune information essentielle ne doit être portée par la
  profondeur, le mouvement ou la couleur seule ; le canvas décoratif doit être
  `aria-hidden="true"` quand il n’est pas interactif.

### Critères de validation 3D

- pas de débordement horizontal à 320/360/390/428/1440 px ;
- interaction principale toujours accessible au clavier et au tactile ;
- pas de blocage du premier rendu ou du chargement d’une leçon ;
- fallback visuel vérifié sans WebGL et en low-data ;
- animation désactivée en reduced motion ;
- budget de poids et de mémoire documenté avant l’ajout d’une librairie ;
- capture desktop et mobile avant fusion ;
- aucune régression sur les tests E2E, le PWA cache et le Terminal.

---

# K. Permissions

## K.1 Rôles actuels

### FREE USER

Peut accéder au curriculum Free, aux leçons authored autorisées, à la Progression, au Journal local, aux ressources Free et aux démonstrations Market/Broker. Ne doit pas accéder au contenu Premium authored.

### PREMIUM USER

Dans le prototype actuel : entitlement local `premium`, statut `demo`, accès aux permissions Premium locales et aux aperçus. Dans un système réel : entitlement serveur vérifié, expiration, provenance, révocation et synchronisation seraient nécessaires.

### ADMIN

**Absent du prototype.** Ne pas créer un bouton ou une route Admin sans modèle d’authentification, audit, rôles, CSRF, gestion des contenus et séparation de données.

## K.2 Rôles futurs

- Content Author.
- Reviewer / pédagogie.
- Support Agent.
- Expert / Instructor.
- Analyst / Data Steward.

Ces rôles appartiennent à l’écosystème futur et ne doivent pas être simulés comme actifs.

## K.3 Règle de sécurité

Les entitlements locaux servent à guider l’interface du prototype. Ils ne protègent pas réellement un contenu Premium téléchargé côté client. Aucun secret, contenu sensible ou donnée commerciale ne doit être ajouté dans `dist/` en prétendant être protégé.

---

# L. MVP Roadmap

## PHASE 1 — Premium Learning Vertical Slice

**Objectif :** prouver la valeur pédagogique Premium sans infrastructure de production.

1. Valider le nom et la compétence du premier module Premium.
2. Authored 1–2 leçons Premium dans le format `LESSON_REGISTRY` / curriculum.
3. Réutiliser les blocs et le Lesson Renderer.
4. Ajouter une mission Terminal pédagogique ou un lab guidé.
5. Ajouter un assessment qui produit une preuve réelle.
6. Afficher cette preuve dans Progression.
7. Préremplir un pont vers Journal & Plan.
8. Ajouter les états Free locked / Premium preview / Premium demo.
9. Ajouter les contrats Node, smoke et E2E.
10. Mettre à jour le Master Build Register.

**Pourquoi :** cette phase teste la boucle Premium sans inventer de paiement, de marché réel ou de score.

## PHASE 2 — Premium Learning System

1. Plusieurs modules authored avec prérequis.
2. Skill Passport par compétence authored.
3. Missions multiples et historique des tentatives.
4. Reviews structurées dans Journal & Plan.
5. Decision Replay local.
6. Dimensions de progression séparées, sans score global arbitraire.
7. CMS local ou format authored plus facilement éditable.

**Pourquoi :** cette phase augmente la profondeur pédagogique avant l’infrastructure commerciale.

## PHASE 3 — Production Infrastructure & Ecosystem

1. Authentification serveur.
2. Base de données et ownership utilisateur.
3. Synchronisation multi-device.
4. Billing validé séparément.
5. Analytics production minimisées.
6. CMS/back-office et workflow de review.
7. AI Coach pédagogique avec garde-fous.
8. Community modérée.
9. Backtesting / Strategy Builder si les données, définitions et risques sont validés.
10. Écosystème Expert et marketplace.

**Pourquoi :** ces éléments ont des conséquences de sécurité, de données, de paiement, de conformité et de gouvernance qui dépassent le prototype actuel.

---

# M. Technical Risks

| Risque | Niveau | Mesure |
|---|---:|---|
| Contenu Premium local exposé côté client | Élevé | Ne pas distribuer de secrets ; considérer le local comme prototype seulement |
| Fausse impression de paiement/abonnement | Élevé | Conserver `status: demo`, labels aperçu, aucun prix définitif |
| Duplication de logique entre leçons et Premium | Élevé | Étendre le registre et le renderer, contrats de registry |
| Skill Passport avec niveaux arbitraires | Élevé | Dériver chaque niveau d’une preuve authored explicable |
| Progress Score non justifiable | Élevé | Pas de score avant collecte et définition des dimensions |
| État local trop volumineux | Moyen | Limites, sanitation, historique compact, tests de quota |
| Migration schema v4 → v5 | Élevé | Migration additive, backup logique, test legacy et rollback |
| Permission locale confondue avec sécurité | Élevé | Documenter le caractère démonstratif, attendre auth serveur |
| Curriculum M2–M9 vide | Moyen | Ne jamais créer des cartes authored sans contenu réel |
| Service worker stale | Moyen | Incrémenter le cache et tester une installation déjà visitée |
| PWA/offline et droits futurs | Élevé | Ne jamais utiliser offline pour contourner une permission serveur |
| Dépendance à des données réelles | Élevé | Garder les graphiques synthétiques explicitement marqués |
| IA transformée en signal | Élevé | AI Coach limité à explication, questions et review |
| Performance images / CSS statique | Moyen | Budget de poids, lazy loading, audit Lighthouse avant production |
| Navigation hash sans historique complet | Faible/Moyen | Conserver back-links contextuels ; décider pushState séparément |
| Couverture de tests insuffisante pour nouveaux labs | Moyen | Test contractuel avant chaque nouvelle surface |
| 3D lourde ou incompatible avec des appareils modestes | Moyen/Élevé | CSS/SVG d’abord, lazy-load, fallback statique, budget GPU et tests low-data/reduced-motion |

---

# N. Implementation Plan

## Étape 0 — Validation de cadrage

- Faire valider le nom du premier module Premium.
- Faire valider sa compétence cible et sa place dans le parcours.
- Confirmer si le MVP reste local/demo ou si une infrastructure externe est autorisée.
- Ne pas coder avant ces trois décisions.

## Étape 1 — Contrat de données

- Ajouter un test de forme pour `premium` sans encore modifier l’UI.
- Définir `sanitizePremium()` et les limites des tableaux.
- Définir les événements autorisés.
- Vérifier la migration d’un état v4 sans `premium`.

## Étape 2 — Curriculum authored

- Créer le module et ses leçons dans la source de curriculum existante.
- Ajouter les compétences et XP réels.
- Composer les blocs avec le Lesson Renderer.
- Définir prérequis et permissions dans le registre unique.
- Vérifier que le module vide ne devient pas automatiquement disponible.

## Étape 2 bis — Direction 3D progressive

- Choisir une seule scène ou signature 3D utile, d’abord sur la landing ou le
  Premium Track, pas dans toutes les vues.
- Produire une version CSS/SVG ou HTML statique équivalente avant toute scène
  WebGL.
- Ajouter le lazy-load, le fallback, le mode low-data et le mode reduced-motion.
- Mesurer le poids, le temps de chargement, la mémoire et l’impact mobile.
- Tester clavier, tactile, WebGL indisponible, connexion lente et capture réelle.
- Ne fusionner la scène que si elle améliore la compréhension de DDA plutôt que
  d’ajouter une décoration autonome.

## Étape 3 — Premium states

- Ajouter l’état Free locked.
- Ajouter l’état Premium preview.
- Ajouter l’état Premium demo.
- Ajouter l’état empty/coming soon.
- Ajouter des labels honnêtes et les routes de retour.

## Étape 4 — Lab et assessment

- Réutiliser le Terminal synthétique.
- Définir une mission guidée avec validation pédagogique.
- Relier la validation à une preuve locale.
- Ne jamais compter le lab comme un quiz de leçon par raccourci.

## Étape 5 — Progression et Journal

- Ajouter la preuve au Fil de maîtrise.
- Afficher la source de la preuve et le niveau atteint.
- Proposer un pont vers Journal & Plan.
- Ne pas ajouter de score global si ses dimensions ne sont pas mesurées.

## Étape 6 — Tests

- `node --check` sur chaque runtime.
- Contrats curriculum/registry/renderer.
- Test migration v4 → état enrichi.
- Smoke boot Free/Premium/locked.
- E2E mobile et desktop.
- Test clavier/focus/reduced motion.
- Test direct deep-link et prérequis.
- Test no fabricated data / no financial promise.

## Étape 7 — Documentation et Product Gate

- Mettre à jour `DDA_MASTER_BUILD_REGISTER.md` avec le statut exact.
- Mettre à jour `DDA_ROUTE_MAP.md` uniquement si une route réelle est ajoutée.
- Ajouter captures représentatives et limites restantes.
- Exécuter le workflow Pages/Product Gate.
- Fusionner seulement après validation des tests et de la gouvernance.

## Étape 7 bis — Finition 3D contrôlée

- Choisir un seul emplacement prioritaire : landing institutionnelle ou preuve Premium.
- Définir le sens de l’animation et son fallback statique avant de choisir une technologie.
- Mesurer le poids initial, le temps de rendu, le coût CPU/GPU et la batterie sur mobile.
- Ajouter les tests reduced-motion, low-data, WebGL indisponible et écran étroit.
- Publier la 3D uniquement si elle améliore la compréhension ou le rythme sans dégrader l’accès au contenu.

## Étape 8 — Ce qui ne doit pas être fait dans cette tranche

- Pas de paiement.
- Pas de vraie authentification.
- Pas de données live.
- Pas de backtesting réel.
- Pas de Strategy Builder complet.
- Pas de AI Coach connecté.
- Pas de Community réelle.
- Pas de marketplace Expert.
- Pas de migration React.
- Pas de refonte globale du design existant.
- Pas de score arbitraire.
- Pas de 3D WebGL généralisée avant validation d’une première scène légère et
  de ses fallbacks.

---

# O. Critères de réussite de la spécification

Après lecture, une prochaine personne doit savoir que :

- DDA possède aujourd’hui un Learning Engine réel, un Terminal pédagogique, un Journal local, une Progression par preuves et un Premium simulé.
- Premium doit d’abord ajouter une seule boucle verticale authored et testable.
- Le premier code probable concerne un module/lab/assessment, pas une plateforme de paiement.
- Les compétences doivent être dérivées de preuves explicables.
- Les données futures doivent être additives et sanitation-safe.
- Les routes actuelles ne doivent pas être renommées.
- Les fonctions absentes restent documentées comme futures.
- Les tests et le Master Build Register sont des livrables de chaque tranche.

> **Décision finale de cette version :** aucune fonctionnalité Premium majeure ne doit être codée sur la seule base de la vision. La prochaine action raisonnable est de valider le périmètre du premier Premium Learning Vertical Slice, puis de l’implémenter à l’intérieur des abstractions existantes.
