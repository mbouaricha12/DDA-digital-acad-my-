# DDA — Statut de lancement (consolidation finale, Lot I)

Date de la passe : 2026-11-07
Base : `origin/main` à `7c61d9d` (PR #218 mergée)
Nature du document : constat factuel basé sur l'exécution réelle de la suite de tests et l'historique Git des PR. Ce n'est pas un argumentaire commercial — chaque ligne est traçable à une preuve (résultat de test ou commit).

---

## 1. Résultats de l'exécution réelle de la suite (Lot I, aujourd'hui)

| Suite | Résultat |
|---|---|
| Syntaxe (`node --check dist/*.js`) | OK — 0 erreur |
| `tests/test_*.js` (82 fichiers, exécutés un par un comme en CI) | **82/82 PASS, 0 échec** |
| `tests/verify_route_register_consistency.js` | **PASS** — 18 routes, 38 lignes de registre, référence d'architecture présente |
| `tests/smoke_app_boot.js` | **24/24 PASS** |
| `tests/run.js` (harnais Playwright réel, navigateur Chromium) | **106/106 PASS, 0 échec** |

**Total : 212 vérifications exécutées, 212 au vert.** Aucune régression trouvée. Aucune modification de code n'a donc été nécessaire dans ce lot (la seule catégorie de changement autorisée — corriger une régression réelle trouvée par la suite — ne s'est pas présentée).

### Vérifications complémentaires ciblées (Playwright réel, ce lot)

- **Console/réseau** : navigation sur landing (`index.html`), shell Academy (`#access`), dashboard (`#parcours`, apprenant *seedé*), vue leçon avec vidéo (M0.2), catalogue DDA Lab, vue Premium/Membership, back-office admin authentifié (owner, via mock BFF). Résultat : **0 erreur console produit** sur les 7 pages. La seule entrée relevée est un `net::ERR_TUNNEL_CONNECTION_FAILED` sur la miniature YouTube (`i.ytimg.com`) de la leçon M0.2 — c'est l'absence d'accès réseau sortant vers YouTube dans cet environnement d'exécution (déjà documentée comme limite d'environnement, pas un bug produit).
- **Mobile 360/390/768/1440** : déjà vérifié lot par lot ; confirmé une dernière fois via `tests/run.js` (tests Z, M, et les contrôles layout à 360/390/1440) — aucun débordement horizontal détecté sur les pages couvertes.
- **CSP** : les meta tags CSP de `dist/index.html`, `academy.html`, `admin.html`, `404.html` sont cohérents avec ce que `tests/test_security_headers_contract.js` attend (passé dans les 82). C'est toujours une CSP en meta tag (limite de GitHub Pages, qui ne sert pas d'en-têtes HTTP personnalisés), déjà documentée par un audit antérieur — pas de régression.
- **Liens morts / routes** : `tests/verify_route_register_consistency.js` reste vert (garde-fou CI déjà en place depuis le Lot G) ; pas de nouvel audit de navigation complet refait.

---

## 2. Lots réellement exécutés (preuve : PR mergées sur `main`)

