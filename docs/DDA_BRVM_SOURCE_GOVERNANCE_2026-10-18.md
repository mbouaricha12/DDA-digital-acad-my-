# DDA — Gouvernance des sources BRVM et import manuel contrôlé

**Date :** 18 octobre 2026  
**Statut :** spécification préparatoire — non implémentée  
**Périmètre :** P0 gouvernance des sources et P1 pipeline documentaire  
**Route concernée :** `#markets` / Publications financières BRVM

## Décision de sécurité

DDA ne connecte actuellement aucune source BRVM et ne publie aucun document financier réel. Ce document décrit le contrôle à appliquer avant toute activation future. Il ne constitue ni un registre de source approuvée, ni un pipeline opérationnel.

Le registre public `BRVM_PUBLICATIONS` doit rester vide tant qu’un dossier de source n’a pas reçu une validation explicite de provenance, de droits de redistribution, de fraîcheur, de sécurité et de revue éditoriale.

## Dossier minimal d’une source

Avant tout import, un dossier doit être créé côté serveur — jamais dans `localStorage` — avec les champs suivants :

- `source_name` : nom officiel du fournisseur ou de l’institution ;
- `source_url` : URL canonique vérifiable ;
- `source_type` : institution officielle, fournisseur sous licence ou document fourni par l’éditeur ;
- `owner_contact` : contact contractuel ou institutionnel ;
- `license_reference` : référence du contrat, mandat ou autorisation ;
- `redistribution_status` : `pending`, `authorized` ou `rejected` ;
- `coverage` : documents, périodes, instruments et territoires couverts ;
- `refresh_policy` : fréquence annoncée par la source ;
- `reviewer_id` et `reviewed_at` : revue humaine traçable ;
- `status` : état du workflow ci-dessous.

Une URL seule, une capture d’écran ou une donnée copiée depuis une page publique ne constitue pas une autorisation de redistribution.

## Workflow obligatoire

```text
PROPOSED
  → RIGHTS_PENDING
  → REVIEW_PENDING
  → APPROVED
  → IMPORTED
  → PUBLISHED
```

Un dossier peut basculer vers `REJECTED` à toute étape ou vers `EXPIRED` lorsque l’autorisation, la fraîcheur ou la couverture ne sont plus valides.

### Conditions de passage

| Passage | Conditions minimales |
|---|---|
| `PROPOSED → RIGHTS_PENDING` | Source identifiée, URL canonique et périmètre documenté |
| `RIGHTS_PENDING → REVIEW_PENDING` | Droit de lecture, archivage et redistribution documenté |
| `REVIEW_PENDING → APPROVED` | Contrôle humain de la source, du format et des limites |
| `APPROVED → IMPORTED` | Manifest d’import complet, checksum et journal sans erreur bloquante |
| `IMPORTED → PUBLISHED` | Métadonnées complètes, fraîcheur valide et seconde vérification éditoriale |

Aucune transition ne doit être déduite d’un état local du navigateur ou d’un clic d’utilisateur.

## Manifest documentaire obligatoire

Chaque document candidat doit avoir un manifest séparé contenant au minimum :

- `document_id` stable ;
- `source_id` ;
- `source_url` ;
- `title` ;
- `reference_date` ;
- `retrieved_at` ;
- `document_type` ;
- `checksum` ;
- `transformer_version` ;
- `verification_status` ;
- `freshness_status` ;
- `redistribution_rights` ;
- `reviewer_id` ;
- `error_code` et `error_detail` si le document est rejeté.

Le rendu public ne doit accepter qu’un manifest dont `verification_status = verified`, `freshness_status = current` et `redistribution_rights = authorized`, avec une URL HTTP(S) et des dates cohérentes.

## Gestion des erreurs d’import

Un import manuel doit être atomique pour chaque document :

1. valider la structure du manifest ;
2. vérifier l’URL et la réponse de la source ;
3. calculer et conserver le checksum ;
4. contrôler le type et la taille du fichier ;
5. appliquer le transformateur versionné ;
6. rejeter le document en cas d’écart ;
7. journaliser l’erreur sans exposer le document partiel ;
8. soumettre le document valide à la revue éditoriale.

Les erreurs ne doivent jamais produire un document partiellement visible, un statut « vérifié » par défaut ou une date de fraîcheur inventée.

## Séparation des responsabilités

- **Opérateur source :** propose ou dépose le dossier ;
- **Responsable droits :** valide l’autorisation de redistribution ;
- **Relecteur éditorial :** vérifie le document et ses métadonnées ;
- **Administrateur système :** maintient le stockage, les journaux et les secrets ;
- **Utilisateur apprenant :** ne peut ni approuver une source ni modifier un entitlement.

Ces rôles devront être contrôlés côté serveur lorsque le pipeline sera développé.

## Ce qui reste volontairement différé

- aucun connecteur BRVM ;
- aucun téléchargement automatisé ;
- aucun stockage serveur de documents ;
- aucune publication réelle ;
- aucune valeur de marché ;
- aucun droit Premium dérivé d’un état local ;
- aucune action d’administration accessible dans l’interface apprenant.

## Critère d’activation futur

La prochaine implémentation ne pourra commencer qu’après obtention d’un dossier source complet, validation juridique de la redistribution, choix du stockage serveur, définition de la politique de fraîcheur et accord sur les rôles de revue. Tant que ces éléments ne sont pas réunis, l’interface doit conserver l’état vide actuel.
