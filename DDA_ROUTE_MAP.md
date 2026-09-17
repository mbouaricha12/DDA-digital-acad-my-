# DDA — Carte des routes (Navigation Integrity V1, septembre 2026)

État réel de chaque vue, tel qu'implémenté dans `dist/app.js`/`dist/index.html` après cette tranche. Routing = SPA à un seul niveau (`document.querySelectorAll('.view')`, hash-based, `showView(id)` dans `app.js`). Aucun back-end, aucun vrai historique de navigateur (`history.replaceState`, jamais `pushState` — voir Dettes).

| Vue (`id`) | Entrées | Sortie principale | Retour | Permission | Deep link (reload) | Anonyme | Déjà inscrit |
|---|---|---|---|---|---|---|---|
| `landing` (Acquisition V1, nouveau) | Défaut absolu si aucun compte local et aucun hash (remplace l'ancien atterrissage direct sur `access`) | CTA "Commencer maintenant" → `access` | — (point d'entrée public) | Aucune (même traitement que `access`) | ✅ fiable | Vue réelle, sans chrome applicatif (`body.public-shell`) | Non pertinent — un compte existant saute directement à sa vue courante |
| `access` | Défaut si aucun compte local et aucun hash ; lien "Commencer" (profil vide) ; toute vue protégée sans droit | Formulaire → `lesson` (ou vue en cours si déjà inscrit) | — (point d'entrée) | Aucune | ✅ fiable | Vue réelle | Redirige vers `dashboard` si déjà inscrit et hash absent |
| `dashboard` (Aujourd'hui/Terminal) | Nav (sidebar/mobile), marque DDA, tout back-link "← Retour" sans origine, fin d'onboarding implicite (Home) | Action principale → leçon réelle, Journal ou Market Intelligence selon `nextActionable()` | — (racine) | Aucune | ✅ fiable | Redirigé vers `access` | ✅ |
| `path` (Parcours) | Nav | Carte "chapitre en cours" → leçon réelle en cours | back-link des leçons ouvertes depuis Parcours → `path` (nouveau, voir §Corrections) | `path` (requiert compte) | ✅ fiable | Redirige vers `access` | ✅ |
| `lesson` (M0.1) | Home, Parcours, Progression, raccourci sidebar "Leçon en cours" | Bouton "Quitter"/back-link → origine réelle (nouveau) ; lien Journal optionnel | back-link contextuel (nouveau) | `lesson_m01` | ✅ fiable | Redirige vers `access` | ✅ — **aucun verrou séquentiel appliqué à la navigation directe (dette, voir §10)** |
| `lesson-m02` (Support & Résistance) | idem + bouton "Continuer" du résultat M0.1 | idem | idem | `lesson_m01` | ✅ fiable | idem | idem |
| `lesson-m03` (Lire une tendance) | idem + bouton "Continuer" du résultat M0.2 | idem | idem | `lesson_m01` | ✅ fiable | idem | idem |
| `progress` (Progression) | Nav, lien "Voir ma Progression" (Profil, résultat de leçon) | Nouveau : bouton par compétence → leçon réelle (§Corrections) | Nav uniquement (vue racine) | `progress` | ✅ fiable | Redirige vers `access` | ✅ |
| `journal` (Journal & Plan) | Nav mobile/desktop, lien "Ouvrir ton Journal" (Terminal, Market, résultat de leçon) | Composer interne (3 étapes) | back-link contextuel (nouveau) → origine réelle | `journal` | ✅ fiable | Redirige vers `access` | ✅ |
| `resources` (Ressources) | Nav, tuile "Ressources" (Terminal) | Lecteur intégré (pas de nouvelle vue) | Nav uniquement | `resources_free` | ✅ fiable | Redirige vers `access` | ✅ |
| `markets` (Marchés & BRVM) | Nav, action principale du Terminal une fois le curriculum complété | Lien "Revoir les fondations" → dernière leçon ; lien Journal | Nav uniquement | `market_room` | ✅ fiable | Redirige vers `access` | ✅ |
| `brokers` (Broker Hub) | Nav, tuile Terminal | — | Nav uniquement | `broker_hub` | ✅ fiable | Redirige vers `access` | ✅ |
| `membership` (DDA Premium) | Nav, bandeau Premium (Terminal, Ressources) | Aperçu Premium local | Nav uniquement | `membership` | ✅ fiable | Redirige vers `access` | ✅ |
| `support` (Aide & support) | Nav, tuile Terminal | Formulaire local | Nav uniquement | `support` | ✅ fiable | Redirige vers `access` | ✅ |
| `profile` (Profil) | Nav, chip sidebar, état vide "Aucun compte" | — | Nav uniquement | `profile` | ✅ fiable | Redirige vers `access` | ✅ |

## Source de vérité unique

`DDALearning.nextActionable(curriculum, state)` (moteur curriculum-agnostique, `learning-engine.js`) est le seul calcul de "prochaine leçon réelle" dans toute l'application :

- **Home/Terminal** (`#lesson-primary-action`, thread de compétence, méta) → `resolveContinueTarget()` → `nextActionable()`
- **Parcours** (carte "chapitre en cours") → même `resolveContinueTarget()` (corrigé cette tranche — voir §Corrections)
- **Progression** (Fil de maîtrise, prochaine étape) → dérive de `moduleStatus()`/`lessonStatusInModule()` du même moteur
- **Journal / Market Intelligence comme action du jour** → `renderTerminalLeadComplete()` s'active seulement quand `nextActionable()` retourne `null` (curriculum authored terminé), jamais une deuxième logique

Aucune page ne recalcule "la prochaine leçon" par elle-même.

## Corrections apportées cette tranche

1. **Back-link contextuel** (`smartBackTarget()`, `app.js`) : les 3 leçons et Journal utilisaient un `data-view="dashboard"` figé. Un `previousView` réel est maintenant suivi à chaque `showView()` (y compris les appels directs de test/deep-link) ; le back-link résout vers le vrai écran d'origine (Parcours, Progression, Terminal…), jamais vers une destination arbitraire.
2. **Parcours → leçon → retour** : la carte "chapitre en cours" pointait en dur vers M0.1 (dette héritée, documentée dans deux tranches précédentes). Elle suit désormais `resolveContinueTarget()`.
3. **Progression → compétence → leçon pertinente** : chaque ligne du Fil de maîtrise expose maintenant un lien réel vers sa leçon (`mastery-row-lesson-link`, délégation d'événement car la liste est régénérée dynamiquement).
4. **Deep link / reload fiable** : `history.replaceState` conserve le hash ; au chargement, `showView(initialView)` restaure la vue si elle existe, sinon un visiteur anonyme atterrit sur `access` (corrigé lors de la tranche précédente), jamais sur un tableau de bord factice.

## Dettes réelles restantes (documentées, non corrigées cette tranche)

1. **Verrou séquentiel non appliqué à la navigation directe** : `lessonStatusInModule()` (moteur) sait qu'une leçon est verrouillée tant que la précédente du même module n'est pas complétée, mais `showView()` ne consulte jamais cette fonction — un lien direct vers `#lesson-m03` fonctionne même sans avoir terminé M0.1/M0.2. Correction non tenue cette tranche : ~20 sites de test dépendent explicitement de ce comportement pour tester M0.2/M0.3 en isolation ; l'implémenter aurait exigé une réécriture disproportionnée de tests existants pour un chemin que le CEO n'a pas explicitement signalé comme cassé. À traiter dans une tranche dédiée.
2. **`history.pushState` jamais utilisé** : le bouton natif "précédent" du navigateur ne suit pas les transitions internes (toujours `replaceState`). Le back-link applicatif compense pour les leçons/Journal ; les autres vues n'ont pas besoin de "retour" puisqu'elles sont des racines de la nav principale.
3. **Modules M3–M9** : aucun titre réel n'existe dans la documentation produit au-delà de M0/M1/M2 ; Parcours affiche donc honnêtement "Module M3"…"Module M9", jamais un contenu inventé (conforme au mandat §8).

## Addendum — Acquisition Engine V1 (CEO decision)

`landing` devient le point d'entrée anonyme par défaut (`!prototypeState.user` sans hash valide), `access` reste atteignable directement par lien/deep-link et reste la cible de tout refus de permission (`showView()` continue de rediriger vers `access`, jamais vers `landing`, quand un visiteur anonyme tente une vue protégée — `landing` est un point d'entrée marketing, pas une destination de gate). Aucune autre règle de `smartBackTarget()`/`previousView` n'est modifiée par cette tranche.
