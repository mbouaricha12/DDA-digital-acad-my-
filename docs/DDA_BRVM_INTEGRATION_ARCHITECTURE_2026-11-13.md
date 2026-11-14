# DDA — Architecture d'intégration BRVM (préparation)

**Date :** 13 novembre 2026
**Nature :** préparation technique uniquement. Aucune source de données n'est branchée par ce document ; aucune cotation ou document n'est présenté comme réel sans source validée.

## 1. Ce qui existe déjà

DDA a déjà une architecture de gouvernance complète pour la BRVM, construite mais **jamais alimentée** :

- **Schéma Supabase** (`supabase/migrations/0005_brvm_publications.sql`) : deux tables, `dda_brvm_sources` (une source = institution officielle, fournisseur licencié ou éditeur) et `dda_brvm_documents` (un document rattaché à une source, avec checksum SHA-256, statut d'import, de vérification, de fraîcheur et de droits de redistribution). Les contraintes SQL imposent par construction :
  - une source ne peut passer en `approved` que si un réviseur des droits ET un réviseur de la source (deux personnes distinctes) l'ont validée ;
  - un document ne peut passer en `published`/`imported` que si l'import a réussi, la vérification éditoriale est faite, la fraîcheur est confirmée, les droits de redistribution sont `authorized`, et le réviseur des droits diffère du réviseur éditorial.
- **Store BFF** (`bff/src/brvm-publication-store.js`) : lit les documents publiés depuis Supabase (`dda_brvm_publications`, une vue/table dérivée), et **rejette silencieusement** toute ligne qui n'a pas tous les champs requis, dont une URL source et une URL document en HTTPS valide, une date de référence et une fraîcheur non expirée au moment de la requête.
- **Contrat partagé frontend** (`dist/brvm-publications.js`) : `isVerified()` est la seule porte d'affichage, utilisée à la fois par l'Academy et le ticker landing — une publication qui ne passe pas `verificationStatus === 'verified'`, `freshnessStatus === 'current'` et `redistributionRights === 'authorized'` n'est jamais rendue.
- **État actuel réel** : le registre est vide. L'UI affiche honnêtement « Aucune publication vérifiée disponible » / « Sources en préparation » plutôt qu'un document fictif ou périmé présenté comme à jour.
- **Leçon pédagogique** : `MBRVM.1` (« Introduction à la BRVM ») est une leçon de fondations indépendante du flux de publications — elle enseigne ce qu'est la BRVM sans dépendre d'une donnée en temps réel.

## 2. Architecture d'intégration proposée (une fois une source validée)

```
Source officielle/licenciée
        │  (document brut : PDF, page HTML, flux)
        ▼
Pipeline d'ingestion (hors périmètre technique DDA actuel — à construire)
  - récupère le document, calcule son checksum_sha256
  - insère une ligne dda_brvm_documents en statut 'draft'/'pending'
        │
        ▼
Double revue humaine (jamais automatique)
  - réviseur des droits : confirme la licence/autorisation de redistribution
  - réviseur éditorial : confirme l'exactitude et la fraîcheur du contenu
  - les deux doivent être des personnes distinctes (contrainte SQL)
        │
        ▼
document_status → 'approved' → 'imported' → 'published'
        │
        ▼
dda_brvm_publications (vue exposée au store BFF)
        │
        ▼
PostgrestBrvmPublicationStore.listPublished()
  - revalide chaque ligne (HTTPS, dates, fraîcheur non expirée) à chaque lecture
        │
        ▼
GET /v1/publications/brvm (BFF, déjà existant)
        │
        ▼
DDABrvmPublications.isVerified() (frontend, déjà existant)
        │
        ▼
Affichage Academy + ticker landing
```

**Ce qui reste à construire** : uniquement le pipeline d'ingestion (récupération du document brut + calcul du checksum + écriture initiale en base) et l'interface de revue humaine (où un réviseur des droits et un réviseur éditorial approuvent chaque document). Tout le reste de la chaîne — stockage, validation, exposition API, affichage — existe déjà et n'a pas besoin d'être modifié.

## 3. Exigences de licence et de redistribution

Avant toute ingestion, pour chaque source candidate, documenter et faire approuver :

1. **Nature de la source** : institution officielle (ex. régulateur, opérateur de bourse) vs fournisseur de données licencié vs éditeur ayant lui-même les droits — catégorie déjà modélisée (`source_type`).
2. **Base légale de redistribution** : autorisation écrite explicite de republier ce document/cette donnée sur une plateforme tierce (DDA), pas seulement de la consulter. Beaucoup de sites officiels autorisent la consultation publique mais interdisent la republication ou la redistribution automatisée sans accord.
3. **Portée de la licence** : documents historiques uniquement, ou aussi des données proches du temps réel ? DDA ne doit jamais présenter une cotation comme "temps réel" sans un contrat explicite le permettant.
4. **Attribution requise** : comment la source doit être citée (déjà supporté : chaque publication affichée porte `source` et `sourceUrl`).
5. **Durée/révocabilité** : la licence peut-elle être retirée ? Prévoir alors un mécanisme de retrait (dépublication) — actuellement non modélisé explicitement dans le schéma, à ajouter si une source réelle l'exige.
6. **Coût** : un fournisseur licencié a généralement un coût récurrent — à chiffrer avant engagement, hors périmètre technique de ce document.

## 4. Sources candidates à examiner (aucune validée, aucune branchée)

Liste de pistes à investiguer et faire valider par le fondateur — **aucune n'est confirmée autorisée** :

- **BRVM elle-même** (opérateur de la bourse régionale UEMOA) — source la plus directe pour des avis de marché, rapports officiels et communiqués ; à contacter pour connaître ses conditions de republication.
- **Autorité des Marchés Financiers de l'UMOA (régulateur)** — publications réglementaires, rapports annuels, avis officiels.
- **Fournisseurs de données financières licenciés** (ex. Refinitiv, Bloomberg, ou fournisseurs régionaux spécialisés Afrique de l'Ouest) — généralement payants, avec contrat de redistribution explicite ; à évaluer selon le budget.
- **Communiqués d'émetteurs cotés eux-mêmes** (relations investisseurs des sociétés cotées à la BRVM) — souvent publics et libres de citation, à vérifier cas par cas.

Aucune de ces pistes ne doit être branchée techniquement avant qu'un accord de redistribution explicite (section 3) ne soit obtenu et documenté dans `dda_brvm_sources`.

## 5. Mode pédagogique alternatif (déjà en place)

Si aucune source autorisée n'est disponible à court terme, DDA n'a pas besoin d'attendre pour proposer de la valeur BRVM :

- **MBRVM.1** reste la leçon de fondations (ce qu'est la BRVM, ses titres, sa capitalisation) — contenu éditorial statique, sans dépendance à une donnée externe, déjà livré et testé.
- **L'état vide honnête du module Publications** (déjà implémenté) continue de s'afficher tel quel : « Sources en préparation » / « Aucune publication vérifiée disponible » — jamais un document fictif, jamais une cotation inventée.
- **Extension pédagogique possible sans données réelles** (piste, non implémentée) : des leçons additionnelles sur la structure et le fonctionnement d'une bourse régionale en général (mécanismes de cotation, rôle d'un dépositaire central, etc.), clairement présentées comme pédagogiques et génériques, jamais comme des données BRVM réelles.

## 6. Conclusion

L'essentiel de l'architecture technique (schéma, store, contrat d'affichage, fail-closed) est déjà construit et testé. Le travail restant est contractuel et humain (obtenir une source réellement autorisée) avant d'être technique (construire le pipeline d'ingestion et l'interface de double revue). Aucune cotation ne doit être présentée comme réelle avant que ces deux étapes soient complétées et validées par le fondateur.
