# DDA — EXECUTION_LOG

Journal append-only. Les heures sont UTC lorsque disponibles. Ne pas réécrire les entrées historiques; ajouter une nouvelle entrée à chaque passe.

## 2026-11-18 — Audit pré-lancement et consolidation

- **Base vérifiée :** `origin/main` SHA `01165ab9c893249e69cd09fc627d7bb93b6ddc72`; domaine officiel `dariusdigitalacademy.com`.
- **Régression corrigée en branche de travail :** progression d’une leçon jamais commencée initialisée à 0 %, test dédié ajouté. Non publiée, aucune affirmation de correction en production.
- **Documentation :** README actualisé; rapport complet, protocole de handoff et quatre registres opérationnels créés.
- **Tests locaux après le correctif :** 118 fichiers de tests Node/smoke, 0 échec; Playwright `tests/run.js`, 128 passés, 0 échec.
- **CI sur le SHA de production :** workflow Pages/deploy, DDA E2E, code coverage, CodeQL Advanced et availability monitor en succès.
- **Web public :** 12 URLs du sitemap en HTTP 200 sans redirection; 5 pages futures en 200 avec `noindex, follow`, hors sitemap; Academy reste non indexable.
- **Responsive/preuves :** captures homepage 360/390/768/1366/1440/1920/2560 px; `/launch/` et `/academy.html` à 390 px. Archive: `/home/ubuntu/dda-prelaunch-evidence/DDA-live-audit-evidence-2026-11-18.zip`.
- **Lighthouse mobile (un run homepage) :** score 0,71; LCP 4,4 s; CLS 0; TBT 340 ms; Speed Index 5,3 s; INP non mesuré.
- **Sécurité :** PR #245 fusionnée (identité apprenant); PR #121 fermée sans merge. Rate limit, sessions inactives, transitions de billing monotones et tests présents dans la base auditée; aucune validation de staging réelle.
- **PR concurrentes préservées :** #299 et #271 encore ouvertes au contrôle; leurs branches non modifiées.
- **Actions interdites/non effectuées :** aucun merge, paiement, activation de clé, déploiement de branche ou changement de permissions.

## Prochaine entrée

Ajouter le SHA du commit et l’URL de PR lorsque la branche de travail est poussée. Après approbation/merge, consigner le SHA réellement déployé, le résultat du monitor, les parcours testés et les captures actualisées.

## 2026-11-18 — Constat complémentaire : gate serveur M1

- `canUnlock()` exige une confirmation BFF pour `premium_track`, mais `advanced_modules` retombe sur `DDA.can()` côté client.
- `m1-1-lesson.js`, `m1-2-lesson.js` et `m1-3-lesson.js` répondent anonymement en HTTP 200 depuis le domaine officiel (tailles observées : 10 720, 11 411 et 13 261 octets).
- Le libellé de `/launch/` reste exact (M1 hors Free), mais le gate technique est contournable et ne constitue pas une autorisation serveur.
- Aucun code, contenu pédagogique ou droit M1 modifié ici. À traiter dans une PR sécurité séparée avant toute offre M1/avancée; critères : bundles absents de `dist/`, BFF refuse sans droit, autorise seulement avec entitlement serveur actif.
