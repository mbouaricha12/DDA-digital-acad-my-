# DDA — Protocole technique de provenance et de fraîcheur des données BRVM

**Version :** 1.0 — spécification opérationnelle préparatoire  
**Date :** 20 octobre 2026  
**Périmètre :** publications financières et futurs documents BRVM affichés dans DDA  
**Route de lecture :** `#markets` / Publications financières BRVM  
**Statut :** à valider par DDA et la source avant activation de toute donnée réelle

> Ce protocole décrit les contrôles à appliquer. Il n’autorise pas, à lui seul, la copie, l’archivage, l’extraction ou la redistribution d’un document BRVM. Ces droits doivent être confirmés séparément par écrit.

## 1. Objectif et règle de publication

Le registre doit permettre de répondre à quatre questions pour chaque document affiché dans DDA :

1. **D’où vient-il ?** — source institutionnelle, URL canonique et identifiant de la source.
2. **De quel document s’agit-il ?** — titre, émetteur, type et date de référence.
3. **Quand DDA l’a-t-il contrôlé ?** — récupération, checksum, fraîcheur et historique des vérifications.
4. **Pourquoi peut-il être affiché ?** — droits autorisés, revue des droits, revue éditoriale et décision de publication.

La règle de sécurité est fail-closed :

```text
Si une métadonnée obligatoire manque,
si la source n’est pas approuvée,
si les droits ne sont pas autorisés,
si le document est périmé,
ou si une vérification échoue,
alors le document n’est pas visible dans la galerie publique.
```

Une erreur de stockage, de réseau ou de parsing ne doit jamais être transformée en registre vide ni en document « vérifié ».

## 2. Architecture de confiance

Le registre est composé de trois niveaux distincts :

- **Registre des sources** : identité de la BRVM, d’un fournisseur sous licence ou d’un émetteur autorisé, périmètre, contact et droits.
- **Registre des documents** : manifest documentaire, checksum, import, fraîcheur et validations.
- **Journal d’audit** : historique append-only des créations, modifications, transitions et suppressions.

La galerie DDA ne lit jamais les tables privées directement. Elle reçoit uniquement une projection serveur filtrée par le BFF :

```text
tables privées → vue dda_brvm_publications → BFF GET /v1/publications/brvm → navigateur
```

Le navigateur peut revalider la forme d’une réponse, mais ne peut pas approuver une source, modifier un statut, prolonger une fraîcheur ou activer un droit Premium.

## 3. Registre des sources

Chaque source doit être créée côté serveur avec les champs suivants :

| Champ | Règle |
|---|---|
| `source_id` | UUID stable, généré côté serveur. |
| `source_name` | Nom officiel, 1 à 200 caractères. |
| `source_url` | URL canonique HTTPS sans identifiant ni mot de passe. |
| `source_type` | `official_institution`, `licensed_provider` ou `editor_supplied`. |
| `owner_contact` | Contact institutionnel ou contractuel vérifiable. |
| `license_reference` | Référence du courrier, contrat, licence ou autorisation. |
| `redistribution_status` | `pending`, `authorized` ou `rejected`. |
| `coverage` | Documents, instruments, périodes et territoires couverts. |
| `refresh_policy` | Fréquence ou événement de mise à jour annoncé. |
| `source_status` | `proposed`, `rights_pending`, `review_pending`, `approved`, `rejected`, `expired`. |
| `rights_reviewer_id` / `rights_reviewed_at` | Identité et date de la validation des droits. |
| `source_reviewer_id` / `source_reviewed_at` | Identité et date de la validation de l’origine et du périmètre. |
| `created_at` / `updated_at` | Horodatages UTC générés côté serveur. |

### Conditions d’approbation d’une source

Une source ne peut passer à `approved` que si :

