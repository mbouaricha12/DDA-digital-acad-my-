# DDA — Attribution du rôle `owner` (procédure fondateur)

## Statut

Cette procédure est **manuelle et volontairement hors code**. Aucune migration, aucun script et aucune route du BFF ne peut créer ou attribuer le rôle `owner` : lui seul peut exister sans qu'un `owner` déjà en place ne l'ait accordé (`dda_admin_roles.assignRole` — voir `bff/src/admin-roles-store.js` — refuse toute attribution si l'appelant n'est pas déjà `owner`). Le bootstrap initial casse volontairement cette règle une seule fois, à la main, directement en base — jamais via une API exposée au navigateur.

Aucun compte fictif n'est créé par cette procédure. Le compte qui reçoit le rôle `owner` doit être un compte réel, créé par toi via le parcours d'inscription normal de DDA (le même que celui d'un apprenant), pour que l'authentification (mot de passe, session, vérification d'email) reste strictement celle déjà auditée.

## Prérequis

- Un projet Supabase réel existe et `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` sont configurés sur le BFF (aucun des deux n'existe encore à la date de cette procédure — voir le rapport joint).
- Les migrations `0001` à `0007` ont été rejouées sur ce projet (`scripts/replay_p3_migrations.sh`, avec un `DATABASE_URL` pointant explicitement sur l'instance Postgres de ce projet Supabase — jamais sur un autre).

## Étapes

1. **Crée ton propre compte DDA** via le formulaire d'inscription normal de l'Academy (`/v1/auth/register`), avec l'adresse email que tu veux utiliser comme fondateur. Vérifie l'email comme n'importe quel compte.
2. **Retrouve ton identifiant utilisateur réel (`auth.users.id`)** :
   - Dans le tableau de bord Supabase du projet → Authentication → Users → cherche ton email → copie son UUID.
   - Ou, en SQL, directement sur l'instance (jamais via une route exposée) :
     ```sql
     select id, email from auth.users where email = 'ton-email@exemple.com';
     ```
3. **Insère ta propre ligne `owner`**, directement en base, avec un rôle `service_role` (jamais `anon`/`authenticated`, qui n'ont de toute façon aucun droit sur cette table) :
   ```sql
   insert into public.dda_admin_roles (user_id, role)
   values ('<ton-uuid-copié-à-l-étape-2>', 'owner');
   ```
4. **Vérifie** :
   ```sql
   select user_id, role, created_at from public.dda_admin_roles;
   ```
   Une seule ligne `owner` doit apparaître — la tienne.

## Après le bootstrap

Une fois cette première ligne posée, tu es seul capable d'accorder le rôle `admin` à quelqu'un d'autre (toute future route de gestion des rôles devra passer par `dda_admin_roles.assignRole(userId, role, actingUserId)`, qui refuse déjà toute attribution par quelqu'un qui n'est pas lui-même `owner` — voir `bff/src/admin-roles-store.js`). Si tu attribues un jour le rôle `owner` à une deuxième personne, la protection du dernier `owner` (`revokeRole`) continue de s'appliquer : aucun `owner` ne peut être retiré s'il est le dernier restant, y compris par lui-même.

## Ce que cette procédure ne fait pas

- Elle ne crée aucune route `/v1/admin/roles` — aucune n'existe encore (seules des routes de **consultation** existent à ce stade : `/v1/admin/overview`, `/v1/admin/users`, `/v1/admin/memberships`).
- Elle ne contourne aucune authentification : ton compte `owner` se connecte exactement comme n'importe quel compte DDA (email + mot de passe, session BFF, cookies `__Host-`), et les routes `/v1/admin/*` ne changent rien à cela — elles ajoutent une seconde vérification (le rôle), jamais un raccourci d'identité.
