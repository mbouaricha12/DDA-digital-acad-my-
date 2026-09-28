# DDA Academy — P3.1 Contrat de données & ownership

**Statut :** contrat v1 — préparation d’architecture, aucun backend activé  
**Source locale :** modèle v4 `dda-prototype-state-v4`  
**Contrat machine-readable :** [`contracts/p3-data-contract-v1.json`](contracts/p3-data-contract-v1.json)

## Objectif

Cette étape fixe les frontières de responsabilité avant toute authentification ou base distante. Elle ne modifie pas le comportement du prototype P2 : `prototypeState`, `DDA.load()` et `localStorage` restent la façade locale.

Le futur système distant devra toutefois respecter la règle suivante :

> Le navigateur est une interface non fiable. L’API et la base sont l’autorité pour l’identité, la propriété des données, les timestamps, les entitlements et les preuves validées.

## Règles d’ownership

| Catégorie | Propriétaire | Écriture client | Règle serveur |
|---|---|---|---|
| Utilisateur | Système d’identité | Profil limité | `user_id` attribué par le serveur |
| Onboarding | Utilisateur | Champs de parcours | Accès uniquement au propriétaire |
| Progression leçons | Utilisateur | Jalons de leçon | Une ligne unique par `owner_id + lesson_id` |
| Terminal | Utilisateur | Observation, annotations, pratique | Validation des limites et du propriétaire |
| Journal | Utilisateur | Texte libre et métadonnées autorisées | `owner_id` dérivé de la session |
| Plan Journal | Utilisateur | Champs de plan | Une ligne unique par propriétaire |
| Premium | Utilisateur + validation serveur | Entrées et réflexions | Niveau, preuve et réussite validés côté serveur |
| Membership / entitlements | Serveur | Aucune | Le plan local ne donne aucun droit réel |
| Curriculum authored | Système | Aucune via API apprenant | Contenu séparé et immuable pour l’apprenant |
| Audit events | Système | Aucune | Append-only, sans secrets ni texte du Journal |
| Acquisition | Appareil pseudonyme | Local uniquement par défaut | Ne devient jamais une identité utilisateur |

## Identifiants et timestamps

- `user_id`, identifiants de ressources et `owner_id` sont générés côté serveur au format UUID.
- Le client ne peut jamais imposer ou modifier `owner_id`.
- `created_at` et `updated_at` sont des timestamps serveur canoniques.
- `clientMutationId` est seulement une clé d’idempotence pour les retries ; ce n’est ni une identité ni un secret.
- L’identifiant local `local-*` n’est jamais réutilisé comme identifiant serveur.
- `visitorId` d’acquisition reste pseudonyme et ne doit jamais être promu en `user_id`.

## Mapping du modèle local v4

| État local v4 | Cible distante | Décision initiale |
|---|---|---|
| `user` | `users` | Import après compte authentifié ; e-mail vérifié ; nouvel ID serveur |
| `membership` | `memberships` | Cache d’affichage uniquement ; la valeur locale `demo` n’est pas une preuve d’abonnement |
| `onboarding` | `onboarding` | Synchronisable après ownership établi |
| `lessons` | `lesson_progress` | Clé par leçon authored et propriétaire |
| `terminal` | `terminal_state` | Synchronisable après validation et limites serveur |
| `journal.entries` | `journal_entries` | Une ressource par entrée, texte libre sensible |
| `journal.plan` | `journal_plans` | Une ressource par propriétaire |
| `premium` | `premium_progress` | Les inputs peuvent venir du client ; preuves et niveaux doivent être recalculés/validés côté serveur |
| `preferences` | `preferences` | Synchronisable, faible sensibilité |
| `events` | `audit_events` / analytics | Pas d’import en masse par défaut ; seulement événements allowlistés selon politique |
| `acquisition` | Aucun par défaut | Reste lié à l’appareil tant qu’un consentement et une politique ne justifient pas la synchronisation |

## Politique de migration

La migration v4 vers le distant sera :

1. **authentifiée** — aucun import anonyme ;
2. **explicitement consenti** — l’utilisateur voit ce qui sera importé ;
3. **idempotente** — une reprise ne crée pas de doublons ;
4. **réversible** — chaque import est associé à un `migration_id` ;
5. **non destructive** — la copie locale est conservée jusqu’à confirmation visible ;
6. **consciente des conflits** — aucune fusion silencieuse entre local et serveur ;
7. **bornée** — les champs inconnus sont ignorés et signalés ;
8. **séparée des droits** — le plan local Premium ne peut pas créer un entitlement serveur.

## Ce qui est explicitement hors périmètre de cette étape

- aucune route API ;
- aucune base de données ;
- aucun fournisseur d’identité ;
- aucun cookie de session ;
- aucun paiement ;
- aucune synchronisation automatique ;
- aucune modification du modèle local v4 ;
- aucune nouvelle fonctionnalité utilisateur.

## Critères d’acceptation P3.1

La phase est considérée comme définie lorsque :

- chaque donnée personnelle possède une règle d’ownership explicite ;
- les champs client-écrivable et serveur-seulement sont distingués ;
- les IDs locaux ne sont pas promus en identités serveur ;
- membership et entitlements sont séparés de l’état client ;
- les règles de migration, conflit, suppression et reprise sont écrites ;
- les tests de sécurité requis sont listés avant leur implémentation backend ;
- le contrat machine-readable et ce document restent synchronisés.

La prochaine étape pourra être la conception de l’API d’identité et de session, mais elle ne doit commencer qu’après revue du contrat et validation des choix de gouvernance : région d’hébergement, fournisseur d’identité, conservation et suppression des données.
