# DDA — INFORMATION ARCHITECTURE & UX STRUCTURE AUDIT

**Mission :** comprendre et rationaliser toute la structure du produit avant toute nouvelle implémentation  
**Dépôt audité :** `mbouaricha12/DDA-digital-acad-my-`  
**Périmètre inspecté :** `dist/index.html`, `dist/app.js`, `dist/dda-core.js`, `dist/learning-engine.js`, `dist/lesson-renderer.js`, `DDA_ROUTE_MAP.md`, `DDA_INFORMATION_ARCHITECTURE_TARGET.md`, tests et manifest d’hébergement  
**Date de l’audit :** 28 septembre 2026  
**Statut :** audit documentaire uniquement — aucun fichier fonctionnel modifié

---

## 0. Résumé exécutif

DDA possède déjà une structure riche et cohérente sur le plan pédagogique, mais elle est devenue trop large pour un prototype qui cherche à guider une seule prochaine action. Le problème principal n’est pas le nombre de vues : c’est le fait que plusieurs vues et plusieurs cartes répondent partiellement à la même question.

### Diagnostic central

> **Le Dashboard veut être à la fois une page d’accueil, un Terminal, une page de pratique, une page Market Intelligence, une page Journal, une page de progression et un teaser Premium.**

Cela crée une hiérarchie floue : l’utilisateur peut comprendre la promesse de DDA, mais ne sait pas toujours quelle action est la mission principale de la page actuelle.

### Constat par règle produit

| Règle | État actuel | Diagnostic |
|---|---|---|
| **ONE PAGE = ONE PRIMARY MISSION** | Partiellement respectée | Les vues `lesson`, `journal`, `resources`, `markets`, `brokers`, `support` ont une mission identifiable ; `dashboard`, `progress`, `membership` et `access` en ont plusieurs. |
| **ONE CLICK = une intention significativement différente** | Partiellement respectée | Les clics de navigation sont généralement explicites, mais plusieurs CTA différents ouvrent la même destination sans préciser la différence d’intention. |
| **ONE PRIMARY SOURCE OF TRUTH** | Bonne base technique | `DDALearning.nextActionable()` est bien la source de vérité de la prochaine leçon. Le risque restant concerne la duplication éditoriale et les indicateurs de progression, pas le moteur de curriculum. |

### Décision d’architecture recommandée

Ne pas supprimer immédiatement des pages. Réduire d’abord leur mission :

1. **Dashboard / Aujourd’hui** = choisir et lancer la prochaine action.
2. **Parcours** = comprendre la carte du curriculum et le statut des modules.
3. **Leçon** = apprendre et prouver une compétence.
4. **Terminal / Practice** = observer, manipuler et produire une preuve pratique.
5. **Progression** = comprendre les preuves acquises et la prochaine compétence.
6. **Journal & Plan** = formuler, conserver et revoir son propre processus.
7. **Market Intelligence** = contextualiser un fait en contenu pédagogique, jamais afficher une seconde progression.
8. **Premium** = expliquer un niveau d’accès et ses capacités réelles, pas raconter toute la roadmap.

Cette clarification est une décision de structure, pas une demande de redesign.

---

## 1. Carte complète du produit actuel

### 1.1 Surface publique et accès

| Page / vue | Mission primaire proposée | Audience | Entrée | Actions principales | Sortie obtenue | Liens / destinations | Données affichées | Pages similaires / chevauchements |
|---|---|---|---|---|---|---|---|---|
| `landing` | Comprendre pourquoi DDA existe et commencer | Visiteur anonyme | URL sans compte/hash ; point d’entrée public | Entrer dans DDA ; voir la méthode | Accès au formulaire ou compréhension de la méthode | `access`, `path` | Promesse Learn → Practice → Prove, principes, aperçu Free/Premium | `access` répète une partie de la promesse ; `dashboard` reprend Learn → Practice → Prove |
| `access` | Créer/reprendre une session locale | Visiteur ou apprenant local | CTA landing, deep-link, gate de permission | Inscription locale ; onboarding ; reprendre session ; liens secondaires vers plusieurs zones | Profil local et parcours initial | `lesson`, `journal`, `markets`, `community`, `membership`, `brokers`, `resources`, `support` | Formulaire, onboarding, promesse locale, aperçus de domaines | `landing` pour la promesse ; `profile` pour les données personnelles |
| `onboarding` (sous-flux de `access`) | Qualifier le point de départ pédagogique | Nouvel apprenant | Soumission d’inscription | Choisir niveau, objectif, rythme | Préférences locales utilisées par le Terminal | Suite vers `lesson` ou vue courante | Niveau, objectif, rythme | `profile` réédite ces mêmes préférences |

