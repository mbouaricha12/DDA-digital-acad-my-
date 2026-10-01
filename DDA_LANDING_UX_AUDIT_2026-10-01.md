# DDA Academy — Audit UX de la landing publique

**Date :** 1 octobre 2026  
**Périmètre :** première tranche du cycle UI/UX — landing uniquement.  
**Base examinée :** `main` à `4c91c169c89d1310e319d65de79f`; correctif fusionné à `b3c0989209d4b8815ec4673414b17b36cf5b6809`.
**Site public :** https://mbouaricha12.github.io/DDA-digital-acad-my-/  
**Déploiement du correctif :** [GitHub Actions — run 36814527869](https://github.com/mbouaricha12/DDA-digital-acad-my-/actions/runs/36814527869), `verify` et `deploy` terminés avec succès.
**PR :** [#96](https://github.com/mbouaricha12/DDA-digital-acad-my-/pull/96), fusionnée après validation; commit de branche `199eddfe3986ee8a50ac58cf77b0b84283720b3d`.

## Synthèse

La landing est désormais une surface publique autonome, distincte de `academy.html`. Son rôle est clair : expliquer l’approche, montrer les parties réellement présentes de DDA Free, signaler les éléments futurs et conduire vers l’accès sans contourner les routes de l’application. La séquence éditoriale et la direction Deep Navy/cobalt/turquoise/or sont cohérentes avec l’identité actuelle.

Un défaut mobile vérifiable a été corrigé et déployé : la CTA persistante vérifiait uniquement l’intersection avec la quatrième carte DDA Free. Elle pouvait donc recouvrir du texte dans une autre section. La garde calcule maintenant l’intersection de la CTA avec les éléments textuels/actions visibles de la landing et la masque uniquement pendant le recouvrement; elle redevient visible dans les plages de lecture dégagées.

## Revue des cinq axes

| Axe | Constat sur la base auditée | État de la tranche |
|---|---|---|
| **Hero** | Promesse compréhensible, titre français dominant, action gratuite principale et action secondaire vers la méthode. L’Aperture présente des écrans explicitement pédagogiques/synthétiques; elle n’invente pas de cotation réelle. La photo et le mockup donnent une preuve visuelle sans remplacer le message. | Aucun changement de composition/copie nécessaire pour corriger le défaut rencontré. |
| **Storytelling et rythme** | Ordre observé : différenciation « Pas de signal ici » → méthode Discover/Learn/Practice/Analyze/Improve → produit → preuve et feedback → offre Free → domaines → vision future → garde-fous de confiance → CTA final. Premium, Experts et IA sont explicitement futurs. Le contenu mobile est long (environ 11,6–12,3 kpx selon la largeur), mais ses sections restent identifiables et les reveals se déclenchent au scroll naturel. | Conservé; le travail de compression éditoriale, s’il est souhaité, restera une décision séparée. |
| **CTA** | Il existe une CTA principale au hero, des CTA contextuelles dans le parcours éditorial et une barre persistante sur mobile après le premier scroll. L’ancienne garde ne contrôlait que la dernière carte Free. | **Corrigé et déployé** : masquage basé sur le recouvrement réel avec le texte/action; CTA visible hors zone de recouvrement. La cible tactile reste ≥ 44 px. |
| **Images** | Photo hero chargée en eager; photo institutionnelle chargée en lazy. Les deux assets sont locaux et se chargent après un parcours de scroll. L’aperçu produit reste indiqué comme pédagogique; aucun asset externe n’a été ajouté. | Aucun asset ajouté ou remplacé dans cette tranche. |
| **Mobile** | Contrôle Chromium à 360, 390 et 414 px : largeur de document égale au viewport, pas d’overflow horizontal. Le layout de la landing garde ses gutters et son padding bas. La CTA s’efface devant un titre de section et apparaît dans une plage dégagée. | Le défaut de recouvrement est verrouillé par le test E2E sur les trois largeurs. |

## Identité, animation et navigation — observations sans extension de périmètre

- Le canvas Deep Navy `#060d17` et les accents cobalt/turquoise/or restent lisibles et cohérents avec la couche visuelle déployée.
- La navigation publique utilise des ancres de landing. Les CTA d’accès sont les sorties explicites vers l’app; les destinations futures ne simulent pas des fonctionnalités construites.
- Les reveals tiennent compte de `prefers-reduced-motion`; le parcours d’expérience fait aussi tourner son état toutes les 2,6 secondes quand le mouvement réduit n’est pas demandé. La rotation n’a pas été modifiée dans cette tranche; une éventuelle pause/focalisation relève de la prochaine revue des micro-interactions.
- Aucun changement de route, droit, contenu pédagogique, acquisition, backend, Supabase, BFF, paiement, données de marché ou logique métier n’a été effectué.

## Validation locale et post-déploiement

- `node tests/run.js` : **54 réussis, 0 échec**; le nouveau scénario cible 15 éléments rédactionnels/actionnables sur chacun des viewports 360, 390 et 414 px.
- Contrats Node et vérification du registre de routes : **34 fichiers réussis**.
- `tests/smoke_app_boot.js` avec la dépendance jsdom déjà disponible hors dépôt : **24 contrôles réussis**.
- `node --check dist/public.js`, `node --check tests/run.js` et `git diff --check` : **PASS**.
- Revue Chromium, scroll complet à 390 et 1440 px : **0 overflow horizontal, 0 erreur JavaScript, 0 élément reveal restant masqué**; photo hero et photo institutionnelle chargées.
- Contrôle du CTA à 360/390/414 px : la CTA est visible dans l’intervalle dégagé (lorsqu’il existe à la hauteur considérée) et disparaît devant le contenu testé.
- Smoke sur le site public à 390×844 : CTA visible à la première position sûre rencontrée (`scrollY=560`), puis masquée sur un titre DDA Free; largeur du document 390 px et 0 erreur JS. `index.html`, `public.js` et CSS servis en HTTP 200; le JS déployé contient le filtre global.

## Prochaine tranche — non démarrée

La prochaine revue proposée traite **l’identité DDA** (palette, typographie, composants, iconographie et cohérence) à partir des observations de la landing. Elle n’est pas démarrée ici; pages internes, animations et vision produit restent hors de la tranche livrée.
