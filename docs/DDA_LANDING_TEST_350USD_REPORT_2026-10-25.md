# DDA — Compte rendu : Landing Page Test d'acquisition 350 USD

**Directive exécutée :** `DDA_Directive_Landing_Test_350USD_V1.md`
**Date :** 25 octobre 2026
**Statut gouvernance (§0 de la directive) :** instruction d'exécution reçue directement de Richard en conversation (« Corrige tout et poursuis »). Aucune publicité n'a été lancée, aucun prix/abonnement/paiement/architecture n'a été modifié, rien n'a été publié sur `main` sans autorisation explicite — conformément à la directive et aux règles déjà en vigueur dans cette session.

## 1. Pages modifiées / créées

| Fichier | Nature | Résumé |
|---|---|---|
| `dist/go/index.html` | **Nouveau** | La page de test elle-même. Page autonome, légère (CSS inline, pas de bundle app), un seul pôle (Trading & Marchés), un seul CTA répété 3 fois. |
| `dist/dda-core.js` | Modifié | Ajout additif du champ `content` (variante utm_content) à l'objet d'attribution (`ATTRIBUTION_VALUES`, `emptyAcquisition`, `sanitizeAcquisition`, `EVENT_METADATA_KEYS`). Aucun champ existant supprimé ou renommé. |
| `dist/dda-analytics.js` | Modifié | `content` ajouté aux clés/valeurs sûres transmises à l'analytics externe. **Correctif réel** : `signup_started`, `signup_completed` et `quiz_complete` (renommé en externe `lesson_completed`) n'étaient jusqu'ici **jamais transmis** à l'analytics externe (PostHog) — seulement gardés dans une file de debug locale invisible sans les devtools. Corrigé pour que les deux conversions exigées par la directive (§2) soient réellement mesurables. |
| `dist/index.html`, `dist/academy.html` | Modifiés | Le script d'amorçage de chaque page capture désormais aussi `utm_content` (même mécanisme d'allowlist que `utm_source/medium/campaign`, aucun changement de comportement pour les valeurs déjà supportées). |
| `dist/app.js` | Modifié | `captureAcquisition` et l'événement `landing_viewed` transmettent désormais `content`. |
| `tests/test_landing_acquisition_test_contract.js` | **Nouveau** | 13 vérifications réelles (Playwright, viewport 360×740) : 3 variantes + repli, CTA qui transmet les bons UTM, rejet des valeurs non autorisées, absence de phrases interdites, FAQ exacte, disclaimer présent, offres sans prix, `landing_viewed` effectivement mis en file avec la bonne variante, aucun débordement horizontal à 360px. |

## 2. Événements branchés — correspondance réelle avec la directive (§6)

