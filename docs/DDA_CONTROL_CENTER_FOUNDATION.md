# DDA Control Center — fondation et état de preuve

## Statut

Le Control Center est **conçu mais non déployé**. Ce document et le contrat associé ne constituent pas une API d’administration opérationnelle et ne donnent aucune permission dans le navigateur.

Contrat canonique : [`contracts/dda-admin-control-center-v1.json`](../contracts/dda-admin-control-center-v1.json)

## Objectif

Séparer clairement :

- l’interface publique ;
- l’application apprenant ;
- l’API apprenant ;
- le Control Center propriétaire ;
- les services de données, paiement, surveillance et sauvegarde.

Le Control Center doit permettre au fondateur de contrôler DDA sans dépendre de `localStorage`, de l’interface apprenant ou d’un agent ayant produit le code.

## Ce qui est déjà prouvé dans le dépôt

- Le dépôt GitHub est public et `main` est maintenant protégé.
- Les routes BFF existantes couvrent l’identité, les sessions, le profil, l’export et la suppression de compte.
- Les contrats P3 définissent l’ownership serveur, les entitlements serveur, l’idempotence et les événements d’audit.
- Le schéma SQL définit les tables apprenant et les politiques RLS de défense en profondeur.
- Les secrets serveur ne sont pas livrés au navigateur.

## Ce qui n’est pas encore opérationnel

- aucun rôle propriétaire/admin persistant ;
- aucune route `/v1/admin/*` déployée ;
- aucun audit log administratif persistant ;
- aucune base distante connectée et vérifiée dans ce dépôt ;
- aucune sauvegarde distante exécutée ;
- aucun test de restauration réussi sur une infrastructure réelle ;
- aucune gestion administrative de contenu ou de paiement en production.

## Rôles cibles

| Rôle | Mission | Limite principale |
|---|---|---|
| `owner` | contrôle complet, configuration, récupération | MFA et session privilégiée obligatoires |
| `admin` | opérations et gestion courante | ne peut pas transférer la propriété |
| `editor` | contenus et versions | aucun accès aux paiements ou secrets |
| `support` | aide aux comptes et services | accès limité aux données sensibles |
| `analyst` | lecture opérationnelle | aucune mutation |

## Ordre d’implémentation

1. Connecter une base de développement réelle et documenter son propriétaire.
2. Ajouter le stockage serveur des rôles avec une attribution `owner` bootstrap hors navigateur.
3. Ajouter le middleware d’autorisation serveur pour `/v1/admin/*`.
4. Ajouter l’audit append-only et les tests de non-divulgation.
5. Ajouter l’état des services et erreurs redacted.
6. Ajouter la gestion versionnée des contenus.
7. Ajouter les abonnements et événements de paiement uniquement lorsque le BFF HTTPS est déployé.
8. Ajouter l’interface Control Center après validation de l’API, sans métriques fictives.

## Critères de sortie

Le Control Center ne pourra être déclaré opérationnel qu’après preuve de :

- refus d’accès d’un apprenant à toutes les routes admin ;
- attribution et révocation de rôles côté serveur ;
- journalisation des mutations sensibles ;
- absence de secrets et de texte libre du Journal dans les logs ;
- séparation entre données de test et production ;
- sauvegarde et restauration testées ;
- export lisible et procédure de reprise documentée ;
- revue indépendante de la configuration et des permissions.
