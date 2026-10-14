# DDA — Audit pré-lancement

**Date :** 14 octobre 2026  
**Branche auditée :** `fix/landing-production-legal-menu`  
**Commit audité :** `6363956d0afcd1518559fb16c53cf19daee9d378`  
**Pull Request :** [#101](https://github.com/mbouaricha12/DDA-digital-acad-my-/pull/101)

## Conclusion exécutive

Le **code de la branche candidate est validé techniquement**. La landing, les surfaces Academy, les routes, les contrats, le smoke test et la régression navigateur passent.

Le lancement public n'est toutefois **pas encore prêt côté production**, car GitHub Pages sert toujours `main` au commit `c02da3e...`, et non la branche candidate. Le site actuellement visible publiquement est donc en retard par rapport à la version auditée.

## Validation de la branche candidate

### Tests et contrats

- Syntaxe de tous les fichiers `dist/*.js` : **PASS**
- Contrats automatisés `tests/test_*.js` : **PASS**
- Vérification de cohérence routes / registre : **PASS**
- Smoke test de démarrage : **24 checks PASS**
- Régression navigateur : **54 passed, 0 failed**
- `git diff --check` : **PASS**
- État Git local : propre et synchronisé avec le remote

### Crawl navigateur responsive

Le crawl a couvert :

- landing publique : 1 vue × 4 largeurs ;
- Academy : 25 vues × 4 largeurs ;
- largeurs : 360, 390, 768 et 1440 px ;
- erreurs JavaScript de console ;
- erreurs de page ;
- ressources manquantes ;
- états 404 / page introuvable ;
- débordements horizontaux.

Résultat : **aucune erreur détectée**.

## Vérifications GitHub

Les checks de la PR #101 sont au vert :

- CodeQL : succès ;
- DDA E2E regression : succès ;
- Lesson Registry Check : succès ;
- M1.2 Order Execution Check : succès ;
- DDA Product Gate : succès ;
- Verify and deploy static site : succès ;
- 1 job ignoré conformément au workflow ;
- aucun check en échec ou en attente.

La PR reste bloquée uniquement par la règle GitHub d'approbation obligatoire.

## Écart de production constaté

Configuration Pages vérifiée :

- URL : https://mbouaricha12.github.io/DDA-digital-acad-my-/
- source : `main` / `/`
- dernier déploiement : commit `c02da3e...`
- HTTPS : activé

Le site public actuel contient encore des éléments absents de la branche candidate :

- `ABIDJAN · AFRIQUE FRANCOPHONE · MONDE` ;
- liens légaux affichés comme « bientôt » ;
- `Communauté — bientôt` ;
- `Devenir Expert — bientôt` ;
- ancienne version du footer et des surfaces légales.

Ce n'est pas une régression de la branche actuelle : c'est un **écart de déploiement**, car la PR #101 n'est pas encore fusionnée dans `main`.

## Décision de lancement

### État du code candidat

**GO technique conditionnel** : la branche est prête à être fusionnée.

### État du site public

**NO-GO avant fusion et redéploiement** : la version réellement accessible au public n'est pas la version validée.

## Séquence recommandée avant ouverture publique

1. Obtenir l'approbation obligatoire de la PR #101.
2. Fusionner la PR vers `main`.
3. Attendre le workflow GitHub Pages.
4. Vérifier que le déploiement cible le nouveau SHA.
5. Refaire le contrôle HTTP et navigateur sur l'URL publique.
6. Contrôler que les mentions « Abidjan », « bientôt » et les anciennes mentions légales ne sont plus servies.
7. Refaire un parcours public : landing → access → inscription → onboarding → M0.1.

> Tant que la PR n'est pas fusionnée, il ne faut pas présenter la landing actuellement publiée comme la version finale auditée.
