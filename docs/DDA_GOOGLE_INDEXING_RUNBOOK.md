# DDA — Runbook d’indexation Google

**Domaine canonique :** `https://dariusdigitalacademy.com/`

## Ce qui est préparé dans le dépôt

- `dist/robots.txt` autorise le crawl public et déclare le sitemap canonique.
- `dist/sitemap.xml` liste la landing et les pages publiques autonomes.
- `dist/index.html` contient maintenant un canonical, une URL Open Graph et des données structurées `Organization` / `WebSite`.
- `dist/academy.html` est explicitement `noindex, nofollow` : l’espace applicatif ne doit pas concurrencer la landing dans les résultats.
- Les routes de campagne `/go/` sont exclues du crawl standard.

Ces éléments améliorent la compréhension du site, mais ils ne garantissent pas une indexation immédiate. Google décide du crawl et de l’indexation selon ses propres signaux.

## Action obligatoire dans Google Search Console

1. Ouvrir [Google Search Console](https://search.google.com/search-console).
2. Ajouter une propriété de type **Domaine** avec :

   ```text
   dariusdigitalacademy.com
   ```

3. Google affichera un enregistrement TXT de vérification à créer dans Cloudflare.
4. Dans Cloudflare, ajouter ce TXT à la racine DNS, avec le nom et la valeur fournis par Google.
5. Revenir dans Search Console et cliquer sur **Vérifier**.
6. Utiliser **Inspection de l’URL** pour :
   - `https://dariusdigitalacademy.com/`
   - `https://dariusdigitalacademy.com/about/`
   - `https://dariusdigitalacademy.com/faq/`
7. Cliquer sur **Demander une indexation** pour la landing et les pages publiques prioritaires.
8. Dans **Sitemaps**, soumettre :

   ```text
   https://dariusdigitalacademy.com/sitemap.xml
   ```

La vérification Search Console est distincte de la vérification GitHub Pages. Le TXT GitHub protège le domaine pour GitHub Pages ; le TXT Google prouve la propriété du domaine à Search Console.

## Recommandations éditoriales

La landing doit rester la page principale : titre clair, description unique, contenu substantiel, liens internes vers les pages publiques et aucun chiffre de marché présenté comme une donnée live. Les pages Academy, les écrans de connexion et les routes de campagne ne sont pas des pages SEO.

Après chaque changement éditorial important, vérifier que la page répond en HTTPS, que le canonical pointe vers le domaine principal et qu’aucune erreur JavaScript ne bloque le rendu initial.

## Limite connue

DDA ne peut pas automatiser la demande d’indexation depuis GitHub Pages. Search Console nécessite une connexion au compte Google du propriétaire et un TXT généré par Google. Cette étape doit être effectuée dans le compte Google qui gère la présence officielle de DDA.
