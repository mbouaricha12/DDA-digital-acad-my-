# DDA — Phase 2 UX : maquettes textuelles et spécifications de correction

**Date :** 17 octobre 2026  
**Périmètre :** corrections UX issues des premiers retours du pilote Free  
**Statut :** spécification prête pour implémentation — aucun changement d’interface appliqué dans ce document  
**Produit cible :** DDA Free en production, Premium toujours en aperçu local

## 1. Objectif de la Phase 2

La Phase 2 ne consiste pas à ajouter une nouvelle couche visuelle. Elle doit rendre le parcours actuel plus compréhensible, plus rassurant et plus actionnable :

1. savoir pourquoi on est sur un écran ;
2. savoir quoi faire maintenant ;
3. comprendre ce qui vient d’être validé ;
4. comprendre ce qui reste local, futur ou non activé ;
5. revenir facilement à la prochaine étape sans perdre son contexte.

### Hors périmètre

- pas de paiement réel ;
- pas d’activation Premium serveur ;
- pas de synchronisation multi-appareils annoncée ;
- pas de données de marché temps réel ;
- pas de refonte graphique complète ;
- pas de vidéo déclarée publiée sans fichier vérifié ;
- pas d’ajout de statistiques marketing non observées.

## 2. Principes d’interface à appliquer partout

### 2.1 Une page = une mission

Chaque écran conserve un seul objectif principal, affiché sous la forme :

```text
DDA / [ESPACE]
[Titre de l’écran]
[Pourquoi cet écran existe en une phrase]

MISSION
[Action utile maintenant]
[Une seule action principale]
```

Les actions secondaires restent visibles mais ne doivent pas concurrencer le bouton principal.

### 2.2 Un statut explicite

Utiliser toujours l’un des statuts suivants, avec une formulation stable :

- **Disponible maintenant** — utilisable dans DDA Free ;
- **Aperçu local** — démonstration sur cet appareil, sans droit commercial ;
- **À préparer** — contenu ou service non ouvert ;
- **Validé** — preuve réellement enregistrée ;
- **À revoir** — tentative enregistrée mais notion à retravailler.

Éviter les formulations vagues comme « bientôt » seules, « débloqué » sans condition ou « certification » sans le mot « aperçu ».

### 2.3 Une prochaine action visible

Après chaque validation, l’écran doit répondre à trois questions :

```text
Ce que tu viens de faire : [validation]
Ce que cela prouve : [compétence ou trace]
Prochaine étape : [un bouton unique]
```

### 2.4 Mobile d’abord

- cible tactile minimale : 44 px ;
- aucun bouton important uniquement dans une zone sticky qui peut recouvrir le clavier ;
- une colonne jusqu’à 767 px ;
- titres limités à 3 lignes sur largeur 320–390 px ;
- les aides contextuelles passent sous le champ, jamais dans une infobulle indispensable ;
- les panneaux ne doivent pas demander de défilement horizontal ;
- le contenu reste lisible à 200 % de zoom et avec `prefers-reduced-motion: reduce`.

## 3. Écran A — Landing : clarifier la promesse avant l’accès

**Surface :** `dist/index.html`  
**Zone :** hero, Free, CTA final  
**Objectif :** permettre à un nouveau visiteur de reformuler DDA Free en une phrase.

### Maquette textuelle cible

```text
[DDA / LEARNING ACADEMY]

Comprendre les marchés.
Construire une méthode.
Prouver ce que tu as appris.

Un parcours guidé pour débuter, pratiquer et garder des traces de
compréhension — sans signal, sans promesse de gain et sans carte bancaire.

[Commencer le parcours Free →]

DDA Free aujourd’hui
✓ 6 leçons de fondations
✓ exercices, quiz et retry
✓ progression et Journal sur cet appareil

Ce que DDA ne fait pas
Pas de données temps réel · pas de conseil financier · pas d’exécution d’ordres
```

### Corrections UX

- Remonter dans le premier écran les trois éléments concrets de Free : **six leçons, exercices/quiz, progression locale**.
- Placer « progression sur cet appareil » à proximité du CTA, et non uniquement dans une section de confiance éloignée.
- Transformer le bouton « À venir » Premium en lien explicite vers `/launch/` ou la page Membership, avec le libellé **« Comprendre la préparation Premium »**.
- Conserver les garde-fous, mais les présenter après la promesse et non avant toute valeur.

### Critères d’acceptation

