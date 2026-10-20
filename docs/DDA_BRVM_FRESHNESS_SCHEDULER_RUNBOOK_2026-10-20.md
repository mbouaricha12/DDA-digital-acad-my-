# DDA — Runbook du scheduler de revalidation de fraîcheur BRVM

**Date :** 20 octobre 2026  
**Statut :** conception prête à implémenter — scheduler non activé  
**Propriétaire :** BFF / service serveur DDA  
**Cible :** documents BRVM privés, projection `dda_brvm_publications`

## Décision d’architecture

La revalidation doit être exécutée par un **job serveur appartenant au BFF**, déclenché par le scheduler natif de l’hébergeur du BFF ou par un worker planifié. Elle ne doit pas être exécutée par :

- le navigateur de l’apprenant ;
- `localStorage` ;
- une tâche frontend ;
- un endpoint public non authentifié ;
- un scheduler Manus qui recevrait directement la clé Supabase.

La raison est simple : le job doit accéder aux tables privées et aux références de droits. Il doit aussi être capable de retirer une publication de la projection sans que l’utilisateur puisse provoquer ou empêcher cette décision.

Le dépôt ne déploie actuellement ni BFF ni base Supabase distante. Le runbook décrit donc la configuration cible ; aucune tâche récurrente ne doit être activée avant le déploiement contrôlé du BFF et l’application validée de la migration.

## 1. Ce que le scheduler doit faire

À chaque exécution, le job doit :

1. sélectionner les documents publiés qui arrivent à échéance ou qui nécessitent un contrôle ;
2. vérifier la source et le document avec un timeout borné ;
3. contrôler le code HTTP, les redirections, le domaine, le type de contenu et la taille ;
4. vérifier le titre et l’identité du document lorsque le mode de contrôle le permet ;
5. comparer le checksum si le téléchargement et le calcul sont autorisés ;
6. enregistrer le résultat du contrôle ;
7. maintenir `freshness_status = current` uniquement si tous les contrôles passent ;
8. passer le document à `stale` ou `expired` en cas d’échec ;
9. ne jamais transformer automatiquement `pending` en `authorized`, `verified` ou `published` ;
10. laisser la vue SQL retirer immédiatement tout document qui n’est plus actuel.

Le job ne doit pas modifier `retrieved_at` lors d’un simple contrôle. `retrieved_at` décrit la récupération du document ; le contrôle périodique doit avoir ses propres horodatages.

## 2. Cadence recommandée

Utiliser une cadence fréquente pour le scheduler, mais laisser la base sélectionner les documents réellement dus :

```text
Toutes les 15 minutes : démarrer le job serveur.
À chaque démarrage : traiter au maximum 50 documents dus.
Avant expiration : sélectionner les documents dans la fenêtre des 24 prochaines heures.
Après échec : nouvelle tentative bornée selon un backoff.
```

Cette cadence ne signifie pas que chaque document est téléchargé toutes les 15 minutes. Elle permet seulement de ne pas rater une échéance.

Les règles de fraîcheur restent propres au type de document et doivent être approuvées par la source :

- bulletin quotidien : valeur de travail de 72 heures ;
- avis ponctuel : valeur de travail de 30 jours ;
- rapport trimestriel : valeur de travail de 180 jours ;
- rapport annuel ou états financiers : valeur de travail de 365 jours.

Ces délais ne sont pas des autorisations BRVM. Ils doivent être confirmés avant activation.

## 3. Sélection des documents dus

La requête de sélection doit être exécutée côté serveur, avec un verrou de concurrence. Conceptuellement :

```sql
select document_id
from public.dda_brvm_documents
where document_status = 'published'
  and (
    fresh_until <= now() + interval '24 hours'
    or last_checked_at is null
    or last_check_status in ('error', 'stale')
  )
order by fresh_until asc nulls first
limit 50;
```

La colonne `last_checked_at` n’existe pas encore dans la migration actuelle. Il faut l’ajouter ou, de préférence, créer un journal de contrôles séparé avant l’activation du scheduler.

Le job doit utiliser un verrou distribué ou une réservation transactionnelle afin que deux instances ne revalident pas le même document simultanément. Une solution minimale est une table de réservations avec `locked_until` ; une solution PostgreSQL peut utiliser `FOR UPDATE SKIP LOCKED` dans une transaction serveur.

## 4. Adaptation SQL nécessaire avant activation

Le journal actuel `dda_brvm_audit_events` conserve les transitions de statut, mais il ne décrit pas suffisamment chaque contrôle périodique. Une revalidation réussie peut laisser `document_status = published` et changer seulement `fresh_until` ou `freshness_status` ; l’événement d’audit ne porterait alors pas le détail du contrôle.

Ajouter une table privée dédiée, par exemple :