**Problème structurel :** `access` n’est pas seulement une authentification. Il sert aussi de menu de découverte pour Journal, Marchés, Communauté, Premium, Broker Hub, Ressources et Support. Cela dilue l’intention « créer/reprendre ma session ».

---

### 1.2 App apprenant

| Page / vue | Mission primaire proposée | Audience | Entrée | Actions principales | Sortie obtenue | Liens / destinations | Données affichées | Pages similaires / chevauchements |
|---|---|---|---|---|---|---|---|---|
| `dashboard` / Aujourd’hui / Darius Terminal | Choisir la prochaine action utile aujourd’hui | Apprenant inscrit | Navigation principale, fin d’onboarding, retour de lesson | Reprendre la leçon ; ouvrir Journal ; accéder aux modules de Terminal | Une action démarrée ou une décision d’orientation | `lesson`, `journal`, `markets`, `membership`, `brokers`, `resources`, `support`, `community`, `practice`, `intelligence` | Prochaine leçon, Fil de maîtrise résumé, Practice Terminal, Market Intelligence, Journal, Skill map, Premium, Family, outils | `path` répète la prochaine leçon ; `progress` répète le Fil de maîtrise ; `markets` répète une partie de l’intelligence ; `journal` répète l’accès au Journal |
| `path` / Mon parcours | Se situer dans le curriculum et choisir un module autorisé | Apprenant inscrit | Navigation principale ; liens publics ou support | Ouvrir le chapitre courant ; consulter statuts | Compréhension de la position dans M0–M9 | Leçon courante ; retour nav | Module actif, modules à suivre, statuts verrouillé/en cours/validé | `dashboard` affiche la prochaine leçon ; `progress` affiche aussi le statut des modules |
| `lesson`, `lesson-m02`, `lesson-m03`, `lesson-m11`, `lesson-m12`, `lesson-m13` | Acquérir puis prouver une compétence pédagogique | Apprenant inscrit avec permission | Dashboard, Parcours, Progression, résultat de leçon, deep-link protégé | Lire, marquer compris, pratiquer, corriger, valider quiz, éventuellement journaliser | Preuve de compréhension/pratique et prochaine leçon | `back`, leçon suivante, `journal`, `dashboard`, `progress`, `support` | Contenu authored, exercices, quiz, feedback, résultat, XP local | `practice` approfondit la pratique ; `progress` synthétise les preuves |
| `practice` / Pratique avancée | Présenter les outils avancés à venir et un premier lien vers le Journal | Apprenant inscrit / Premium simulé | Navigation et entitlement | Consulter l’aperçu ; être informé | Préférence locale de notification ; aucune pratique avancée active | `journal` ; notification locale | Revue hebdomadaire, Decision Replay, Analyse assistée, Trading Lab, Trader DNA, Skill Graph — tous futurs | `journal`, `progress`, `intelligence` contiennent déjà une partie des mêmes concepts |
| `progress` / Progression | Lire les preuves et la prochaine compétence à confirmer | Apprenant inscrit | Navigation, Profil, résultat de leçon | Revoir une leçon depuis une compétence ; comprendre le prochain pas | Lecture des compétences démontrées | Leçons authored ; navigation principale | XP, modules amorcés, jours d’activité, Fil de maîtrise, preuves Practice, prochaine étape, modules, certification, badges | `dashboard` résume le Fil de maîtrise ; `profile` duplique XP/modules/jours ; `path` duplique les modules |
| `journal` / Journal & Plan | Documenter son processus de décision et son plan personnel | Apprenant inscrit | Nav, Dashboard, Market Intelligence, leçon, Practice, résultat | Créer/éditer/supprimer une entrée ; remplir un plan ; passer par 3 étapes | Note locale structurée, plan sauvegardé, preuve éventuellement reliée à une leçon | `back`, source lesson si preuve ; aucune destination métier obligatoire | Marché, contexte, scénario, processus, décision, résultat, review, note ; objectifs du plan | `markets` invite à journaliser ; `dashboard` l’affiche ; `practice` le met en avant ; leçon propose aussi le même CTA |
| `resources` / Bibliothèque DDA | Ouvrir une ressource pédagogique courte au bon moment | Apprenant inscrit | Nav, Dashboard, Premium gate | Ouvrir lecteur intégré ; demander aperçu Premium | Lecture d’une ressource ou rencontre avec un verrou | `membership`, lecteur interne | Ressources Free, atelier Premium, labels d’entitlement | `path` et `lesson` portent déjà du contenu pédagogique ; `membership` répète l’atelier |
| `markets` / Market Intelligence | Relier un fait de marché à une notion à apprendre | Apprenant inscrit | Nav, Dashboard, access, fin du curriculum | Lire l’aperçu ; revoir les fondations ; journaliser | Une question pédagogique ou entrée de Journal | `lesson`, `journal` | BRVM Composite, BRVM 30, calendrier de démonstration, chaîne Fait → Pourquoi → Notion → Contenu DDA | Dashboard affiche un aperçu des mêmes indices ; `resources` pourrait devenir la destination du contenu associé |
| `brokers` / Broker Hub | Comparer des critères de broker sans recommandation | Apprenant inscrit | Nav, Dashboard, access | Filtrer marché/usage ; ouvrir critères | Compréhension des critères, aucune décision de dépôt | Aucun parcours de sortie fort | Profils de démonstration, critères, disclosures | `support` et `membership` contiennent le même registre de garde-fous ; hors mission d’apprentissage centrale |
| `community` / DDA Family | Montrer un aperçu honnête d’une communauté future | Apprenant inscrit | Nav, Dashboard, Membership, access | Être informé au lancement | Préférence locale uniquement | Aucun contenu actif | Discussions, sessions, groupes d’étude, atelier gestion du risque | `practice` et `intelligence` utilisent exactement le même patron d’aperçu futur |
| `profile` / Profil | Modifier l’identité et les préférences locales | Apprenant inscrit | Nav, chip profil, Support | Modifier prénom, niveau, objectif, rythme ; low-data ; rappels ; reset | État local mis à jour ou session réinitialisée | `progress`, `access` | Nom, e-mail local, plan, XP/modules/jours, préférences | `onboarding` réutilise niveau/objectif/rythme ; `progress` réaffiche les mêmes métriques |