- Un participant débutant peut répondre à « Que vas-tu faire dans DDA Free ? » avec au moins deux éléments concrets sans aide.
- Le CTA principal est visible à 320 px, 360 px, 390 px et 768 px.
- Aucun texte ne laisse croire que Premium ou les vidéos sont déjà commercialisés.
- Le lien de préparation ouvre une page ou une surface existante, jamais une ancre vide.

## 4. Écran B — Accès : réduire l’anxiété de création

**Surface :** `#access` dans `dist/academy.html`  
**Sélecteurs concernés :** `#signup-form`, `#onboarding-form`, `.access-sequence`, `.access-card`  
**Objectif :** expliquer le parcours en deux étapes sans donner l’impression d’un compte commercial obligatoire.

### Maquette textuelle cible — étape 1

```text
ÉTAPE 1 SUR 2 · CRÉER

Commence ton parcours Free

Pas de carte bancaire. Pas de courtier. Deux minutes pour préparer
une première leçon adaptée à ton point de départ.

Prénom
[____________________________]

Adresse e-mail
[____________________________]

[ ] Je comprends que cette version conserve ma progression sur cet appareil.

[Continuer →]

Déjà une progression sur cet appareil ?
[Reprendre ma session]   [Effacer mes données]
```

### Maquette textuelle cible — étape 2

```text
ÉTAPE 2 SUR 2 · CALIBRER

Construisons une première étape réaliste

Ces réponses servent à choisir ton point de départ pédagogique.
Elles ne sont pas un test et ne constituent pas un profil financier.

Ton niveau
[ Débutant                         v ]

Ton objectif d’apprentissage
[ Comprendre les marchés            v ]

Ton rythme réaliste
[ 10 minutes par jour               v ]

[Construire mon parcours →]
```

### Corrections UX

- Remplacer « Créer mon compte » par **« Commence ton parcours Free »** lorsque le BFF n’est pas actif.
- Si l’authentification serveur est active plus tard, conserver un sous-texte distinct : **« Compte serveur sécurisé »** ; ne jamais mélanger compte local et compte serveur.
- Ajouter une phrase d’utilité sous les trois champs d’onboarding.
- Afficher le statut local dans le formulaire, au moment où le participant prend sa décision.
- Rendre les erreurs spécifiques : « Choisis ton niveau pour continuer », pas « formulaire invalide ».
- Après validation, afficher une transition de 1 à 2 secondes maximum : **« Ton parcours est prêt — première étape : M0.1 »**.

### États à spécifier

| État | Message | Action principale |
|---|---|---|
| Champ incomplet | « Choisis ton niveau pour construire ton parcours. » | Rester sur le champ |
| Stockage indisponible | « La progression ne pourra pas être conservée après fermeture. » | Continuer avec avertissement |
| Session existante | « Une progression existe déjà sur cet appareil. » | Reprendre / Effacer |
| BFF indisponible | « Le mode local reste disponible ; aucun compte serveur n’a été créé. » | Continuer localement |
| Succès | « Ton parcours est prêt. Commence par M0.1. » | Ouvrir M0.1 |

### Critères d’acceptation

- Un participant peut expliquer la raison des champs d’onboarding.
- Le bouton principal reste désactivé uniquement lorsqu’un champ requis manque.
- Les erreurs sont annoncées par `aria-live` et associées au champ concerné.
- Aucun utilisateur ne croit qu’un paiement ou une carte bancaire est requis.

## 5. Écran C — Leçon M0.1 : rendre le cycle d’apprentissage évident

**Surface :** `#lesson` et le rendu généré par `lesson-renderer.js`  
**Objectif :** séparer visuellement comprendre, essayer, vérifier et continuer.

### Maquette textuelle cible

```text
M0.1 · FONDATIONS

Ce que tu vas savoir faire
Identifier la différence entre un marché, un prix observé
et une hypothèse pédagogique.

[1] COMPRENDRE  [2] ESSAYER  [3] VÉRIFIER  [4] CONTINUER

AVANT DE RÉPONDRE
Lis l’exemple. Ici, il n’y a pas de cotation réelle.

[Contenu de la leçon]

À TOI D’ESSAYER
[Exercice guidé]
[Choix A] [Choix B] [Choix C]

[Valider ma réponse]

FEEDBACK
[Résultat] Ce que ta réponse montre : [...]
[Si incorrect] Relis ce passage : [...]
[Réessayer]

PROCHAINE ACTION
Quand l’exercice est validé, le quiz vérifie la même idée
avec une formulation différente.
[Continuer vers le quiz →]
```

