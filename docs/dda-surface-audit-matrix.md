# Matrice d’audit des surfaces DDA

**Phase :** 1 — Audit visuel et inventaire des surfaces  
**Couche design préparée :** Phase 2 — Tokens CSS enrichis  
**Branche :** `chore/p3-reconciliation`  
**Date :** 9 octobre 2026

## Objectif de la matrice

Cette matrice sert de référence avant toute refonte visuelle plus profonde. Elle distingue la **mission produit** de chaque surface, les redondances à surveiller, les composants visuels à renforcer et les contraintes de validation.

> Règle DDA : une page doit avoir une mission claire, un rythme visuel propre et une prochaine action distincte. Elle ne doit pas recopier le contenu d’une autre surface.

## Légende

- **P0** : impact direct sur la perception premium ou le parcours principal.
- **P1** : amélioration importante après les surfaces principales.
- **P2** : finition ou surface future, sans bloquer le parcours cœur.
- **À préserver** : route, IDs DOM, stockage local, progression ou contrat déjà couvert par les tests.

## Matrice principale

| Surface / route | Mission unique | Redondances à surveiller | Composants visuels à renforcer | Priorité | Risque responsive | À préserver |
|---|---|---|---|---|---|---|
| Landing `#landing` | Faire comprendre la promesse DDA et conduire vers l’accès | Ne pas devenir un résumé du Dashboard ou du Parcours | Hero éditorial, halo Deep Navy, preuve de méthode, CTA, plans, garde-fous | P0 | Moyen | Shell public, CTA landing → access, sticky CTA mobile |
| Accès `#access` | Créer l’entrée apprenant et qualifier le parcours | Ne pas répéter la landing ni exposer prématurément le Dashboard | Carte d’inscription, étapes, illustration, états de validation | P0 | Élevé | Formulaires, onboarding, redirection vers M0.1 |
| Aujourd’hui / Dashboard `#dashboard` | Orienter vers la prochaine action utile | Répétition du Terminal, de Market Intelligence et de la Progression | Header de pilotage, Mastery Thread, CTA principal, daily brief, evidence snapshot | P0 | Moyen | `#analysis-terminal`, prochaine leçon, handoffs existants |
| Parcours `#path` | Montrer l’ordre des compétences et le prochain jalon | Ne pas devenir une deuxième page de leçon ou de Progression | Rail de modules, états locked/active/done, carte du module actif | P0 | Élevé | Prérequis, routes M0/M1, verrouillage séquentiel |
| Leçon M0.1 `#lesson` | Comprendre, appliquer, valider une fondation | Ne pas répéter le Dashboard ni le Terminal | Header de leçon, lesson beats, exercice, quiz, résultat | P0 | Moyen | IDs `lesson-*`, gate exercice → quiz, stockage progression |
| Leçon M0.2 `#lesson-m02` | Observer et identifier une zone pédagogique | Ne pas transformer le graphique en signal | Chart frame, zones, feedback, handoff Practice | P0 | Élevé | Graphiques synthétiques, zones cliquables, contrat Practice |
| Leçon M0.3 `#lesson-m03` | Lire une direction générale sans prédire | Ne pas recopier M0.2 ou Market Intelligence | Graphique, classification, feedback, progression | P1 | Élevé | Prérequis M0.2, quiz, résultat |
| Leçon M1.1 `#lesson-m11` | Comprendre la formation du prix | Ne pas promettre une lecture exploitable comme signal | Header institutionnel, emplacement vidéo 16:9, cas de pression, preuve | P0 | Moyen | Métadonnées vidéo, fallback, gate M1.1 |
| Leçon M1.2 `#lesson-m12` | Comprendre l’exécution des ordres | Ne pas confondre explication et exécution réelle | Séquence d’ordres, niveaux de prix, exercice multi-étapes | P1 | Élevé | Ordre pédagogique, quiz et prérequis |
| Leçon M1.3 `#lesson-m13` | Comprendre l’organisation des marchés | Ne pas dupliquer Broker Hub ou Market Intelligence | Carte des acteurs, primaire/secondaire, synthèse finale | P1 | Moyen | Fin honnête du curriculum M1 |
| Progression `#progress` | Montrer les compétences et preuves acquises | Ne pas devenir une copie du Parcours ou du Journal | Mastery panel, preuves, niveaux, next step, certificat verrouillé | P0 | Moyen | États localStorage, cartes de preuve, liens de leçon |
| Journal & Plan `#journal` | Documenter une observation et une décision pédagogique | Ne pas répéter le Terminal ou devenir un simple formulaire | Timeline, entrée enregistrée, preuve source, composer par étapes | P0 | Élevé | Sécurité XSS, onglets Journal/Plan, persistence locale |
| Ressources `#resources` | Compléter une leçon avec un outil précis | Ne pas devenir un deuxième parcours | Shelf, cartes de ressources, type, CTA retour à la pratique | P1 | Moyen | Accès Premium, liens vers Practice |
| Membership `#membership` | Comprendre les niveaux d’accès | Ne pas ressembler à une page de paiement réelle | Cartes Free/Premium, comparaison, état local, garde-fous | P1 | Moyen | Aucun achat réel, Premium Demo local |
| Premium Track `#premium-track` | Montrer la boucle Premium BUILD → PROVE | Ne pas dupliquer le Parcours principal | Rail P2, états de progression, carte de mission | P1 | Moyen | Entitlement Premium, P2.1 → P2.2 → Lab |
| Premium Lab `#premium-lab` | Appliquer un processus de risque dans un scénario synthétique | Ne pas devenir un terminal live | Formulaire, faits du scénario, feedback, état validé | P1 | Élevé | Aucun live data, progression P2 |
| Premium Assessment `#premium-assessment` | Valider la qualité du processus, pas la performance | Ne pas ressembler à une certification financière | Questions, receipt de preuve, résultat, handoff Journal | P1 | Moyen | Mention non financière, preuve locale |
| Market Intelligence `#markets` | Lire un contexte éditorial sans le confondre avec un signal | Répétition du Dashboard et du Terminal | Brief éditorial, cartes de contexte, steps “fait → sens → notion” | P1 | Moyen | Disclosures no live data, CTA vers Terminal/Parcours |
| Broker Hub `#brokers` | Filtrer des critères avant toute comparaison | Ne pas devenir une recommandation ou une page marché | Contrôles, lignes broker, badges, guide de lecture | P1 | Élevé | Garde-fous, événements broker, structure homogène |
| Centre d’aide `#support` | Résoudre un blocage précis | Ne pas devenir une nouvelle page de contenu | FAQ, formulaire, disclosure, retour au parcours | P2 | Moyen | Formulaire local, message non envoyé |
| Communauté `#community` | Préparer de futurs espaces d’échange sans faux flux | Ne pas dupliquer Journal, Market ou Parcours | Principes, aperçu atelier, CTA notification locale | P2 | Moyen | Aucun flux réel, préférence locale uniquement |
| Practice `#practice` | Prolonger une compétence observée | Ne pas remplacer le Terminal ou le Journal actif | Replay, featured Journal, carte de prochaine pratique | P1 | Moyen | État “à venir”, liens Progression/Profil |
| Intelligence DDA `#intelligence` | Préparer une aide qui explique sans décider | Ne pas simuler une IA de signal | Principes, personnalisation, disclosure, CTA futur | P2 | Faible | Aucun conseil automatique, aucun signal |
| Profil `#profile` | Ajuster les préférences de l’environnement | Ne pas répéter la Progression | Identité, métriques, préférences, actions de compte | P1 | Élevé | Reset local, préférences, non-serveur |
| Navigation desktop | Donner une carte stable de l’application | Ne pas multiplier les destinations équivalentes | États actifs, groupes, plan label, profil | P0 | Faible | Routes et boutons `data-view` |
| Navigation mobile | Permettre un accès rapide sans couvrir le contenu | Ne pas devenir un second menu complet | Barre fixe, état actif, clearance safe-area | P0 | Élevé | 5 destinations principales, hauteur testée |
| Bannière prototype / disclosure | Maintenir la transparence produit | Ne pas ressembler à une erreur ou à une alerte anxiogène | Surface paper, texte court, contraste | P1 | Faible | Disclosure local/no live data |
| États vides / locked / error | Expliquer quoi faire ensuite | Ne pas laisser une opacité sans explication | Message, icône, CTA, distinction verrouillé/indisponible | P0 | Moyen | Accessibilité `role=status/alert`, progression intacte |
| Vidéo leçon | Ajouter un support explicatif institutionnel | Ne pas remplacer le contenu ni bloquer l’exercice | Frame 16:9, caption, loading, fallback, état erreur | P0 | Élevé | Allow-list Vimeo, fallback, aucune permission excessive |

