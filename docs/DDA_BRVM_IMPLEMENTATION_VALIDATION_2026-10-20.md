# DDA — Validation technique de la migration SQL et du magasin BFF BRVM

**Date :** 20 octobre 2026  
**Branche auditée :** `feat/brvm-phase1-traceable`  
**Périmètre :** `0005_brvm_publications.sql`, magasin PostgREST BRVM, endpoint BFF, projection publique, contrats et E2E

## Verdict

**Implémentation techniquement cohérente et fail-closed pour le chemin de lecture, mais non encore opérationnelle en production.**

La migration protège correctement les tables privées, impose les transitions de statut, sépare les revues de droits et éditoriales, journalise les mutations et expose uniquement une projection filtrée. Le magasin BFF revalide les URL HTTPS, les dates, la récupération future, la fraîcheur et la forme des réponses. L’endpoint distingue correctement une indisponibilité du service d’un registre réellement vide.

La qualification « production » reste bloquée par des prérequis d’exploitation : migration non appliquée à Supabase, BFF non déployé, aucune source réelle ni autorisation de redistribution enregistrée, absence d’écran ou de workflow d’administration et absence de tâche de revalidation de fraîcheur.

## 1. Migration SQL — garanties validées

### Modèle de données

La migration crée trois tables privées :

- `dda_brvm_sources` pour l’identité, le périmètre, la licence, la politique de mise à jour et les revues de la source ;
- `dda_brvm_documents` pour le manifest, les dates, le checksum, les statuts d’import, de vérification, de fraîcheur et de publication ;
- `dda_brvm_audit_events` pour le journal append-only des mutations.

Les contraintes contrôlent les URL HTTPS, les longueurs, les types de document, les checksums SHA-256, les dates cohérentes, les identités de revue et les identifiants distincts des acteurs.

### Transitions

Les triggers imposent les workflows suivants :

```text
Source   : proposed → rights_pending → review_pending → approved
Document : draft → review_pending → approved → imported → published
```

Les rejets et expirations sont possibles selon le statut. Les identités de source et de document sont immuables. Un manifest approuvé ne peut pas être modifié silencieusement.

### Audit et séparation des rôles

Chaque mutation exige un acteur UUID issu des claims JWT et un rôle de base. Les revues des droits et de l’éditorial doivent être effectuées par deux identités distinctes. Une publication doit aussi être activée par un acteur distinct des deux relecteurs.

Les suppressions sont journalisées avant leur exécution. La fonction trigger est `SECURITY DEFINER` avec `search_path` fixé à `pg_catalog, public`, ce qui réduit le risque de résolution de fonctions ou d’objets non maîtrisés.

### RLS et privilèges

Les tables privées sont protégées par RLS et les rôles `anon`/`authenticated` n’ont aucun accès. Le BFF n’a pas de droit d’écriture sur les tables BRVM. Il lit uniquement la vue `dda_brvm_publications`, qui ne renvoie que les documents :

- publiés ;
- importés avec succès ;
- vérifiés ;
- actuels ;
- autorisés à la redistribution ;
- rattachés à une source approuvée ;
- dont `fresh_until` n’est pas dépassé.

Cette séparation respecte la règle selon laquelle le navigateur ne peut ni approuver une source ni activer une publication.

## 2. Magasin BFF — garanties validées

`PostgrestBrvmPublicationStore` sélectionne explicitement les colonnes nécessaires au rendu et n’expose pas les détails de licence, les relecteurs ou les erreurs internes.

Avant de renvoyer une ligne au BFF, il contrôle :

- la présence des identifiants et métadonnées de rendu ;
- les URL HTTPS sans identifiant ni mot de passe ;
- la validité de `reference_date`, `retrieved_at` et `fresh_until` ;
- `retrieved_at >= reference_date` ;
- `retrieved_at <= maintenant` ;
- `fresh_until > maintenant`.

Une réponse PostgREST non-2xx, un JSON invalide ou une forme inattendue déclenche une erreur. Le magasin ne convertit pas un incident de base en liste vide.

