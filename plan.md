# DDA — Plan d’exécution Free → Premium

## Objectif

Transformer la base DDA déployée en une expérience Free pédagogiquement utile et préparer une transition Premium honnête, sans activer de paiement réel ni présenter les droits locaux comme une sécurité serveur.

## Périmètre actuel

Le dépôt est un site statique composé de `dist/index.html`, `dist/academy.html`, de runtimes JavaScript, de contenus de leçons et de contrats Node. Le prototype conserve principalement l’état dans le navigateur. `bff-client.js` fournit une frontière d’intégration mais aucun backend public n’est configuré dans la version actuelle.

## Approche d’implémentation

1. Auditer les modules, leçons, outils Free/Premium, vidéos et états vides.
2. Classer chaque élément `TERMINÉ`, `PARTIEL`, `MANQUANT` ou `BLOQUÉ` avec preuve dans un inventaire versionné.
3. Corriger d’abord les défauts pédagogiques et fonctionnels réalisables sans service externe.
4. Rendre explicites les contenus de démonstration, les vidéos absentes et les limites du stockage local.
5. Ajouter les contrats de régression nécessaires aux corrections.
6. Préparer une frontière backend stable autour de `bff-client.js` : authentification, profil, progression, entitlements et abonnements.
7. Ne pas activer de paiement, ne pas introduire de clé secrète dans `dist/`, et ne pas transformer `localStorage` en mécanisme d’autorisation.
8. Valider sur les dimensions DDA existantes : 280×653, 375×667, 717×512 et 1440×900.

## Structure du projet

- `dist/index.html` : landing publique, surfaces d’information et footer.
- `dist/academy.html` : shell Academy, accès, leçons, Journal, progression et vues Premium.
- `dist/dda-core.js` : modèle local, normalisation, progression, entitlements de démonstration.
- `dist/app.js` : navigation, montage des leçons, Journal, Premium local et états UI.
- `dist/*lesson*.js`, `dist/p2-lessons.js`, `dist/market-intelligence.js` : contenus chargés par domaine.
- `dist/bff-client.js` : frontière d’intégration backend future.
- `dist/dda-analytics.js` : adaptateur de mesure locale/externe optionnelle.
- `tests/` : contrats de contenu, routes, sécurité, persistance, Premium et navigateur.
- `docs/` : matrices d’audit et de réconciliation existantes.

## Décisions de design et de ton

- **Style choisi :** éditorial premium sobre, avec une structure de lecture en étapes plutôt qu’un catalogue de fonctionnalités.
- **Principes :** clarté pédagogique, preuve de travail, limites explicites, continuité Free → Premium.
- **Palette :** fond ivoire et marine profonde, or réservé aux actions et aux preuves ; l’or indique une progression ou un accès, pas une promesse financière.
- **Interaction :** chaque écran doit répondre à « que dois-je comprendre ou faire ensuite ? » ; les états vides et verrouillés expliquent la raison et la prochaine action.
- **Voix :** précise, accessible et responsable ; jamais de promesse de rendement, de faux témoignage ou de fonctionnalité non connectée.
- **Positionnement :** une académie francophone pour comprendre les marchés, pratiquer un raisonnement structuré et prouver sa progression.

## Transition technique cible

Le mode local Free reste disponible pendant la migration. Un compte serveur facultatif pourra ensuite être ajouté, avec migration explicite des données locales. Les droits Premium seront calculés côté serveur à partir d’un abonnement confirmé par webhook ; l’interface ne pourra jamais accorder un droit Premium à partir d’un simple champ local.

Aucune modification de paiement réel ne fait partie de cette phase : les dépendances, secrets, fournisseurs, tarifs et décisions juridiques doivent être fournis et validés avant implémentation commerciale.

## Critères de livraison de cette phase

- inventaire Free, vidéos et Premium versionné ;
- corrections sûres appliquées et testées ;
- limites du prototype affichées honnêtement ;
- contrats de régression ajoutés pour les nouveaux comportements ;
- aucune clé secrète ou transaction réelle ;
- branche de travail propre et PR documentée vers `main`.