---

### 1.3 Premium et surfaces futures

| Page / surface | Mission actuelle réelle | Statut | Risque UX |
|---|---|---|---|
| `membership` / DDA Premium | Simuler localement un niveau Premium et expliquer les briques futures | SIMULÉ / aperçu | Mélange entre entitlement, pricing absent, roadmap, communauté et certification |
| `practice` | Aperçu des outils avancés | FUTUR / aperçu | Le titre « Pratique avancée » peut laisser croire à un outil actif alors que le Terminal possède déjà une pratique réelle M0.2 |
| `intelligence` | Aperçu de Darius AI et personnalisation | FUTUR / aperçu | Risque de confondre IA future, personnalisation existante et prochaine action calculée par le moteur |
| `weekly review` | Mention seulement dans les tuiles Premium/Practice | FUTUR | Pas de route ni d’objet métier actuel ; ne doit pas devenir une pseudo-page |
| `P2`, `P3` | Non trouvés comme routes actives dans `dist/index.html` ou comme pages dédiées | Non présents comme surfaces runtime | Ne pas les traiter comme des pages existantes ; les garder comme phases/backlog documentaire |
| Écosystème Expert | Non présent comme fonctionnalité runtime | FUTUR | Nécessite modèle de rôle, contenu, paiements, revenus, analytics et gouvernance séparés |

---

## 2. Navigation et graphe des clics

### 2.1 Destinations les plus appelées dans `dist/index.html`

Le comptage porte sur les éléments `data-view` présents dans le shell HTML ; il ne compte pas les destinations générées dynamiquement par le moteur de leçons.

