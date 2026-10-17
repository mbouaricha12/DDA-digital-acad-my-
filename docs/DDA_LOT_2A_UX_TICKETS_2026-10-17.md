# DDA — Tickets UX Lot 2A

**Lot :** 2A — Compréhension immédiate  
**Périmètre :** Accès, onboarding, M0.1, Progression, Premium  
**Statut :** prêts à créer dans Jira ou GitHub Issues  
**Règle produit :** aucune activation de paiement, d’entitlement serveur ou de synchronisation n’est incluse dans ce lot.

## Vue d’ensemble

| ID | Type | Titre | Priorité | Estimation | Dépendances |
|---|---|---|---|---:|---|
| UX-2A-01 | Story | Clarifier l’entrée DDA Free | P0 | 3 pts | — |
| UX-2A-02 | Story | Rendre l’onboarding explicite et rassurant | P0 | 5 pts | UX-2A-01 |
| UX-2A-03 | Story | Structurer M0.1 en cycle Comprendre → Essayer → Vérifier → Continuer | P0 | 5 pts | UX-2A-02 |
| UX-2A-04 | Story | Améliorer le feedback d’exercice et la prochaine action M0.1 | P0 | 3 pts | UX-2A-03 |
| UX-2A-05 | Story | Transformer Progression en tableau de prochaine action | P0 | 5 pts | UX-2A-04 |
| UX-2A-06 | Story | Rendre le statut Premium local impossible à confondre avec un abonnement | P0 | 3 pts | UX-2A-01 |
| UX-2A-07 | Task | Valider Lot 2A sur mobile, clavier et reduced motion | P0 | 3 pts | UX-2A-01 à UX-2A-06 |

**Total indicatif : 27 points.** Les estimations sont des points de complexité, pas des jours calendaires.

---

## UX-2A-01 — Clarifier l’entrée DDA Free

**Type :** User Story  
**Priorité :** P0 — Bloquant acquisition / confiance  
**Labels :** `lot-2a`, `ux`, `access`, `free`, `priority:p0`, `mobile`

### User story

> En tant que nouveau visiteur, je veux comprendre ce que je vais faire dans DDA Free avant de créer une session, afin de commencer sans penser qu’un paiement, un courtier ou un engagement commercial est requis.

### Écrans concernés

- Landing : hero et section DDA Free (`dist/index.html`)
- Accès : première étape (`#access` dans `dist/academy.html`)

### Proposition de contenu

```text
Commence ton parcours Free

Un parcours guidé pour comprendre les marchés, pratiquer une notion
à la fois et garder une trace de ce que tu as réellement appris.

✓ 6 leçons de fondations
✓ exercices, quiz et retry
✓ progression et Journal sur cet appareil

Pas de carte bancaire. Pas de courtier. Pas de signal de marché.

[Commencer le parcours Free →]
```

### Critères d’acceptation

- [ ] Le premier écran de la landing présente au moins deux éléments concrets du parcours Free.
- [ ] Le CTA principal reste visible et utilisable à 320, 360, 390 et 768 px.
- [ ] Le texte indique la conservation locale au voisinage du CTA ou du formulaire.
- [ ] Aucun texte ne suggère que Premium, les vidéos ou la synchronisation sont actifs.
- [ ] Le clic Landing → Accès conserve le funnel existant et ne crée pas de route morte.
- [ ] Le participant pilote peut répondre à « Que vas-tu faire dans DDA Free ? » avec au moins deux éléments sans aide.
- [ ] Les liens Telegram, WhatsApp, FAQ, contact et `/launch/` ne sont pas régressés.

### Notes techniques

- Préserver les attributs analytics existants (`data-analytics`, `data-funnel-position`).
- Ne pas remplacer les boutons `data-view` par des liens non pris en charge par le shell Academy.
- Réutiliser les classes de la hiérarchie actuelle (`eyebrow`, `primary-action`, `trust-list`).

### Hors périmètre

- Nouvelle illustration 3D.
- Prix ou checkout Premium.
- Statistiques de conversion inventées.

### Definition of Done

- [ ] Copy validée en français.
- [ ] Test structure landing passé.
- [ ] Test mobile sans débordement passé.
- [ ] Test manuel avec au moins un débutant réalisé.

---

## UX-2A-02 — Rendre l’onboarding explicite et rassurant

**Type :** User Story  
**Priorité :** P0 — Bloquant activation  
**Labels :** `lot-2a`, `ux`, `onboarding`, `free`, `accessibility`, `priority:p0`

### User story

> En tant qu’apprenant débutant, je veux comprendre pourquoi DDA me demande mon niveau, mon objectif et mon rythme, afin de répondre sereinement et d’obtenir une première leçon adaptée.

### Écrans concernés