### Corrections UX

- Ajouter une barre de cycle courte au-dessus du contenu, distincte d’un pourcentage de progression.
- Renommer les boutons selon l’état : **« Vérifier ma réponse »**, puis **« Réessayer »**, puis **« Continuer vers le quiz »**.
- Après erreur, afficher une explication liée au concept précis avant le bouton de retry.
- Après réussite, ne pas envoyer directement vers une nouvelle page sans résumé de validation.
- Sur mobile, garder l’action de validation dans le flux naturel ; la zone sticky ne doit pas couvrir les choix.
- Dans l’outline, différencier les sections lues des validations réellement obtenues.

### Critères d’acceptation

- Le participant explique spontanément la différence entre exercice et quiz.
- Une erreur offre une piste de compréhension, pas uniquement une nouvelle tentative.
- Une leçon ouverte mais non validée n’apparaît pas comme compétence acquise.
- Le lecteur conserve la position et le contexte après une réponse.

## 6. Écran D — Terminal et M0.2 : empêcher la lecture « signal »

**Surface :** Dashboard / Terminal d’observation / M0.2  
**Objectif :** rendre impossible, ou au minimum très improbable, la confusion entre série pédagogique et recommandation.

### Maquette textuelle cible

```text
TERMINAL D’OBSERVATION PÉDAGOGIQUE

Ce que tu observes
Une série synthétique pour travailler une notion.
Ce n’est pas un prix réel, un signal ou une recommandation.

[graphique illustratif]

Question de méthode
Quelles zones observes-tu ?
[ ] Une zone de réaction possible
[ ] Un prix garanti
[ ] Une décision à prendre immédiatement

[Valider mon observation]

RAPPEL
Décrire n’est pas prédire. Une observation correcte devient une
trace de travail, pas une instruction de marché.

[Ajouter au Journal →]
```

### Corrections UX

- Utiliser le terme **« série synthétique »** à proximité immédiate du graphique.
- Éviter les couleurs vert/rouge qui peuvent ressembler à un système achat/vente.
- Afficher le rappel sans signal dans le même panneau, pas seulement dans la FAQ.
- Le CTA après validation doit être **« Ajouter au Journal »**, jamais « prendre une position » ou équivalent.
- Si l’apprenant choisit une réponse qui évoque un signal, le feedback doit corriger le modèle mental sans le culpabiliser.

### Critères d’acceptation

- Le participant sait dire si la série est réelle ou synthétique.
- Aucun label de graphique ne ressemble à un prix ou une performance actuelle.
- La conversion Terminal → Journal conserve la notion source et le contexte observé.

## 7. Écran E — Progression : transformer les chiffres en prochaine action

**Surface :** `#progress`  
**Sélecteurs concernés :** `#progress-next-step`, `#mastery-list`, `#modules-recap-list`  
**Objectif :** éviter une page de statistiques sans décision pédagogique.

### Maquette textuelle cible

```text
PROGRESSION

Ce que tu as réellement démontré
Les ouvertures de pages ne comptent pas comme une compétence acquise.

[ 0 XP ] [ 0 module validé ] [ 0 jour actif ]

TA PROCHAINE ACTION
Commencer M0.1 : distinguer une observation d’une hypothèse.
[Reprendre M0.1 →]

TES PREUVES
✓ Exercice M0.1 — validé le [date]
○ Quiz M0.1 — à faire
○ Journal — aucune trace liée

OÙ TU EN ES
M0 Fondations       [à commencer]
M1 Lecture           [verrouillé : termine M0]
Premium P2          [aperçu local uniquement]

À retenir
Ta progression reste sur cet appareil dans cette version.
[Voir comment fonctionne le stockage local]
```

### Corrections UX

- Faire remonter `#progress-next-step` immédiatement après les statistiques.
- Remplacer un tiret isolé par un état explicite : **« Commencer M0.1 »**, **« Revoir M0.2 »** ou **« Aucun parcours commencé »**.
- Chaque ligne de maîtrise doit afficher : preuve obtenue, notion, date locale et lien vers la source.
- Distinguer les modules verrouillés par prérequis des espaces non construits.
- Afficher une notice locale contextualisée une seule fois par session, avec lien vers l’explication complète.

### Critères d’acceptation

- Un participant sait quelle action effectuer ensuite en moins de 10 secondes.
- Un module lu mais non validé reste dans un état non acquis.
- Les preuves Premium locales ne se mélangent pas aux preuves Free.
- L’absence de progression ne ressemble pas à une erreur système.

