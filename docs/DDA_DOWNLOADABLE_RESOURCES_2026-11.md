# DDA — Ressources téléchargeables révisées

## Périmètre

Cette tranche professionnalise les trois ressources déjà visibles dans la bibliothèque DDA :

- `dist/resources/downloads/checklist-avant-decision.pdf` — fiche imprimable en 2 pages : contexte, scénario, confirmation, invalidation, risque, état émotionnel, décision finale et notes ;
- `dist/resources/downloads/glossaire-marches.pdf` — guide en 4 pages, organisé par catégories, avec 12 repères, exemples de contexte, points essentiels et erreurs fréquentes ;
- `dist/resources/downloads/journal-de-trading-template.xlsx` — classeur en 3 feuilles : `Journal de trading`, `Instructions` et `Relecture`.

Le journal conserve les dix champs déjà utilisés par le Journal DDA. Aucun montant, rendement, objectif de gain ou métrique de perte n'a été ajouté.

## Sources modifiables

Le générateur reproductible est `scripts/generate_resources.py`. Il contient le contenu éditorial, la palette DDA, la mise en page PDF et la structure du classeur. Depuis la racine du dépôt :

```bash
python3 scripts/generate_resources.py
```

Les fichiers générés sont versionnés dans `dist/` car l'application statique les sert directement. La génération ne modifie ni le BFF, ni Supabase, ni les paiements, ni les règles d'accès.

## Copie affichée dans la bibliothèque

Les descriptions de la Landing (`dist/index.html`) et de l'Academy (`dist/academy.html`) indiquent désormais le nombre de pages, les feuilles du tableur et les usages réellement disponibles. Aucune promesse de performance et aucune donnée de marché en direct ne sont introduites.

## Contrôle qualité

Le contrat `tests/test_downloadable_resources_contract.js` vérifie la présence des livrables, leur pagination, les marqueurs pédagogiques essentiels, les trois feuilles du classeur, les filtres, les validations et l'absence de champs de gains/pertes dans le modèle.

## Limites restantes

La bibliothèque administrable peut recevoir d'autres ressources via son BFF, mais cette tranche ne modifie pas son catalogue distant. Une revue éditoriale humaine et un test d'impression sur les imprimantes réellement utilisées restent recommandés avant une campagne de diffusion large.