| Événement demandé (§6) | État réel dans le dépôt | Détail honnête |
|---|---|---|
| `landing_viewed` | **Branché** sur `dist/go/index.html`, avec `source`/`medium`/`campaign`/`content` | Nouveau sur cette page ; déjà existant ailleurs dans l'app |
| `signup_started` | **Déjà présent** dans `academy.html` (déclenché à l'arrivée sur `#access`) | Était capturé localement mais **pas transmis en externe avant ce correctif** — corrigé |
| `signup_completed` | **Déjà présent**, même correctif que ci-dessus | idem |
| `onboarding_completed` | **Nom réel différent** : `onboarding_complete` (sans "d" final), déjà transmis en externe sous le nom `dda_signup` | Pas renommé pour rester cohérent avec le reste de l'app — c'est la même donnée, un nom différent |
| `lesson_started` | **Non implémenté** | Aucun événement "ouverture de leçon" distinct n'existe dans l'app actuelle (seulement `view_opened` générique). Ne pas inventer un événement redondant sans décision produit — signalé ici, pas construit. |
| `lesson_completed` (avec `lesson_id`) | **Nom réel différent** : `quiz_complete` avec `metadata.lesson` (ex. `M0.1`) — **transmis en externe sous le nom `lesson_completed`** depuis ce correctif | C'est le signal réel de complétion de leçon dans l'app (le quiz valide la compétence) |
| `quiz_attempted` | **Nom réel différent** : `quiz_attempt` existe dans le vocabulaire d'événements local mais n'est **pas transmis** en externe | Non corrigé — hors du périmètre strict de cette page de test, signalé pour une prochaine passe |
| `progress_updated` | **N'existe pas** comme événement discret | La progression est calculée à la volée depuis le journal d'événements existant (`lessonViewed`/`exerciseComplete`/`quizComplete`), jamais ré-émise comme un événement séparé. Ne pas fabriquer un événement qui dupliquerait une donnée déjà dérivable, sans décision produit explicite. |
| `offer_viewed`, `checkout_started` | **Non applicables** | Standard/Pro ne sont pas affichés (paiement non actif par défaut, §4.5) — rien à mesurer tant qu'ils restent masqués. |

**Conclusion honnête** : la conversion principale (`signup_completed`) et la conversion de qualité (`lesson_completed`) exigées par la directive §2 sont maintenant réellement mesurables en externe — elles ne l'étaient pas avant cette passe. Le reste de la liste §6 (`lesson_started`, `quiz_attempted`, `progress_updated`) reste un écart documenté, pas fabriqué.

## 3. Tests réels exécutés

| Test | Résultat |
|---|---|
| `node tests/test_landing_acquisition_test_contract.js` (13 vérifications Playwright, 360×740) | **13/13 PASS** |
| Les 68 `tests/test_*.js` (dont le nouveau) | **68/68 PASS** |
| `tests/verify_route_register_consistency.js` | **PASS** |
| `node tests/run.js` (régression navigateur complète du reste du site) | **61 passed, 0 failed** — aucune régression introduite par les changements additifs dans `dda-core.js`/`dda-analytics.js`/`app.js` |
| Capture d'écran mobile réelle (360×740, variante `risque`) | Prise avec Playwright, envoyée séparément à Richard |

**Limite honnête sur le test mobile** : la directive §7/§11.4 demande un test sur « un vrai téléphone, en réseau lent ». Ce qui a été fait ici est une émulation de viewport mobile (360×740) dans Chromium headless — pas un test sur un appareil physique ni une simulation de débit réseau réel. C'est une preuve de layout et de logique, pas une preuve d'expérience terrain. Un test sur un vrai téléphone Android/iOS en 3G/4G réelle reste à faire avant tout lancement publicitaire.

## 4. Écarts avec la directive

1. **`lesson_started`, `quiz_attempted`, `progress_updated`** : non implémentés, voir §2 ci-dessus — nécessitent une décision produit (créer de nouveaux événements ou accepter les équivalents existants) avant d'être ajoutés.
2. **Test réseau lent / appareil physique réel** : non fait, voir §3.
3. **§4.2 vidéo M0.1** : aucune vidéo n'existe (confirmé par l'audit du 15 octobre, toujours vrai). Image fixe utilisée : en réalité, aucune capture d'écran de l'app n'a été utilisée — un aperçu textuel honnête a été préféré à une capture, pour ne pas devoir simuler un parcours d'inscription complet seulement pour produire une image. **[DÉCISION RICHARD]** si une vraie capture d'écran est voulue, je peux la produire sur demande.
4. **§5 preuve de test complète (visite → inscription → M0.1)** : non exécutée en conditions réelles (nécessite un compte réel et l'app complète) — seuls les tests automatisés ci-dessus ont été faits.
5. **§8 relance WhatsApp/Telegram après inscription** : non implémenté. Aucun canal ni texte n'a été décidé (**[DÉCISION RICHARD]** explicite dans la directive) — construire cette case à cocher sans canal réel reviendrait à fabriquer une fonctionnalité qui ne fait rien.
6. **Nomenclature Découverte/Standard/Pro** : utilisée par défaut comme demandé — ces noms existent déjà réellement ailleurs dans l'app (pas une invention pour ce test).

## 5. Décisions restant à prendre (Richard)

- Vidéo M0.1 ou capture d'écran réelle pour l'aperçu (§4.2).
- Canal et texte de relance post-inscription (§8).
- Validation du budget 350 USD et de la politique Meta avant tout lancement (§11).
- Décision sur `lesson_started`/`quiz_attempted`/`progress_updated` : les construire pour ce test ou s'en passer.

## 6. Prêt à pousser

Oui — commit prêt sur une branche de travail, tests validés. Comme pour tout le reste de cette session, aucun push/merge n'est fait sans autorisation explicite.

## Décision de cette passe

> La page de test est fonctionnelle, honnête, conforme aux interdits (§9), et mesure réellement ses deux conversions clés. Elle n'active rien de commercial et ne touche à aucune architecture de paiement. Elle n'est pas prête à recevoir du trafic publicitaire tant que les points de la section 5 ne sont pas tranchés par Richard et qu'un test sur appareil physique réel n'a pas été fait.
