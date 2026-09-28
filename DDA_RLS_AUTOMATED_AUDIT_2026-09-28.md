# DDA Academy — Audit automatisé des policies RLS

## Objectif

Empêcher qu’une future table Supabase soit ajoutée sans :

1. RLS activé ;
2. au moins une policy explicitement attachée à la table ;
3. privilèges `anon` explicitement révoqués dans le SQL versionné ;
4. absence de privilège `ALL` accordé à `anon`.

## Contrôles

### Audit statique obligatoire

Le script `scripts/audit_rls_policies.js` inspecte les fichiers SQL sous :

- `bff/supabase/` ;
- `supabase/migrations/` si ce dossier est ajouté plus tard.

La CI exécute ce contrôle sur chaque push, pull request et lancement manuel. Une table `public.*` créée sans RLS ou sans policy fait échouer le job.

### Audit distant optionnel

`scripts/remote_rls_audit.sql` est exécuté contre la base réelle lorsque le secret GitHub `SUPABASE_DB_URL` est configuré. Il vérifie :

- toutes les tables ordinaires du schéma `public` ont RLS activé ;
- toutes ces tables ont au moins une policy ;
- aucun privilège direct n’est accordé à `anon`.

Sans `SUPABASE_DB_URL`, la CI ne simule pas un audit distant : elle exécute seulement le contrôle statique et indique clairement que le contrôle distant est ignoré.

## Secret GitHub requis pour le contrôle distant

Créer le secret de dépôt ou d’environnement :

```text
SUPABASE_DB_URL
```

Il doit contenir l’URL de connexion PostgreSQL du projet distant, avec mot de passe géré par GitHub Secrets. Ne jamais la placer dans un fichier versionné, une issue, un log ou une variable publique.

## Limites et règle d’évolution

- Toute nouvelle table user-owned doit avoir des policies fondées sur `auth.uid()` et des tests négatifs inter-comptes.
- Une simple présence syntaxique de `CREATE POLICY` ne prouve pas la qualité métier de la condition ; la revue de la clause `USING`/`WITH CHECK` reste obligatoire.
- Les tables authored, membership, entitlement, proof et audit doivent recevoir des règles spécialisées, pas une policy générique permissive.
- L’audit distant couvre les tables, RLS et privilèges `anon`; il ne remplace pas les tests métier d’ownership.