- l’URL canonique répond en HTTPS et correspond à l’institution ou au fournisseur déclaré ;
- le périmètre de la source est documenté ;
- les droits de lecture, d’archivage et de redistribution sont explicitement établis ;
- la politique de mise à jour est connue ou déclarée indéterminée ;
- un responsable des droits a effectué la revue ;
- un relecteur de source distinct a confirmé l’identité et le périmètre ;
- les deux revues sont conservées dans le journal d’audit.

Une page publique, une capture d’écran ou une URL trouvée dans un moteur de recherche prouve l’existence possible d’un contenu, mais ne constitue pas une autorisation de le redistribuer.

## 4. Manifest d’un document

Tout document candidat doit être décrit par un manifest immuable après approbation :

```json
{
  "document_id": "uuid-server",
  "source_id": "uuid-source",
  "title": "Titre officiel du document",
  "issuer_name": "Émetteur ou entité concernée",
  "official_identifier": "Identifiant officiel si disponible",
  "document_type": "financial_statement",
  "source_url": "https://www.brvm.org/page-officielle",
  "document_url": "https://www.brvm.org/sites/default/files/document.pdf",
  "reference_date": "2026-09-30",
  "retrieved_at": "2026-10-20T10:30:00Z",
  "checksum_sha256": "64 caractères hexadécimaux",
  "content_type": "application/pdf",
  "content_length_bytes": 123456,
  "transformer_version": "manual-pdf-v1",
  "import_status": "pending",
  "verification_status": "pending",
  "freshness_status": "pending",
  "redistribution_rights": "pending",
  "document_status": "draft",
  "fresh_until": null,
  "rights_reviewer_id": null,
  "editorial_reviewer_id": null,
  "published_by": null,
  "error_code": null,
  "error_detail": null
}
```

Les champs minimums déjà prévus par le modèle serveur DDA sont obligatoires : `document_id`, `source_id`, `title`, `document_type`, `source_url`, `reference_date`, `retrieved_at`, `checksum_sha256`, `transformer_version`, les statuts et les identités de revue.

### Types de documents initiaux

Le pilote peut commencer avec les types suivants :

- `financial_statement` — états financiers ;
- `annual_report` — rapport annuel ;
- `issuer_notice` — avis ou publication d’un émetteur ;
- `market_notice` — avis de marché ou bulletin officiel ;
- `other_official_publication` — uniquement après revue manuelle renforcée.

Le type ne doit pas être déduit uniquement du nom de fichier. Il doit être confirmé par le titre, la page source et le contenu du document.

## 5. Cycle de vie et transitions

### Source

```text
PROPOSED → RIGHTS_PENDING → REVIEW_PENDING → APPROVED
    ↘ REJECTED                 ↘ REJECTED
APPROVED → EXPIRED / REJECTED / RIGHTS_PENDING
```

Une modification d’une source approuvée portant sur son URL, son périmètre, sa licence ou sa politique de mise à jour doit provoquer une nouvelle revue des droits et de la source.

### Document

```text
DRAFT → REVIEW_PENDING → APPROVED → IMPORTED → PUBLISHED
  ↘ REJECTED       ↘ REJECTED       ↘ REJECTED / EXPIRED
                                     ↘ EXPIRED
PUBLISHED → EXPIRED
```

Les statuts de workflow et les statuts de contrôle restent distincts :

- `document_status` décrit la position dans le processus de publication ;
- `import_status` décrit le résultat de l’import ;
- `verification_status` décrit la revue de provenance et de contenu ;
- `freshness_status` décrit la validité temporelle ;
- `redistribution_rights` décrit l’autorisation juridique ou contractuelle.

### Conditions de passage vers `published`

Un document ne peut devenir public que si toutes les conditions suivantes sont vraies :

```text
source_status = approved
redistribution_status = authorized
document_status = imported puis published
import_status = succeeded
verification_status = verified
freshness_status = current
redistribution_rights = authorized
source_url et document_url sont HTTPS
reference_date est valide
retrieved_at >= reference_date
fresh_until > maintenant
rights_reviewer_id est renseigné
editorial_reviewer_id est renseigné
rights_reviewer_id ≠ editorial_reviewer_id
published_by est renseigné et distinct des deux relecteurs
```