```sql
create table public.dda_brvm_revalidation_checks (
  check_id bigint generated always as identity primary key,
  document_id uuid not null references public.dda_brvm_documents(document_id) on delete restrict,
  job_run_id uuid not null,
  checked_at timestamptz not null default now(),
  outcome text not null check (outcome in ('current', 'stale', 'error', 'skipped')),
  http_status integer,
  final_url text,
  observed_content_type text,
  observed_size_bytes bigint,
  observed_checksum_sha256 text,
  error_code text,
  error_detail text,
  latency_ms integer,
  actor_role text not null,
  created_at timestamptz not null default now()
);
```

Règles de cette table :

- RLS activé ;
- aucun accès `anon` ou `authenticated` ;
- aucune écriture depuis le navigateur ;
- accès uniquement au worker serveur ou à un rôle d’exploitation dédié ;
- `error_detail` borné et sans secret ;
- `job_run_id` commun à toutes les vérifications d’une exécution ;
- index sur `(document_id, checked_at desc)` et `(outcome, checked_at desc)`.

Cette table ne remplace pas `dda_brvm_audit_events`. Le journal d’audit garde les décisions et transitions ; la table de contrôles garde les observations techniques répétées.

## 5. Algorithme du job

### Préparation

Le worker charge uniquement ses secrets depuis l’environnement serveur :

```text
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
BRVM_REVALIDATION_ENABLED
BRVM_REVALIDATION_BATCH_SIZE
BRVM_REVALIDATION_LOOKAHEAD_MINUTES
BRVM_REVALIDATION_TIMEOUT_MS
BRVM_REVALIDATION_MAX_BYTES
BRVM_APPROVED_HOSTS
```

`BRVM_REVALIDATION_ENABLED` doit être `false` par défaut. Le job refuse de s’exécuter si la configuration est incomplète.

### Contrôle de la source

Pour chaque document réservé :

1. vérifier que la source parente est encore `approved` ;
2. vérifier que ses droits ne sont pas `rejected` ou arrivés à expiration ;
3. vérifier que le domaine de l’URL correspond au domaine approuvé ;
4. suivre au maximum un nombre borné de redirections HTTPS ;
5. rejeter toute redirection vers un domaine inattendu ;
6. enregistrer le code HTTP et l’URL finale sans exposer de secret.

Une erreur de source ne doit pas modifier automatiquement `redistribution_status`. Elle doit placer le document en `stale` ou `error` et créer une tâche de revue des droits si nécessaire.

### Contrôle du document

Selon les droits autorisés :

- **Mode lien externe :** vérifier la disponibilité, le type MIME, la taille et les headers disponibles sans archiver le contenu ;
- **Mode copie autorisée :** télécharger en mémoire ou dans un stockage privé, avec limite de taille, calcul SHA-256 et comparaison au manifest ;
- **Mode extraction autorisée :** appliquer uniquement le transformateur versionné déclaré dans le manifest.

Le worker ne doit pas télécharger ni conserver un document lorsque la licence ne couvre pas cet usage.

### Décision

Contrôle réussi :

```text
record outcome = current
keep verification_status = verified
keep redistribution_rights = authorized
set freshness_status = current
set fresh_until according to approved policy
```

Contrôle échoué :

```text
record outcome = stale or error
set freshness_status = stale
remove the document from the SQL public projection
preserve the last known manifest and checksum
create a review task when the cause may affect rights or identity
```

Le worker ne doit jamais :

- approuver une source ;
- attribuer une licence ;
- modifier `verification_status` vers `verified` ;
- publier un document ;
- contourner une revue humaine ;
- remettre un document en `current` après une modification de checksum sans nouvelle revue.

## 6. Exemple de pseudo-code serveur

```js
async function runBrvmFreshnessJob({ db, fetchImpl, clock, config }) {
  if (!config.enabled) return { status: 'disabled', checked: 0 };

  const jobRunId = crypto.randomUUID();
  const documents = await db.claimDueDocuments({
    limit: config.batchSize,
    lookaheadMinutes: config.lookaheadMinutes,
    jobRunId
  });

  let checked = 0;
  for (const document of documents) {
    try {
      const result = await revalidateOne(document, { fetchImpl, clock, config });
      await db.recordRevalidation({ jobRunId, documentId: document.document_id, ...result });
      if (result.outcome === 'current') {
        await db.markCurrent(document.document_id, result.freshUntil);
      } else {
        await db.markStale(document.document_id, result.errorCode);
      }
      checked += 1;
    } catch (error) {
      await db.recordRevalidation({
        jobRunId,
        documentId: document.document_id,
        outcome: 'error',
        errorCode: classifyRevalidationError(error),
        errorDetail: redactError(error)
      });
      await db.markStale(document.document_id, 'REVALIDATION_FAILED');
    }
  }

  return { status: 'completed', jobRunId, checked };
}
```

