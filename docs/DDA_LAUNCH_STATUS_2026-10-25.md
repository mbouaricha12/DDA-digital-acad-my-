# DDA — Point de situation lancement (25 octobre 2026)

**Dépôt :** `mbouaricha12/DDA-digital-acad-my-`
**Base auditée :** `main` — `420c820` (après fusion des PR #125, #126, #127, #128)
**Document précédent :** `docs/DDA_LAUNCH_PREPARATION_REPORT_2026-10-16.md` (16 octobre 2026)

## 1. Objet de cette passe

Ce document ne refait pas l'audit général du 15-16 octobre : il constate ce qui a changé depuis, avec preuve à l'appui (tests réels exécutés sur ce commit), et met à jour la liste des blocages. Les conclusions du 16 octobre restaient correctes sur le fond — Premium commercial bloqué, vidéos non produites, pilote non exécuté — mais plusieurs correctifs techniques réels ont été livrés depuis et doivent être enregistrés.

## 2. Changements livrés depuis le 16 octobre

| PR | Changement réel | Preuve |
|---|---|---|
| #125 | `handleChariowPulse` ne perd plus silencieusement un paiement après échec de transition ; `claim()` devient un compare-and-swap atomique (`WHERE processed_status=eq.failed`) | `tests/test_p4_chariow_billing.js`, `tests/test_billing_store.js` |
| #127 | `business-store.js` et `bff/supabase/schema.sql` resynchronisés sur les vraies migrations `supabase/migrations/0001-0007` (les 4 tables métier avaient un préfixe `dda_` inventé, absent des migrations réelles — tout appel Supabase réel aurait échoué en 404) ; SEO (sitemap/robots), pages légales lisibles sans JS, en-têtes CSP compatibles GitHub Pages, CTA trompeurs corrigés ; anneau de progression réel sur l'écran Progression | `tests/test_business_store_table_names_contract.js`, `tests/test_seo_sitemap_robots_contract.js`, `tests/test_security_headers_contract.js`, `tests/test_public_autonomous_pages.js` |
| #126 | Validation d'identité Chariow durcie (UUID DDA obligatoire, référence fournisseur obligatoire), métadonnées `license.*` corrigées, gestion complète des erreurs JSON invalide, XSS réel corrigé dans `renderPracticeProof()` | `tests/test_p4_chariow_billing.js`, tests navigateur |
| #128 | Grants trop larges retirés de `bff/supabase/schema.sql` (insert/update/delete inventés sur 4 tables métier, policies jamais prévues par les migrations réelles où toute écriture passe par le service-role du BFF) ; `GRANT select` manquants ajoutés, sans quoi les policies `select` restaient inertes malgré le `REVOKE ALL` | `tests/test_p3_business_schema.js` |

Aucun de ces correctifs n'active une intégration réelle (pas d'appel Supabase/Chariow en production, pas de paiement). Ils corrigent des défauts qui auraient fait échouer la première intégration réelle, le jour où les secrets et l'environnement de staging seraient fournis.

## 3. Tests réels exécutés sur ce commit (420c820)

| Commande | Résultat |
|---|---|
| Les 67 `tests/test_*.js` | **67/67 PASS** |
| `tests/verify_route_register_consistency.js` | **PASS** (18 routes, 38 lignes de registre) |
| `node tests/run.js` (régression navigateur complète) | **61 passed, 0 failed** |

## 4. État commercial du lancement — mise à jour

Inchangé par rapport au 16 octobre sur le fond :

| Périmètre | État |
|---|---|
| DDA Free | **PRÊT POUR PILOTE CONTRÔLÉ** — checklist déjà rédigée (`DDA_FREE_PILOT_CHECKLIST_2026-10-16.md`), jamais exécutée avec de vrais apprenants |
| Premium local | **PRÊT POUR DÉMONSTRATION / BÊTA NON PAYANTE** |
| Premium commercial | **TOUJOURS BLOQUÉ** — la fondation technique est plus solide qu'au 16/10 (grants corrigés, webhook durci), mais rien de cela ne remplace les dépendances externes ci-dessous |
| Vidéos | **TOUJOURS NON PRÊTES** — 8 scripts rédigés (`DDA_VIDEO_SCRIPTS_V1_2026-10-16.md`), aucun tournage |

## 5. Blocages restants — aucun ne peut venir du dépôt seul

Reconduits depuis le 16 octobre, toujours non résolus :

1. Identité juridique complète et juridiction de vente (éditeur, statut, adresse, mentions commerciales)
2. Produit, prix, devise, fréquence et compte marchand Chariow réel
3. URL publique et domaine définitifs du BFF, déployés en staging
4. Secrets Supabase, Chariow, session et webhook — jamais fournis à ce dépôt ni à cette session
5. Migrations Supabase (0001-0007, prêtes et testées en local) jamais appliquées sur un vrai projet Supabase
6. Cycle webhook → entitlement → accès → révocation jamais validé en conditions réelles
7. Synchronisation multi-appareils, export, suppression — jamais testés en environnement serveur
8. Fichiers vidéo, droits, sous-titres, hébergement
9. Retours d'un premier groupe d'apprenants réels — le pilote n'a jamais été exécuté

## 6. Ce qui reste réalisable depuis le dépôt seul

Honnêtement, très peu : le travail de correction technique interne (schémas, sécurité, SEO, accessibilité, design) a été mené aussi loin que possible sans les dépendances externes listées en section 5. Les prochaines actions à forte valeur ne sont plus du code :

1. Recruter 5-8 apprenants et exécuter le pilote Free (checklist prête).
2. Fournir l'identité juridique et le choix commercial de l'offre Premium.
3. Créer/configurer les comptes Supabase et Chariow réels, fournir les secrets de façon sécurisée (jamais dans une conversation, un commit ou un ticket public).
4. Valider les scripts vidéo et lancer le tournage.
5. Une fois 2-3 fournis : appliquer les migrations en staging, câbler `DDA_BFF_BASE_URL`, tester le cycle webhook complet en sandbox.

## Décision de cette passe

> Aucune régression introduite, aucun paiement activé, aucune clé secrète ajoutée. L'état technique interne du dépôt est maintenant cohérent avec les migrations versionnées (la fondation BFF/Supabase ne contient plus de défauts connus qui auraient fait échouer la première intégration réelle). Le blocage vers la commercialisation reste entièrement du côté des dépendances externes listées en section 5, inchangées depuis le 16 octobre.