## Audit détaillé par priorité

### P0 — À traiter en premier

1. **Dashboard / Aujourd’hui**
   - Clarifier la prochaine action.
   - Réduire les répétitions du Terminal et de Market Intelligence.
   - Renforcer le Mastery Thread et la preuve récente.

2. **Lecteur de leçons**
   - Donner un rythme plus éditorial aux lesson beats.
   - Mettre la compétence et la prochaine action au premier plan.
   - Intégrer visuellement la vidéo M1.1 sans la rendre obligatoire.

3. **Terminal**
   - Renforcer l’outillage et les états actifs.
   - Conserver un graphique synthétique, non financier et non prédictif.
   - Améliorer la lisibilité tactile et mobile.

4. **Parcours**
   - Rendre le rail plus institutionnel et plus lisible.
   - Montrer immédiatement le prochain jalon.
   - Maintenir les verrous séquentiels existants.

5. **Journal & Progression**
   - Présenter les entrées et validations comme des preuves de compétence.
   - Clarifier la relation source : Leçon → Terminal → Journal → Progression.

6. **Navigation et états**
   - Maintenir une transition fluide mais légère.
   - Donner un feedback clair aux états locked, empty, loading et error.

### P1 — Deuxième vague

- Market Intelligence ;
- Ressources ;
- Membership ;
- Premium Track ;
- Premium Lab ;
- Premium Assessment ;
- Broker Hub ;
- Profil ;
- Practice.