- `#signup-form`
- `#onboarding-form`
- `#resume-device`
- États BFF local / indisponible

### Maquette cible

```text
ÉTAPE 1 SUR 2 · COMMENCER

Pas de carte bancaire. Deux minutes pour préparer ta première leçon.

Prénom
[________________]

Adresse e-mail
[________________]

[ ] Je comprends que cette version conserve ma progression sur cet appareil.

[Continuer →]
```

```text
ÉTAPE 2 SUR 2 · CALIBRER

Ces réponses servent à choisir ton point de départ pédagogique.
Elles ne sont pas un test et ne constituent pas un profil financier.

Ton niveau                 [ Débutant              v ]
Ton objectif               [ Comprendre les marchés v ]
Ton rythme réaliste        [ 10 minutes par jour    v ]

[Construire mon parcours →]
```

### Critères d’acceptation

- [ ] Le titre de l’étape 1 distingue clairement parcours Free et compte serveur éventuel.
- [ ] Une phrase explique l’utilité des réponses d’onboarding.
- [ ] Chaque erreur indique le champ à corriger ; aucune erreur générique seule.
- [ ] Les erreurs utilisent `role="alert"` ou `aria-live` déjà prévu par la surface.
- [ ] Le bouton est désactivé uniquement si un champ requis est réellement incomplet.
- [ ] Le message de succès indique : « Ton parcours est prêt. Commence par M0.1. »
- [ ] L’état session existante propose explicitement Reprendre et Effacer.
- [ ] L’état stockage indisponible avertit sans bloquer silencieusement la lecture.
- [ ] Le sélecteur mobile ne déborde pas et ne reste pas couvert par le clavier.
- [ ] Le parcours existant Landing → Access → Onboarding → M0.1 continue de passer.

### Notes techniques

- Préserver les IDs `#first-name`, `#email`, `#level`, `#goal`, `#time` pour ne pas casser le runtime.
- Ne pas stocker plus de données que le schéma local existant.
- Si le BFF est indisponible, ne pas afficher « compte créé » : afficher explicitement le mode local.

### Definition of Done

- [ ] Copy et états validés.
- [ ] Test keyboard / Escape / native select passé.
- [ ] Test iPhone SE et écran étroit passé.
- [ ] Test de régression signup/onboarding passé.

---

## UX-2A-03 — Structurer M0.1 en cycle Comprendre → Essayer → Vérifier → Continuer

**Type :** User Story  
**Priorité :** P0 — Compréhension pédagogique  
**Labels :** `lot-2a`, `ux`, `lesson`, `m0.1`, `free`, `priority:p0`

### User story

> En tant qu’apprenant, je veux voir les étapes d’une leçon M0.1, afin de distinguer ce que je dois lire, essayer, vérifier et faire ensuite.

### Écran concerné

- `#lesson` et le rendu de `lesson-renderer.js`

### Maquette cible

```text
M0.1 · FONDATIONS

Ce que tu vas savoir faire
Identifier une observation, un prix illustratif et une hypothèse pédagogique.

[1 Comprendre] — [2 Essayer] — [3 Vérifier] — [4 Continuer]

AVANT DE RÉPONDRE
Lis l’exemple. Il ne s’agit pas d’une cotation réelle.

[Contenu de la leçon]

À TOI D’ESSAYER
[Question / interaction]
[Valider ma réponse]
```

### Critères d’acceptation

- [ ] Le cycle est visible sans être confondu avec un pourcentage de progression.
- [ ] Les états du cycle reflètent réellement l’état local de la leçon.
- [ ] Une leçon ouverte mais non validée n’est pas présentée comme une compétence acquise.
- [ ] Le bouton d’exercice décrit l’action : « Vérifier ma réponse ».
- [ ] Une réponse incorrecte reste dans le contexte de la leçon et permet un retry.
- [ ] Les mentions pédagogiques / synthétiques restent proches des exemples ou graphiques.
- [ ] La prochaine étape n’apparaît qu’après la condition réelle prévue par le curriculum.
- [ ] Le cycle fonctionne sur mobile sans scroll horizontal ni CTA masqué.

### Notes techniques

- Réutiliser les gates existants exercice → quiz et la persistance actuelle.
- Ne pas modifier les réponses correctes du curriculum sans mettre à jour les contrats.
- Ne pas convertir la barre en score financier ou en promesse de compétence globale.

### Definition of Done

- [ ] M0.1 incorrect → feedback → retry validé.
- [ ] M0.1 correct → quiz validé.
- [ ] Reload pendant la leçon testé.
- [ ] Accessibilité clavier et focus testés.

---

## UX-2A-04 — Améliorer le feedback d’exercice et la prochaine action M0.1

