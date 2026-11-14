# DDA Lab — Note de validation staging

**Date :** 13 novembre 2026
**Périmètre :** DDA Lab (LAB1–LAB3 Free, LAB4 + Capstone Premium)
**Nature :** note de validation technique, aucune activation commerciale ni déploiement production induit.

## 1. Objet

Cette note documente l'état réel de DDA Lab après audit et renforcement des tests, en vue de sa validation sur un environnement de staging. Elle ne remplace pas une recette fonctionnelle humaine ; elle liste ce qui est prouvé par le code et les tests, et ce qui reste à vérifier manuellement avant une éventuelle mise en avant du Lab.

## 2. État constaté

### LAB1–LAB3 (Free)

- Contenu intégralement authored dans `dist/dda-lab.js` (littéral de données pur, même moteur de rendu que le curriculum principal M0/M1).
- Chaîne de prérequis linéaire : LAB1 → LAB2 → LAB3, déverrouillage à `quizComplete`.
- Chaque leçon suit les 4 étapes honnêtes (Comprendre/Essayer/Vérifier/Continuer), avec un exercice réel qui gate le quiz verrouillé.
- Un écart fonctionnel était présent (le bloc `decision_choice` "À toi de juger/choisir" n'était jamais lié à `bindQuestion`, donc aucun clic n'y déclenchait de validation) — déjà corrigé (Lot F, visible dans les commentaires `app.js`), confirmé par la suite de tests.

### LAB4 + Capstone (Premium)

- Contenu réel jamais exposé publiquement : seules des métadonnées vides vivent dans `dist/dda-lab.js` ; le vrai contenu (`bff/src/premium-content.js`) n'est servi que via `GET /v1/premium/content/:id`, derrière la même garde `hasActivePremium()` que l'aperçu Premium.
- Un apprenant Free qui ouvre directement `#lesson-lab4` est redirigé avant tout montage de contenu authored — jamais de fuite, jamais de contenu factice affiché à la place.
- Sans serveur (mode local/pilote), LAB4 affiche l'état honnête « indisponible » plutôt qu'un contenu vide ou un faux contenu.
- Le Capstone (LABCAP) ne prétend jamais à une notation serveur : c'est une auto-vérification contre une grille explicite, assumée comme telle dans le texte de résultat.

## 3. Travail effectué dans ce lot

- Audit du registre `LAB_REGISTRY` (`dist/app.js`), du contenu authored (`dist/dda-lab.js`) et du contenu Premium serveur (`bff/src/premium-content.js`) : aucune anomalie concrète trouvée au-delà de ce qui était déjà documenté et corrigé.
- Gap de test identifié et corrigé : le Capstone (LABCAP) n'avait **aucune** couverture Playwright d'interaction (montage, clic du quiz d'auto-vérification, statut catalogue) — seule sa structure de données était contractuellement testée. Ajouté : test de bout en bout du Capstone en mode BFF (fetch réel, complétion, statut « Terminé » dans le catalogue).
- Gap de test identifié et corrigé : LAB4/LABCAP n'avaient aucune vérification de débordement horizontal mobile une fois leur vrai contenu Premium chargé depuis le BFF (contrairement à toutes les autres surfaces Premium). Ajouté : test à 360px et 390px.
- Suite complète exécutée après ajout : `tests/test_*.js` (tous PASS), `tests/verify_route_register_consistency.js` (PASS), `tests/run.js` — **128 passed, 0 failed**.

## 4. Preuves conservées

- `tests/test_dda_lab_contract.js` — 16 contrôles de contrat de contenu (PASS).
- `tests/run.js`, section N « DDA Lab — catalogue, parcours et verrou Premium » — 8 scénarios Playwright réels (chargement à la demande, parcours Free LAB1→LAB2, gate Free sur LAB4, statut séquentiel Premium, fetch+montage BFF pour LAB4, fetch+montage+complétion BFF pour LABCAP, non-débordement mobile 360/390px).
- Commit `fc5a353` sur `claude/dda-baseline-inspection-2huthf` (tests ajoutés, aucune modification de contenu ni de logique de gating).

## 5. Ce qui reste à vérifier manuellement avant mise en avant

Ces points ne peuvent pas être prouvés par la suite automatisée seule :

1. **Expérience tactile réelle** sur un appareil physique (pas seulement un viewport simulé) pour LAB1–Capstone : défilement, taille des zones de clic, lisibilité des blocs `scenario`/`case_study`.
2. **Temps de chargement réel** de LAB4/LABCAP sur un BFF de staging réel (latence réseau réelle, pas une route mockée instantanée).
3. **Cohérence du statut Premium réel** : ce lot ne touche pas Chariow ni l'entitlement serveur — la validation suppose qu'un compte Premium réel confirmé serveur se comporte comme les mocks `premium_preview`/`premium/content` utilisés ici.
4. **Relecture éditoriale humaine** du contenu LAB1–Capstone (ton, exactitude pédagogique) — hors du périmètre technique de cet audit.

## 6. Conclusion

DDA Lab (Free et Premium) est techniquement stable et sans anomalie concrète trouvée au-delà de ce qui était déjà corrigé. Le seul changement apporté par ce lot est l'ajout de tests manquants, sans modification de contenu, de logique de gating ni de comportement visible. Le Lab peut être proposé pour une recette humaine sur staging ; aucune déclaration de disponibilité commerciale n'est faite ici, et aucune activation production n'a été effectuée.
