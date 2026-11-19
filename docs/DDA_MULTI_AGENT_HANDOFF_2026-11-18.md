# DDA — Protocole de handoff multi-agent

**Mis à jour :** 18 novembre 2026  
**Dépôt de référence :** `mbouaricha12/DDA-digital-acad-my-`  
**SHA de départ :** `01165ab9c893249e69cd09fc627d7bb93b6ddc72`  
**Règle d’autorité :** seul le propriétaire du produit autorise merge, déploiement public, dépenses, activation de compte marchand ou de secrets.

## 1. Lecture obligatoire avant intervention

Chaque agent lit, dans cet ordre :

1. `docs/PROJECT_STATUS.md`
2. `docs/DDA_AUDIT_COMPLET_PRE_LANCEMENT_2026-11-16.md`
3. `docs/EXECUTION_LOG.md`, `docs/DECISION_LOG.md`, `docs/RISK_REGISTER.md`
4. `README.md` et les contrats/tests du domaine qu’il touche
5. État live du domaine officiel si sa tâche concerne une capacité visible

Confirmer par écrit : SHA de départ, branche de travail, fichiers qu’il possède, hypothèses, tests prévus et critères d’acceptation. Ne jamais supposer que les anciens documents ou les branches de PR reflètent `main`.

## 2. Règles Git d’isolation

- Un agent = une branche et idéalement un worktree séparé. Ne jamais travailler sur le même checkout/branche en parallèle.
- Actualiser `origin/main`, créer une branche dédiée (`agent/<nom>/<scope>-YYYYMMDD`) et ne pas baser une nouvelle tâche sur une branche d’agent non fusionnée.
- Pas de force-push, pas de modification directe de `main`, pas de commit d’un fichier possédé par une autre PR sans coordination explicite.
- Une PR déclare ses fichiers, ses tests, les limites non testées et le SHA parent; elle ne fusionne jamais une PR concurrente implicitement.
- Les secrets, tokens, noms/emails de test, identifiants de clients et clés de paiement ne vont ni dans les commits, logs, screenshots publics ni dans les prompts partagés.
- Aucune action de paiement, dépense, création de produit marchand, merge ou publication n’est autorisée par ce protocole.
- Une preview CI n’est pas une preuve de livraison. Après merge autorisé, attendre le workflow de production, vérifier l’URL officielle et joindre une capture horodatée.

Exemple de worktree isolé :

```bash
git fetch origin
git worktree add ../DDA-agent-auth -b agent/<nom>/auth-smoke-20261118 origin/main
cd ../DDA-agent-auth
```

Avant une PR :

```bash
git status --short --branch
git diff --check
# Exécuter les contrats du domaine, puis tests/run.js si l’environnement le permet.
```

## 3. Ownership proposé (aucun chevauchement)

| Responsable | Lot | Fichiers / surface autorisés | Sortie et limites |
|---|---|---|---|
| **Manus / intégration** | Correctif progression 0 % + audit et registres | `dist/learning-engine.js`, son test dédié, README et `docs/*` du rapport/registres | PR isolée; ne pas toucher aux entitlements, paiement ou pages produit. La correction n’est déclarée qu’après déploiement/domain check. |
| **DeepSeek sur Windows** | Revue en lecture seule du gate M1, de `advanced_modules` et de l’UX/contrat existant | Aucun fichier modifiable dans la première passe; livrer un mémo de findings et cas de test | Confirmer si l’interface utilise les labels Free/Premium, où intervient le gate et si la page de lancement reste cohérente. Ne pas changer le code, les droits ou la copie. |
| **Agent backend dédié (après approbation)** | Revue server-side entitlements / auth / Supabase staging | `bff/src/*`, schéma/migrations et tests BFF uniquement; propriétaire explicite par PR | Commencer par un plan de test; aucun accès réel sans environnement fourni par le propriétaire; aucun checkout ou déploiement. Éviter `dist/app.js`. |
| **Agent QA navigateur** | Parcours public Free après autorisation d’un compte de test | Tests navigateur/evidence exclusivement; pas de code produit, pas d’identifiant/PII durable dans les captures | Tester CTA → première leçon → quiz → progression et viewport; comparer au domaine réel. Un simple screenshot ne prouve pas le backend. |
| **Propriétaire produit/exploitation** | Décisions commerciales et secrets | Dashboard sécurisé du fournisseur seulement, jamais dépôt/chat | Confirmer mapping de l’offre, politique commerciale, comptes de test et autorisations avant staging; aucun prix ou paiement n’est présumé. |

### Branches concurrentes déjà ouvertes au contrôle

- **#299** — optimisation du transfert d’image Dashboard; ne pas modifier ses fichiers ou réutiliser sa branche.
- **#271** — revert de la vidéo institutionnelle de landing; décision visuelle distincte, ne pas fermer/fusionner dans cette tâche.
- **#245** est fusionnée; **#121** est fermée sans merge. Comparer les protections présentes dans `main`; ne pas cherry-pick ces branches en bloc.

## 4. Prompt prêt à transmettre à DeepSeek (lecture seule)

> Tu travailles sur DDA, dépôt `mbouaricha12/DDA-digital-acad-my-`, à partir du SHA `01165ab9c893249e69cd09fc627d7bb93b6ddc72`. Commence par lire `docs/PROJECT_STATUS.md`, le rapport pré-lancement et les quatre registres. Tâche strictement en lecture seule : retrace la permission `advanced_modules` de M1.1–M1.3 dans le registre des leçons, l’UI et les contrats; distingue permission client locale et autorisation BFF réellement imposée; compare au libellé public de `/launch/` et au vocabulaire Free/Premium. Constat déjà vérifié : le gate `premium_track` consulte le serveur, mais `advanced_modules` suit le gate local et les trois fichiers `m1-*.js` répondent publiquement en 200. Vérifie le chemin exact et les limites de cette conclusion sans modifier le contenu. N’édite aucun fichier, ne crée aucune branche de livraison, ne change aucun droit, prix, texte public ou secret. Retourne : (1) chemins/lignes probants, (2) flux d’autorisation réel, (3) divergences, (4) cas de tests minimaux, (5) incertitudes qui exigent une décision du propriétaire. N’annonce pas M1 comme Free et ne transforme pas une permission technique en produit commercial.

## 5. Contrat de sortie par agent

Chaque agent remet :

1. SHA de base et identifiant de branche/PR;
2. fichiers possédés et fichiers modifiés;
3. comportements constatés (code / interface / production) séparés;
4. commandes/tests exécutés avec résultats exacts;
5. cas négatifs testés et limitations non testées;
6. risques nouveaux et dépendances du propriétaire;
7. déclaration explicite « aucune opération externe/dépense/merge effectuée » lorsqu’applicable.

L’intégrateur met à jour `PROJECT_STATUS`, `EXECUTION_LOG`, `DECISION_LOG` et `RISK_REGISTER` sans effacer les décisions historiques. Aucun agent ne marque une fonctionnalité « disponible » avant la vérification sur `dariusdigitalacademy.com` après un merge autorisé.