| Destination | Nombre de références `data-view` | Lecture |
|---|---:|---|
| `journal` | 8 | Sur-sollicité : Dashboard, access, Market Intelligence, Practice, leçons, résultat et nav |
| `back` | 7 | Cohérent techniquement, mais dépend d’un historique applicatif manuel |
| `path` | 5 | Hub de curriculum et sortie par défaut de plusieurs surfaces |
| `progress` | 4 | Destination de synthèse appelée depuis Dashboard, Profil, leçon et Practice |
| `profile` | 4 | Mélange entre identité, statistiques et reset |
| `community` | 3 | Preview future répétée dans access, membership et Dashboard |
| `resources` | 3 | Bibliothèque appelée depuis access, Dashboard et Practice |
| `markets` | 3 | Market Intelligence appelée depuis access, Dashboard et Support |
| `access` | 3 | Entrée/gate, mais aussi action de reset profil |
| `brokers`, `membership`, `support` | 2 chacun | Accès de nav + raccourci ou gate |
| `practice`, `intelligence` | 1 chacun | Surfaces présentes dans la nav mais peu reliées depuis le contenu |

### 2.2 Principaux chemins observés

```text
LANDING
 ├── Entrer dans DDA → ACCESS → ONBOARDING → LEÇON
 └── Voir la méthode → PATH

DASHBOARD / AUJOURD’HUI
 ├── Prochaine action → LEÇON
 ├── Mission guidée → TERMINAL / PRACTICE
 ├── Ce qui bouge → MARKET INTELLIGENCE
 ├── Observation → JOURNAL & PLAN
 ├── Fil de maîtrise → PROGRESSION
 ├── Ouverture DDA → PREMIUM
 ├── DDA Family → COMMUNAUTÉ
 └── Outils → BROKER HUB / RESSOURCES / SUPPORT

LEÇON
 ├── Exercice / Quiz → résultat de leçon
 ├── Journal → JOURNAL & PLAN
 ├── Continuer → LEÇON SUIVANTE
 ├── Voir mon Terminal → DASHBOARD / TERMINAL
 └── Voir ma Progression → PROGRESSION

MARKET INTELLIGENCE
 ├── Revoir les fondations → LEÇON
 └── Ouvrir Journal & Plan → JOURNAL

PROGRESSION
 ├── Revoir/continuer une compétence → LEÇON
 ├── Certification / badges → verrou local
 └── Modules recap → même curriculum

PREMIUM
 ├── Preview atelier / certification → gate ou ressource
 └── DDA Family → COMMUNAUTÉ
```

### 2.3 Problème de navigation principal

Le Dashboard est le centre de gravité de presque toutes les intentions. Il devient donc une page de destination universelle, alors que la règle produit demande une distinction claire entre :

- reprendre une leçon ;
- pratiquer dans le Terminal ;
- comprendre le marché ;
- journaliser ;
- consulter une preuve ;
- explorer un futur Premium.

Le code fait correctement respecter la destination de la prochaine leçon via `DDALearning.nextActionable()`, mais la hiérarchie UX autour de cette source de vérité est trop large.

---

## 3. Analyse des termes et contenus répétés

### 3.1 BRVM / Market Intelligence

**Présences constatées :**

- Dashboard : aperçu « Ce qui bouge aujourd’hui », BRVM Composite/BRVM 30 ;
- navigation : « Marchés & BRVM » ;
- `markets` : page complète Market Intelligence ;
- formulaire Journal : exemple de marché « BRVM Composite » ;
- ressources/support/access : références indirectes ;
- `MARKET_DEMO` dans `dist/app.js` : source unique des indices et calendrier de démonstration.

**Risque :** l’utilisateur peut croire que « BRVM » est à la fois un marché réel, une page de données, un exemple de Journal et un module d’apprentissage.

**Source de vérité technique actuelle :** `MARKET_DEMO` pour les éléments affichés dans le Dashboard et la page `markets`.  
**Mission recommandée :** `markets` est la seule page qui explique le contexte de marché ; le Dashboard peut conserver une seule ligne de signalisation et renvoyer vers cette page, sans recréer la mini-page.

### 3.2 Parcours

**Présences constatées :**

- landing : « Voir la méthode » pointe vers `path` ;
- nav : `Mon parcours` ;
- Dashboard : prochaine leçon et parfois résumé de module ;
- Progression : recap M0–M9 ;
- Support : lien Débutants / Parcours ;
- Premium : modules M1+ ;
- leçons : retours contextuels vers `path`.

**Risque :** le mot Parcours désigne trois choses : carte de curriculum, prochaine action et historique de progression.

