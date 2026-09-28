# DDA Academy — Revue UX Elite et navigation

**Date :** 28 septembre 2026
**Branche :** `feat/darius-analysis-terminal`
**Pull request :** [#94 — Darius Analysis Terminal Pro](https://github.com/mbouaricha12/DDA-digital-acad-my-/pull/94) — fusionnée dans `main` et publiée (état vérifié ci-dessous)
**Périmètre :** harmonisation visuelle globale, hiérarchie des espaces, raccourci Terminal et retour mobile.

## Résumé

La surcouche Elite applique un langage visuel plus cohérent et reposant : toile Deep Navy `#060d17`, panneaux bleu nuit à bordures fines, texte blanc/gris doux, or mesuré et bleu réservé aux actions. Les couleurs sémantiques des états pédagogiques et des parcours n’ont pas été remplacées.

La navigation a été clarifiée sans créer ni supprimer de route. Le Terminal reste un espace intégré au Dashboard, accessible depuis la sidebar desktop et depuis le lien « Explorer le Terminal ». Sur mobile, Retour/Avancer et le bouton Retour de l’application suivent maintenant l’historique interne des écrans.

**Aucun fichier BFF, Supabase, RLS, schéma de données ou secret n’a été modifié.** La PR #94 a depuis été fusionnée et déployée; les validations de production sont consignées dans l’addendum final.

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
- Le cache du shell PWA est passé à `dda-shell-v20` dans la tranche Elite initiale, puis à `dda-shell-v21` pour publier la couche Aurora (voir l’addendum ci-dessous).

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

## État de livraison à la rédaction initiale (avant fusion)

À cette étape de la revue, les changements étaient encore sur `feat/darius-analysis-terminal`, dans la PR #94 ouverte vers `main`. Les checks GitHub étaient alors **8 réussis, 1 ignoré, 0 en attente, échec ou annulation**. Cet état est historique et a été supersédé par le merge et le déploiement confirmés ci-dessous.


## Addendum — DDA Aurora (28 septembre 2026)

La référence BizNext a servi uniquement à préciser la qualité de lumière et la matière des surfaces. La composition et le vocabulaire restent propres à DDA : l’**Aperture** qui met en scène le Terminal et le Journal, les instruments pédagogiques du Terminal, et le **fil de maîtrise** qui n’émet un accent lumineux que sur les états de preuve réellement confirmés. Aucun template, texte, métrique ou identité BizNext n’est repris.

- **Portée :** surcouche CSS additive `dist/alpha-polish.css`, cache PWA `dda-shell-v21`, contrats visuels et Playwright. Aucune modification du BFF, Supabase, RLS, des permissions, du schéma local, des routes, des handlers métier ou des contenus de leçons.
- **Matière et lumière :** champ Deep Navy `#060d17` conservé sur les 26 vues; nappes/rayons bleu électrique statiques, verre fumé bleu-nuit, liserés fins, reflets d’instrument dans l’Aperture; CTAs d’action en dégradé bleu lumineux et or gardé pour les preuves/repères DDA.
- **Profondeur en usage :** mouvement lent du stage ordinateur/téléphone, reflet de bureau, entrée de route avec profondeur très légère et inclinaison discrète des cartes réellement interactives sur desktop.
- **Performance et ergonomie :** motion et reflet coupés en `prefers-reduced-motion`/`low-data`; transparence blur supprimée sur mobile afin de préserver les feuilles fixes et les cibles tactiles. Les fonds restent translucides et lisibles sans filtre coûteux.
- **Garde-fous fonctionnels :** courbes et données toujours pédagogiques/synthétiques, aucune statistique apprenant ni cotation inventée; routes, navigation et handoff Terminal → Journal inchangés.
- **Validation locale :** tous les contrats Node, syntaxe, cohérence des routes et `git diff --check` : **PASS**; Playwright : **53 réussis, 0 échec**, y compris l’onboarding mobile, reduced-motion, low-data, toutes les vues et le Terminal.
- **Inspection visuelle :** Accueil, Terminal, Parcours, Journal, Progression, Marchés et Profil capturés sur desktop et mobile; aucune erreur console, largeur de page conforme au viewport.

### Captures Aurora

- [Accueil — desktop](/home/ubuntu/dda-aurora-preview/aurora-landing-desktop.png) · [mobile](/home/ubuntu/dda-aurora-preview/aurora-landing-mobile.png)
- [Terminal — desktop](/home/ubuntu/dda-aurora-preview/aurora-dashboard-desktop.png) · [mobile](/home/ubuntu/dda-aurora-preview/aurora-dashboard-mobile.png)
- [Parcours — desktop](/home/ubuntu/dda-aurora-preview/aurora-path-desktop.png) · [mobile](/home/ubuntu/dda-aurora-preview/aurora-path-mobile.png)
- [Journal — mobile](/home/ubuntu/dda-aurora-preview/aurora-journal-mobile.png) · [Progression — mobile](/home/ubuntu/dda-aurora-preview/aurora-progress-mobile.png)
- [Marchés — desktop](/home/ubuntu/dda-aurora-preview/aurora-markets-desktop.png) · [Profil — mobile](/home/ubuntu/dda-aurora-preview/aurora-profile-mobile.png)

**État à la rédaction de cet addendum (avant l’approbation de publication) :** changements préparés sur `feat/darius-analysis-terminal`, PR #94 ouverte vers `main`; aucun merge ni déploiement n’avait encore été effectué.

## Mise à jour post-fusion et post-publication — 28 septembre 2026

- PR #94 fusionnée dans `main` au merge commit `cc3c96d9a4204948dc5fcc445da7b06ddf61b122`.
- Workflow [Verify and deploy static site to GitHub Pages](https://github.com/mbouaricha12/DDA-digital-acad-my-/actions/runs/36388831251) : vérification et déploiement réussis; les deux jobs `verify` et `deploy` sont verts.
- Site public : https://mbouaricha12.github.io/DDA-digital-acad-my-/ — le shell servi est `dda-shell-v21` et le token Aurora `#1887ff` est présent.
- Smoke test Chromium post-déploiement, avec état local de démonstration (sans session Supabase réelle) : Accueil, Dashboard/Terminal, Parcours, Journal, Progression, Marchés et Profil testés en desktop (1440 px) et mobile (390 px); aucune erreur console ni aucun débordement horizontal. Le CTA ouvre l’accès, Back/Forward revient bien aux vues précédentes, et un visiteur reste redirigé vers l’accès lorsqu’il demande une route protégée. Le socle backend/auth n’a pas été modifié ni certifié par ce test UI.
- Les anciens statuts « non fusionnée / non déployée » ci-dessus décrivent la situation avant l’approbation; cette mise à jour constitue l’état final.

Si un navigateur ou une PWA affiche encore l’ancien cache, fermer puis rouvrir l’application ou effectuer un rechargement forcé afin de laisser le service worker v21 s’activer.


## Addendum — Palette DDA pure et inspirante (v22, 28 septembre 2026)

**Direction chromatique :** le Deep Navy `#060d17` reste la toile stable; les accents gagnent en présence avec un cobalt Aurora `#2588ff`, un turquoise minéral `#39d6cf` et un or DDA plus pur `#f3c76c`. Les surfaces de verre fumé et les liserés prennent une nuance bleue plus lisible; les CTA passent du bleu lumineux vers le turquoise. Les couleurs sémantiques des bougies et des états pédagogiques ne changent pas.

- **Progression :** le visuel du bandeau conserve son voile de contraste et sa fonction d'arrière-plan, tout en passant de `saturate(.45) brightness(.68)` à `saturate(.68) brightness(.8)` pour laisser mieux percevoir sa matière et ses couleurs.
- **Journal :** le toolbar gagne `18px` de retrait intérieur; « Weekly Review » est harmonisé en « Revue hebdomadaire » dans le Journal, le parcours et la confirmation d'enregistrement.
- **Cache :** service worker `dda-shell-v22` afin de faire recharger les styles et libellés aux clients installés.
- **Préservation :** changements de présentation, de microcopie et de cache uniquement. Aucune modification des routes, des handlers métier, des données pédagogiques synthétiques, du BFF, de Supabase, de RLS ou des permissions.
- **Validation locale v22 :** syntaxe JS, cohérence du registre (23 routes / 38 entrées), contrats Node, `git diff --check` et Playwright complet : **53 réussis, 0 échec**. Les captures locales desktop/mobile montrent l'Accueil, le Terminal, le Journal et Progression sans erreur console ni débordement horizontal.

### Aperçus locaux de la palette v22

- [Accueil — desktop, 1440 px](/home/ubuntu/dda-live-check/candidate-v22-landing-desktop.png) · [mobile, 390 px](/home/ubuntu/dda-live-check/candidate-v22-landing-mobile.png)
- [Terminal — mobile, 390 px](/home/ubuntu/dda-live-check/candidate-v22-terminal-mobile.png)
- [Journal — mobile, 390 px](/home/ubuntu/dda-live-check/candidate-v22-journal-mobile.png)
- [Progression — mobile, 390 px](/home/ubuntu/dda-live-check/candidate-v22-progress-mobile.png)

**État à cette étape :** validation locale terminée; la version publique est toujours v21 jusqu'à la publication du suivi v22. L'addendum de production sera complété après le smoke test public.
