# DDA — Tranche 0 : Nettoyage de confiance et orientation

**Statut :** implémentée localement, validation statique réussie.
**Périmètre :** surfaces Membership/Premium, sans changement de route ni logique d’entitlement serveur.

## Objectif

Éviter qu’un visiteur ou un apprenant confonde la démonstration Premium locale avec un abonnement actif, et lui donner une lecture immédiate des trois états réels : Free disponible, Premium en démonstration locale, Access à préparer.

## Matrice de périmètre

| Élément | Décision | Justification |
|---|---|---|
| Routes et routeur | KEEP | Aucune nécessité de modifier la navigation. |
| M0, Journal, Terminal | KEEP | Fonctionnalités validées et hors périmètre. |
| Entitlement local `setPlan` | KEEP / DISCLOSURE | Conservé comme démonstration pédagogique, mais libellés renforcés. |
| Statut Membership | MODIFY | « État de l’accès » et mention explicite de l’absence de droit serveur. |
| Orientation Free / Premium / Access | ADD | Bloc visible avant les actions de découverte. |
| Paiement, checkout, prix | DEFER | Aucun flux de paiement opérationnel démontré. |
| Rôles Supabase et production | DEFER | Nécessite staging et accès vérifiable. |

## Modifications livrées

- Ajout d’un bloc d’orientation dans `dist/academy.html`.
- Remplacement des libellés Premium ambigus par « démonstration locale » dans `dist/app.js`.
- Renforcement des messages de toast : aucun abonnement ou droit serveur n’est créé.
- Ajout du style responsive du bloc dans `dist/styles.css`.
- Ajout d’un contrat statique dédié pour empêcher le retour des formulations ambiguës.

## Critères d’acceptation

1. La page Membership indique « État de l’accès ».
2. Les états Free, Premium et Access sont visibles avec leur disponibilité réelle.
3. Le statut local Premium contient « démonstration locale ».
4. Aucun texte ne présente l’activation locale comme un achat, un abonnement ou un entitlement serveur.
5. Les routes existantes restent inchangées.
6. La syntaxe JS et les contrats existants passent.
7. Le bloc reste lisible sur les petits écrans sans débordement horizontal.

## Limites

Cette tranche ne rend pas le paiement opérationnel, ne déploie rien et ne prouve pas la configuration de production. Le contrôle d’accès réel doit toujours être côté serveur avant toute ouverture commerciale.
