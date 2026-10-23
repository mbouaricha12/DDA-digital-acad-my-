# Audit de cohérence du site DDA

**Date :** 21 octobre 2026<br>
**Dépôt local :** `mbouaricha12/DDA-digital-acad-my-`, branche `main`<br>
**Site public inspecté :** <https://mbouaricha12.github.io/DDA-digital-acad-my-/><br>
**Périmètre :** landing page, Academy publique, parcours d’accès, offre Premium, état AutoTrader, pages publiques/légales, manifeste de routes, ressources et intégration BFF visible.<br>
**Nature :** audit en lecture seule; aucun changement applicatif, commit, push, déploiement, compte utilisateur, paiement ou appel Twelve Data n’a été effectué.

## Conclusion exécutive

DDA présente une **cohérence de produit satisfaisante en tant que bêta/aperçu pédagogique local** : la landing promet apprentissage, pratique et progression, et l’Academy précise que les données restent sur l’appareil, qu’il n’y a pas de cotations réelles, d’ordre réel, de paiement ou de connexion broker dans cette version. Les pages visibles sur l’Intelligence DDA et l’AutoTrader signalent également que ces fonctions ne sont pas encore actives. Les tests de parcours navigateur et la vérification de liens internes n’ont pas révélé de casse de navigation.

En revanche, le site **n’est pas cohérent avec une présentation comme service Premium pleinement opérationnel**. La publication GitHub Pages est différente de l’état local actuel; le site public garde le BFF désactivé et les inscriptions sont locales; Premium est une simulation sans encaissement; AutoTrader n’a pas de flux connecté. Plusieurs documents publics n’ont pas leur contenu dans le HTML initial, et les documents SEO de base sont absents de l’origine publiée. La bonne qualification reste donc : **prototype/pré-lancement, pas service commercial connecté**.

## Résultats vérifiés

- La landing publique répond en HTTP 200 et expose un titre, une description, des sections de produit et des CTA.
- L’Academy publique répond en HTTP 200. Son interface d’accès explique que la version conserve la progression sur l’appareil. Son parcours d’inscription demande un prénom et un e-mail dans le mode local; le code ne crée alors pas de compte serveur.
- L’Academy publiée contient `window.DDA_BFF_BASE_URL = window.DDA_BFF_BASE_URL || ''`. Aucune URL BFF n’est configurée dans la réponse observée. Le client BFF reste donc désactivé par défaut sur cette publication.
- L’interface et les contenus publics précisent l’absence de données de marché réelles, de paiement et d’exécution. La page Intelligence décrit AutoTrader comme prototype sans flux de marché connecté.
- Les routes publiques contrôlées (`/`, `/academy.html`, `/about/`, `/terms/`, `/privacy/`, `/cookies/`, `/imprint/`, `/risks/`, `/accessibility/`, `/contact/`, `/faq/`, `/launch/`) répondent en 200. Une route inconnue renvoie 404.
- Les 13 fichiers HTML locaux ont été parcourus pour leurs références locales : **0 référence manquante ou hors du répertoire `dist/`**.
- La suite navigateur locale `tests/run.js` passe : **59 réussites, 0 échec**. `tests/test_launch_final_audit.js` passe également. Ces suites ne prouvent ni un déploiement BFF ni un parcours réel de paiement.
- Les empreintes SHA-256 locales et publiques des fichiers `academy.html`, `app.js`, `bff-client.js` et `sw.js` sont différentes. La publication GitHub Pages n’est donc pas la copie locale auditée.

## Constats et priorités

### 1. Écart entre le code local et la publication — priorité P1 avant release

Les fichiers essentiels diffèrent entre `dist/` et GitHub Pages. Les changements locaux ne sont pas mis en ligne automatiquement et ne doivent pas être considérés comme validés publiquement. La réponse de la racine observée porte `Last-Modified: Sun, 18 Oct 2026 16:45:15 GMT`, antérieur aux changements récents du dépôt.

**Risque :** tests concluants sur la copie locale alors que les visiteurs utilisent une version plus ancienne, potentiellement différente dans ses écrans, disclosures et garde-fous.