**Source de vérité technique actuelle :** `DDA.curriculum.modules` + `DDALearning.moduleStatus()` / `nextActionable()`.  
**Mission recommandée :** `path` = carte structurelle ; `dashboard` = décision du jour ; `progress` = preuves ; ne pas afficher de seconde carte de curriculum complète dans les deux dernières.

### 3.3 Progression

**Présences constatées :**

- page `progress` ;
- Terminal : Fil de maîtrise, XP, activité, skill map ;
- Profil : XP total, modules amorcés, jours d’activité ;
- leçon : stepper Comprendre → Exercice → Quiz → Résultat ;
- Premium : « preuve de progression » ;
- Practice : Skill Graph futur.

**Risque :** même mot pour quatre niveaux différents : étape dans une leçon, compétence, curriculum global et statistique personnelle.

**Source de vérité technique actuelle :** `DDALearning.lessonNextStep()`, `getLessonProgress()`, `moduleStatus()`, `totalXp()`, `countActiveDays()` ; `renderState()` alimente Dashboard, Progression et Profil.  
**Mission recommandée :** réserver « Progression » à la page des preuves de compétence ; appeler le stepper de leçon « Étapes de la leçon » ; appeler XP/jours « Activité personnelle » si ces métriques restent visibles.

### 3.4 Journal & Plan

**Présences constatées :**

- nav principale ;
- Dashboard : carte Journal ;
- Terminal : « Continuer dans Journal & Plan » et « Ouvrir ton Journal » ;
- Market Intelligence : CTA Journal ;
- leçons : bloc `journal_link` ;
- résultats de leçon : Journal ;
- Practice : carte Journal & Plan ;
- access : plusieurs liens Journal.

**Risque :** le Journal devient la sortie générique de tout contenu, même quand l’intention pédagogique devrait se terminer par une preuve de leçon ou une action de marché contextualisée.

**Source de vérité technique actuelle :** `DDA.addJournalEntry`, `updateJournalEntry`, `saveJournalPlan`, `prototypeState.journal`.  
**Mission recommandée :** le Journal ne doit être proposé que lorsqu’une observation personnelle ou une décision mérite d’être conservée ; les leçons doivent garder la preuve de leçon comme sortie primaire et rendre le Journal secondaire.

### 3.5 Premium Track

**Présences constatées :**

- landing : carte Free/Premium ;
- Dashboard : bandeau « Ouverture DDA » ;
- gates des leçons M1+ ;
- ressources Premium ;
- certification ;
- page `membership` ;
- communauté ;
- Practice et Intelligence ;
- `ENTITLEMENTS` dans `dda-core.js`.

**Risque :** Premium est à la fois un plan, une roadmap, un gate d’accès, une promesse de profondeur et un conteneur de futurs outils.

**Source de vérité technique actuelle :** `DDA.can(state, permission)`, `DDA.setPlan()`, `ENTITLEMENTS`.  
**Mission recommandée :** `membership` explique les droits réellement débloqués ; les pages futures expliquent leur propre mission et ne doivent pas être présentées comme des features Premium déjà disponibles.

### 3.6 Cartes Dashboard

Le Dashboard contient au minimum :

1. Fil de maîtrise ;
2. prochaine leçon ;
3. Terminal visuel ;
4. Practice Terminal ;
5. Market Intelligence ;
6. Journal ;
7. Skill map ;
8. DDA Family ;
9. Premium ;
10. Broker Hub ;
11. Ressources ;
12. Support.

**Conclusion :** ces cartes ne sont pas toutes des raccourcis d’une même mission. Certaines sont des résumés de données, d’autres des CTA, d’autres des previews futures. Le Dashboard doit donc être considéré comme un **cockpit de priorisation**, non comme la page complète de toutes les fonctionnalités DDA.

---

## 4. Matrice “une page = une mission”