## 8. Écran F — Journal : guider l’écriture sans langage de trading prescriptif

**Surface :** `#journal`, `#journal-composer` et pont Terminal → Journal  
**Objectif :** faire comprendre que le Journal conserve un raisonnement, pas une recommandation.

### Maquette textuelle cible — état vide

```text
JOURNAL DE BORD

Une observation devient utile quand tu peux la relire.
Le Journal conserve ton raisonnement sur cet appareil.

[Illustration]

Tu n’as pas encore d’entrée.
Commence par décrire ce que tu observais, ce que tu pensais
et ce que tu as réellement fait.

[Nouvelle entrée]
[Depuis le Terminal]
```

### Maquette textuelle cible — formulaire

```text
NOUVELLE ENTRÉE · 1 / 3

AVANT

Marché ou instrument
[Ex. EUR/USD, Or, BRVM Composite…]

Contexte observé
[Qu’observais-tu avant de commencer ?]

Hypothèse de travail
[Quelle idée voulais-tu examiner ?]

[Continuer →]

Notice : écris une observation ou une hypothèse pédagogique,
pas une recommandation à transmettre à quelqu’un.
```

```text
PENDANT · 2 / 3

Méthode suivie
[Quelle checklist ou méthode as-tu appliquée ?]

Décision de processus
[Qu’as-tu réellement décidé de faire ou de ne pas faire ?]

[Retour] [Continuer →]
```

```text
APRÈS · 3 / 3

Ce qui s’est passé
[Décris l’issue sans inventer de gain ou de perte.]

Ce qui a été bien fait
[____________________________]

Ce qui doit être amélioré
[____________________________]

[Enregistrer l’entrée]
```

### Corrections UX

- Ajouter un exemple court au premier champ de chaque étape.
- Remplacer « résultat » seul par **« ce qui s’est passé »** pour éviter une lecture uniquement financière.
- Afficher un rappel de confidentialité et stockage local avant l’enregistrement.
- Après sauvegarde, afficher la source si l’entrée vient du Terminal : **« Reliée à M0.2 — Support & Résistance »**.
- Après sauvegarde, proposer deux actions : **« Voir mon entrée »** et **« Revenir à ma prochaine leçon »** ; une seule doit être primaire.

### Critères d’acceptation

- Le participant distingue observation, hypothèse, action de processus et résultat.
- Une entrée créée depuis le Terminal conserve la source pédagogique.
- Le formulaire est utilisable au clavier et sans débordement à 320 px.
- La notice ne prétend pas fournir une conservation serveur ou une confidentialité absolue.

## 9. Écran G — Membership / Premium : rendre la limite commerciale impossible à mal lire

**Surface :** `#membership`, `#premium-track`, `#premium-lab`, `#premium-assessment`  
**Objectif :** présenter la valeur pédagogique sans simuler un abonnement actif.

### Maquette textuelle cible

```text
ACCÈS DDA

DDA Free est disponible maintenant.
Premium est une démonstration locale de la prochaine profondeur pédagogique.

FREE · DISPONIBLE MAINTENANT
✓ M0 et fondations
✓ exercices, quiz et progression
✓ Journal & Plan local
[Continuer Free]

PREMIUM · APERÇU LOCAL
✓ P2 Risk & Discipline
✓ Risk Plan Lab
✓ Controlled Decision
✓ preuve locale et revue

Aucun paiement, abonnement ou renouvellement automatique n’est actif.
La démonstration reste sur cet appareil.
[Voir l’aperçu Premium]

[Comprendre la préparation commerciale →]
```

### Corrections UX

- Remplacer les formulations pouvant ressembler à une offre immédiatement achetable par **« Aperçu local »** dans le titre, le badge et le CTA.
- Ajouter au-dessus du premier écran Premium la phrase : **« Tu explores une démonstration pédagogique, pas un abonnement. »**
- Chaque livrable Premium doit afficher son statut : local, démonstration, futur ou serveur requis.
- Après Risk Plan Lab et Assessment, afficher la preuve produite et ses limites, puis un CTA vers le Journal.
- Éviter « certification » seul ; utiliser **« aperçu de certification — non officiel »**.
- La page `/launch/` devient le lien de référence pour le statut commercial et les prérequis de mise en vente.

### Critères d’acceptation

