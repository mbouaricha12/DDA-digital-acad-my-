# DDA — Quick Skills Discovery

_Date : 14 novembre 2026_

## Décision

La prochaine évolution DDA est une couche de découverte rapide dans le Dashboard. Elle ne crée ni nouvelle route, ni nouveau moteur de progression, ni nouvelle promesse commerciale. Chaque Quick Skill pointe vers une leçon déjà authored et utilise l’état de progression local existant.

## Quick Skills livrées

| Pilier | Quick Skill | Destination réelle | Capacité annoncée |
| --- | --- | --- | --- |
| Trading | Observer avant de chercher un signal | M0.1 | Décrire le rôle des acheteurs et des vendeurs |
| Trading | Repérer une zone de support ou résistance | M0.2 | Identifier une aire d’observation sans certitude |
| BRVM | Distinguer action et obligation | MBRVM.1 | Expliquer propriété versus prêt avec échéance |
| IA | Vérifier ce que l’IA produit | LAB1 | Repérer une limite avant utilisation |

Les durées affichées sont des estimations pédagogiques d’orientation, pas des statistiques de réussite ni des garanties de résultat.

## KEEP / MODIFY / ADD / DEFER

| Décision | Élément | Justification |
| --- | --- | --- |
| KEEP | Routes Academy, Parcours, Terminal, Journal et Progression | Aucun changement de logique métier ni de deep-link |
| KEEP | Registre LESSON_REGISTRY et état local existant | Une seule source de vérité pour les leçons et la progression |
| MODIFY | Dashboard | Ajouter un point d’entrée court et orienté capacité |
| ADD | QUICK_SKILLS_REGISTRY et rendu d’état | Relier quatre besoins immédiats à du contenu réellement disponible |
| ADD | Contrat statique Quick Skills | Empêcher les cartes orphelines, les fausses capacités et les débordements mobiles |
| DEFER | Catalogue Produits Digitaux actif | Aucun contenu authored ni route métier dédiée n’est encore validé |
| DEFER | Paiement, certification et promesse de revenus | Restent soumis aux intégrations serveur et à la validation commerciale |

## Règles de confiance

- Une carte terminée est affichée comme « Validée » seulement quand le quiz réel de la leçon est terminé.
- Une carte verrouillée renvoie au Parcours au lieu de simuler un accès.
- Les cartes IA et BRVM renvoient uniquement vers des contenus existants.
- Les Produits Digitaux sont mentionnés comme préparation, jamais comme parcours actif.
- Aucun rendement, revenu, signal ou certification n’est promis.

## Validation

- Syntaxe `dist/app.js`.
- Contrat `tests/test_quick_skills_discovery_contract.js`.
- Contrats existants de routes, curriculum, Free/Premium, BRVM et responsive.
- Validation navigateur à 390 px et 1440 px via la suite CI existante.
