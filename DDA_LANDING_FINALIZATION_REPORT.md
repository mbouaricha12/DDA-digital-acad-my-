# DDA — Rapport de finalisation de la landing

**Date :** 13 octobre 2026  
**Périmètre :** landing publique, navigation mobile, documents légaux, accessibilité et CI GitHub Pages.

## Corrections livrées

### Navigation publique

- Les liens d’ancre (`Accueil`, logo et rubriques) restent sur `index.html`.
- Défilement fluide vers les sections sans rechargement intempestif.
- Le menu burger se ferme automatiquement après sélection d’une rubrique.
- Le panneau mobile est opaque, avec contraste et espacement stabilisés.
- Le CTA `Commencer gratuitement` conserve le handoff vers `academy.html#access` via le flux existant.

### Documents légaux

Le footer ne contient plus de mentions « bientôt ». Quatre documents sont accessibles dans une modale native et réutilisable :

- Conditions générales d’utilisation ;
- Politique de confidentialité ;
- Gestion des cookies et du stockage local ;
- Mentions légales.

Les textes couvrent l’usage pédagogique, la conservation locale, la minimisation des données, l’absence de conseil financier/signal, les limites des scénarios synthétiques et la propriété intellectuelle.

**Point de conformité à traiter avant lancement commercial :** compléter l’identité juridique exacte de l’éditeur, l’adresse, l’immatriculation, le contact, le directeur de publication et l’hébergeur, puis faire relire les textes par un conseil compétent. Le site ne présente pas ces champs comme finalisés.

### Accessibilité et confiance

- Rails de leçons et outlines scrollables accessibles au clavier (`Tab`, flèches, `Home`, `End`).
- Focus visible renforcé.
- Feedbacks pédagogiques et état de sauvegarde annoncés par `role=status`, `aria-live` et `aria-atomic`.
- Contrastes renforcés sur les micro-libellés Dashboard/Terminal, Access et Premium.
- Respect de `prefers-reduced-motion` conservé.

## Fichiers concernés

- `dist/index.html`
- `dist/public.js`
- `dist/alpha-polish.css`
- `dist/academy.html`
- `dist/app.js`
- `dist/lesson-renderer.js`
- `tests/test_landing_launch_contract.js`
- `tests/test_accessibility_contract.js`
- `.github/workflows/pages.yml`

## Validation

- Contrats statiques : **PASS**.
- Contrat landing/légal : **PASS**.
- Contrat accessibilité : **PASS**.
- Syntaxe JavaScript : **PASS**.
- Structure HTML et doublons d’identifiants : **PASS**.
- `git diff --check` : **PASS**.
- Régression navigateur Playwright : **54/54, 0 échec**.

## CodeQL

Aucun binaire CodeQL ni workflow CodeQL n’est configuré dans ce dépôt au moment de la livraison. La validation exécutée couvre la syntaxe, les contrats métier, les frontières de surfaces, l’accessibilité ciblée et la régression navigateur. L’ajout de CodeQL peut constituer une étape DevSecOps séparée si l’équipe souhaite activer l’analyse statique GitHub.

## Publication

Le workflow `.github/workflows/pages.yml` exécute désormais les deux contrats landing/accessibilité avant le déploiement Pages. Le commit final sera poussé sur `main`; GitHub Pages déploiera automatiquement après passage du job `verify`.