**Type :** User Story  
**Priorité :** P0 — Compréhension et rétention  
**Labels :** `lot-2a`, `ux`, `feedback`, `m0.1`, `free`, `priority:p0`

### User story

> En tant qu’apprenant qui vient de répondre, je veux savoir ce que ma réponse démontre et quoi faire ensuite, afin de progresser au lieu de cliquer au hasard ou de recommencer sans comprendre.

### États à implémenter

```text
RÉPONSE À REVOIR

Ce que ta réponse montre : [notion partiellement comprise]
À revoir : [explication courte liée au concept]

[Relire le passage]   [Réessayer]
```

```text
RÉPONSE VALIDÉE

Ce que tu viens de démontrer : [validation précise]

Le quiz va vérifier la même idée avec une formulation différente.

[Continuer vers le quiz →]
```

### Critères d’acceptation

- [ ] Le feedback incorrect explique une notion précise avant d’offrir Retry.
- [ ] Le feedback correct nomme la validation, sans exagérer le niveau de compétence.
- [ ] Le CTA principal est unique dans chaque état.
- [ ] Une action secondaire permet de relire le passage source.
- [ ] Le feedback est annoncé avec `aria-live="polite"` ou un mécanisme équivalent.
- [ ] L’utilisateur peut retenter sans perdre la question ni le contexte.
- [ ] La validation locale ne déclenche pas d’accès Premium ou de certification.

### Notes techniques

- Conserver les événements anonymisés existants et leurs filtres PII.
- Ne pas transmettre le texte complet des réponses à un outil externe.
- Vérifier le lien avec la progression et l’activation existante.

### Definition of Done

- [ ] Les deux états sont couverts par un test automatisé.
- [ ] Le texte est compréhensible par un débutant pendant un test modéré.
- [ ] Le retry fonctionne après rechargement.
- [ ] Aucun résultat historique ni message contradictoire ne reste affiché.

---

## UX-2A-05 — Transformer Progression en tableau de prochaine action

**Type :** User Story  
**Priorité :** P0 — Rétention / orientation  
**Labels :** `lot-2a`, `ux`, `progress`, `free`, `priority:p0`, `mobile`

### User story

> En tant qu’apprenant qui consulte ma Progression, je veux voir ce que j’ai réellement validé et une seule prochaine action, afin de reprendre mon parcours sans interpréter des chiffres seuls.

### Écran concerné

- `#progress`
- `#progress-next-step`
- `#mastery-list`
- `#modules-recap-list`

### Maquette cible

```text
PROGRESSION

Ce que DDA peut réellement prouver que tu as appris.

[0 XP] [0 module validé] [0 jour actif]

TA PROCHAINE ACTION
Commencer M0.1 : distinguer observation et hypothèse.
[Reprendre M0.1 →]

TES PREUVES
✓ Exercice M0.1 — validé le [date]
○ Quiz M0.1 — à faire
○ Journal — aucune trace liée

OÙ TU EN ES
M0 Fondations    [À commencer]
M1 Lecture       [Après M0]
Premium P2       [Aperçu local uniquement]
```

### Critères d’acceptation

- [ ] `#progress-next-step` n’affiche jamais un tiret isolé lorsque le profil connaît une prochaine action.
- [ ] La prochaine action est placée avant les sections secondaires de statistiques.
- [ ] Chaque preuve indique au minimum source, état et date locale si disponible.
- [ ] Un module ouvert mais non validé reste non acquis.
- [ ] Un module verrouillé par prérequis est distingué d’un contenu non construit.
- [ ] Les preuves Premium locales sont séparées des validations Free.
- [ ] L’état zéro explique quoi commencer et ne ressemble pas à une erreur.
- [ ] Le CTA renvoie vers la bonne leçon ou le bon écran sans route morte.

### Notes techniques

- Réutiliser le calcul de prochaine étape existant plutôt que créer une seconde logique.
- Préserver `#progress-next-step` pour les tests et les lecteurs d’écran.
- Ajouter une notice locale contextualisée, sans prétendre à une sauvegarde serveur.

### Definition of Done

- [ ] État zéro, état en cours et état après M1.3 testés.
- [ ] Retour Progression → leçon → Progression vérifié.
- [ ] Mobile 320–390 px sans overflow.
- [ ] Tests de persistance locale passés.

---

## UX-2A-06 — Rendre le statut Premium local impossible à confondre avec un abonnement

**Type :** User Story  
**Priorité :** P0 — Confiance / conformité commerciale  
**Labels :** `lot-2a`, `ux`, `premium`, `membership`, `priority:p0`, `legal`

### User story

> En tant qu’utilisateur Free, je veux comprendre ce que l’aperçu Premium démontre et ce qui n’est pas encore activé, afin de ne pas croire qu’un abonnement, un paiement ou un droit serveur existe déjà.

