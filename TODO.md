# DDA — Résultats de travail

## Audit réel et inventaires

- [ ] Produire l’inventaire des modules et leçons avec un statut `TERMINÉ`, `PARTIEL`, `MANQUANT` ou `BLOQUÉ`, uniquement après inspection du contenu et du runtime.
- [ ] Produire le registre des vidéos prévues, disponibles, intégrées, vérifiées, à produire ou bloquées ; ne jamais présenter une vidéo inexistante comme publiée.
- [ ] Produire l’inventaire exhaustif des outils Free et Premium réellement visibles et fonctionnels.
- [ ] Documenter la persistance locale, les limites du mode appareil et la différence entre démonstration locale et production connectée.

## Expérience DDA Free

- [ ] Chaque module annoncé comme Free possède un contenu réel, un objectif, une explication, une pratique ou un quiz pertinent, un résumé et une prochaine action cohérente.
- [ ] Les liens et boutons des leçons Free conduisent aux bonnes destinations et les états vides sont explicites.
- [ ] La progression ne se déclare pas terminée sans action cohérente de l’apprenant.
- [ ] L’expérience reste lisible et utilisable sur 280×653, 375×667, 717×512 et 1440×900.
- [ ] Les contenus pédagogiques distinguent les scénarios synthétiques des données de marché réelles et n’émettent aucun signal ni conseil financier.

## Premium et transition

- [ ] Chaque outil Premium affiché est classé selon son fonctionnement réel : pilote limité, commercialisable, à terminer ou bloqué par une ressource externe.
- [ ] Les droits Premium locaux restent explicitement démonstratifs et ne sont jamais présentés comme une autorisation serveur sécurisée.
- [ ] La frontière `bff-client.js` est documentée pour l’authentification, le profil, la progression, les entitlements et les abonnements futurs.
- [ ] Aucun paiement réel, webhook réel ou secret de fournisseur n’est ajouté sans configuration et autorisation explicites.
- [ ] Les cas d’échec backend, expiration, déconnexion et migration des données locales ont un comportement honnête et réversible.

## Validation et livraison

- [ ] Ajouter ou corriger les contrats de régression nécessaires aux corrections réalisées.
- [ ] Exécuter les contrats Node, la syntaxe JavaScript et la régression navigateur disponibles.
- [ ] Contrôler les liens, les footers, les documents publics et les informations légales du prototype.
- [ ] Publier un rapport d’inventaire avec les blocages nécessitant des informations ou services externes.
- [ ] Livrer les corrections réalisables dans une branche dédiée et ouvrir une PR vers `main`.