Le code réel doit ajouter un timeout `AbortController`, limiter les redirections, borner les téléchargements et utiliser des requêtes transactionnelles pour les réservations et mises à jour.

## 7. Configuration du scheduler d’hébergement

Le scheduler doit lancer une commande interne du BFF, par exemple :

```bash
node bff/jobs/revalidate-brvm-freshness.js
```

Configuration cible :

```text
Fréquence : */15 * * * * UTC
Commande : node bff/jobs/revalidate-brvm-freshness.js
Timeout : 5 minutes
Concurrence : 1 exécution active
Retries : 2 avec backoff
```

La plateforme exacte dépendra de l’hébergement du BFF. Dans tous les cas :

- les secrets restent dans le gestionnaire de secrets de la plateforme ;
- aucun secret n’est placé dans le dépôt ou dans les arguments de commande ;
- les logs sont structurés et expurgés ;
- l’exécution possède un identifiant `job_run_id` ;
- l’échec du job déclenche une alerte ;
- le scheduler ne doit pas appeler une URL publique sans authentification forte.

Si l’hébergeur ne fournit pas de cron applicatif, un worker persistant ou un job planifié de la plateforme peut exécuter la même commande. Il ne faut pas remplacer cette tâche serveur par un agent navigateur ou par une boucle dans le BFF HTTP.

## 8. Observabilité et alertes

Chaque exécution doit publier :

```text
job_run_id
started_at
finished_at
selected_count
checked_count
current_count
stale_count
error_count
skipped_count
```

Alertes recommandées :

- aucune exécution réussie depuis 30 minutes ;
- plus de 20 % de contrôles en erreur sur une exécution ;
- source BRVM inaccessible pendant trois contrôles consécutifs ;
- checksum modifié ;
- document expirant dans moins de 24 heures sans contrôle réussi ;
- document `published` exclu de la projection ;
- tentative de transition illégale ;
- échec de réservation ou concurrence supérieure à une instance.

Les logs ne doivent jamais inclure la clé Supabase, le contenu des PDFs, les références contractuelles complètes ou des données personnelles non nécessaires.

## 9. Procédure de rollback et de retrait

En cas de faux positif ou de source compromise :

1. désactiver `BRVM_REVALIDATION_ENABLED` ;
2. ne pas remettre manuellement un document en `current` ;
3. passer le document en `stale` ou `expired` via une opération serveur auditée ;
4. conserver le dernier manifest et les contrôles associés ;
5. ouvrir une revue des droits et de la source ;
6. corriger le worker ou la politique ;
7. effectuer un contrôle non public ;
8. republier seulement après validation distincte des droits et de l’éditorial.

La restauration d’une sauvegarde ne doit pas republier automatiquement les documents. La projection SQL doit continuer à appliquer `fresh_until > now()`.

## 10. Checklist d’activation

### Avant déploiement

- [ ] Source BRVM autorisée et dossier de droits complet.
- [ ] Migration `0005_brvm_publications.sql` appliquée dans l’environnement cible.
- [ ] Table de contrôles périodiques ajoutée et protégée.
- [ ] Job serveur implémenté et testé avec des fixtures non réelles.
- [ ] Politique de fraîcheur approuvée par type de document.
- [ ] Timeout, limite de taille et allowlist de domaines configurés.
- [ ] Verrou de concurrence testé.
- [ ] Secrets configurés uniquement côté serveur.

### Avant première exécution réelle

- [ ] `BRVM_REVALIDATION_ENABLED=false` pendant le dry-run.
- [ ] Dry-run réalisé sans modification de statut.
- [ ] Résultats comparés aux documents attendus.
- [ ] Alertes vérifiées.
- [ ] Scénario 404, redirection, checksum différent et expiration testé.
- [ ] Procédure de retrait validée.
- [ ] Relecteurs droits et éditorial confirmés.

### Activation progressive

1. activer le job en dry-run ;
2. observer au moins une fenêtre complète de contrôle ;
3. activer la mise à jour `current/stale` sur un document de test non public ;
4. contrôler la projection BFF ;
5. activer un premier document réel autorisé ;
6. limiter la taille du batch ;
7. élargir progressivement après observation.

## État actuel DDA

Le dépôt dispose déjà de la projection SQL, du magasin BFF, des contrôles de fraîcheur à la lecture et des contrats fail-closed. Il ne dispose pas encore de :

- worker `revalidate-brvm-freshness.js` ;
- table de contrôles périodiques ;
- scheduler hébergé ;
- source réelle autorisée ;
- migration distante appliquée ;
- alertes et monitoring déployés.

La prochaine implémentation technique recommandée est donc la table d’observations de revalidation et le worker en dry-run. Le scheduler ne doit être activé qu’après validation humaine des droits BRVM et choix de l’hébergeur du BFF.