### Écrans concernés

- `#membership`
- `#premium-track`
- `#premium-lab`
- `#premium-assessment`
- lien vers `/launch/`

### Maquette cible

```text
DDA PREMIUM · APERÇU LOCAL

Tu explores une démonstration pédagogique sur cet appareil,
pas un abonnement actif.

Ce que la démonstration permet de travailler
✓ Risk & Discipline P2
✓ Risk Plan Lab
✓ Controlled Decision
✓ preuve locale et revue hebdomadaire

État actuel
Aucun paiement · aucun renouvellement · aucun entitlement serveur

[Voir l’aperçu Premium]
[Comprendre la préparation commerciale →]
```

### Critères d’acceptation

- [ ] Le statut « Aperçu local » apparaît dans Membership et Premium Track au-dessus de la ligne de flottaison.
- [ ] Le mot « abonnement » est toujours accompagné d’un état négatif explicite tant que le paiement n’est pas actif.
- [ ] Aucun bouton ne ressemble à un checkout réel et aucune carte bancaire n’est demandée.
- [ ] Les six zones de valeur sont formulées comme livrables pédagogiques, pas comme résultats financiers.
- [ ] Les preuves Premium sont séparées des preuves Free et portent la mention locale.
- [ ] L’aperçu de certification est libellé « non officiel ».
- [ ] Le lien vers `/launch/` ouvre la page publique déployée.
- [ ] Le passage Premium → Journal conserve le contexte sans accorder de droit serveur.

### Notes techniques

- Ne pas modifier l’entitlement local de façon à simuler un achat.
- Préserver les garde-fous `premium-locked-note` et les textes de non-paiement.
- Toute future activation serveur devra remplacer l’état par une réponse BFF vérifiée, jamais par `localStorage` seul.

### Definition of Done

- [ ] Free, aperçu local et futur sont distingués visuellement et textuellement.
- [ ] Parcours Premium P2 complet toujours testable localement.
- [ ] Aucun texte public ne promet certification, données live ou rendement.
- [ ] Tests Premium et tests d’accès passent sans régression.

---

## UX-2A-07 — Valider Lot 2A sur mobile, clavier et reduced motion

**Type :** Task  
**Priorité :** P0 — Contrôle transversal  
**Labels :** `lot-2a`, `qa`, `accessibility`, `responsive`, `priority:p0`

### Objectif

> En tant qu’équipe produit, nous voulons vérifier les surfaces Lot 2A dans les conditions réelles d’usage afin de ne pas corriger la compréhension desktop en cassant l’expérience mobile ou clavier.

### Matrice de validation

| Surface | 320 px | 360 px | 390 px | 412 px | 768 px | 1440 px | Clavier | Reduced motion |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Accès / onboarding | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| M0.1 exercice / quiz | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| Progression | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| Membership / Premium | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |

### Critères d’acceptation

- [ ] Aucun overflow horizontal sur les quatre surfaces.
- [ ] Toutes les cibles interactives principales font au moins 44 px.
- [ ] Le focus est visible et l’ordre clavier suit la lecture.
- [ ] Les annonces d’erreur et de succès sont vocalisables.
- [ ] `prefers-reduced-motion: reduce` désactive les transitions non essentielles.
- [ ] Le clavier virtuel ne masque aucun bouton principal.
- [ ] Les retours arrière ne perdent pas les réponses valides.
- [ ] Les tests de régression Free et Premium passent.
- [ ] Les modifications n’introduisent pas de texte « bientôt » trompeur ou de route vide.

### Definition of Done

- [ ] Contrat automatisé ajouté ou mis à jour lorsque le comportement est stable.
- [ ] Capture ou compte-rendu manuel pour chaque largeur critique.
- [ ] Aucun défaut P0 ouvert.
- [ ] Les défauts P1 restants sont documentés avec workaround.

---

## Ordre recommandé dans Jira / GitHub

1. `UX-2A-01` — clarifier l’entrée Free ;
2. `UX-2A-02` — onboarding ;
3. `UX-2A-03` — structure M0.1 ;
4. `UX-2A-04` — feedback M0.1 ;
5. `UX-2A-05` — Progression ;
6. `UX-2A-06` — Premium local ;
7. `UX-2A-07` — validation transversale.

### Labels recommandés

```text
lot-2a, ux, priority:p0, free, premium, mobile, accessibility
```

### Epic recommandé

```text
DDA — Phase 2 UX / Compréhension immédiate
```

### Règle de clôture de l’Epic

L’Epic ne peut être fermé que lorsque les tickets UX-2A-01 à UX-2A-07 sont terminés, que la suite de régression passe et qu’au moins cinq apprenants ont pu réaliser le parcours Free sans aide sur les étapes classées P0.
