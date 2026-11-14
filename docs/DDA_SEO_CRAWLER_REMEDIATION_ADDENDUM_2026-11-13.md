# DDA — Addendum de remédiation SEO crawler

**Base contrôlée :** `main` après la PR SEO #256  
**Lot :** correction complémentaire, sans refonte visuelle, sans changement du curriculum ou des permissions.

## Corrections appliquées

- `lang="fr-FR"` sur la homepage, les pages publiques, les pages futures indexables, l’Academy shell et les documents utilitaires.
- Description `/commencer/` recentrée sur les trois fondations M0 et l’apprentissage honnête.
- `/launch/` clarifie maintenant que Free commence par M0.1, M0.2 et M0.3 ; M1.1 à M1.3 sont trois leçons supplémentaires dont l’accès dépend de la formule et des droits de l’apprenant.
- Le contenu pédagogique, le registre des leçons et les permissions n’ont pas été modifiés.
- JSON-LD de `/commencer/` et `/launch/` réaligné avec leurs descriptions HTML.
- Alias historiques (`about.html`, `faq.html`, `legal/`, `mentions-legales/`, `politique-de-confidentialite/`, `privacy-policy/`) marqués `noindex, follow` tout en conservant leur redirection/canonical vers la page de référence.
- L’image OG existante de `main` est conservée : elle est déjà validée en 1200 × 630. Aucun doublon d’image n’a été ajouté.

## Contrôles

Les contrats SEO suivants passent après correction :

- `tests/test_public_seo_metadata_contract.js` — 15 pages publiques ; PASS.
- `tests/test_jsonld_structured_data_contract.js` — 85 assertions ; PASS.
- `tests/test_seo_sitemap_robots_contract.js` — PASS.
- `tests/test_landing_launch_contract.js` — PASS.
- `git diff --check` — PASS.

Le sitemap conserve les pages futures `live`, `business`, `experts`, `community` et `ai`, car elles sont accessibles et leur retrait n’a pas été autorisé sans décision de direction. Cette décision reste ouverte : les conserver indexables comme feuille de route, ou les passer `noindex` jusqu’à leur lancement effectif.

## État production et limites de mesure

Avant déploiement, les URLs publiques prioritaires répondaient en HTTP 200. `/academy.html` répondait en 200 mais restait protégé par `noindex, nofollow` et `Disallow` dans `robots.txt`. GitHub Pages ne renvoyait pas de `X-Robots-Tag`; aucune configuration de dépôt ne permet de l’ajouter côté serveur.

Le contrôle local des liens internes et des `alt` n’a identifié aucun lien local cassé ni image sans `alt` dans le périmètre prioritaire. Les mesures Playwright synthétiques ont donné `CLS = 0` et des LCP rapides sur les pages documentaires locales. L’INP réel doit être confirmé par une mesure après déploiement ; l’absence d’événement INP qualifiant dans un run headless ne constitue pas une garantie utilisateur.

## Livraison

Cette correction est publiée dans une PR dédiée sur `main`, sans fusion automatique. Un smoke test de production devra être relancé après fusion pour vérifier les nouvelles balises réellement servies par GitHub Pages.