| Page | Mission primaire retenue | Ce qu’elle ne doit pas devenir |
|---|---|---|
| Landing | Convaincre et orienter vers le début du parcours | Un catalogue complet des fonctionnalités |
| Access | Créer/reprendre une session locale | Un menu public de toutes les pages |
| Dashboard / Aujourd’hui | Décider la prochaine action du jour | Un résumé exhaustif de tout DDA |
| Parcours | Comprendre la carte du curriculum | Un tableau de preuves détaillées |
| Leçon | Apprendre et valider une compétence | Une page de marché ou un Journal complet |
| Terminal / Practice | Observer/manipuler et produire une preuve pratique | Une page de données live ou de signaux |
| Progression | Lire les preuves et les compétences | Une deuxième carte de curriculum complète |
| Journal & Plan | Documenter le processus personnel | Un flux de marché ou un tableau de progression |
| Ressources | Trouver le bon support pédagogique | Une page Premium complète |
| Market Intelligence | Contextualiser un fait et ouvrir le contenu utile | Un dashboard de trading ou une liste de signaux |
| Broker Hub | Comprendre les critères de comparaison | Une recommandation ou un tunnel d’affiliation |
| Premium | Comprendre les droits et capacités disponibles | Une roadmap infinie ou un faux checkout |
| Communauté | Montrer le statut et le périmètre de la communauté | Une conversation simulée |
| Support | Obtenir une réponse ou identifier un blocage | Un hub de navigation produit |
| Profil | Gérer identité et préférences locales | Une deuxième page Progression |
| Practice avancée | Présenter la profondeur future du système de pratique | La mission M0.2 réellement disponible dans le Terminal |
| Intelligence DDA | Présenter l’IA future et ses garde-fous | Une IA active ou un conseiller de marché |

---

## 5. Sources de vérité recommandées

| Type d’information | Source actuelle à conserver | Pages consommatrices légitimes | Pages qui devraient seulement résumer |
|---|---|---|---|
| Curriculum, modules, leçons | `DDA.curriculum` dans `dda-core.js` | Parcours, leçons, progression | Dashboard, Premium |
| Prochaine action | `DDALearning.nextActionable()` | Dashboard | Parcours, Progression |
| Étape d’une leçon | `DDALearning.lessonNextStep()` + progression lesson | Leçon | Dashboard |
| Preuve de compétence | `getLessonProgress()`, Practice proof | Progression, résultat de leçon | Dashboard, Profil |
| Modules authored et ordre | `LESSON_REGISTRY` + curriculum monté | Parcours, moteur de leçon | Progression |
| Journal et Plan | `prototypeState.journal` via fonctions DDA | Journal & Plan | Dashboard, Market Intelligence |
| Entitlements | `ENTITLEMENTS` + `DDA.can()` | Membership, gates | Nav, cartes Premium |
| Données Market Intelligence de démonstration | `MARKET_DEMO` | `markets` | Dashboard, uniquement en résumé |
| Identité et préférences | `prototypeState.user`, `onboarding`, `preferences` | Profil | Dashboard, access |
| XP / activité | calculs DDA existants (`totalXp`, `countActiveDays`) | Progression ou Profil — choisir un propriétaire | Dashboard, Premium |
| Statut des features futures | registre de roadmap / documents de gouvernance | Membership ou page future dédiée | Toutes les autres pages, sous forme de badge court |

### Point important

Le code respecte déjà une bonne source de vérité pour la prochaine leçon. Il faut éviter de créer une deuxième logique pour :

- un « plan du jour » parallèle ;
- un « next step » du Dashboard différent de `nextActionable()` ;
- un score de Skill Graph indépendant ;
- une progression Premium calculée séparément ;
- une lecture BRVM non issue de `MARKET_DEMO` ou d’une future source validée.

---

## 6. Pages ou concepts à fusionner conceptuellement

Il ne s’agit pas encore de modifier les routes. Il s’agit de clarifier les frontières avant tout code.

### 6.1 Dashboard + Terminal

**Constat :** le Dashboard inclut le Darius Analysis Terminal P0.4.  
**Décision d’architecture à prendre :**

- soit le Terminal est la mission pratique principale d’une sous-section du Dashboard ;
- soit il devient une page primaire distincte `practice-terminal`.

**Recommandation audit :** conserver le Terminal dans l’App Apprenant mais le traiter comme un module explicitement nommé **Pratique guidée**, avec une sortie unique : preuve de pratique ou retry.

### 6.2 Parcours + Progression

**Constat :** les deux lisent le curriculum, et Progression possède aussi un recap M0–M9.  
**Recommandation :**

- Parcours = carte et ordre ;
- Progression = preuves et compétences ;
- supprimer conceptuellement le recap de curriculum de Progression ou le réduire à un contexte minimal.

### 6.3 Journal + Plan

**Constat :** la page contient deux onglets et plusieurs appels CTA.  
**Recommandation :** garder une page unique, mais avec une hiérarchie claire :

