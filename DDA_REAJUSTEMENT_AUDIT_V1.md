# DDA — Audit de réajustement, consolidation et poursuite du chantier (V1)

**Date : 3 novembre 2026**
**Commit audité :** `05671b8` (main, après merge PR #181)
**Méthode :** lecture directe du code, des routes et des tests — pas une synthèse des audits précédents. Les ~25 audits antérieurs (`DDA_*AUDIT*.md`, `docs/DDA_*AUDIT*.md`) restent disponibles comme historique ; ce document les met à jour avec une vérification fraîche, pas une paraphrase.

## 0. Résumé exécutif

DDA n'est pas un squelette à construire : c'est un produit avec une base technique réelle, honnête sur ses propres limites, et déjà testée (77 fichiers de contrats statiques + 85 scénarios de navigateur réel dans `tests/run.js`, tous verts à ce commit). Le travail des dernières semaines (navigation, Premium, back-office, attribution, SEO) a corrigé la plupart des irritants de parcours identifiés par les audits antérieurs.

Les écarts réels restants ne sont pas des « pages cassées » — ils sont :
1. **BRVM** : un pôle éditorial honnête, mais sans parcours pédagogique structuré (pas de leçons, pas d'exercices, pas de quiz BRVM) — §6 du cahier des charges n'est pas couvert aujourd'hui.
2. **Protection Premium** : la vérification d'accès Premium dans l'Academy (`DDA.can()`) est **entièrement côté navigateur** — aucun appel au BFF pour gater une leçon Premium. Le BFF a bien des routes d'entitlement (`/v1/premium/preview`, `/v1/me`), mais l'app Academy ne les utilise pas pour décider qui voit quoi.
3. **DDA AI / Intelligence DDA** : honnêtement marqué « bientôt disponible », zéro fonctionnalité — c'est correct par rapport au mandat (ne jamais simuler une IA active), mais ça veut dire que la section 8 du cahier des charges est à construire entièrement, pas à ajuster.
4. **Paiement Chariow** : adaptateur serveur prêt (webhook, signature, idempotence, modèle membership), **zéro secret/produit réel configuré** — correct et volontaire, mais aucun paiement n'est donc réellement testable aujourd'hui.
5. **Inventaire des routes désynchronisé** : `dist/manus-routes.json` (utilisé par les tests de routes publiques) ne liste pas certaines pages qui existent réellement dans `dist/` (`commencer/`, `live/`, `business/`, `experts/`, `community/`, `ai/`, `admin.html`, les vues DDA Lab).

Aucun P0 bloquant trouvé au sens strict (route cassée, page vide inattendue, redirection silencieuse vers l'accueil, bouton sans action). Les écarts sont des P1 — consolidation réelle, pas urgence de sécurité.

## 1. Audit de l'architecture

| Composant | État réel |
| --- | --- |
| Frontend | SPA statique (`dist/*.html` + `dist/*.js`), aucun build step — le code livré est le code source. Academy (`academy.html`) et site public (`index.html`) sont deux documents séparés délibérément (déjà documenté dans `DDA_ROUTE_MAP.md`). |
| BFF | Node natif (`bff/src/app.js`, 533 lignes), routes `/v1/auth/*`, `/v1/me`, `/v1/progress`, `/v1/admin/*`, `/v1/premium/preview`, `/v1/publications/brvm`. CSRF, idempotence, sessions chiffrées, rate-limit — tous testés (`tests/test_bff_implementation.js` et consorts). |
| Supabase | Auth (GoTrue) + PostgREST pour `dda_admin_roles`, `dda_billing_*`, sessions. RLS activé et audité (`DDA_RLS_AUTOMATED_AUDIT_2026-09-28.md`, dédupliqué depuis). |
| Authentification | Réelle côté BFF (`/v1/auth/register|login|logout`), mais **non branchée côté Academy pour le gating de contenu** — voir §3. |
| Rôles & permissions | Back-office : rôles réels (`owner`/`admin`), appliqués serveur (`adminRoles.assignRole`), protection du dernier owner testée. Academy : permissions Free/Premium/Standard gérées uniquement en local (`ENTITLEMENTS` dans `dda-core.js`, basé sur `prototypeState.membership.plan`). |
| Free/Premium | Modèle local honnête : bascule simulée (`DDA.setPlan`), jamais présentée comme un achat réel. Paywall enrichi récemment (titre/objectifs/durée réels, sortie gratuite, aperçu par module). |
| Progression | `DDALearning` (learning-engine.js) + `localStorage` v4 avec migration legacy testée. Pas de synchronisation serveur — toute la progression peut disparaître si le navigateur est vidé (déjà signalé honnêtement dans le formulaire d'inscription). |
| Registres de contenu | `LESSON_REGISTRY`, `LAB_REGISTRY`, `VIDEO_REGISTRY` (ajouté nov. 2026), `BROKER_REGISTRY` (ajouté nov. 2026) — même principe : une entrée de registre pilote le rendu, pas de duplication HTML. |
| Tests | 77 fichiers `tests/test_*.js` (contrats statiques/sécurité/BFF) + `tests/run.js` (85 scénarios Playwright navigateur réel) + `smoke_app_boot.js` (24 vérifications jsdom) + `verify_route_register_consistency.js`. Tous verts à ce commit. |
| Dépendances | Aucune dépendance npm en production (`dist/` est du JS vanilla). `playwright` global pour les tests seulement. |
| Fonctionnalités incomplètes/provisoires | BRVM (données + parcours), DDA AI, Chariow réel, offre annuelle, page partenaires broker, Challenge BRVM, synchronisation progression serveur. |

## 2. Inventaire des pages

### 2.1 Site public (`dist/*/index.html`)

| Route | Objectif | État | Lien entrant | Limitation connue |
| --- | --- | --- | --- | --- |
| `/` (index.html) | Landing marketing | Opérationnel | Nav principale | — |
| `/commencer/` | Landing d'acquisition dédiée | Opérationnel, testé (`test_commencer_route_contract.js`) | Lien « Découvrir le parcours Free » | — |
| `/about/`, `/faq/`, `/contact/`, `/terms/`, `/privacy/`, `/cookies/`, `/imprint/`, `/risks/`, `/accessibility/` | Documents publics/légaux | Opérationnels, contenu réel | Footer + nav publique | Mentions légales : identité juridique complète de l'éditeur encore provisoire (déjà signalé dans le texte lui-même) |
| `/launch/` | Statut du pilote | Opérationnel | Lien depuis Premium/Membership | — |
| `/live/`, `/business/`, `/experts/`, `/community/`, `/ai/` | Espaces futurs | **Placeholders honnêtes** (« à venir »), pas de contenu fonctionnel | Chips écosystème sur la landing | C'est voulu — mais ce sont bien des pages à contenu nul au sens du cahier des charges §2.2 ; elles ne doivent pas être comptées comme « défectueuses », seulement comme « à construire », ce qu'elles annoncent elles-mêmes. |
| `/mentions-legales/`, `/politique-de-confidentialite/`, `/legal/`, `/privacy-policy/`, `/faq.html`, `/about.html` | Alias de compatibilité | Opérationnels (ajoutés depuis l'audit du 27/10) | Anciens liens externes/partagés | — |
| `admin.html` | Back-office | Opérationnel (overview, utilisateurs + export CSV, abonnements, rôles) | Lien discret révélé après confirmation serveur du rôle | Pas de page "page partenaires" ni reporting broker (n'existe pas encore) |

### 2.2 Academy (`academy.html#<vue>`)

| Vue | Objectif | État | Statut |
| --- | --- | --- | --- |
| `#access`, `#dashboard`, `#path` | Entrée, Terminal, Parcours | Opérationnels | OK |
| `#lesson`, `#lesson-m02`, `#lesson-m03`, `#lesson-m11`, `#lesson-m12`, `#lesson-m13` | Curriculum M0/M1 | Opérationnels, contenu authored complet (texte, exemples, exercices, quiz) | OK — **vidéo non intégrée dans ces leçons** (voir §5) |
| `#premium-track`, `#premium-lab`, `#premium-assessment` | Premium P2 | Opérationnels, aperçu P2.1 gratuit (Lot 2, nov. 2026) | OK |
| `#progress` | Progression | Opérationnel, + carte partageable (Lot 5) | OK |
| `#journal` | Journal & Plan | Opérationnel | OK |
| `#resources` | Bibliothèque | Opérationnel, + rayon vidéo (Lot 1) | OK |
| `#membership` | Page Premium commerciale | Opérationnel, honnête (« aperçu local », aucun paiement actif) | Correct pour un pilote ; pas encore une vraie page commerciale au sens §7.2 (prix non officiellement validé pour l'annuel) |
| `#markets` | BRVM / Market Intelligence | **Partiellement construit** — voir §4 | Incomplet par rapport au §6 |
| `#brokers` | Broker Hub | Opérationnel, registre préparatoire (Lot 4), aucun lien réel | OK pour l'état actuel |
| `#forex`, `#stocks`, `#indices`, `#crypto` | Univers futurs | Placeholders honnêtes « en préparation » | Voulu |
| `#support`, `#community`, `#practice`, `#intelligence`, `#profile` | Aide, communauté, pratique avancée, IA, profil | `#community` et `#intelligence` sont des aperçus « bientôt disponible » honnêtes ; les autres opérationnels | `#intelligence` = DDA AI, à construire (§8) |
| `#lab`, `#lesson-lab1..4`, `#lesson-lab-capstone` | DDA Lab | Opérationnel, LAB1-3 Free, LAB4/Capstone Premium avec paywall honnête | OK |

**Aucune route testée ne redirige silencieusement vers l'accueil, aucun bouton sans action trouvé dans les vues listées ci-dessus** — les tests de navigation (`tests/run.js` sections C, M, N, O) couvrent spécifiquement ce risque et sont verts.

### 2.3 Écart document ↔ code constaté

`dist/manus-routes.json` (le manifeste utilisé par les tests de routes publiques et par le script de vérification d'intégrité) **ne liste pas** : `/commencer/`, `/live/`, `/business/`, `/experts/`, `/community/`, `/ai/`, `admin.html`, ni aucune vue DDA Lab. Ces pages existent et fonctionnent, mais ne sont pas couvertes par ce manifeste précis — un script de monitoring externe basé uniquement sur ce fichier aurait une image incomplète du site réel.

## 3. Matrice des parcours utilisateurs (13 parcours du mandat)

| # | Parcours | Résultat du test réel | Problème trouvé |
| --- | --- | --- | --- |
| 1 | Visiteur découvrant DDA | OK — landing → #access, aucune fuite de chrome Academy | — |
| 2 | Inscription Free | OK — formulaire réel, consentement requis, validation | — |
| 3 | Première connexion | OK (mode local) ; mode BFF testé séparément (register/login/CSRF) | — |
| 4 | Accès au premier cours (M0.1) | OK — contenu authored complet | — |
| 5 | Progression dans les modules | OK — prérequis séquentiels respectés et testés | — |
| 6 | Visionnage des vidéos | **Partiel** — lecteur Vimeo + YouTube léger existent (Lot 1), mais aucune vidéo n'est actuellement rattachée à une leçon M0/M1 ; les 4 vidéos ajoutées vivent dans la Bibliothèque, pas dans le curriculum | Écart réel vs §5.1 |
| 7 | Exercices | OK — gating séquentiel, feedback, testé | — |
| 8 | Consultation progression | OK — chiffres réels, cohérents entre Progression/Profil/carte partageable | — |
| 9 | Découverte Premium | OK — paywall honnête avec titre/objectifs/durée réels | — |
| 10 | Accès contenus Premium autorisés | OK fonctionnellement, **mais protection frontend uniquement** | Écart réel vs §7.3 |
| 11 | DDA Lab | OK — parcours complet testé, LAB4/Capstone gating honnête | — |
| 12 | Section BRVM | **Incomplet** — contexte éditorial réel, mais aucune leçon/exercice/quiz BRVM dédié | Écart réel vs §6.1 |
| 13 | DDA AI | OK par rapport à l'honnêteté exigée (rien n'est simulé), mais **aucune fonctionnalité** n'existe | Écart réel vs §8, à construire |

## 4. BRVM — audit spécifique (§6 du mandat)

Ce qui existe réellement aujourd'hui dans `#markets` :
- Un bandeau éditorial (contexte UEMOA, méthode de lecture, glossaire).
- Un registre de publications **vide par construction** (aucune source vérifiée connectée — honnête, pas un bug).
- Une roadmap visuelle en 8 étapes, dont seules les étapes 1-2 (« vue d'ensemble », « formation BRVM ») sont marquées actives.
- M1.3 (« Comment les marchés s'organisent ») est la seule leçon authored qui touche réellement à la BRVM dans le curriculum principal.

Ce qui manque par rapport au §6.1 : introduction dédiée, fonctionnement de la bourse, actions/obligations, sociétés cotées, capitalisation, dividendes, rendement/risques, lecture d'informations boursières, analyse élémentaire, ordres de bourse, exercices, études de cas, quiz — **aucun de ces éléments n'existe comme module structuré**. C'est un chantier de contenu pédagogique complet, pas un ajustement.

## 5. Vidéos — audit spécifique (§5 du mandat)

- Lecteur Vimeo (`lesson.video` dans `LESSON_REGISTRY`) : fonctionnel, jamais utilisé par une leçon authored actuellement (aucune leçon M0/M1 ne déclare de champ `video`).
- Lecteur YouTube léger (Lot 1, nov. 2026) : miniature avant clic, `youtube-nocookie.com`, pas d'autoplay — fonctionnel, utilisé uniquement par `VIDEO_REGISTRY` → Bibliothèque DDA, pas par le curriculum.
- Les 4 vidéos communiquées (indicateurs, moyennes mobiles, volatilité Forex, cryptomonnaies) sont des Shorts courts et génériques, pas alignées sur une leçon précise du curriculum M0/M1 existant — les rattacher à une leçon spécifique nécessiterait une décision éditoriale (quelle leçon, quel moment) plutôt qu'un simple branchement technique.
- Aucune leçon n'est actuellement vide « à cause d'une vidéo indisponible » — toutes les leçons authored ont déjà un contenu textuel complet sans dépendre d'une vidéo.

## 6. Risques techniques

1. **Protection Premium frontend-only** (déjà signalé §0.2) — le risque n'est pas qu'un attaquant contourne un paiement réel (aucun n'existe), mais que l'architecture donne une fausse impression de sécurité si elle n'est pas corrigée avant l'activation commerciale.
2. **Pas de synchronisation serveur de la progression** — un changement d'appareil ou un cache vidé perd tout. Déjà documenté honnêtement dans l'UI, mais reste un risque produit réel pour la rétention.
3. **Chariow non activé** — aucun risque technique actif, mais aucun test de paiement réel n'a eu lieu ; la chaîne complète (webhook → signature → idempotence → entitlement) n'est validée qu'en environnement simulé.
4. **HTTPS forcé / headers de sécurité frontend** — toujours ouvert depuis l'audit du 27/10 (`https_enforced:false` sur GitHub Pages) ; hors de portée du code, nécessite un accès GitHub Pages admin ou une migration d'hébergeur.
5. **`manus-routes.json` désynchronisé** (§2.3) — risque faible mais réel si un outil de monitoring externe s'appuie uniquement sur ce fichier.

## 7. Priorités (P0/P1/P2)

**P0 — aucun trouvé.** Aucune route cassée, aucune page essentielle vide de façon inattendue, aucune redirection silencieuse, aucun bouton sans action, aucune faille de sécurité critique n'a été constatée par cet audit direct du code et des tests.

**P1 — consolidation réelle, à traiter en priorité :**
- Protection Premium côté serveur (brancher le gating de contenu Academy sur les entitlements BFF réels, pas seulement l'état local).
- Construire un socle pédagogique BRVM minimal (au moins une introduction + un module structuré, avant d'étendre).
- Rattacher au moins une vidéo réelle à une leçon authored existante, avec une décision éditoriale claire sur laquelle.
- Mettre à jour `manus-routes.json` pour refléter les routes réelles.
- Compléter l'identité juridique de l'éditeur dans les pages légales (dépend d'une information du fondateur).

**P2 — amélioration progressive, non bloquant pour le lancement :**
- DDA AI (assistant pédagogique réel) — chantier complet, pas un ajustement.
- Challenge BRVM, page partenaires, offre annuelle — tous explicitement dépendants d'une décision ou d'une information externe déjà identifiée dans les audits précédents.
- JSON-LD structuré par page, variantes de landing `/commencer/`.

## 8. Recommandations

1. Ne pas reconstruire ce qui fonctionne — Academy Free, DDA Lab, back-office, attribution et SEO sont solides et testés ; les toucher sans raison serait un risque pur.
2. Traiter la protection Premium serveur comme la priorité technique n°1 avant toute activation commerciale réelle — c'est le seul écart qui pourrait devenir un vrai problème de confiance si Premium devient payant sans lui.
3. Traiter BRVM comme un chantier de contenu, pas de code — la structure technique (registre, roadmap, honnêteté des données) est déjà la bonne base ; il manque des leçons écrites, pas une nouvelle architecture.
4. Garder DDA AI désactivé et honnêtement signalé jusqu'à ce qu'une vraie capacité existe — ne jamais céder à la tentation de simuler une réponse IA pour « avoir l'air complet ».
5. Le plan d'exécution détaillé (corrections P0/P1, dépendances, fichiers concernés, critères d'acceptation) fait l'objet du document séparé `DDA_REAJUSTEMENT_EXECUTION_PLAN_V1.md`.
