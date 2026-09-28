# DDA Academy — Revue UX Elite et navigation

**Date :** 28 septembre 2026
**Branche :** `feat/darius-analysis-terminal`
**Pull request :** [#94 — Darius Analysis Terminal Pro](https://github.com/mbouaricha12/DDA-digital-acad-my-/pull/94) — ouverte, non fusionnée
**Périmètre :** harmonisation visuelle globale, hiérarchie des espaces, raccourci Terminal et retour mobile.

## Résumé

La surcouche Elite applique un langage visuel plus cohérent et reposant : toile Deep Navy `#060d17`, panneaux bleu nuit à bordures fines, texte blanc/gris doux, or mesuré et bleu réservé aux actions. Les couleurs sémantiques des états pédagogiques et des parcours n’ont pas été remplacées.

La navigation a été clarifiée sans créer ni supprimer de route. Le Terminal reste un espace intégré au Dashboard, accessible depuis la sidebar desktop et depuis le lien « Explorer le Terminal ». Sur mobile, Retour/Avancer et le bouton Retour de l’application suivent maintenant l’historique interne des écrans.

**Aucun fichier BFF, Supabase, RLS, schéma de données ou secret n’a été modifié.** Aucun déploiement ni fusion de la PR n’a été effectué.

## Hiérarchie produit appliquée

| Espace de navigation | Contenu conservé | Intention |
| --- | --- | --- |
| **Apprendre** | Aujourd’hui, Mon parcours, Leçon en cours | Comprendre la prochaine étape pédagogique. |
| **Pratiquer** | Terminal d’analyse, Pratique avancée | Séparer l’apprentissage de l’expérimentation guidée. |
| **Mon travail** | Progression, Journal | Regrouper les preuves réellement acquises et leur documentation. |
| **Explorer** | Communauté, Intelligence DDA, Ressources, Marchés & BRVM, Broker Hub | Présenter les espaces de découverte sans les confondre avec le curriculum. |
| **Compte** | Premium, Support, Profil | Garder les fonctions de compte et d’assistance dans un groupe distinct. |

Le **Journal** reste l’espace de travail. Son onglet **Mon plan** reste une action du Journal, pas une destination principale concurrente. Les intitulés visibles « Journal & Plan » redondants ont été normalisés dans le handoff Terminal, Market Intelligence, le Journal et Pratique avancée.

Le raccourci Terminal utilise l’ancre `#analysis-terminal` à l’intérieur de `#dashboard` : il ne contourne aucun contrôle d’accès et n’introduit pas une nouvelle route métier.

## Changements visuels principaux

### Système global

- Harmonisation des vues et des familles de composants : cartes, formulaires, filtres, états, panneaux de support, profils, ressources et vues premium.
- Champs et contrôles conservent un contraste lisible sur les surfaces sombres ; focus clavier, états actifs et adaptation tactile restent pris en charge.
- Les notes « compétences plus loin » de Parcours/Progression ne réintroduisent plus le fond crème historique.
- Les formulaires et panneaux conservent leurs contenus, identifiants, handlers et protections existants.

### Accueil et mockup produit

- Le slogan décoratif redondant a été retiré du mockup afin de laisser respirer la composition ordinateur + smartphone.
- La scène de produit reste illustrative ; elle ne simule pas un flux de cotations réelles.
- Un héritage CSS appliquait par erreur la taille du titre du hero au libellé `BRVM Composite` dans l’écran d’ordinateur. Il est corrigé explicitement : la typographie du mockup revient à **8 px**, contre **76,8 px** calculés auparavant à 1440 px.
- À 1440 px, le bloc éditorial et la maquette ne se chevauchent pas. À 390 px, le contenu reste dans la largeur de l’écran ; la maquette commence sous le premier pli sans recouvrir le texte ou les actions.

### Terminal d’analyse

- Toolbar à icônes SVG fines regroupant crosshair, zones S/R, tendance et Fibonacci ; commandes de zoom, déplacement et édition réunies dans un dock compact.
- Le comportement des bougies synthétiques, annotations, outil tactile et handoff Journal reste celui de la PR #94.
- Mesures du rendu à 1440 px : graphique **964 × 460 px**. À 390 px : **328 × 281 px**, sans débordement horizontal. Les quatre commandes de tracé occupent chacune **76 px** en largeur dans le dock mobile.
- Le handoff reste dans le Journal existant et conserve l’hypothèse saisie ainsi que les métadonnées pédagogiques prévues par le contrat.

### Progression et palette reposante

- L’image du bandeau Progression conserve sa texture, mais sa saturation est ramenée à `0.45`, sa luminosité à `0.68`, puis renforcée par un voile navy.
- Le panneau de contexte des compétences futures utilise maintenant une surface `rgba(10, 20, 36, .78)` au lieu du beige historique.
- Les couleurs de bougies haussières/baissières et les statuts pédagogiques restent distincts pour préserver leur sens.

## Navigation et préservation du socle

- La navigation navigateur s’appuie sur History API (`pushState`, `popstate`, hash) et continue de prendre en charge les liens profonds.
- Sur mobile, **Retour**, **Avancer** et le bouton Retour interne reviennent aux vues DDA précédentes au lieu de quitter le document.
- Le raccourci desktop et le lien mobile amènent au graphique en faisant défiler le Dashboard, sans nouvelle route.
- Routes, gardes d’accès, stockage local, logique des leçons, permissions et handoffs existants sont conservés.
- Aucun chiffre de confiance, statistique apprenant ou cotation n’a été fabriqué. Les instruments et mini-courbes de démonstration restent identifiés comme pédagogiques/synthétiques.
- Le cache du shell PWA est passé à `dda-shell-v20` pour publier ensemble le HTML, la feuille Elite et le routeur actualisés.

## Validation effectuée

- Tous les tests de contrat Node `tests/test_*.js` ont réussi.
- `tests/verify_route_register_consistency.js` : **PASS**, 23 routes parsées et 38 entrées du registre.
- `node --check` sur le routeur, le runner E2E et le service worker : **PASS**.
- `git diff --check` : **PASS**.
- Suite Playwright complète : **52 réussis, 0 échec**, incluant historique mobile, raccourci desktop/mobile, garde d’accès Marchés, surfaces sombres des vues et contrôles tactiles aux largeurs 360, 390 et 1440 px.
- Captures visuelles desktop et mobile inspectées pour l’Accueil, le Terminal, le Journal et Progression, dont la note dynamique des compétences futures.

## Aperçus visuels

- [Accueil — desktop, 1440 px](/home/ubuntu/dda-elite-preview/landing-desktop.png)
- [Accueil — mobile, 390 px](/home/ubuntu/dda-elite-preview/landing-mobile.png)
- [Terminal — desktop, 1440 px](/home/ubuntu/dda-elite-preview/terminal-desktop.png)
- [Terminal — mobile, 390 px](/home/ubuntu/dda-elite-preview/terminal-mobile.png)
- [Journal — mobile, 390 px](/home/ubuntu/dda-elite-preview/journal-mobile.png)
- [Progression — mobile, 390 px](/home/ubuntu/dda-elite-preview/progress-mobile.png)
- [Progression — panneau de compétences, 390 px](/home/ubuntu/dda-elite-preview/progress-context-mobile.png)

## État de livraison

Les changements restent sur `feat/darius-analysis-terminal` dans la PR #94 ouverte vers `main`. La branche n’est ni fusionnée ni déployée. Les checks GitHub du code livré ont été vérifiés après la mise à jour de la PR : **8 réussis, 1 ignoré, 0 en attente, échec ou annulation**.
