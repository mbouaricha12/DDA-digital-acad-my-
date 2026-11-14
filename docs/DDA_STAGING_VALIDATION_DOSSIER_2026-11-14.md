# DDA — Dossier de validation finale staging

**Date :** 14 novembre 2026
**Nature :** consolidation de l'état réel du dépôt en vue d'une validation staging. Ne constitue ni une déclaration de lancement, ni une exécution de smoke test production (voir section 5), ni une activation commerciale.
**Historique :** ce dossier succède à `docs/DDA_LAUNCH_FINAL_REPORT_2026-11-05.md` et `docs/DDA_FREE_PILOT_CHECKLIST_2026-10-16.md` — beaucoup a changé depuis (P0 identité corrigé et déployé, DDA Lab audité et renforcé, backlog de PR intégralement fusionné) ; ce document reflète l'état au 14 novembre, pas une réécriture de l'historique.

## 1. État de la suite de tests (preuve locale)

| Suite | Résultat au 14/11 |
|---|---|
| `tests/test_*.js` (contrats Node) | Tous PASS |
| `tests/verify_route_register_consistency.js` | PASS |
| `tests/run.js` (harnais navigateur réel) | **128 passed, 0 failed** |
| `tests/test_dda_lab_contract.js` | 16/16 PASS |
| `tests/test_landing_presentation_video_contract.js` (nouveau) | 4/4 PASS |

Flake connu et documenté, non lié à une régression : `tests/test_signup_reliability_e2e.js`, scénario « I+J. forgot password → reset → login » — intermittent sous charge CPU contrainte, confirmé PASS en isolation à chaque reprise.

## 2. DDA Lab — statut

Déjà consolidé dans `docs/DDA_LAB_STAGING_VALIDATION_2026-11-13.md` : LAB1–LAB3 Free et LAB4/Capstone Premium audités, aucune anomalie concrète restante, gap de test (Capstone, overflow mobile LAB4/LABCAP) corrigé. **GO staging** pour ce lot, sous réserve d'une recette humaine tactile réelle (non automatisable).

## 3. Landing — éléments vérifiés sans refonte

- **CTA** : « Commencer gratuitement » présent et fonctionnel au hero et en CTA final, vérifié par `tests/run.js` (sections hero + funnel).
- **Inscription Free** : parcours signup → confirmation → login couvert bout en bout, y compris à 390px mobile (scénario K de `test_signup_reliability_e2e.js`).
- **Parcours mobile** : aucun débordement horizontal détecté à 360/390/1440px sur les surfaces testées (landing, Academy, Lab, Premium, back-office) — confirmé par les contrôles `scrollWidth <= innerWidth` existants, tous PASS.
- **SEO** : `index.html` et les pages publiques (`live/`, `business/`, `experts/`, `community/`, `ai/`) ont chacune un canonical, Open Graph et Twitter Card complets, pointant vers une image OG réellement présente sur disque (`images/dda-og-image.jpg`). `academy.html` et `go/index.html` sont `noindex, nofollow` **intentionnellement** (ce ne sont pas des pages à indexer) — vérifié, pas une anomalie.
- **Anomalie réelle constatée et corrigée** : aucune. Rien n'a été trouvé cassé dans ce lot ; seule une préparation additive a été faite (section 4).

## 4. Vidéo de présentation — harnais d'intégration préparé

À partir du script/storyboard déjà validé (`docs/DDA_LANDING_VIDEO_SCRIPT_STORYBOARD_2026-11-13.md`), le point d'intégration technique est maintenant prêt dans `dist/index.html`/`dist/public.js` :

- Une section `#landing-presentation-video` existe juste après le hero, **`hidden` par défaut**.
- Le CSP de `index.html` autorise déjà `i.ytimg.com` (miniature) et `youtube-nocookie.com` (lecture), mêmes règles qu'`academy.html`.
- Tant que `LANDING_PRESENTATION_VIDEO.url` (dans `public.js`) reste vide, **aucune requête vers YouTube n'est jamais émise** et la section reste invisible — vérifié par test automatisé.
- Une fois la vidéo finale produite et son URL YouTube validée, l'activer ne demande qu'une seule ligne à renseigner — aucun autre changement de code.
- Aucune vidéo n'est produite par ce dossier ; aucun ID n'a été fabriqué.

## 5. Ce qui N'EST PAS validé ici (et pourquoi)

| Élément | Statut | Raison |
|---|---|---|
| Smoke test production (2 comptes réels) | **Non exécuté** | Réseau sortant bloqué dans cet environnement vers `dariusdigitalacademy.com` (confirmé, 403 proxy egress). Script prêt : `scripts/smoke_test_production.js` + `docs/DDA_PRODUCTION_SMOKE_TEST.md`. |
| Vidéo de présentation réelle | Non produite | En attente de production (montage réel) — script/storyboard et captures de référence déjà livrés. |
| Source BRVM réelle | Non connectée | En attente d'une source autorisée (voir `docs/DDA_BRVM_INTEGRATION_ARCHITECTURE_2026-11-13.md`) ; état vide honnête déjà en place. |
| SaSPay | Non intégré | En attente des informations réelles SaSPay (voir `docs/DDA_SASPAY_INTEGRATION_PREP_2026-11-13.md`) ; Chariow reste seul actif. |
| Déploiement staging/production réel | Non fait | Aucune autorisation de déploiement reçue — ce dossier prépare la validation, il ne la déclenche pas. |

## 6. Verdict

**GO staging pour Academy Free, DDA Lab (Free + Premium aperçu) et landing**, sous réserve de la recette humaine listée en section 5. **NO-GO commercial Premium/paiement** inchangé — Chariow reste la seule intégration active, non modifiée. Aucun déploiement production n'est recommandé sans l'autorisation explicite du fondateur et sans l'exécution réelle du smoke test (section 5).