- Journal = entrée personnelle principale ;
- Plan = sous-vue de planification, pas une deuxième mission racine.

### 6.4 Market Intelligence + Ressources

**Constat :** Market Intelligence promet une chaîne fait → pourquoi → notion → contenu DDA ; Ressources héberge des supports courts.  
**Recommandation :** Market Intelligence contextualise ; Ressources fournit le contenu. Le CTA d’un fait doit ouvrir **une ressource ou une leçon identifiée**, pas un Dashboard intermédiaire.

### 6.5 Premium + Practice avancée + Intelligence DDA

**Constat :** Membership sert de plan, Practice sert de roadmap, Intelligence sert de roadmap IA.  
**Recommandation :**

- Premium = droits ;
- Practice = produit pratique futur ;
- Intelligence = produit IA futur ;
- aucun des deux derniers ne doit être utilisé pour vendre le premier tant qu’il n’y a pas de capacité active.

---

## 7. Audit des pages similaires et sorties

### Leçon → Journal

**Intention différente ?** Oui, si l’utilisateur veut formuler une observation personnelle.  
**Risque :** CTA présent dans chaque leçon, même sans preuve à contextualiser.  
**Règle proposée :** Journal secondaire, jamais sortie principale d’une leçon.

### Market Intelligence → Journal

**Intention différente ?** Oui : transformer une lecture de contexte en observation personnelle.  
**Risque :** Dashboard et Market Intelligence proposent tous deux un même pont.  
**Règle proposée :** seul `markets` crée le pont contextuel ; Dashboard n’affiche qu’un aperçu et renvoie à `markets`.

### Dashboard → Progression / Profil

**Intention différente ?** Partiellement. Les chiffres XP/modules/jours sont présents dans plusieurs endroits.  
**Règle proposée :** Progression possède les preuves ; Profil possède identité/préférences ; Dashboard ne montre qu’une micro-confirmation de la prochaine action.

### Premium → Certification / Ressources Premium

**Intention différente ?** Oui si Premium explique les droits et les deux pages expliquent l’usage.  
**Risque :** certification et atelier deviennent des arguments commerciaux répétés.  
**Règle proposée :** un seul propriétaire éditorial des droits Premium, avec les autres pages limitées à leur état verrouillé.

### Support → toute l’application

**Intention différente ?** Non : Support contient des liens vers Ressources, Parcours, Markets, Journal, Progression et Profil.  
**Risque :** Support devient un second menu général.  
**Règle proposée :** Support doit diagnostiquer un problème et orienter vers une réponse ; limiter les liens contextuels aux deux destinations les plus pertinentes par FAQ.

---

## 8. Risques UX prioritaires

### P0 — Dashboard surchargé

**Symptôme :** trop de missions concurrentes sur la première page apprenant.  
**Conséquence :** la prochaine action, pourtant calculée correctement, perd sa dominance visuelle et mentale.  
**Sans coder maintenant :** décider quelles cartes sont essentielles à l’arrivée et lesquelles sont des sorties secondaires.

### P0 — Access comme hub secondaire

**Symptôme :** le formulaire d’accès expose Journal, Marchés, Community, Premium, Broker, Ressources et Support.  
**Conséquence :** un visiteur n’a pas une intention unique au moment de l’inscription.  
**Décision à prendre :** Access doit seulement créer/reprendre une session ; la découverte reste sur Landing.

### P1 — Progression et Profil redondants

**Symptôme :** XP total, modules amorcés et jours d’activité sont affichés dans les deux.  
**Conséquence :** l’utilisateur ne sait pas si ces chiffres décrivent une compétence ou son compte.  
**Décision à prendre :** choisir le propriétaire des métriques globales.

### P1 — Practice réel et Practice avancé homonymes

**Symptôme :** M0.2 propose déjà une mission de pratique dans le Terminal ; `practice` est une page future « Pratique avancée ».  
**Conséquence :** l’utilisateur peut croire que la page avancée contient la mission actuelle ou inversement.  
**Décision à prendre :** nommer clairement la surface actuelle « Pratique guidée » et la future « Practice Lab » ou équivalent.

### P1 — Market Intelligence et mini-aperçu Dashboard

**Symptôme :** BRVM et indices apparaissent dans le Dashboard et dans la page `markets`.  
**Conséquence :** deux lieux semblent être la source officielle.  
**Décision à prendre :** `markets` propriétaire ; Dashboard résumé non éditable.

