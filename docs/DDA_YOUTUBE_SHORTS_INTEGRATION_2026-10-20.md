# DDA — Intégration officielle des YouTube Shorts

**Date :** 20 octobre 2026  
**Statut :** intégré dans le moteur de leçons, cloisonné Free/Premium et vérifié par Playwright.

## Règles d’intégration

Les URLs publiques `youtube.com/shorts/...` ne sont jamais injectées directement dans une iframe. Le renderer valide l’hôte et l’identifiant, puis normalise chaque Short vers `https://www.youtube-nocookie.com/embed/<id>` avec `rel=0`, `modestbranding=1` et `playsinline=1`. Le lecteur reste optionnel : le texte, les exercices, les quiz et la progression restent utilisables si YouTube est indisponible.

Chaque Short utilise un conteneur vertical `9/16`, limité à une largeur de 360 px et à une hauteur raisonnable sur mobile. Les Shorts sont chargés en `lazy`, sans autoplay, avec fallback d’erreur et titre accessible.

## Mapping officiel cloisonné

### DDA Free — cinq Shorts fondamentaux

| Leçon | Short | Identifiant YouTube |
|---|---|---|
| M0.1 — Le trading comme commerce | C’est quoi le trading ? | `HwlEuA39HpM` |
| M0.1 — Le trading comme commerce | Le marché des devises | `bUHsQnIAFuc` |
| M0.1 — Le trading comme commerce | Les différents types de traders | `bVJ9n-Etcpc` |
| M0.2 — Support & Résistance | Support et résistance | `pRFqhk55bL4` |
| M0.3 — Lire une tendance | La bougie japonaise | `WDifN6ZKnjY` |

### DDA Premium — cinq Shorts d’analyse et d’indicateurs

| Leçon Premium | Short | Identifiant YouTube |
|---|---|---|
| P2.1 — Risk Before Entry | Les indicateurs en trading | `BTipx88k_U8` |
| P2.1 — Risk Before Entry | Les moyennes mobiles en trading | `rVd4dF6JaZ4` |
| P2.1 — Risk Before Entry | La volatilité sur le forex trading | `HaP-Onie9Lc` |
| P2.2 — The Anatomy of a Controlled Trade | C’est quoi les crypto-monnaies ? | `yBNc_eQbiow` |
| P2.2 — The Anatomy of a Controlled Trade | Les figures chartistes en trading | `VLdAqeJCllE` |

Les cinq supports avancés ne sont plus attachés à M0/M1 : ils sont rendus exclusivement par les leçons P2 déjà protégées par `premium_track`. Un utilisateur Free ne reçoit donc ni les iframes ni le contenu authored P2 ; le verrou d’accès existant est la source de décision côté interface, tandis que l’entitlement serveur reste la source d’autorité en production.

## Validation

- Les 10 identifiants sont présents dans `window.DDA.curriculum`.
- M0 contient exactement les cinq Shorts fondamentaux attendus.
- P2 contient exactement les cinq Shorts avancés attendus.
- M1 ne contient aucun Short avancé hors de son entitlement.
- Les hôtes arbitraires sont rejetés par le renderer.
- Le format vertical est rendu par `.video-frame-portrait`.
- Le viewport ne déborde pas à 280, 375, 717 et 1440 px dans l’audit de lancement.
- Le test Playwright `tests/test_launch_final_audit.js` vérifie l’inventaire, l’URL privacy-enhanced, le rendu vertical et l’absence de montage Premium pour un utilisateur Free.
