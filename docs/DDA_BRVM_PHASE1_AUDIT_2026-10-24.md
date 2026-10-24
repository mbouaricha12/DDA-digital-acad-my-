# DDA — Audit et livraison BRVM · Phase 1

**Date : 24 octobre 2026**
**Périmètre : information publique, traçabilité et préparation pédagogique**

## État avant modification

DDA possédait déjà une vue `Marchés & BRVM`, des indices pédagogiques normalisés, un lien vers le Journal et une identité visuelle régionale. En revanche, le bloc de calendrier reposait sur `Société A`, `Société B` et `Société C`. Même marqué comme exemple, ce contenu ressemblait à un calendrier de marché et ne servait pas réellement l’information BRVM.

La page ne devait pas inventer de cours, de volumes, de dividendes ou de dates. Aucun flux officiel automatisé autorisé n’était configuré dans le dépôt. La correction retenue est donc une surface d’information vérifiable, sans fausse donnée temps réel.

## Modifications visibles

- Le titre et l’introduction identifient clairement le **pôle BRVM** de DDA.
- Le bloc institutionnel explique la BRVM comme bourse régionale commune aux huit pays de l’UEMOA.
- Le calendrier fictif a été supprimé.
- Cinq liens vers des ressources officielles BRVM sont affichés : cours des actions, résumé du marché, sociétés cotées, rapports des sociétés et règles pour investir.
- Chaque ressource affiche son type et une description d’usage.
- La page affiche un statut de données : information éditoriale et liens officiels, sans flux automatique connecté.
- La provenance, la référence et l’heure de récupération sont explicites.
- Une feuille de route visible distingue les repères disponibles des modules nécessitant une source, une persistance serveur ou une validation supplémentaire.
- Le responsive mobile a été renforcé pour les sources, la provenance et la feuille de route.

## Limites assumées

Les cours, volumes, performances, fiches d’entreprises détaillées, événements de calendrier, portefeuille virtuel persistant et assistant IA BRVM ne sont pas déclarés comme opérationnels. Ils ne doivent être activés qu’après validation des droits de récupération et redistribution, du stockage serveur, des permissions et de la qualité des données.

Les indices visibles dans la zone de démonstration restent des éléments pédagogiques et non des cotations. Le Terminal DDA conserve également son marquage de série synthétique locale.

## Sources officielles utilisées dans l’interface

- https://www.brvm.org/fr/cours-actions/0
- https://www.brvm.org/fr/resume
- https://www.brvm.org/fr/emetteurs/societes-cotees
- https://www.brvm.org/fr/rapports-societes-cotees
- https://www.brvm.org/fr/comment-investir-la-brvm

## Validation prévue

Le contrat `tests/test_brvm_information_contract.js` vérifie la présence du pôle, la suppression des sociétés fictives, les sources officielles, le statut non temps réel, les états de provenance et les styles mobiles. La régression générale doit ensuite confirmer que la navigation Academy, le Terminal, le Journal et les parcours Free/Premium ne sont pas affectés.

## Prochaine étape recommandée

Après validation du pilote Free, préparer un import manuel daté d’un bulletin officiel BRVM, avec conservation de la source, du symbole, de la date de référence, de l’heure de récupération, du type de donnée et du statut de vérification. Ne pas lancer de portefeuille virtuel ni d’assistant BRVM avant que cette chaîne de données et la persistance serveur soient opérationnelles.