## 6. Procédure d’import contrôlé

Le premier pilote doit être manuel. Aucun scraping ou téléchargement périodique ne doit être activé avant validation de la source et des droits.

### Étape A — Préparer le dossier source

L’opérateur crée le dossier source avec l’URL canonique, le périmètre, le contact et la référence d’autorisation. Le statut reste `proposed` ou `rights_pending`.

### Étape B — Valider les droits

Le responsable des droits conserve la preuve de l’autorisation : courrier, convention, licence ou réponse institutionnelle. Il documente explicitement si l’autorisation couvre :

- le lien externe seulement ;
- l’affichage des métadonnées ;
- le résumé éditorial ;
- l’hébergement d’une copie ;
- l’extraction de tableaux ou de chiffres ;
- l’archivage et la durée de conservation.

Sans autorisation de copie, DDA doit utiliser le mode **métadonnées + lien officiel**, sans stocker le PDF localement.

### Étape C — Construire le manifest

L’opérateur saisit le manifest sans inventer de valeur manquante. Si une information n’existe pas dans la source, elle reste `null` ou `pending` et empêche la publication si elle est obligatoire.

### Étape D — Contrôler l’URL et le document

Le service vérifie :

- protocole HTTPS ;
- absence d’identifiant ou de mot de passe dans l’URL ;
- réponse HTTP non ambiguë ;
- type MIME attendu ;
- taille maximale définie par la politique d’exploitation ;
- cohérence du titre et du document avec la page officielle ;
- absence de redirection vers un domaine non approuvé ;
- date du document et date de récupération ;
- calcul du SHA-256 si une copie autorisée est traitée.

### Étape E — Soumettre aux deux revues

Le responsable des droits et le relecteur éditorial doivent être distincts. Le relecteur éditorial vérifie le document, son type, son titre, son émetteur, sa date et le résumé proposé. Il ne peut pas modifier la décision juridique du responsable des droits.

### Étape F — Publier la projection

Après approbation, le document passe par `imported`, puis `published`. Seule la projection publique est exposée au BFF. Les détails de licence, contacts, erreurs internes et notes de revue ne sont jamais renvoyés à l’apprenant.

## 7. Politique de fraîcheur

La fraîcheur doit être calculée à partir d’une règle documentée, jamais à partir de la date du jour seule.

### Champs obligatoires

- `reference_date` : date à laquelle le contenu ou la période du document se rapporte ;
- `retrieved_at` : date et heure UTC auxquelles DDA a récupéré ou contrôlé la ressource ;
- `fresh_until` : limite UTC au-delà de laquelle le document ne doit plus être présenté comme actuel ;
- `freshness_status` : `pending`, `current` ou `stale`.

### Politique initiale proposée

Ces délais sont des **valeurs de travail à valider avec la source** :

| Type | Valeur de travail | Motif |
|---|---:|---|
| Bulletin officiel quotidien | 72 heures après la séance concernée | Contrôler rapidement les liens et éviter un bulletin présenté comme récent après retrait. |
| Avis ou publication ponctuelle | 30 jours après le dernier contrôle | À réduire si la source signale une correction ou un retrait. |
| Rapport trimestriel | 180 jours | Le document reste historique, mais son statut de disponibilité doit être recontrôlé. |
| Rapport annuel / états financiers | 365 jours | La date de référence reste historique ; la fraîcheur concerne la disponibilité et le statut, pas une actualité de cours. |

Pour un document historique, DDA doit distinguer **date de référence** et **fraîcheur du lien/document**. Un rapport ancien peut rester consultable comme archive si les droits le permettent, mais ne doit pas être étiqueté « actuel » sans justification.

### Revalidation

Une tâche de contrôle doit vérifier avant `fresh_until` :

1. que la page source existe ;
2. que le document est toujours accessible ;
3. que le titre et le checksum correspondent ;
4. que la source n’a pas modifié ou retiré le document ;
5. que les droits couvrent toujours l’usage DDA ;
6. que la nouvelle date de contrôle est enregistrée.

