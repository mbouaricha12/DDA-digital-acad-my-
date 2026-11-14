# DDA — Plan de couverture vidéo du curriculum (9 leçons)

**Date :** 13 novembre 2026
**Nature :** préparation uniquement. Aucun ID YouTube n'est fabriqué dans ce document ; les deux vidéos déjà en place sont les seules réellement vérifiées (`dist/app.js` `VIDEO_REGISTRY`, publiées sur la chaîne DDA).

## 1. Tableau des 9 leçons

| Leçon | Titre affiché | Statut vidéo | Vidéo liée aujourd'hui |
|---|---|---|---|
| M0.1 | Leçon en cours (fondations) | Aucune vidéo | — |
| M0.2 | Support & Résistance | **Vidéo réelle en place** | `VID-SUPPORTS-RESISTANCES` |
| M0.3 | Lire une tendance | **Vidéo réelle en place** | `VID-MOYENNES-MOBILES` |
| M1.1 | Pourquoi les prix évoluent ? | Aucune vidéo | — |
| M1.2 | Comment les ordres s'exécutent ? | Aucune vidéo | — |
| M1.3 | Comment les marchés s'organisent ? | Aucune vidéo | — |
| MBRVM.1 | Introduction à la BRVM | Aucune vidéo | — |
| P2.1 | Le risque avant l'entrée (Premium) | Aucune vidéo | — |
| P2.2 | L'anatomie d'un trade contrôlé (Premium) | Aucune vidéo | — |

**2/9 couvertes**, conforme au constat de l'audit du 10 novembre.

### Vidéos déjà publiées mais non rattachées à une leçon

Le catalogue `VIDEO_REGISTRY` contient 6 vidéos supplémentaires, déjà publiées et visibles dans Ressources, mais sans correspondance thématique directe avec une leçon du curriculum actuel : `VID-INDICATEURS`, `VID-VOLATILITE-FOREX`, `VID-CRYPTOMONNAIES`, `VID-TYPES-DE-TRADERS`, `VID-BOUGIES-JAPONAISES`, `VID-MARCHE-DES-DEVISES`. Elles restent disponibles en l'état dans Ressources ; les rattacher à une leçon nécessiterait soit une leçon dont le sujet correspond vraiment, soit de les laisser dans Ressources sans forcer une correspondance artificielle.

## 2. Format vidéo recommandé

Les 2 vidéos déjà en place suivent un format cohérent, à reproduire pour la suite plutôt que d'en introduire un nouveau :

- **Format source :** YouTube Shorts (vertical, courte durée) — cohérent avec un public mobile-first et le lecteur « lite » déjà construit (`dist/lesson-renderer.js` `renderYouTubeLite`/`getYouTubeId`, qui n'accepte que `youtube.com`, `youtu.be` et `youtube-nocookie.com`).
- **Lecture :** pas d'autoplay, pas de script YouTube chargé avant clic — seule une miniature statique + bouton play, puis un `<iframe>` `youtube-nocookie.com` au clic (respect CSP `frame-src https://www.youtube-nocookie.com` déjà en place dans `academy.html`). Toute nouvelle vidéo doit respecter cette contrainte technique, pas en ajouter une nouvelle (pas de lecteur tiers, pas d'autoplay).
- **Durée cible :** courte (format Shorts, quelques dizaines de secondes), pour rester un complément à la leçon écrite plutôt qu'une substitution — la leçon textuelle reste la source de vérité pédagogique.
- **Langue/ton :** français, débutant, même registre que les deux vidéos déjà en place (`level: 'débutant'`).
- **Hébergement :** chaîne YouTube publique DDA existante (`video_visibility: 'public_youtube'`) — pas de nouvel hébergeur.

## 3. Emplacements exacts d'intégration dans le code

Pour chaque nouvelle leçon vidéo :

1. **Ajouter l'entrée dans `VIDEO_REGISTRY`** (`dist/app.js`, juste après la déclaration `const VIDEO_REGISTRY = Object.freeze([...])`, ligne ~174) avec `id`, `title`, `module` (l'id de la leçon, ex. `'M1.1'`), `level`, `type: 'video'`, `access`, `duration`, `status: 'publié'`, `video_visibility: 'public_youtube'`, `preview: false`, `url` (le vrai lien YouTube), `description`.
2. **Rattacher la leçon à la vidéo** dans `LESSON_REGISTRY` (`dist/app.js`, ligne ~31) : ajouter le champ `video: 'VID-XXX'` sur l'entrée de la leçon concernée (M0.2/M0.3 montrent déjà exactement ce pattern, avec le commentaire « Vidéo réelle du VIDEO_REGISTRY (mandat §5, P1.3) »).
3. **Aucune autre modification de code n'est nécessaire** : le montage (`dist/app.js`, bloc autour de `if (entry.video) { ... }`, ligne ~409) et le rendu (`dist/lesson-renderer.js` `renderYouTubeLite`) sont génériques et pilotés entièrement par ces deux registres — ils fonctionnent déjà pour toute leçon qui porte un champ `video` valide.

## 4. Critères de validation avant publication

Avant d'ajouter une vidéo réelle à une leçon, vérifier :

1. **Propriété/droits** : la vidéo est hébergée sur la chaîne YouTube publique de DDA, ou DDA détient une autorisation explicite et documentée de rediffusion si elle vient d'ailleurs.
2. **Exactitude pédagogique** : le contenu de la vidéo correspond réellement au sujet de la leçon (même niveau d'exigence que les deux vidéos déjà en place, choisies par correspondance thématique directe — voir les commentaires `app.js`).
3. **Absence de promesse de gain/signal** : la vidéo ne doit contenir aucune promesse de rendement, aucun signal de trading, conformément aux règles de conformité marketing DDA déjà appliquées au reste du produit.
4. **Format technique conforme** : lien YouTube `youtube.com`/`youtu.be`/`youtube-nocookie.com` uniquement (seule forme acceptée par `getYouTubeId()`), vidéo publique (pas privée/non répertoriée accidentellement), pas de script tiers additionnel.
5. **Non-obligatoire** : la vidéo reste un complément — la leçon doit rester complète et compréhensible sans elle (déjà garanti par construction : `renderPedagogicalVisual` et le contenu textuel existent indépendamment du champ `video`).
6. **Test de régression** : après ajout, exécuter `tests/run.js` (la suite couvre déjà le montage vidéo pour M0.2/M0.3 — tout nouvel ajout doit continuer à passer ces mêmes contrôles) et vérifier à l'œil l'absence de débordement mobile sur la leçon modifiée (360/390px).
7. **Pas de placeholder trompeur** : si une leçon n'a pas encore de vidéo réelle, ne rien afficher plutôt qu'un espace vide ou un faux aperçu — c'est déjà le comportement actuel (« un lesson avec no `video` field renders nothing here »), à préserver.

## 5. Ce qui manque pour avancer

Pour chacune des 7 leçons sans vidéo, il faut un lien YouTube réel et vérifié correspondant au sujet exact de la leçon (M1.1 : pourquoi les prix évoluent ; M1.2 : exécution des ordres ; M1.3 : organisation des marchés ; MBRVM.1 : introduction BRVM ; P2.1/P2.2 : gestion du risque et décision de trade). Ce document ne peut pas fournir ces liens : ils doivent venir du fondateur ou d'une production vidéo réelle, puis être intégrés selon la procédure de la section 3.