**À faire avant release :** revue des changements en attente, intégration par le processus normal, contrôle du workflow de déploiement Pages, puis comparaison des empreintes et parcours sur l’origine publique. Ne pas confondre le déploiement du site statique avec celui du BFF ou des migrations Supabase.

### 2. Compte utilisateur local, pas compte serveur — priorité P1 si le funnel est présenté comme inscription réelle

Le HTML public de l’Academy laisse `DDA_BFF_BASE_URL` vide. Dans `dist/app.js`, le gestionnaire de `signup-form` (autour des lignes 2750–2798) appelle `DDABFF.register()` uniquement quand le BFF est activé; sinon il sauvegarde localement un utilisateur et enregistre le parcours dans l’état local. Le site rappelle correctement que les données restent sur cet appareil, mais certains libellés comme « Créer mon compte », « Mon compte » et « Commencer gratuitement » peuvent laisser attendre un compte DDA transférable entre appareils.

**Risque :** confusion sur l’existence d’un compte serveur, la récupération de compte et la portabilité de la progression.

**À faire :** tant que le backend n’est pas déployé et configuré, préférer des libellés comme « Créer mon profil sur cet appareil » ou rendre le mode local très visible avant le formulaire. Une fois le BFF opérationnel, tester les flux réels inscription → vérification e-mail → connexion → session → progression et révocation.

### 3. Premium reste une démonstration; pas de vente opérationnelle — priorité P1 commerciale

Les pages Premium indiquent explicitement « Premium Demo local » et « aucun paiement, aucune donnée live »; la FAQ explique qu’aucun paiement réel n’est activé. Le code permet de simuler le déverrouillage Premium localement. Cela est cohérent avec un aperçu, mais n’est pas un entitlement facturé ni une preuve d’abonnement côté serveur.

**Risque :** présenter la simulation comme une offre disponible à l’achat rendrait le parcours et le droit d’accès incohérents.

**À faire :** maintenir les disclosures tant que Chariow, le BFF, Supabase, les droits et le test staging complet ne sont pas activés. Ne pas utiliser la simulation locale comme preuve d’achat ou d’autorisation.

### 4. Documents légaux remplis côté JavaScript — priorité P1/P2 pour disponibilité, accessibilité et indexation

Exemple : `dist/terms/index.html` contient un `<article data-document-content>` vide (ligne 13), et charge `public-docs.js` / `public-document.js` (ligne 16). `dist/public-document.js` prend ensuite le contenu de `window.DDA_PUBLIC_DOCUMENTS` et l’injecte avec `innerHTML` (lignes 4–15). Le HTML brut de `/terms/` contient donc le titre/navigation, mais pas le corps des conditions avant exécution JavaScript. Le rendu dans un navigateur JavaScript est disponible; ce n’est pas la même chose que la présence du texte dans la réponse initiale.

**Risque :** visiteurs sans JavaScript, lecteurs spécialisés et crawlers reçoivent une coquille; la consultation de conditions, confidentialité ou risques ne doit pas dépendre d’un script tiers ou d’un chargement client pour afficher son contenu essentiel.

**À faire :** générer/prérendre le texte des documents dans leur HTML statique initial, en conservant éventuellement le script pour la navigation. Répéter le contrôle sur la réponse publique brute après publication.

### 5. Découverte et métadonnées SEO incomplètes — priorité P2

À la date de l’inspection, les URLs publiques `/sitemap.xml` et `/robots.txt` renvoient 404. Aucun fichier correspondant n’est présent sous `dist/`. Les pages HTML vérifiées localement ne définissent pas de canonical. Les pages de l’Academy ont un titre de document propre, mais leurs Open Graph/Twitter reprennent le titre et la description de la landing. `og:image` et `twitter:image` utilisent `images/dda-og-image.jpg`, une URL relative, y compris sur la page publiée sous un chemin de dépôt GitHub Pages.

**Risque :** mauvais aperçu lors du partage, indexation incomplète ou métadonnées incohérentes entre l’accueil, l’Academy et les documents.

**À faire :** décider quelles routes publiques sont indexables; publier un `sitemap.xml` et un `robots.txt` adaptés au sous-chemin actuel; fournir des canonical et URL d’images absolues calculées pour l’origine et le chemin réels; donner à l’Academy ses propres métadonnées sociales. Les routes d’accès privées ou avec état ne doivent pas être proposées à l’indexation.