### P2 — Finition et préparation future

- Centre d’aide ;
- Communauté ;
- Intelligence DDA ;
- surfaces futures sans données réelles ;
- animations éditoriales avancées.

## Questions d’audit à appliquer à chaque surface

### Mission

- La page répond-elle à une question ou à une intention unique ?
- La prochaine action est-elle visible sans chercher ?
- Cette action mène-t-elle à une autre surface réellement complémentaire ?

### Hiérarchie visuelle

- Le titre est-il dominant ?
- Le statut et le contexte sont-ils lisibles ?
- Existe-t-il un CTA principal clairement identifiable ?
- Les cartes secondaires sont-elles réellement secondaires ?

### Profondeur premium

- Les surfaces utilisent-elles des bordures et ombres cohérentes ?
- Le contraste entre fond, contenu et accent Brass est-il maîtrisé ?
- La texture apporte-t-elle du relief sans bruit visuel ?
- Les états actifs sont-ils visibles sans surcharge ?

### Interactivité

- Le hover apporte-t-il une information ou uniquement un mouvement ?
- Le focus clavier est-il visible ?
- L’état de succès ou d’erreur est-il immédiat et compréhensible ?
- Les préférences `prefers-reduced-motion` sont-elles respectées ?

### Responsiveness

- Aucun overflow à 360 px ?
- Navigation fixe sans recouvrement à 390 px ?
- Grilles et graphiques équilibrés à 414 px ?
- Densité suffisante à 1440 px sans étirement excessif ?
- Les cibles tactiles atteignent-elles au moins 44 px ?

### Intégrité produit

- Aucun signal ou conseil financier implicite ?
- Les disclosures “données synthétiques / locales” restent-ils visibles ?
- Les routes et IDs existants sont-ils préservés ?
- Le stockage local et la progression fonctionnent-ils comme avant ?

## Tokens CSS préparés en Phase 2

Les tokens enrichis sont centralisés dans le dernier bloc `:root` de `dist/styles.css`.

Ils couvrent :

- `--dda-void` et les niveaux Deep Navy ;
- `--dda-brass` et `--dda-brass-soft` ;
- `--dda-muted`, `--dda-cyan`, `--dda-teal` ;
- `--dda-line-subtle`, `--dda-line`, `--dda-line-strong` ;
- `--dda-glass` et `--dda-glass-strong` ;
- `--dda-surface-base`, `--dda-surface-raised`, `--dda-surface-inset` ;
- `--dda-texture-grid`, `--dda-texture-grid-size`, `--dda-texture-halo` ;
- `--dda-shadow-card`, `--dda-shadow-deep`, `--dda-shadow-brass` ;
- `--dda-serif`, `--dda-sans`, `--dda-mono` ;
- `--dda-ease` et les durées de motion.

Ces tokens sont préparatoires : ils n’imposent pas encore une refonte globale de toutes les cartes. La prochaine étape peut les appliquer surface par surface, en commençant par Dashboard, Terminal et lecteur de leçons.

## Validation attendue après chaque application

```bash
node --check dist/app.js
node --check dist/lesson-renderer.js
node tests/run.js
node tests/verify_route_register_consistency.js
git diff --check
```

Les tests responsive prioritaires restent :

```text
360 px · 390 px · 414 px · 1440 px
```

## État initial de la Phase 1 / Phase 2

- [x] Matrice d’audit créée.
- [x] Missions des surfaces explicitées.
- [x] Redondances prioritaires identifiées.
- [x] Risques responsive classés.
- [x] Tokens CSS enrichis.
- [ ] Application des tokens aux surfaces P0.
- [ ] Ajout des tests vidéo E2E.
- [ ] Comparaison screenshots avant/après.
- [ ] Validation finale avant merge vers `main`.