### P2 — Future surfaces trop visibles

**Symptôme :** Community, Practice, Intelligence, Weekly Review, Decision Replay, Skill Graph et Darius AI sont montrés par tuiles.  
**Conséquence :** l’architecture paraît plus large que la valeur actuellement utilisable.  
**Décision à prendre :** conserver les previews pour gouvernance, mais les retirer de la navigation principale ou les regrouper sous « À venir » lorsque le prochain objectif est l’apprentissage M0/M1.

---

## 9. Structure cible recommandée avant nouvelle implémentation

```text
DDA
├── PUBLIC
│   ├── Accueil                  → promesse + commencer
│   ├── Méthode                  → comprendre Learn / Practice / Prove
│   └── À propos                 → identité et gouvernance
│
├── ACCÈS
│   ├── Inscription              → créer une session locale
│   ├── Connexion                → futur compte réel
│   └── Onboarding               → choisir niveau / objectif / rythme
│
├── APP APPRENANT
│   ├── Aujourd’hui              → une prochaine action
│   ├── Parcours                 → carte du curriculum
│   ├── Leçon                    → apprendre et valider
│   ├── Pratique guidée          → manipuler et produire une preuve
│   ├── Progression              → preuves et compétences
│   ├── Journal & Plan           → documenter et revoir
│   ├── Bibliothèque             → ressources
│   ├── Market Intelligence      → fait → contexte → contenu DDA
│   └── Profil                   → identité et préférences
│
├── ACCÈS PREMIUM
│   └── Premium                  → droits et capacités réelles
│
└── FUTUR
    ├── Communauté
    ├── Practice Lab
    ├── Intelligence DDA
    └── Écosystème Expert
```

Cette structure est une proposition d’information, pas une instruction de modification de routes.

---

## 10. Décisions bloquantes à faire valider avant de coder

1. **Le Terminal pratique reste-t-il une section du Dashboard ou devient-il une page dédiée ?**
2. **Progression possède-t-elle les métriques XP/modules/jours, ou Profil ?**
3. **Le Journal est-il une sortie secondaire de la leçon, ou une mission principale autonome dans la boucle DDA ?**
4. **Market Intelligence est-elle une page apprenant autonome, ou un type de ressource contextualisée ?**
5. **Le Dashboard doit-il afficher les previews Community/Premium/Practice/Intelligence, ou les regrouper derrière une zone future ?**
6. **Le mot « Premium » désigne-t-il uniquement l’entitlement, tandis que les produits futurs reçoivent leur propre nom ?**
7. **Weekly Review, P2 et P3 sont-ils des phases de roadmap documentaire uniquement, sans routes, jusqu’à un prochain arbitrage ?**
8. **Quelle est la définition officielle de « Learn », « Practice », « Prove », « Progression » et « Journal » dans le glossaire produit ?**

---

## 11. Verdict

### Ce qui est solide

- Le moteur curriculum et `DDALearning.nextActionable()` fournissent une base de source de vérité saine.
- Le registre des leçons évite déjà une duplication technique des titres, permissions et prérequis.
- Les surfaces futures sont honnêtement signalées comme futures et non connectées.
- Le Journal conserve une séparation claire entre preuve de pratique et note personnelle.
- Market Intelligence distingue explicitement contenu pédagogique et données réelles absentes.

### Ce qui doit être rationalisé

- La mission du Dashboard ;
- le rôle de l’Access screen ;
- la frontière Parcours / Progression ;
- la propriété des métriques XP / activité ;
- la frontière Practice réel / Practice avancé ;
- la répétition de BRVM ;
- la visibilité et le regroupement des previews futures ;
- l’usage systématique du Journal comme sortie.

### Conclusion

Le prototype ne souffre pas d’un manque de routes. Il souffre d’une **densité de missions par route** et d’une **densité de références croisées par concept**.

La prochaine tranche ne doit donc pas commencer par ajouter une page. Elle doit commencer par valider une **hiérarchie des missions**, puis vérifier que chaque page possède :

```text
une mission primaire
une source de vérité
une action principale
une sortie claire
un nombre limité de destinations secondaires
```

**Aucune modification fonctionnelle, aucun changement de design, aucune modification P2/P3 et aucun backend n’ont été effectués pendant cet audit.**