| Lot | PR | Ce qui a été livré |
|---|---|---|
| Lot 0 (fondations pré-mandat) | #185–#203 | Authentification (récupération mot de passe, PKCE, détection de route de récupération), assistant pédagogique DDA AI (chat réel), reconstruction pédagogique de DDA Lab, vérification serveur du Premium (P1), vidéo en leçon (P1), itérations de thème/copy P2. |
| Lot « audit Academy » | #204 | Audit pédagogique (style BabyPips) : la CSP bloquait les vidéos YouTube — corrigé. |
| UI redesign | #205, #206, #207 | Refonte du lecteur de leçon + header shell, phase 2 (header admin, overlay vidéo, libellés sidebar), onglets de leçon (À propos / Exercice-Quiz). |
| BRVM | #208 | Réintégration du module pédagogique BRVM (MBRVM.1) adapté au système d'onglets. |
| Lot 1 | #209 | Correction de fuite : `dda-lab.js` n'est plus servi à 100 % des visiteurs, chargé à la demande (lazy-load). |
| Lot 2 + Lot 5 | #210 | Correction de fuite majeure : le contenu Premium réel (leçons/labs) est servi depuis une route BFF authentifiée, plus jamais livré en clair au client avant vérification serveur. |
| — | #211 | Correction de rupture de palette sur la landing (alignement AURORA or/cyan). |
| Lot C | #212 | Suppression du doublon d'inventaire de module sur la vue leçon. |
| Lot D | #213 | Repositionnement de la vidéo de leçon en hero dominant. |
| Lot E | #214 | Contenu pédagogique réel des 7 leçons Free (contre contenu générique/placeholder). |
| Lot F | #215 | Correction de la validation manquante des blocs `decision_choice` dans LAB1-3. |
| Lot G | #216 | Cohérence inter-pages, navigation et états honnêtes — correctifs ciblés (glyphe parasite + cloche de notification trompeuse corrigés). |
| Complémentaire | #217 | Vérification DDA AI / inscription / cohérence du mockup back-office + correction de grille. |
| Lot H | #218 | Back-office admin : confirmation des mutations de rôle, affichage des emails réels sur les abonnements (best-effort depuis les données déjà en session, jamais une nouvelle route), vue "Contenu" en lecture seule. |

---

## 3. Corrections réalisées (liste concrète, basée sur les PR)

