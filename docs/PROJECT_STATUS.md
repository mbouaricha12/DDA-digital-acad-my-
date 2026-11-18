# DDA — PROJECT_STATUS

**Dernière mise à jour :** 18 novembre 2026  
**Dépôt :** `mbouaricha12/DDA-digital-acad-my-`  
**Domaine :** `https://dariusdigitalacademy.com`  
**Branche de référence :** `origin/main` — `01165ab9c893249e69cd09fc627d7bb93b6ddc72`  
**Branche de travail actuelle :** `audit/dda-launch-readiness-20261118` (non fusionnée)

## État global

**Pré-lancement / pilote Free conditionnel.** Le frontend public est en production et les workflows du SHA de référence sont réussis. Le noyau M0 (trois leçons Free) est visible. Le paiement Premium et les intégrations réelles IA/marché/synchronisation n’ont pas été validés de bout en bout. Aucun paiement, secret ou changement de permission n’a été effectué dans cette tranche.

## Travail en cours

- Correctif local : `dist/learning-engine.js` retourne maintenant 0 % pour une leçon intacte; test ajouté `tests/test_learning_engine_progress_percent.js`.
- README actualisé pour corriger les affirmations d’architecture périmées.
- Rapport d’audit pré-lancement complet rédigé à `docs/DDA_AUDIT_COMPLET_PRE_LANCEMENT_2026-11-16.md`.
- Stratégie de travail multi-agent dans `docs/DDA_MULTI_AGENT_HANDOFF_2026-11-18.md`.
- Le fix et les documents ne sont pas encore vérifiés sur le domaine officiel : ils ne sont pas fusionnés/déployés.

## Statut des offres

- **DDA Free :** trois leçons M0; GO conditionnel pour un pilote avec smoke test réel.
- **M1 :** trois leçons authored et hors Free selon `/launch/`, mais le droit `advanced_modules` n’est pas confirmé côté BFF; les trois bundles sont accessibles anonymement en HTTP 200. Ne pas présenter M1 comme un contenu sécurisé ni l’offrir avant une PR serveur dédiée.
- **DDA Premium :** aperçu local, pas d’encaissement autorisé ni de parcours marchand vérifié.
- **Noms publics :** Free / Premium; `advanced_modules` est interne, et le mapping commercial définitif exige une décision produit.

## Points de contrôle avant déclaration « livré »

1. Relire le rapport et les registres (`EXECUTION_LOG`, `DECISION_LOG`, `RISK_REGISTER`).
2. Vérifier `git status`, `origin/main` et les PR ouvertes #271 et #299 avant tout changement.
3. Un agent par branche/worktree; ne pas modifier une zone possédée par une PR concurrente.
4. CI verte, merge explicitement autorisé, publication réelle, puis vérification sur `dariusdigitalacademy.com` et captures.
5. Ne jamais inscrire de secret, données de paiement ou identifiants utilisateur dans le dépôt, le rapport ou une PR.

## Prochaine action

Finaliser la PR de progression/documentation, faire relire ses tests, demander la revue/autorisation de merge au propriétaire et, seulement après merge, contrôler le correctif sur le domaine officiel.
