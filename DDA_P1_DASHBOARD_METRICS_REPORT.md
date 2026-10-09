# DDA — Rapport P1 Dashboard & métriques

**Date :** 9 octobre 2026  
**Périmètre :** corrections locales, sans modification d’architecture, de backend ou de permissions.

## Corrections réalisées

### 1. XP initial

**Avant :** le Dashboard utilisait `DDALearning.totalXp(...) || 20`, ce qui affichait `+20 XP` pour un nouvel apprenant sans preuve enregistrée.

**Après :** le Dashboard utilise uniquement `DDALearning.totalXp(...)`. Un nouvel apprenant commence donc à `0 XP` ; les points apparaissent uniquement après les jalons réels du curriculum.

Le libellé est devenu **« XP total »** afin de ne pas faire croire à une fenêtre hebdomadaire qui n’existait pas.

### 2. Activité

**Avant :** `countActiveDays()` comptait toutes les dates d’événements, y compris les simples ouvertures de vues et les événements de navigation.

**Après :** le compteur :

- utilise une fenêtre glissante stricte de **7 jours** ;
- ignore `view_opened`, les visites landing, les préférences, les aperçus et les changements de navigation ;
- retient uniquement les actions pédagogiques : leçon comprise, exercice/quiz terminé, tentative Practice, entrée ou plan Journal enregistré, et étapes Premium réellement pratiquées ;
- exclut les dates invalides et les événements futurs.

Les libellés Dashboard, Progression et Profil indiquent désormais explicitement **« Activité (7 j) »** ou **« Jours actifs (7 j) »**.

### 3. Practice Terminal

La validation ou tentative de la mission Practice émet maintenant `practice_attempted`, événement autorisé et filtré par le noyau DDA. Elle peut donc alimenter l’activité uniquement lorsqu’une action de pratique réelle est effectuée.

## Fichiers modifiés

- `dist/app.js`
  - suppression du fallback XP `|| 20` ;
  - ajout de l’allowlist d’actions pédagogiques ;
  - fenêtre glissante de 7 jours ;
  - émission de `practice_attempted`.
- `dist/academy.html`
  - affichage initial `0 XP` ;
  - libellés métriques clarifiés.
- `dist/dda-core.js`
  - allowlist de l’événement `practice_attempted` ;
  - métadonnées `practice` et `status` filtrées par le sanitizer.
- `tests/test_dashboard_metrics_contract.js`
  - contrat de non-régression XP / activité / Practice.

## Validation

- Contrat P1 Dashboard : **PASS**
- Tous les contrats `tests/test_*.js` : **PASS**
- Syntaxe de tous les scripts `dist/*.js` : **PASS**
- IDs HTML de `academy.html` : **uniques**
- `git diff --check` : **PASS**
- Suite E2E `node tests/run.js` : **54 scénarios réussis, 0 échec** avec Chromium Playwright temporaire. Le dépôt contient actuellement 54 scénarios actifs, et non 58.

## Étape suivante proposée

Traiter les points WCAG et contrastes en tranche dédiée :

1. audit clavier et focus visible sur chaque surface ;
2. vérification des contrastes texte / arrière-plan ;
3. labels et annonces `aria-live` des feedbacks pédagogiques ;
4. cibles tactiles mobiles ;
5. test réduit-motion et navigation sans souris ;
6. contrat automatisé pour empêcher les régressions d’accessibilité.
