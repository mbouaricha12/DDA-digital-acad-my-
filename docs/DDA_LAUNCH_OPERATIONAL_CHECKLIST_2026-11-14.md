# DDA — Checklist opérationnelle du lancement (pilote Free)

**Date :** 14 novembre 2026
**Portée :** ouverture d'un pilote Free. N'inclut aucune activation Premium/paiement (hors périmètre, Chariow reste inchangé et non modifié par ce document).
**Nature :** liste de vérification opérationnelle. Chaque case non cochée nécessite une action humaine (décision, accès, ou exécution hors de cette session) — rien n'est déclaré fait ici qui ne soit vérifié.

## 1. Avant l'ouverture (pré-lancement)

- [x] CI verte sur `main` : CodeQL, Product Gate, E2E, RLS audit — tous les checks requis passent (confirmé par l'historique de fusion des PR de cette session).
- [x] Suite de tests locale complète verte (voir `docs/DDA_STAGING_VALIDATION_DOSSIER_2026-11-14.md`, §1).
- [x] DDA Lab audité et stabilisé (Free + Premium aperçu).
- [ ] **Smoke test production avec deux comptes réels exécuté** — script prêt (`scripts/smoke_test_production.js`), non exécuté (réseau indisponible dans cette session). À faire par un humain ou un environnement CI avec accès réseau avant toute annonce publique.
- [ ] **Recette manuelle sur appareil physique** (pas seulement un viewport simulé) pour Academy Free et DDA Lab.
- [ ] Vérification manuelle que le domaine `dariusdigitalacademy.com` et son HTTPS sont bien servis depuis la dernière version de `main` (GitHub Pages).
- [ ] Vérification que les secrets/variables d'environnement BFF réels (Supabase, Chariow, Resend) sont configurés sur l'environnement de production réel — hors de la portée de ce dépôt de code.

## 2. Transparence produit (non négociable avant toute communication)

- [x] Aucune fonctionnalité non activée n'est présentée comme disponible dans le code (Premium = aperçu local, BRVM = état vide honnête, DDA AI = hors ligne sans BFF configuré) — vérifié par les tests de contrat existants.
- [x] Les mentions légales/CGU/confidentialité du site public indiquent explicitement le statut provisoire de l'entité (`dist/public.js`, documents légaux).
- [ ] Confirmer que la communication de lancement (réseaux sociaux, Telegram, WhatsApp) reprend le même langage honnête que le produit — hors du périmètre technique de ce dépôt, à valider par le fondateur avant publication.

## 3. Support et canaux (déjà en place dans le code)

- [x] E-mail de contact officiel configuré et affiché : `dariusdigitalacademy@gmail.com`.
- [x] Canal Telegram et chaîne WhatsApp officiels liés depuis le site public (`dist/public.js`, document « contact »).
- [ ] Vérifier que ces canaux sont activement surveillés dès l'ouverture du pilote (organisationnel, hors code).

## 4. Supervision technique au lancement

- [x] Workflow `production-availability.yml` (alertes Resend en cas d'échec du health check production) fusionné et actif (PR #259).
- [ ] Confirmer la configuration réelle des secrets `RESEND_API_KEY`/`RESEND_FROM_EMAIL` sur l'environnement GitHub Actions (documenté dans `docs/PRODUCTION_AVAILABILITY_ALERTS.md`, non vérifiable depuis cette session).
- [ ] Désigner qui surveille activement les alertes et les canaux de support pendant les premières 48h du pilote.

## 5. Plan de retour arrière (rollback)

- [ ] Confirmer la procédure de rollback GitHub Pages (revert du commit de déploiement sur `main` + re-déclenchement du workflow Pages) — procédure standard GitHub, non testée spécifiquement dans cette session.
- [ ] Confirmer qu'aucune migration Supabase irréversible n'est appliquée au moment du lancement Free (aucune migration Premium/BRVM/SaSPay n'est prévue à ce stade — voir dossiers de préparation correspondants).

## 6. Après l'ouverture (premiers jours)

- [ ] Suivre les métriques d'acquisition déjà instrumentées (`dda-analytics.js`, événements `landing_viewed`, `hero_cta_click`, `landing_section_reached`) pour observer l'usage réel.
- [ ] Collecter les retours du pilote via les canaux de support (section 3) et les classer : anomalie concrète vs amélioration future — ne pas transformer un retour en refonte non demandée.
- [ ] Revisiter ce dossier et celui de staging (`DDA_STAGING_VALIDATION_DOSSIER_2026-11-14.md`) après la première semaine pour objectiver ce qui a tenu et ce qui doit être corrigé.

## 7. Ce que cette checklist ne couvre pas (volontairement)

- Activation Premium/paiement — reste NO-GO, Chariow non modifié, SaSPay non connecté.
- Connexion d'une source BRVM réelle.
- Production et intégration de la vidéo de présentation réelle (harnais prêt, voir §4 du dossier staging).
- Toute décision commerciale ou juridique (identité de l'éditeur, conformité pays) — hors périmètre technique.

**Aucune case non cochée ci-dessus ne doit être présentée comme faite avant qu'elle le soit réellement.**
