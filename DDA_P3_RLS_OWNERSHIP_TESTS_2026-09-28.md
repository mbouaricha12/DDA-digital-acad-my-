# DDA Academy — Policies RLS et tests négatifs

**Projet :** `dda-academy-p3`  
**Project ref :** `vcvrjogdhdakrwmemoxl`  
**Région :** `eu-west-1` — Ireland  
**Date :** 28 septembre 2026

## Migrations appliquées

- `p3_rls_ownership_policies` — policies `auth.uid()`.
- `p3_rls_authenticated_grants` — privilèges SQL minimaux nécessaires à l’évaluation des policies.

## Policies effectives

### `public.dda_profiles`

Le rôle `authenticated` peut uniquement :

- lire une ligne dont `user_id = auth.uid()` ;
- créer une ligne dont `user_id = auth.uid()` ;
- modifier une ligne dont `user_id = auth.uid()` ;
- supprimer une ligne dont `user_id = auth.uid()`.

### `public.dda_sessions`

Le rôle `authenticated` peut uniquement lire ses propres sessions. Il ne peut pas insérer, modifier ou supprimer directement une session. La création, la rotation et la révocation restent du ressort du BFF/service role.

## Test négatif exécuté

Le test a inséré deux identités et leurs fixtures dans une transaction, puis a simulé successivement les claims :

- utilisateur A : `11111111-1111-4111-8111-111111111111` ;
- utilisateur B : `22222222-2222-4222-8222-222222222222`.

Pour chaque identité, le test a vérifié :

- lecture de sa propre ligne de profil : 1 ligne ;
- lecture de la ligne de l’autre compte : 0 ligne ;
- modification croisée : 0 ligne modifiée ;
- suppression croisée : 0 ligne supprimée ;
- lecture de sa propre session : 1 ligne ;
- lecture de la session de l’autre compte : 0 ligne.

Résultat : **`RLS_NEGATIVE_TESTS_PASS`**.

Les fixtures et les identités de test ont été annulées par `ROLLBACK`. Aucun compte permanent ni donnée de test ne reste dans le projet.

## Contrôle advisor

L’advisor sécurité Supabase ne retourne plus d’alerte `rls_enabled_no_policy` après la migration. Les deux tables restent RLS-enabled.

## Limites

Les tables métier P3.1 ne sont pas encore créées. Chaque future table user-owned devra recevoir une policy `auth.uid()` équivalente avant toute exposition. Les tables authored, memberships, entitlements, proofs et audit doivent conserver des règles distinctes et ne jamais accepter une autorité provenant du navigateur.
