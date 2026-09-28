# DDA Academy — Bootstrap Supabase P3

**Date :** 28 septembre 2026  
**Projet :** `dda-academy-p3`  
**Project ref :** `vcvrjogdhdakrwmemoxl`  
**Région :** `eu-west-1` — Ireland  
**Statut observé :** `ACTIVE_HEALTHY`  
**URL API :** `https://vcvrjogdhdakrwmemoxl.supabase.co`

## Opérations effectuées

1. Création du projet Supabase dans l’organisation `mbouaricha12's Org`.
2. Coût annoncé et confirmé avant création : **0 $/mois**.
3. Application de la migration `p3_bff_initial_schema`.
4. Activation de RLS sur `public.dda_profiles` et `public.dda_sessions`.
5. Révocation des privilèges directs `anon` et `authenticated` sur ces tables.
6. Vérification de la migration, de la structure des colonnes, des clés étrangères et de l’état opérationnel.

## Tables créées

### `public.dda_profiles`

- `user_id` UUID, clé primaire et référence `auth.users(id)`.
- `display_name` limité à 60 caractères.
- `created_at` et `updated_at` générés côté serveur.
- RLS activé.

### `public.dda_sessions`

- `session_id` UUID généré côté serveur.
- `user_id` référencé vers `auth.users(id)`.
- `token_hash` unique ; le cookie opaque n’est pas stocké en clair.
- Tokens fournisseur stockés uniquement sous forme chiffrée côté BFF.
- Dates de création, dernière activité, expiration et révocation.
- Index utilisateur et index des sessions actives.
- RLS activé.

## Alerte de sécurité observée

L’advisor Supabase signale `rls_enabled_no_policy` sur les deux tables. Dans cette première tranche, l’absence de policy est intentionnelle : les rôles navigateur `anon` et `authenticated` n’ont aucun privilège direct et le BFF utilise exclusivement le service role côté serveur.

Avant d’ouvrir un accès PostgREST direct, il faudra ajouter des policies strictes basées sur `auth.uid()` et exécuter des tests négatifs entre deux comptes. Cette décision ne doit pas être contournée par une policy permissive.

## Non effectué

- Aucune clé service role n’est copiée dans le dépôt ou dans le navigateur.
- Aucun secret n’est écrit dans `.env.example`.
- Le BFF n’est pas encore déployé.
- Le domaine contrôlé DDA n’est pas encore configuré.
- Les tables métier P3.1 (`journal_entries`, `lesson_progress`, `premium_progress`, etc.) ne sont pas encore migrées.
- Les workflows export/suppression, rate limiting distribué, sauvegarde/restauration et DPA restent à finaliser.