- **Fuite de contenu Premium (critique)** corrigée en deux temps : `dda-lab.js` n'est plus chargé pour 100 % des visiteurs (Lot 1, PR #209), puis le contenu Premium réel (leçons et labs) est désormais servi uniquement par une route BFF authentifiée après vérification serveur de l'entitlement (Lot 2+5, PR #210). `bff/src/premium-content.js` est la source de vérité serveur du contenu Premium.
- **Vidéo bloquée par la CSP** : la CSP interdisait les vidéos YouTube dans Academy — corrigée (PR #204), puis la vidéo a été repositionnée en hero dominant de la leçon (Lot D, PR #213).
- **Feedback générique sur M0.3** : le retour "correct/incorrect" sur les contrôles de tendance de M0.3 a été remplacé par une justification réelle propre à la question (PR antérieure au Lot E, visible dans l'historique `tests/historical-test-references.json` / commits de contenu).
- **Contenu Free incomplet** : les 7 leçons Free avaient un contenu insuffisant/placeholder — remplacé par du contenu pédagogique réel (Lot E, PR #214).
- **Validation manquante `decision_choice` LAB1-3** : les blocs de pratique de décision dans LAB1 à LAB3 n'étaient pas branchés/validés — corrigé (Lot F, PR #215).
- **Glyphe parasite + cloche de notification trompeuse** : un caractère de markup résiduel et un indicateur de notification qui ne reflétait rien de réel ont été supprimés (Lot G, PR #216).
- **Layout du back-office** : la grille admin ne s'effondrait pas correctement en pleine largeur sur les états "gated" — corrigé (PR #217).
- **Confirmation de mutation de rôle absente** : un changement de rôle dans le back-office s'appliquait immédiatement sans confirmation, alors qu'une révocation prend effet tout de suite — un `window.confirm()` nommant le compte et le rôle exact a été ajouté ; refuser annule le changement sans jamais appeler le serveur (Lot H, PR #218).
- **Memberships affichant un `user_id` brut** : la table des abonnements du back-office ne montrait qu'un identifiant opaque — elle affiche maintenant l'email déjà connu depuis une page Users chargée dans la même session (best-effort, jamais une nouvelle route, jamais une supposition) (Lot H, PR #218).
- **Aucune vue du contenu publié dans le back-office** : ajout d'une vue "Contenu" en lecture seule, sourcée depuis `dist/manus-routes.json` (le registre de routes public existant), plutôt que de dupliquer `LESSON_REGISTRY` en parallèle (Lot H, PR #218).
- **Duplication de l'inventaire de module sur la vue leçon** : corrigée (Lot C, PR #212).
- **Rupture de palette sur la landing** : alignement avec les tokens AURORA or/cyan (PR #211).

---

## 4. Fichiers importants modifiés (les plus significatifs, sur l'ensemble des lots)

- `bff/src/premium-content.js` — source de vérité serveur du contenu Premium (leçons + labs), servi uniquement après vérification d'entitlement côté serveur.
- `bff/src/app.js` — routes `/v1/admin/*`, `/v1/me`, `/v1/premium/content/:id` ; plomberie de rôle owner-only avec protection du dernier owner.
- `dist/app.js` (≈4 400 lignes) — cœur applicatif Academy : état local (schema v4), registre des leçons, registre vidéo, registre broker, gating Premium côté client (en plus de la vérification serveur), navigation, sidebar, DDA AI.
- `dist/lesson-renderer.js` — rendu du lecteur de leçon (onglets, hero vidéo, sommaire de module, carte de module latérale).
- `dist/admin.js` + `dist/admin-roles-store.js` — back-office : vues Utilisateurs/Abonnements/Contenu, recherche, export CSV, confirmations de mutation de rôle.
- `dist/dda-lab.js` — module DDA Lab chargé à la demande (lazy-load), catalogue LAB1-4/LABCAP.
- `dist/index.html`, `dist/academy.html`, `dist/admin.html`, `dist/404.html` — CSP en meta tag, shells de page.
- `tests/run.js` (2 678 lignes, 106 scénarios) et les 82 `tests/test_*.js` — filet de sécurité produit, exécuté intégralement dans ce lot.

---

## 5. Fonctionnalités confirmées (preuve par test réel, pas par lecture de code)

- **Gating Premium côté serveur** : un plan Premium forcé localement (sans BFF confirmé) ne débloque jamais le contenu réel ; un plan confirmé par le serveur débloque la vraie leçon/lab (`tests/run.js`, section V, 3 tests PASS).
- **Progression et persistance** : état apprenant schema v4, migration depuis les anciens schémas, survie au rechargement, parcours complet M0→M1→Terminal persistant (`smoke_app_boot.js`, 24 PASS ; `test_progress_sync.js`, `test_practice_progress_contract.js`).
- **Onglets de leçon** (À propos / Exercice-Quiz), sommaire de module, carte de module latérale, breadcrumb avec % réel du module (`tests/run.js` sections O, Y).
- **DDA AI réel** : hors BFF, le chat est honnêtement hors-ligne (jamais de fausse réponse) ; avec BFF, réponse réelle persistée localement, message de rate-limit honnête distinct (`tests/run.js` section W).
- **DDA Lab** : catalogue ouvert pour Free, LAB1 complet de bout en bout, LAB4 gated proprement pour Free et débloqué pour Premium confirmé serveur (`tests/run.js` section N).
- **Back-office admin** : lien caché pour une session locale ordinaire, visible seulement après confirmation serveur du rôle admin ; recherche, export CSV, profil réel via `/v1/me` (`tests/run.js` sections O, S, T).
- **Vidéo click-to-load** : miniature avec overlay titre/points clés tirés du contenu réellement authoré, pas d'iframe avant clic (`tests/run.js` section Q).
- **Paywall honnête** : P2.1 en aperçu reste ouvert pour Free ; P2.2 affiche un paywall honnête avec titre/durée/objectifs réels et une sortie "Continuer gratuitement" sans cul-de-sac (`tests/run.js` section R).
- **Attribution partenaire (`ref=`)** : capture, validation, propagation au BFF à l'inscription (`tests/run.js` section S).

---

## 6. Fonctionnalités encore incomplètes (honnête)

- **Couverture vidéo partielle** : seulement **2 leçons sur 9** référencent une vidéo réelle du `VIDEO_REGISTRY` (M0.2 et M0.3, confirmé par grep sur `dist/app.js`) ; les autres n'ont aucun bloc vidéo. Les vidéos elles-mêmes sont des contenus publics YouTube Shorts génériques (indicateurs, moyennes mobiles, volatilité Forex, cryptomonnaies), pas du contenu de marque DDA produit sur mesure pour chaque leçon.
- **Pas de jointure email↔abonnement côté serveur dans l'admin** : la table Memberships affiche l'email seulement si l'utilisateur a déjà été vu sur la page Users dans la même session (best-effort côté client). C'est un **choix délibéré documenté au Lot H** (PR #218) pour éviter de dupliquer la logique serveur plutôt qu'une lacune non vue.
- **CSP en meta tag** : toujours une limite de GitHub Pages (pas d'en-têtes HTTP personnalisables côté hébergement statique) — documentée par un audit antérieur, pas une régression, confirmée cohérente dans ce lot.
- **Module BRVM** : réintégré (PR #208) mais limité à une seule leçon d'introduction (MBRVM.1) — pas d'approfondissement BRVM au-delà.
- **Déploiement production** : le BFF sur Vercel redéploie automatiquement à chaque merge sur `main` (confirmé par le contexte du mandat) ; ce lot n'a pas requêté l'environnement Vercel de production lui-même (aucun outil de déploiement sollicité dans ce lot, car aucun code n'a changé) — à reconfirmer par le fondateur si une vérification de production live est voulue avant l'annonce de lancement.

---

## 7. Blocages

**Aucun blocage de lancement trouvé dans ce lot.** Les 212 vérifications exécutées (82 tests contrat + consistency + smoke + 106 scénarios Playwright) sont toutes au vert, et les vérifications complémentaires (console, réseau, CSP, mobile, liens) n'ont révélé aucun bug produit — seulement la limite d'environnement déjà connue (pas d'accès réseau sortant vers YouTube dans ce container, qui n'affecte pas la production réelle sur GitHub Pages).

---

## 8. Décisions nécessaires du fondateur

1. **Contenu vidéo supplémentaire** : décider si les 7 leçons sans vidéo doivent recevoir une vidéo dédiée (production sur mesure ou sélection curée d'un autre contenu public), et sur quel calendrier.
2. **Module BRVM** : décider si MBRVM.1 reste une leçon d'introduction isolée pour le lancement, ou si un approfondissement BRVM est requis avant ou après le lancement.
3. **Confirmation finale de l'hébergement** : confirmer que GitHub Pages (statique, CSP en meta tag) reste le choix pour le lancement, par opposition à toute intention future d'un hébergement avec en-têtes HTTP personnalisables (ce qui lèverait la limite CSP meta tag).
4. **Vérification de la production live** : si le fondateur veut une confirmation que le déploiement Vercel/BFF de production reflète bien `main` à `7c61d9d` avant l'annonce de lancement, c'est une vérification distincte (hors du périmètre de ce lot, qui n'a touché aucun code).

---

## 9. Éléments restant indispensables au lancement (priorisés)

- **P0 — Aucun.** Aucune fonctionnalité bloquante de lancement n'a été identifiée dans ce lot : le gating Premium serveur, la progression, l'authentification, le back-office et DDA AI fonctionnent bout en bout avec preuve de test réelle.
- **P1** :
  - Décision du fondateur sur la couverture vidéo (7 leçons sans vidéo) — n'empêche pas le lancement mais affecte la perception de complétude pédagogique.
  - Confirmation que le déploiement de production (Vercel BFF) est bien à jour avec `main` à `7c61d9d` avant toute communication de lancement.
- **P2 (nice-to-have, pas indispensable)** :
  - Jointure serveur email↔abonnement dans l'admin (actuellement best-effort côté client, par choix).
  - Approfondissement du module BRVM au-delà de la leçon d'introduction.
  - Vidéos dédiées à la marque DDA plutôt que des Shorts YouTube génériques.