Une modification du fichier, une réponse 404/410, une révocation ou une incertitude sur les droits fait passer le document à `stale` ou `expired` et le retire de la projection publique.

## 8. Gestion des erreurs

Les erreurs sont bornées, codées et conservées dans le registre privé. Elles ne doivent pas contenir de secret, de jeton, de données personnelles ou le contenu intégral d’un document.

| Code | Signification | Action publique |
|---|---|---|
| `SOURCE_UNREACHABLE` | Source non joignable | Retirer temporairement le document, ne pas utiliser le cache comme vérité actuelle. |
| `SOURCE_REDIRECTED` | Redirection vers un domaine inattendu | Bloquer et demander une revue. |
| `SOURCE_NOT_HTTPS` | URL non sécurisée | Rejeter. |
| `DOCUMENT_NOT_FOUND` | Document supprimé ou déplacé | Passer en `stale`/`expired`, aucun lien visible. |
| `CONTENT_TYPE_MISMATCH` | Format différent du manifest | Bloquer l’import. |
| `CHECKSUM_MISMATCH` | Contenu différent de la version contrôlée | Bloquer et demander une nouvelle revue. |
| `DATE_INVALID` | Date absente ou incohérente | Rejeter. |
| `RIGHTS_MISSING` | Autorisation non documentée | Maintenir `pending`, aucune publication. |
| `FRESHNESS_EXPIRED` | `fresh_until` dépassé | Retirer de la projection. |
| `REVIEW_CONFLICT` | Relecteurs non distincts ou non identifiés | Bloquer la transition. |
| `SCHEMA_INVALID` | Manifest incomplet ou mal formé | Rejeter sans créer de publication partielle. |

Une erreur du BFF doit renvoyer un état d’indisponibilité, par exemple HTTP `503`, et non `{ items: [] }`. Le registre vide signifie « aucune publication admissible » ; il ne signifie pas « la source est en panne ».

## 9. Journal d’audit

Le journal `dda_brvm_audit_events` est append-only et doit conserver :

- `event_id` séquentiel ;
- type d’entité : `source` ou `document` ;
- identifiant de l’entité ;
- opération : `insert`, `update` ou `delete` ;
- acteur authentifié ;
- rôle de base ou rôle opératoire ;
- ancien statut ;
- nouveau statut ;
- horodatage UTC.

Les suppressions doivent aussi être auditées. Une suppression physique ne doit pas effacer la preuve qu’une entrée a existé. Les rôles `anon` et `authenticated` ne doivent avoir aucun accès direct aux tables privées ou au journal.

Les changements de manifest approuvé doivent être immuables. Une correction substantielle crée une nouvelle version ou repasse par une revue complète ; elle ne modifie pas silencieusement le document publié.

## 10. Projection BFF et contrat de réponse

L’endpoint de lecture est :

```http
GET /v1/publications/brvm
```

Réponse vide valide :

```json
{ "items": [] }
```

Réponse avec un document admissible :

```json
{
  "items": [
    {
      "id": "uuid-document",
      "title": "Titre officiel",
      "source": "BRVM",
      "sourceUrl": "https://www.brvm.org/page-officielle",
      "documentUrl": "https://www.brvm.org/sites/default/files/document.pdf",
      "referenceDate": "2026-09-30",
      "retrievedAt": "2026-10-20T10:30:00.000Z",
      "verificationStatus": "verified",
      "freshnessStatus": "current",
      "redistributionRights": "authorized"
    }
  ]
}
```

La projection ne doit pas exposer : contacts privés, référence contractuelle complète, détails internes d’erreur, identités des relecteurs, secrets, contenu de fichier ou notes juridiques.

Le BFF doit :

