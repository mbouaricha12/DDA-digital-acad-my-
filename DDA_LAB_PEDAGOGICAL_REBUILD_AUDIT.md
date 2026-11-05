# DDA LAB — Audit pédagogique et plan de refonte
Date : 5 novembre 2026
Base auditée : main / 36d213a122754e1530cde5377e7ee1edc9dbd72d
Branche de travail : feat/dda-lab-pedagogical-rebuild

## Diagnostic exécutif

Le Lab existe techniquement et possède un parcours structuré (LAB1 à LAB4 + capstone), mais son expérience est trop proche d'une leçon statique suivie de QCM. Le problème principal n'est pas le nombre d'écrans : c'est le manque de pratique authentique, de décisions successives, de conséquences visibles et de production personnelle.

Le Lab actuel est un parcours « IA pour agir » (fondamentaux d'IA générative), et non un laboratoire de trading. Cette distinction doit être assumée dans la navigation et la promesse du produit : ne pas mélanger les objectifs d'apprentissage IA et marchés financiers.

## Constat vérifiable dans dist/dda-lab.js

- Chaque LAB1–LAB4 suit quasiment la même séquence : competency_check → text_short → case_study → scenario → decision_choice → quiz exercice → quiz de validation → summary.
- Les deux étapes « Essayer » et « Vérifier » sont principalement des choix de réponses statiques. L'apprenant sélectionne une option, lit un feedback, puis passe à la suite.
- LAB1 répète la même compétence de fiabilité dans plusieurs questions (numéro officiel, prix taxi, faits précis/date).
- LAB2 répète le principe de prompt clair dans plusieurs scénarios (planning de révision, relance client, prompt vague).
- LAB3 répète le contrôle/relecture (date erronée, ton scolaire, ton professionnel).
- LAB4 répète le caractère répétitif de l'automatisation et ses limites (formulaire/tableau, tâches répétitives).
- Le capstone demande un livrable réel, mais la preuve reste une auto-déclaration par QCM/grille : le système ne recueille pas le livrable ni les étapes de travail.
- Le renderer (dist/lesson-renderer.js) dispose de blocs génériques (text_short, case_study, scenario, decision_choice, quiz, summary, etc.) et l'app.js porte les interactions. Le contenu peut évoluer sans casser le moteur, mais une véritable simulation nécessite un composant interactif et des tests de contrat associés.

## Ce qui doit changer

### 1. Passer d'un « cours + quiz » à une mission guidée

Chaque activité doit comporter :
1. une situation crédible et contextualisée (Afrique francophone, téléphone, petite activité, étude ou travail) ;
2. un objectif observable et une consigne courte ;
3. une action réelle de l'apprenant (choisir, classer, reformuler, vérifier, construire, ordonner) ;
4. un résultat/conséquence immédiatement visible ;
5. un feedback expliquant le raisonnement et la prochaine correction ;
6. une trace de progression ou une preuve (choix, réponse construite, checklist ou livrable).

### 2. Réduire les répétitions

- Une compétence = un concept, un exemple fort, une pratique principale et une évaluation différente.
- Ne pas demander trois fois de reconnaître la même bonne réponse sous des formulations proches.
- L'évaluation finale doit transférer la compétence vers un nouveau cas, pas répéter le cas d'exercice.
- Les feedbacks doivent expliquer le « pourquoi », le risque ou l'effet de la décision, et non seulement confirmer « exact ».

### 3. Concevoir un vrai pilote interactif avant de généraliser

Créer une mission pilote « Atelier de prompt » :
- l'apprenant reçoit un brief incomplet ;
- il choisit/ajoute les éléments manquants (contexte, tâche, format, contraintes) ;
- il compare un résultat vague et un résultat structuré ;
- il corrige une réponse selon un critère précis ;
- il valide avec une grille courte ;
- il conserve une trace de sa démarche.

Le pilote doit fonctionner au clavier et sur mobile, avoir des états (départ, action, feedback, réussite), ne pas dépendre d'une API payante, et être testable avec Playwright.

### 4. Architecture pédagogique à garder cohérente

- Academy : enseigne les notions.
- Lab : fait pratiquer et expérimenter les décisions.
- Practice Terminal : permet de manipuler dans un environnement simulé.
- Journal : recueille le raisonnement et les observations.
- Progression : montre une compétence démontrée, pas uniquement des clics ou XP.

Ne pas transformer le Lab en simulateur de prédiction ni en outil de signal. Pour les contenus de marchés financiers, toutes les données de simulation doivent être clairement indiquées comme fictives/pédagogiques.

## Plan de réalisation (progressif, sans retarder le lancement)

- [ ] Phase A — audit de chaque bloc et matrice compétence / répétition / pratique / preuve.
- [ ] Phase B — définir une norme de mission (brief, action, feedback, conséquence, preuve).
- [ ] Phase C — réaliser un pilote interactif complet et son test mobile/accessibilité.
- [ ] Phase D — réécrire LAB1–LAB3 Free en missions distinctes, avec un cas nouveau à chaque évaluation.
- [ ] Phase E — réserver LAB4 + capstone Premium à une production plus ambitieuse, sans surpromesse de correction serveur.
- [ ] Phase F — vérifier les parcours, les états de progression, les prérequis, les erreurs et les tests Playwright.

## Critères d'acceptation

- Aucun module ne se réduit à une succession de QCM.
- Chaque LAB Free contient au moins une action de construction/manipulation, pas seulement un choix de réponse.
- L'exercice et l'évaluation finale testent deux contextes différents.
- Le feedback donne une explication causale et une action corrective.
- L'apprenant comprend ce qu'il a acquis et ce qu'il doit encore pratiquer.
- Les contenus IA restent pédagogiques : aucune promesse de résultat, aucune génération de décision sensible sans vérification.
- Les fonctionnalités existantes, les routes, les prérequis, les règles Free/Premium et la progression sont préservés.
- Tests de contrat et Playwright passent ; responsive 360/390/1440 vérifié.

## Première priorité

Ne pas refondre visuellement tout le Lab avant d'avoir amélioré sa valeur pédagogique. Construire une seule mission pilote de qualité, valider l'expérience, puis appliquer le standard aux autres modules.