- Un utilisateur ne peut pas confondre l’aperçu local avec un achat.
- Le bouton Premium ne demande aucune carte bancaire et ne simule aucun checkout.
- Les preuves Premium sont séparées visuellement et sémantiquement des validations Free.
- Une expiration ou révocation serveur future pourra remplacer le statut local sans modifier le vocabulaire public.

## 10. Écran H — Support : orienter vers le bon canal

**Surface :** `#support` et footer Academy  
**Objectif :** éviter que le participant utilise un canal public pour une question personnelle.

### Maquette textuelle cible

```text
AIDE & SUPPORT

Quel type de question as-tu ?

[Je suis bloqué dans un parcours]
→ Décris l’écran, l’appareil, le navigateur et l’action attendue.
→ Écris à l’adresse officielle DDA.

[Je veux suivre les annonces]
→ Canal Telegram
→ Chaîne WhatsApp officielle

[Je veux comprendre Free ou Premium]
→ Lire la FAQ
→ Lire Pilote & préparation

Ne partage jamais de mot de passe, pièce d’identité, moyen de paiement
ou donnée financière dans un canal public.
```

### Corrections UX

- Organiser l’aide par intention plutôt que par liste de canaux.
- Garder l’e-mail comme canal primaire pour un accès individuel ou une progression.
- Garder Telegram et WhatsApp pour annonces et communauté.
- Transformer le formulaire local actuel en aide de préparation, pas en faux formulaire d’envoi.
- Ajouter des paramètres de diagnostic facultatifs : URL, appareil, navigateur, étape bloquée.

### Critères d’acceptation

- Le participant choisit le bon canal dans trois scénarios simples.
- Il comprend qu’aucun message n’est envoyé depuis un formulaire purement local.
- Les liens Telegram, WhatsApp, FAQ, Contact et `/launch/` fonctionnent depuis mobile.

## 11. Ordre d’implémentation recommandé

### Lot 2A — Compréhension immédiate

1. Accès / onboarding : microcopy et états d’erreur.
2. Leçon M0.1 : cycle comprendre → essayer → vérifier → continuer.
3. Progression : prochaine action visible.
4. Membership : statut Premium local au-dessus de la ligne de flottaison.

### Lot 2B — Boucle de preuve

5. Terminal : rappel synthétique / sans signal.
6. Journal : exemples de champs et source pédagogique.
7. Après-validation : résumés et CTA unique.

### Lot 2C — Confiance et support

8. Landing : résultat concret de Free.
9. Support : orientation par intention.
10. Tests mobile, clavier, zoom, reduced motion et retours arrière.

## 12. Contrat de non-régression UX

Chaque lot doit vérifier :

- landing → accès → onboarding → M0.1 ;
- exercice incorrect → feedback → retry ;
- exercice correct → quiz → validation ;
- Terminal → Journal → source ;
- progression → prochaine action → leçon ;
- Premium aperçu → Lab → Assessment → preuve → Journal ;
- accès local sans stockage → avertissement visible ;
- mobile 320, 360, 390, 412, 768 et 1440 px ;
- clavier, focus visible et `prefers-reduced-motion` ;
- aucun texte ne présentant paiement, vidéo, certification ou synchronisation comme actifs.

## 13. Instrumentation de validation

Ajouter ou conserver uniquement des événements minimisés et pseudonymes :

- `access_step_viewed` avec `step` ;
- `onboarding_help_opened` avec `field` ;
- `lesson_feedback_seen` avec `lessonId` et `result` ;
- `next_action_clicked` avec `sourceView` et `targetView` ;
- `journal_started` avec `source` ;
- `premium_status_notice_seen` ;
- `support_route_opened` avec `route`.

Ne jamais envoyer le contenu des champs Journal, les réponses détaillées, un e-mail ou un nom. Les données servent à localiser une friction, pas à évaluer une personne.

## 14. Définition de fini

La Phase 2 est prête à être considérée comme terminée lorsque :

- les spécifications ci-dessus sont implémentées sans changer le statut commercial réel ;
- chaque écran dispose d’un message d’état vide, erreur, succès et local ;
- chaque écran possède une prochaine action identifiable ;
- les parcours critiques passent les tests automatisés et un test humain sur mobile ;
- cinq participants au minimum peuvent parcourir Free sans aide sur les étapes P0 ;
- les retours de la seconde observation sont comparés aux retours initiaux ;
- toute évolution restante est classée en P1, P2 ou P3 avec une justification.

> **Décision de design :** DDA doit paraître plus clair avant de paraître plus grand. La Phase 2 privilégie la compréhension, la preuve et la confiance avant l’ajout de nouvelles promesses.
