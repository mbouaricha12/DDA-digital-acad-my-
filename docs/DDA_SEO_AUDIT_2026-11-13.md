# DDA — Audit SEO public et préparation du lancement

**Date :** 13 novembre 2026  
**Branche :** `feat/seo-technical-editorial`  
**Périmètre :** pages publiques, indexabilité, métadonnées, sitemap/robots, données structurées, maillage d’acquisition et régression mobile.

## Décision

La tranche SEO est **KEEP / MODIFY**, sans refonte visuelle et sans modification des permissions pédagogiques. Les pages publiques corrigées sont prêtes pour revue et Pull Request. La fusion et le déploiement restent volontairement en attente d’approbation.

## Corrections réalisées

### Cohérence éditoriale

Le vocabulaire Free est maintenant cohérent : **M0 comprend trois fondations (M0.1 à M0.3)** et **M1 ajoute trois leçons (M1.1 à M1.3)**. La correction est appliquée sur l’accueil et `/launch/`. Aucun contenu pédagogique ni droit d’accès n’a été modifié.

### Métadonnées et indexabilité

Les pages publiques du contrat disposent désormais d’un `title` et d’une description distincts, d’un canonical absolu auto-référencé, d’un état `index, follow`, de balises Open Graph et Twitter Card, d’une locale `fr_FR`, d’une image OG absolue et d’un favicon relatif valide. L’image OG est contrôlée en **1200 × 630 px**.

La page privée `academy.html` conserve son statut `noindex, nofollow`. La page `/commencer/` conserve également son statut `noindex`, conformément à son rôle de surface d’acquisition contrôlée.

### Sitemap, robots et données structurées

Le sitemap ne référence que les pages publiques retenues. Les surfaces futures (`/live/`, `/business/`, `/experts/`, `/community/`, `/ai/`) restent explicitement indexables car elles existent et sont documentées ; leur maintien pourra être réévalué séparément après validation produit.

Les données structurées existantes restent limitées à des informations vérifiables : `Organization`, `WebSite`, `WebPage` et `Course` lorsque les données sont présentes. Aucun prix, avis, score, certification ou résultat financier fictif n’a été ajouté.

### Acquisition et maillage

La homepage conserve un CTA clair vers l’accès Free. Les pages institutionnelles et la page de lancement renvoient vers l’espace d’accès sans promettre de signaux de marché, de données BRVM vérifiées ou d’abonnement Premium actif.

## Fichiers touchés

- `dist/index.html`
- `dist/commencer/index.html`
- `dist/launch/index.html`
- `dist/about/index.html`
- `dist/accessibility/index.html`
- `dist/ai/index.html`
- `dist/business/index.html`
- `dist/community/index.html`
- `dist/contact/index.html`
- `dist/cookies/index.html`
- `dist/experts/index.html`
- `dist/faq/index.html`
- `dist/imprint/index.html`
- `dist/live/index.html`
- `dist/privacy/index.html`
- `dist/risks/index.html`
- `dist/terms/index.html`
- `dist/academy.html`
- `dist/images/dda-og-image.jpg`
- `dist/public-docs.js`
- `dist/public.js`
- `tests/test_public_seo_metadata_contract.js`

Le nouveau contrat vérifie les quinze pages publiques, l’unicité des titres et descriptions, les canonicals absolus, les métadonnées sociales, l’état d’indexation, la présence du favicon et les liens vers l’image OG.

## Validation exécutée

La validation ciblée du périmètre public est au vert :

- `tests/test_public_seo_metadata_contract.js` — **PASS, 15 pages**
- `tests/test_seo_sitemap_robots_contract.js` — **PASS**
- `tests/test_jsonld_structured_data_contract.js` — **PASS, 85 assertions**
- `tests/test_public_autonomous_pages.js` — **PASS**
- `tests/test_public_information_contract.js` — **PASS**
- `tests/test_landing_launch_contract.js` — **PASS**
- `tests/test_landing_structure_contract.js` — **PASS**
- `tests/test_commencer_route_contract.js` — **PASS**
- `tests/test_landing_acquisition_test_contract.js` — **PASS, 15 scénarios**
- Vérification syntaxique des scripts `dist/*.js` — **PASS**
- `git diff --check` — **PASS**
- Dimensions `dist/images/dda-og-image.jpg` — **1200 × 630**
- Contrôle ALT des images publiques examinées — **aucun manque détecté**

## Échec global préexistant à isoler

La suite complète `tests/test_*.js` ne peut pas être déclarée entièrement verte sur cette branche à cause de `tests/test_auth_reliability_e2e.js`, hors périmètre SEO. Le test présente plusieurs échecs `page.waitForFunction` car Playwright tente d’évaluer une expression sous une CSP qui interdit `unsafe-eval`, ainsi qu’un timeout de persistance de session. Les scénarios serveur et plusieurs parcours d’authentification passent néanmoins.

Cet échec ne doit pas être masqué ni corrigé dans la tranche SEO. Il mérite une tranche séparée : remplacer les attentes basées sur `waitForFunction` par des assertions Locator/URL compatibles CSP, puis isoler le scénario de refresh de session.

## KEEP / MODIFY / ADD / DEFER

**KEEP** : la structure SPA, les routes publiques existantes, le statut privé de l’Academy, les données structurées vérifiables, la gouvernance BRVM fail-closed et les CTA existants.

**MODIFY** : métadonnées uniques et absolues, cohérence M0/M1, image OG, descriptions de `/launch/`, et couverture contractuelle des pages publiques.

**ADD** : le contrat `tests/test_public_seo_metadata_contract.js` et ce rapport d’audit.

**DEFER** : vérification HTTP post-déploiement sur le domaine de production, audit Lighthouse distant avec réseau simulé, corrections du test d’authentification CSP, et toute décision d’indexation future pour les surfaces Live/Business/Experts/Community/AI.

## Étape suivante

Créer et faire relire la PR de cette branche. Après approbation, déployer sur GitHub Pages puis vérifier les réponses HTTP, les canonicals, les cartes sociales et `/commencer/` sur `https://dariusdigitalacademy.com`. Ne pas fusionner automatiquement tant que cette revue n’est pas obtenue.