### 6. En-têtes HTTP de défense en profondeur absents — priorité P2

La réponse HTTPS publique contrôlée expose HSTS et Cache-Control, mais ne présente pas `Content-Security-Policy`, `X-Content-Type-Options`, `Referrer-Policy` ni `Permissions-Policy` comme en-têtes de réponse. Certaines pages déclarent une politique de référent en meta, mais cela ne remplace pas les autres politiques HTTP. GitHub Pages ne permettant pas de configurer arbitrairement les headers, le changement d’hébergeur/proxy doit être évalué si ces contrôles sont requis.

**Risque :** protection de défense en profondeur réduite contre l’injection, le MIME sniffing et l’accès navigateur à des fonctionnalités non nécessaires.

**À faire :** concevoir une CSP à partir des scripts/styles réellement employés (éviter une politique approximative qui casse la SPA), puis servir les headers par un hébergeur/proxy compatible et les vérifier sur l’origine live.

### 7. Présentation du marché et AutoTrader — cohérent en mode démonstration

La landing marque plusieurs visuels comme pédagogiques/synthétiques; l’Academy indique « aucune donnée de marché réelle ». La page Intelligence distingue Darius AI (à construire) du prototype AutoTrader et précise l’absence de flux connecté et d’exécution. Les modules locaux de démo et d’import historique ne doivent donc pas être décrits comme de la donnée live ou des ordres réels.

**État : cohérent avec une démo**, mais le lancement AutoTrader Premium nécessite encore les droits Twelve Data, un instrument/place/timeframe déterminé, le BFF/Supabase de staging et le scénario end-to-end d’entitlement/quota. Aucun de ces faits n’a été prouvé par cette inspection du site.

## Cohérence de navigation et d’interface

Le manifeste `dist/manus-routes.json` décrit l’accueil, les vues de l’Academy et les pages publiques principales. Les liens locaux présents dans les fichiers HTML pointent vers des fichiers existants. Le chemin direct inconnu renvoie une 404 réelle sur Pages. Les tests navigateur couvrent notamment la navigation, les droits locaux, les parcours de leçons, les états de progrès, les contrôles d’accès Premium, les pages responsive jusqu’à 360 px, la pratique et le funnel; ils passent dans l’environnement local actuel.

La cohérence rédactionnelle est globalement bonne autour de « apprendre, pratiquer, prouver », avec des disclaimers répétés sur les données locales, les séries synthétiques et l’absence de promesses de gains. La faiblesse n’est pas un message explicite de garantie de profit; c’est plutôt le risque que des noms d’actions « compte », « inscription » ou « Premium » soient interprétés comme des services réels alors que la publication active observée est encore une démo locale.

## Ordre recommandé des corrections

1. **Décider du statut public voulu** : bêta locale assumée ou service réellement connecté. Maintenir le site en pré-lancement tant que BFF, facturation et permissions ne sont pas opérationnels.
2. **Aligner build local et Pages** après revue contrôlée; vérifier la version servie et les empreintes de tous les assets changés.
3. **Clarifier les libellés d’accès et de profil** pour signaler sans ambiguïté le stockage local, tant que le BFF n’est pas configuré.
4. **Prérendre les documents publics** dans le HTML initial, puis contrôler le HTML source et le rendu.
5. **Corriger sitemap, robots, canonical et Open Graph** en fonction de l’URL GitHub Pages avec son sous-chemin.
6. **Définir la stratégie de headers HTTP** (hébergement/proxy et CSP testée).
7. **Séparer les validations commerciales** : staging BFF/Supabase/Chariow, licences fournisseur et recette AutoTrader. Un test de l’interface locale ne remplace pas cette recette.

## Limites

Cet audit ne teste pas une connexion avec un compte réel, n’envoie pas d’e-mail, ne paie pas, ne touche pas à Supabase ou Chariow et ne teste pas les API de marché. L’inspection publique porte sur les URLs GitHub Pages documentées dans le dépôt et sur leurs réponses HTTP au moment de l’audit. Les tests locaux attestent uniquement la copie présente dans le workspace. Les changements locaux du dépôt restent non committés; leur nombre et leur contenu dépassent le périmètre de ce rapport et doivent être examinés avant tout merge.