- utiliser la clé serveur uniquement côté serveur ;
- appliquer `Cache-Control: no-store` tant qu’une politique de cache approuvée n’existe pas ;
- vérifier la forme des lignes retournées ;
- exclure toute ligne dont `fresh_until <= now()` ;
- vérifier les URL HTTPS et les dates ;
- échouer en `503` si le magasin est absent ou invalide ;
- journaliser un identifiant de requête sans journaliser de secret.

## 11. Sécurité, confidentialité et continuité

Les tables de provenance et d’audit sont privées. Les mutations ne passent pas par le navigateur. Les secrets Supabase et les références de licence ne doivent jamais être embarqués dans `dist/` ou `localStorage`.

Les fichiers éventuellement archivés doivent être stockés hors du répertoire public avec contrôle de type, limite de taille, analyse antivirus et politique de rétention. Si la licence ne couvre pas l’archivage, DDA ne conserve que les métadonnées autorisées et le lien officiel.

Une sauvegarde doit inclure les manifests, les statuts, les audits et les références d’autorisation. Une restauration doit préserver les checksums et ne doit pas republier automatiquement un document dont la fraîcheur ou les droits ont expiré.

## 12. Monitoring et indicateurs

Les indicateurs minimums sont :

- nombre de sources par statut ;
- nombre de documents par statut de workflow ;
- documents arrivant à expiration dans 7 jours ;
- documents expirés retirés de la projection ;
- taux d’erreur d’accès à la source ;
- erreurs de checksum ou de type ;
- âge du dernier contrôle par source ;
- temps entre import et revue éditoriale ;
- nombre de demandes de retrait ou de correction ;
- écart entre documents privés et documents réellement exposés par le BFF.

Une alerte doit être créée pour toute source approuvée sans contrôle récent, toute erreur répétée, tout changement de domaine et toute tentative de transition illégale.

## 13. Checklist avant le premier document réel

### Gouvernance

- [ ] Structure porteuse de DDA identifiée juridiquement.
- [ ] Source BRVM enregistrée côté serveur.
- [ ] Autorisation de référencement obtenue.
- [ ] Autorisation de copie ou d’extraction explicitement distinguée.
- [ ] Politique de retrait et contact de la source connus.

### Provenance

- [ ] URL officielle HTTPS contrôlée.
- [ ] Titre, émetteur, type et date vérifiés.
- [ ] Identifiant officiel enregistré s’il existe.
- [ ] `retrieved_at` en UTC.
- [ ] Checksum calculé si une copie autorisée est traitée.
- [ ] Version du transformateur enregistrée.

### Droits et revue

- [ ] Responsable des droits identifié.
- [ ] Relecteur éditorial distinct identifié.
- [ ] Autorisation `authorized` enregistrée côté serveur.
- [ ] Aucun approbateur n’est déduit du navigateur.

### Fraîcheur et exposition

- [ ] `fresh_until` justifié par une politique documentée.
- [ ] Revalidation prévue avant expiration.
- [ ] Projection SQL filtrée et BFF configuré.
- [ ] Réponse d’erreur distincte du registre vide.
- [ ] Aucun document non vérifié n’apparaît dans `#markets`.
- [ ] Tests 360, 390 et 1440 px exécutés.
- [ ] Audit et rollback testés.

## 14. État actuel DDA et décision suivante

Le dépôt contient déjà la préparation du schéma serveur, du magasin BFF, des transitions, de la projection filtrée et des contrats de sécurité. La migration BRVM n’est pas appliquée à une base distante, le BFF n’est pas déployé et aucune source ou publication réelle n’est connectée.

La prochaine action autorisée est donc **administrative et documentaire** : obtenir la réponse de la BRVM au courrier de demande d’autorisation, puis enregistrer le dossier de source. Tant que cette réponse n’est pas validée, le registre public doit rester vide.

Aucun délai de fraîcheur, droit de redistribution ou mécanisme d’archivage ne doit être considéré comme approuvé par défaut. Toute valeur proposée dans ce protocole comme « valeur de travail » doit être confirmée avec la BRVM ou le fournisseur concerné avant activation.
