# DDA — Script et storyboard : vidéo de présentation landing

**Date :** 13 novembre 2026
**Référence :** `docs/CDCP_OS_ADDENDUM_LANDING_VIDEO_MOTION_DESIGN.md` (issue #240), étape 1 du plan d'exécution (« Script et storyboard »).
**Statut :** livrable de script/storyboard. Aucune vidéo n'est produite ni montée par ce document — c'est la préparation qui doit être validée avant la production (étapes 2 à 4 de l'addendum). Aucun écran, chiffre ou fonctionnalité non réelle n'est inventé : chaque plan ci-dessous renvoie à un écran existant du dépôt (`dist/index.html`, `dist/academy.html`).

## 1. Durée et structure

**Durée cible : 52 secondes** (dans la fourchette 45–60s de l'addendum), 7 segments.

| # | Intervalle | Titre du segment | Écran réel source |
|---|---|---|---|
| 1 | 0:00–0:06 | Le problème | Hero landing (`#landing`) |
| 2 | 0:06–0:13 | La promesse DDA | Hero landing + logo |
| 3 | 0:13–0:22 | Learn | Academy — leçon M0.1, exercice |
| 4 | 0:22–0:30 | Practice | DDA Lab — LAB1 ou Terminal pratique |
| 5 | 0:30–0:38 | Prove Progress | Vue Progression (`#progress`), Fil de maîtrise |
| 6 | 0:38–0:45 | Ce que DDA ne fait pas | Section garde-fous (`#landing-trust`) |
| 7 | 0:45–0:52 | Appel à l'action | CTA « Commencer gratuitement » |

## 2. Script (narration + sous-titres français, identiques)

Chaque ligne est pensée pour être lue par une voix off posée, sans emphase commerciale excessive — cohérent avec le ton du reste du produit (« pas une promesse, une méthode »).

> **[0:00–0:06]**
> « L'ambition ne manque pas à la jeunesse. Les moyens, si. »
> *(reprise exacte du titre hero `#landing-title` — pas une nouvelle accroche inventée)*

> **[0:06–0:13]**
> « DDA Academy est un système d'apprentissage des marchés financiers. Pas une promesse de gain — une méthode : apprendre, pratiquer, prouver. »

> **[0:13–0:22]**
> « Chaque notion suit le même chemin : une leçon claire, un exercice réel, un quiz qui valide la compréhension — avant de passer à la suite. »
> *(correspond exactement au parcours M0.1 : leçon → exercice gate → quiz verrouillé)*

> **[0:22–0:30]**
> « Dans DDA Lab, tu mets la méthode en pratique — sur des outils pédagogiques, jamais sur de vraies données de marché. »
> *(aligné avec LAB1-3 Free ; aucune mention d'exécution d'ordre ou de marché réel)*

> **[0:30–0:38]**
> « Ta progression n'est jamais fictive. Chaque étape validée laisse une trace réelle, que tu peux suivre à tout moment. »
> *(correspond à la vue Progression / Fil de maîtrise, preuve événementielle)*

> **[0:38–0:45]**
> « Aucun signal de trading. Aucune donnée présentée comme temps réel si elle ne l'est pas. Aucune promesse de résultat. »
> *(reprise directe des 4 garde-fous de `#landing-trust` — ne jamais paraphraser au point de perdre l'exactitude)*

> **[0:45–0:52]**
> « Commence gratuitement, à ton rythme. Sans carte bancaire. »
> *(CTA final, cohérent avec `#landing-free-title` et le bouton réel « Commencer gratuitement »)*

## 3. Plan de tournage / montage (shot list)

| Segment | Plan | Source exacte à capturer | Note de motion design |
|---|---|---|---|
| 1 | Plan large hero, logo DDA en surimpression douce | `#landing` hero, image `hero-market-woman.jpg` | Fondu d'entrée progressif (déjà le langage d'animation du hero) ; **aucun** graphique de cours boursier animé inventé |
| 2 | Enchaînement texte-sur-fond vers le wordmark DDA | Typographie/logo déjà en place dans le header | Transition sobre, pas d'effet « glitch » ou trading-flashy |
| 3 | Capture d'écran réelle : ouverture de la leçon M0.1, clic sur une réponse d'exercice, validation visible | `dist/academy.html#lesson` (M0.1), bloc `exercise` puis `quiz` | Curseur/doigt visible pour ancrer l'action dans le réel ; zoom léger sur le feedback de réussite |
| 4 | Capture d'écran réelle : DDA Lab, LAB1, exercice de pratique | `dist/academy.html#lesson-lab1` | Doit rester identifiable comme un exercice pédagogique (titre visible « À toi de juger »/pratique), jamais présenté comme un graphique de marché réel |
| 5 | Capture d'écran réelle : vue Progression, Fil de maîtrise qui se remplit | `dist/academy.html#progress`, `#mastery-list` | Animation de remplissage progressif cohérente avec les micro-interactions déjà en place sur cette vue |
| 6 | Texte seul sur fond sobre, les 4 garde-fous affichés un par un | Reprise textuelle de `#landing-trust` | Pas d'image produit ici — volontairement un moment « institutionnel », sans démonstration, pour que le message de confiance ne soit pas noyé |
| 7 | Retour sur le bouton réel « Commencer gratuitement » qui pulse légèrement | `#landing-final-cta` | Doit être le même bouton/CTA que celui réellement cliquable sur la page, pas une recréation graphique |

## 4. Sous-titres et accessibilité

- Sous-titres `.vtt` intégrés ou activables, texte strictement identique à la narration (section 2) — aucune reformulation entre voix et sous-titre.
- Pas de lecture automatique du son au chargement de la page (conforme à l'addendum §3 « contrôles ») ; la vidéo démarre en muet si autoplay visuel léger, ou ne démarre pas du tout avant interaction — à trancher en intégration (étape 4), pas ici.
- Alternative texte équivalente dans l'attribut `aria-label` du lecteur et une transcription (ce script fait déjà office de transcription).
- `prefers-reduced-motion` : les transitions de montage internes à la vidéo (fondus, zooms) sont indépendantes de ce réglage (c'est une vidéo, pas une animation CSS) ; seule l'apparition du bloc vidéo lui-même sur la page doit respecter `reduced-motion` (pas de zoom d'entrée agressif du cadre vidéo).

## 5. Exactitude produit — liste de contrôle avant tournage/montage

À vérifier plan par plan avant validation finale (reprend l'addendum §5) :

- [ ] Aucun graphique de cours boursier présenté comme une donnée de marché réelle (seuls des écrans produit réels ou des schémas pédagogiques déjà existants, ex. `renderPedagogicalVisual`).
- [ ] Aucune mention d'IA Coach distant active (le texte dit explicitement « méthode », jamais « assistant IA » dans ce script — cohérent avec l'état réel : DDA AI est honnêtement hors ligne sans BFF configuré).
- [ ] Aucune mention de Premium/abonnement payant actif (le script ne mentionne jamais Premium — Free uniquement, cohérent avec le NO-GO commercial Premium).
- [ ] Aucun témoignage, chiffre de résultat ou statistique non vérifiée.
- [ ] Le CTA final pointe réellement vers le parcours Free gratuit, pas vers une page de paiement.

## 6. Ce qui reste à faire (étapes suivantes de l'addendum)

1. **Validation du script/storyboard** par le fondateur (ce document).
2. **Direction artistique et assets** (étape 2) : choix définitif des captures d'écran réelles à enregistrer (résolution, thème clair/sombre), charte typographique des cartons de texte.
3. **Production motion design vidéo** (étape 3) : enregistrement réel des écrans listés en section 3, montage, étalonnage, export.
4. **Intégration landing page** (étape 4) : poster, lecteur, lazy-load, CTA — selon l'architecture déjà en place pour les vidéos YouTube Shorts (`dist/lesson-renderer.js` `renderYouTubeLite`), à adapter ou dupliquer pour ce lecteur landing si l'hébergement diffère.
5. **Tests performance/accessibilité/CTA** (étape 6) à exécuter une fois intégrée — aucune mesure n'est faite ici puisqu'aucune vidéo n'existe encore.

Ce document ne produit aucune vidéo réelle ; il fournit le script et le découpage nécessaires pour que la production (hors périmètre technique de cette session) puisse commencer sans ambiguïté sur le contenu, le ton et les limites d'exactitude produit.