## 3. Endpoint BFF — garanties validées

L’endpoint de lecture est :

```http
GET /v1/publications/brvm
```

Comportements vérifiés :

- magasin absent : HTTP `503` avec `publications_unavailable` ;
- erreur du magasin : HTTP `500` sans fuite du message privé ;
- registre valide vide : HTTP `200` avec `{ "items": [] }` ;
- publication admissible : HTTP `200` avec les seules métadonnées publiques ;
- absence de cookie apprenant requise pour la lecture publique ;
- `Cache-Control: no-store` présent ;
- aucune écriture ou route d’administration exposée par cet endpoint.

## 4. Contrôles exécutés

### Contrats ciblés

Tous les contrôles suivants ont réussi :

- `test_brvm_publication_server.js` ;
- `test_brvm_server_model_contract.js` ;
- `test_brvm_source_governance_contract.js` ;
- `test_brvm_publications_safety_contract.js` ;
- `test_p3_migration_inventory.js` ;
- `test_rls_policy_audit.js`.

### Régression globale

- Tous les contrats `tests/test_*.js` : réussite.
- Suite Playwright : **58 scénarios réussis, 0 échec**.
- Syntaxe `app.js`, `server.js` et `brvm-publication-store.js` : OK.
- `git diff --check` : OK.
- Tests BRVM navigateur : état vide, réponse BFF vide, réponse vérifiée, échappement HTML, erreur `503`, responsive 360/390/1440 px : OK.

Le smoke test `tests/smoke_app_boot.js` n’a pas été exécuté car `jsdom` n’est pas installé dans l’environnement. Il s’agit d’une limite d’environnement, pas d’un échec fonctionnel observé dans les tests Playwright ou les contrats Node.

## 5. Points non bloquants mais à renforcer

### Validation des URL

Le magasin vérifie le protocole HTTPS mais ne maintient pas une allowlist de domaines. Cette décision est compatible avec le support futur de fournisseurs sous licence, mais l’approbation humaine doit confirmer que chaque domaine correspond bien à la source déclarée.

### Fraîcheur

La vue SQL et le magasin excluent correctement les documents dont `fresh_until` est dépassé. En revanche, aucun scheduler ou worker ne renouvelle les contrôles. Sans tâche de revalidation, les documents deviendront automatiquement invisibles mais ne seront pas proactivement réexaminés.

### Administration

Les droits SQL sont volontairement trop restrictifs pour permettre une administration applicative. C’est sûr pour le pilote, mais une future console d’administration devra utiliser un rôle serveur dédié, une séparation stricte des rôles et un mécanisme d’écriture auditable. Le BFF de lecture ne doit pas recevoir ces droits.

### Exploitation

Le endpoint public devrait recevoir ultérieurement une politique de limitation de débit, une surveillance des erreurs, une alerte d’expiration et une procédure de retrait urgente. Ces éléments ne sont pas nécessaires pour maintenir le registre vide actuel, mais ils sont nécessaires avant l’ajout d’un premier document réel.

## 6. Blocages de mise en production

La migration ne doit pas être appliquée à Supabase avant que les décisions suivantes soient documentées :

1. source BRVM ou fournisseur sous licence retenu ;
2. autorisation de référencement et, séparément, droit de copie ou d’extraction ;
3. politique de conservation et de retrait ;
4. délais de fraîcheur par type de document ;
5. identité des responsables des droits et de la revue éditoriale ;
6. environnement Supabase cible ;
7. domaine BFF et gestion des secrets ;
8. procédure de restauration et de révocation.

## Conclusion

Le chemin de lecture est suffisamment robuste pour poursuivre la préparation sans exposer de données fictives. La prochaine action ne doit pas être d’insérer une publication directement en base. Elle doit être de valider le dossier source, d’appliquer la migration dans un environnement contrôlé, de tester un manifest non public, puis de faire un premier cycle complet `draft → review_pending → approved → imported → published` avec audit et retrait testés.
