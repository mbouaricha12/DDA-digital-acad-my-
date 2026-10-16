# DDA — Rapport de préparation du lancement

**Date :** 16 octobre 2026  
**Branche :** `audit/lancement-final-2026-10-15`  
**PR de référence :** [#113](https://github.com/mbouaricha12/DDA-digital-acad-my-/pull/113)

## 1. Objet de la passe

Cette passe applique la mission suivante sans refaire l’audit général, sans reconstruire les écrans stables et sans activer de paiement. Les travaux ont été limités aux actions réalisables avec le dépôt actuel : préparer le pilote Free, écrire les scripts des huit vidéos, formaliser l’activation Premium et ajouter un contrôle automatisé de ces livrables.

## 2. Fichiers créés

| Fichier | Rôle |
|---|---|
| `docs/DDA_FREE_PILOT_CHECKLIST_2026-10-16.md` | Protocole destiné à 5–8 apprenants, parcours à observer, fiche de retour, critères de sortie et limites à communiquer. |
| `docs/DDA_VIDEO_SCRIPTS_V1_2026-10-16.md` | Huit scripts structurés pour M0.1, M0.2, M0.3, M1.1, M1.2, M1.3, P2.1 et P2.2. |
| `docs/DDA_PREMIUM_ACTIVATION_CHECKLIST_2026-10-16.md` | Checklist P0/P1 de l’identité juridique, Chariow, BFF, Supabase, webhooks, entitlements, sandbox et synchronisation. |
| `tests/test_launch_preparation_docs.js` | Contrat vérifiant la présence, la profondeur et les marqueurs critiques des trois documents. |
| `docs/DDA_LAUNCH_PREPARATION_REPORT_2026-10-16.md` | Rapport de cette passe, limites et prochaines actions. |

## 3. Pilote Free préparé

La checklist couvre le parcours complet disponible : landing, accès, onboarding, M0.1, M0.2, M0.3, M1.1, M1.2, M1.3, Progression, Journal et retours vers les leçons. Elle inclut les exercices, les quiz, le retry, la lecture de la progression, les tests mobile et desktop et la compréhension des modules encore à venir.

Le protocole recommande 5 à 8 apprenants, sans données bancaires, sans connexion de courtier et sans mot de passe. Il distingue les problèmes de compréhension, de contenu, d’interface et de technique. Aucun taux de succès marketing n’est inventé avant la première cohorte.

## 4. Scripts vidéo préparés

Les huit scripts contiennent chacun :

- objectif pédagogique ;
- plan ;
- explications / narration ;
- exemple concret ;
- erreurs à éviter ;
- conclusion et passage vers l’exercice existant.

Les scripts maintiennent les garde-fous DDA : exemples synthétiques, absence de promesse de gain ou de prédiction, distinction entre observation et signal, et preuve Premium décrite comme locale et non officielle.

Aucune vidéo n’a été déclarée publiée. L’audit conserve le fallback « séquence guidée » jusqu’à l’existence d’un fichier réel, de sous-titres, de droits vérifiés, d’une URL HTTPS et d’un test de lecture.

## 5. Activation Premium préparée

La checklist couvre les dépendances qui restent externes au dépôt :

- identité juridique, conditions de vente, remboursement, fiscalité et revue légale ;
- produit, prix, devise, fréquence et compte marchand Chariow ;
- URL publique HTTPS du BFF et `DDA_BFF_BASE_URL` ;
- secrets Supabase et Chariow côté serveur uniquement ;
- signature HMAC des webhooks Pulse ;
- rejet des événements inconnus, invalides, hors produit ou sans utilisateur ;
- idempotence et protection contre les rejouements ;
- activation, expiration et révocation des entitlements serveur ;
- tests de paiement sandbox ;
- synchronisation, export, suppression et conflits de données.

Le document contient un critère **Go / No-go**. Tant que les informations et comptes manquants ne sont pas fournis, le produit reste en pilote Free et aperçu Premium local, sans encaissement.

## 6. Corrections techniques

Aucune correction de page n’était nécessaire après lecture de l’audit et inspection de la branche. Les écrans et parcours stables n’ont pas été refactorisés. La seule logique ajoutée est un contrat de documentation, afin qu’une future modification ne puisse supprimer silencieusement un script vidéo, une étape du pilote ou une dépendance Premium essentielle.

## 7. Tests réels exécutés

| Test | Résultat |
|---|---|
| `node tests/test_launch_preparation_docs.js` | **PASS** |
| `node tests/run.js` | **54 passed, 0 failed** |
| `node tests/test_launch_final_audit.js` | **PASS** |
| Tous les `tests/test_*.js` et `tests/verify_*.js` | **54 fichiers, 0 échec** |
| `git diff --check` | **PASS** |
| Vérification syntaxique du nouveau contrat | **PASS** |

Les mentions de tests historiques dans `verify_route_register_consistency.js` sont des informations de classification et ne sont pas des échecs.

## 8. Blocages restants

Les éléments suivants ne peuvent pas être inventés ni activés depuis le dépôt seul :

1. identité juridique complète et juridiction de vente ;
2. produit, prix, devise, fréquence et compte marchand Chariow ;
3. URL publique et domaine définitifs du BFF ;
4. secrets Supabase, Chariow, session et webhook ;
5. migration Supabase appliquée dans un environnement de staging contrôlé ;
6. validation du cycle webhook → entitlement → accès → révocation ;
7. tests de synchronisation, export, suppression et reprise ;
8. fichiers vidéo, droits, sous-titres, miniatures et hébergement ;
9. retours d’un premier groupe d’apprenants réels.

## 9. Actions nécessitant le propriétaire DDA

À fournir avant l’activation Premium :

- identité et informations légales vérifiables ;
- choix commercial de l’offre et du prix ;
- accès sécurisé ou configuration des comptes Chariow et Supabase ;
- domaine / URL BFF autorisé ;
- politique de remboursement et conservation des données ;
- personnes autorisées à tester le staging ;
- validation des scripts et organisation du tournage vidéo ;
- décision sur la synchronisation multi-appareils.

Aucune clé secrète ne doit être envoyée dans une conversation, un commit, un ticket public ou un fichier de documentation.

## 10. Ordre de priorité suivant

1. Recruter le petit groupe Free et exécuter la checklist sans modifier les réponses des participants.
2. Regrouper les incompréhensions et corriger seulement les problèmes reproduits.
3. Valider les scripts avec le responsable pédagogique, puis produire les vidéos une par une.
4. Fournir les informations juridiques et décider de l’offre Premium.
5. Déployer le BFF et Supabase en staging avec secrets gérés.
6. Tester Chariow, les webhooks, les entitlements et la révocation.
7. Tester synchronisation, export et suppression.
8. Réaliser une revue humaine Go / No-go avant toute vente.

## Décision de cette passe

> Les préparatifs réalisables sont terminés. DDA Free peut passer à un pilote contrôlé. Premium reste un aperçu local / bêta non payante. Aucun paiement, accès serveur ou contenu vidéo n’est présenté comme opérationnel.
