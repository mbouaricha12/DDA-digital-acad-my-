# DDA — Audit complet pré-lancement

**Fichier demandé :** `docs/DDA_AUDIT_COMPLET_PRE_LANCEMENT_2026-11-16.md`  
**Audit réalisé :** 18 novembre 2026  
**Dépôt :** `mbouaricha12/DDA-digital-acad-my-`  
**Base de production observée :** `main` — `01165ab9c893249e69cd09fc627d7bb93b6ddc72`  
**Domaine officiel :** [https://dariusdigitalacademy.com](https://dariusdigitalacademy.com)

> Le nom de fichier conserve la date demandée le 16 novembre. Les vérifications ci-dessous décrivent l’état réel constaté le 18 novembre et distinguent explicitement production, code non déployé, intégration simulée et dépendance externe.

## 1. Décision de lancement

### DDA Free : **GO pour un pilote contrôlé, sous validation du parcours réel**

Le noyau pédagogique M0 (trois leçons authored, exercices, quiz, feedback et progression) est déployé et le domaine public est accessible. La page d’accueil mène clairement à `/commencer/`. Les pages légales et de risques sont disponibles. Les tests locaux et les workflows sur le SHA de production sont verts.

Un correctif de calcul de progression est toutefois encore local à la branche d’audit : une leçon jamais commencée doit afficher **0 %**, et non le pourcentage de sa première étape. Ce correctif n’est pas encore publié sur le domaine officiel. Il doit être revu puis, après approbation de merge, vérifié de nouveau en production.

L’ouverture Free doit rester un **pilote contrôlé**, pas une affirmation de validation avec de vrais apprenants : l’inscription/connexion réelle, le parcours authentifié complet et la synchronisation multi-appareils n’ont pas été testés avec un compte de production pendant cet audit.

### DDA Premium payant : **NO-GO commercial**

Le dépôt contient un adaptateur Chariow, le modèle de membership, des contrôles d’entitlement et des tests. Il n’y a pas de preuve d’un produit marchand actif ni d’un parcours réel checkout → paiement → webhook signé → entitlement → expiration/révocation testé de bout en bout. Aucun prix, prélèvement ou abonnement ne doit être annoncé comme actif. Pas de dépense ou activation de clé effectuée.

### Synthèse de la décision

| Décision | Statut | Conséquence |
|---|---|---|
| Pilote pédagogique DDA Free | **GO conditionnel** | Exécuter et documenter le parcours réel, puis publier le fix de progression après revue. |
| Vente ou abonnement Premium | **NO-GO** | Ne pas activer le checkout avant validation juridique, marchand, Supabase, webhooks et droits serveur. |
| M1 / `advanced_modules` | **Hors périmètre Free publié, mais gate non sécurisé côté serveur** | Ne pas vendre ni présenter M1 comme protégé avant déplacement derrière une autorisation BFF. Ne pas changer le mapping de droits sans décision produit explicite. |
| Données de marché, exécution broker, assistant IA | **Non confirmés comme services opérationnels** | Garder les libellés pédagogiques et les avertissements honnêtes. |

## 2. Méthode, limites et preuves

## 2. Méthode, limites et preuves

Les vérifications ont porté sur le checkout `main` à SHA `01165ab9`, le code livré sous `dist/`, le BFF et ses contrats, la configuration CI/déploiement, les pages du sitemap, les réponses HTTP du domaine officiel, les vues publiques dans un navigateur Chromium à plusieurs tailles et un run Lighthouse mobile de la homepage.

- **Tests locaux après le fix de progression :** 118 fichiers de contrats/smoke, 0 échec; Playwright `tests/run.js`, **128 passés, 0 échec**.
- **CI du SHA de production :** workflows GitHub Pages, DDA E2E, DDA code coverage, CodeQL Advanced et Production availability monitor en réussite.
- **Domaine officiel :** les 12 URL du sitemap répondent HTTP 200, sans redirection, au contrôle du 18 novembre. Les cinq pages futures contrôlées répondent 200 avec `noindex, follow` et sont absentes du sitemap.
- **Captures :** homepage à 360, 390, 768, 1366, 1440, 1920 et 2560 CSS px; `/launch/` et `/academy.html` à 390 px. Elles montrent le contenu déployé avant merge du correctif. `/commencer/` a été vérifiée en HTTP/metadata, mais cette archive ne contient pas sa capture.
- **Non vérifié :** compte apprenant réel, session owner réelle, données Supabase de production, appareil iOS/Safari physique, achat, remboursement, renouvellement, livraison réelle de webhook, clé IA, source de cotations live. Aucune opération de paiement ni aucun secret n’a été utilisé.

La politique **Visible Delivery** reste la règle : le code, une preview de PR, un test local ou une capture de branche ne prouvent pas la disponibilité d’une fonctionnalité. Après tout merge autorisé, consigner le SHA déployé, vérifier l’URL officielle, le parcours concerné et ses captures avant de déclarer le résultat livré.

## 3. Architecture réellement constatée

```text
Visiteur / apprenant
    │
    ├── https://dariusdigitalacademy.com
    │       GitHub Pages → SPA statique `dist/` (HTML / CSS / JavaScript)
    │       └── Learning Engine, curriculum, vues publiques et espace apprenant
    │
    └── https://api.dariusdigitalacademy.com
            BFF Node.js → Supabase (auth, données et memberships, sous réserve
            de configuration et validation réelles de l’environnement)
            ├── routes d’authentification / progression / administration
            ├── routes IA et marché (disponibilité dépendante de la configuration)
            └── adaptateur Chariow / webhook (aucun paiement activé par le code seul)
```

Le frontend est statique et publié par le workflow GitHub Pages. Le BFF source est dans `bff/`; `bff/vercel.json` configure un adaptateur Vercel, `render.yaml` conserve également une configuration Render, et les réponses observées sur l’API publique ont identifié Vercel. Cela ne suffit pas à établir l’état des secrets ou de Supabase. Le README a été corrigé pour ne plus prétendre qu’aucun BFF n’existe, tout en conservant la distinction entre code présent et intégration validée.

Le mode invité conserve les preuves pédagogiques dans le navigateur. Le chemin serveur d’authentification et de progression existe, mais la synchronisation réelle d’un compte sur plusieurs appareils n’a pas été démontrée en production. L’API de marché répondait `not_configured` pour les instruments interrogés; il n’y a donc pas de cotation live démontrée. Le code de l’assistant IA ne prouve pas une clé fournisseur configurée ni un service activé.

### Périmètre de curriculum et droits

- **M0 :** M0.1, M0.2 et M0.3 sont les trois fondations Free indiquées sur `/commencer/` et `/launch/`.
- **M1 :** M1.1, M1.2 et M1.3 existent dans le curriculum. `/launch/` précise qu’elles nécessitent le droit avancé et ne font pas partie du périmètre Free actuel. Cependant, `canUnlock()` ne demande au serveur une confirmation que pour `premium_track`; `advanced_modules` retombe sur `DDA.can()` et l’état local. Les trois fichiers `m1-1-lesson.js`, `m1-2-lesson.js`, `m1-3-lesson.js` répondent publiquement en HTTP 200 sans authentification.
- **Lab :** LAB1–LAB3 sont accessibles dans le parcours Free; LAB4 et Capstone sont sous `premium_track`.
- **Premium :** une expérience locale de démonstration existe; elle ne constitue pas un checkout, un abonnement ou une autorisation commerciale.

Aucune permission ni aucun contenu pédagogique n’a été modifié dans cette tranche. Le décompte public est cohérent : trois leçons M0 accessibles en Free; six leçons au catalogue lorsque les trois M1 à accès avancé sont incluses. La copie est exacte sur le périmètre Free, mais le contrôle technique M1 est contournable et ne prouve pas un droit serveur.

### Nomenclature recommandée

Conserver **DDA Free** et **DDA Premium** comme seuls noms commerciaux publics. Garder `advanced_modules` comme identifiant d’entitlement interne et parler de « droit aux modules avancés » dans la copie publique tant que son mapping commercial n’est pas confirmé. `Standard/Pro` apparaît dans un commentaire historique du registre de leçons, mais aucune offre, aucun prix ni aucun cycle commercial correspondant n’est validé. Ne pas publier ni vendre « Standard/Pro » et ne pas renommer les droits ou changer les gates dans cette passe.

## 4. Matrice de conformité pré-lancement

| Chantier | État réel constaté | Manque / risque | Criticité | Action recommandée |
|---|---|---|---|---|
| **Academy Free** | M0.1–M0.3 authored et déployées; exercices, quiz, feedback et CTA Free visibles. | Parcours d’inscription/authentification réel non rejoué avec un apprenant pilote. | **P0 pilote** | Faire un smoke test supervisé sur le domaine; recueillir les retours de 5–8 apprenants sans promettre une sauvegarde cloud non validée. |
| **M1 / modules avancés** | Trois leçons authored; la copie les exclut de Free et l’UI applique `advanced_modules`. | Le gate est local; les trois bundles sont accessibles anonymement en HTTP 200. Aucun contrôle serveur M1 constaté. | **P0 avant toute offre M1; P1 pour le pilote M0** | Dans une PR séparée, servir le contenu depuis le BFF après authentification + vérification `advanced_modules`; retirer les bundles publics et tester 401/403/autorisé ainsi que l’absence de contenu dans `dist/`. |
| **Premium** | Aperçu local et contenus visibles; les surfaces commerciales préviennent que l’encaissement n’est pas actif. | Checkout, politique commerciale et accès Premium réel non validés. | **P0 si vente envisagée** | Garder en démonstration; aucun paiement avant les critères de sortie de la section 6. |
| **DDA Lab** | LAB1–LAB3 sont des activités pédagogiques; LAB4/Capstone sont gated. | LAB4/Capstone ne sont pas une offre payante opérationnelle; pas un simulateur de trading réel. | P1 | Maintenir les descriptions pédagogiques et le gate; ne pas élargir le périmètre Free ici. |
| **Dashboard** | Vues et indicateurs reliés au curriculum/progression; parcours visible sur le domaine. | Session réelle et données de compte non validées; PR #299 d’optimisation dashboard reste ouverte. | P1 | Examiner #299 indépendamment; rejouer le dashboard connecté uniquement avec un compte de test autorisé. |
| **Progression** | Calcul couvert par tests; fix local en cours pour afficher 0 % à une leçon intacte. | La production reste à l’ancien comportement tant que PR/merge/déploiement ne sont pas effectués. | **P0** | Revoir la PR de progression, CI, merge autorisé, puis test réel et capture sur domaine officiel. |
| **Ressources** | 2 guides en ligne; 2 PDF et 1 XLSX livrés dans `dist/resources/`. | Vérification manuelle de téléchargement et lisibilité par lecteur mobile non incluse ici. | P1 | Faire un contrôle de téléchargement Android/iOS pendant le pilote. |
| **Vidéos** | Registre de 8 vidéos YouTube (2 associées à des leçons, 6 en Ressources selon le câblage); vidéo institutionnelle distincte `landing-presentation-60s.mp4` (~7,16 Mo). | Les 8 vidéos de cours évoquées dans les anciens documents sont des scripts, pas huit productions livrées; 11 liens n’ont pas été établis. | P1 | Distinguer explicitement script, vidéo externe référencée et fichier de landing; ne pas inventer de liens. |
| **Terminal** | Interface pédagogique et démonstrations synthétiques; mesures de prix signalées comme non connectées. | Aucun flux live ni ordre broker démontré; API marché `not_configured`. | P1 | Conserver le disclaimer; aucune connexion broker ou donnée réelle sans nouvelle décision. |
| **Journal** | Journal & Plan utilisables en local; interface et tests présents. | Synchronisation serveur, export/suppression multi-appareils et cycle compte réel non vérifiés. | P1 | Annoncer « sur cet appareil » tant que le parcours serveur n’est pas démontré. |
| **Produits digitaux** | Surface/interface présente dans l’application. | Aucun checkout ou fulfillment vérifié; aucun produit commercial confirmé. | P2 / P0 si vente | Laisser en aperçu/inactif; ne pas ajouter de paiement dans la tranche actuelle. |
| **DDA AI** | Route et garde-fous pédagogiques existent dans le BFF; page publique `/ai/` est « à venir ». | Disponibilité fournisseur, coûts, quotas effectifs et conversation authentifiée non validés; réponse précédente `ai_not_configured`. | P1 | Ne pas la présenter comme un service live; valider config, quota, budget et parcours avant activation. |
| **Back-office** | Page admin et vues d’aperçu, utilisateurs, memberships, progression/ressources existent; protection par rôle côté BFF. | Aucun accès owner réel testé ici; ce n’est pas un CMS complet ni un système de gestion de contenu éditorial automatisé. | P1 | Valider en staging avec un owner autorisé; ne pas ajouter de rubriques sans actions/données réelles. |
| **Abonnements** | Modèle membership et état server-side présents dans le code. | Pas d’offre, de facturation récurrente ni de séquence renouvellement/révocation validée avec Chariow. | **P0 si vente** | Ne pas annoncer d’abonnement actif; confirmer séparément les événements récurrents disponibles chez le marchand. |
| **Entitlements** | Les identifiants `premium_track`, `resources_premium`, `certificate_preview`, `advanced_modules` existent; `premium_track` a un contrôle serveur ciblé. | `advanced_modules` n’est pas imposé par le BFF pour les fichiers M1 : `DDA.can()` local et bundles publiquement téléchargeables. Mapping commercial non approuvé. | **P0 avant toute offre avancée payante** | Créer une PR sécurité dédiée, servir M1 par route BFF protégée et supprimer l’exposition statique; le compte sans entitlement doit obtenir un refus serveur. |
| **Paiements** | Adaptateur Chariow avec validation de signature, idempotence et tests de transitions existe. | Produit, clés, environnement, webhook réel, remboursements et réconciliation jamais testés de bout en bout dans cette passe. | **P0 si vente** | Aucun encaissement; staging marchand + migrations + test de vente/échec/expiration/révocation + validation juridique avant activation. |
| **SEO** | Sitemap à 12 URL; toutes répondent 200 sans redirection. Canonicals absolus auto-référencés, titres/descriptions uniques, Open Graph/Twitter, `fr-FR`, favicon et viewport mobile vérifiés. Academy reste noindex. | Les en-têtes robots HTTP ne sont pas fournis par GitHub Pages; le contrôle repose sur les directives meta/robots. | **Conforme / P1 headers** | Garder les 5 pages futures hors sitemap et en `noindex, follow`; réauditer après tout changement d’hébergement. |
| **Responsive** | Captures homepage à 360, 390, 768, 1366, 1440, 1920 et 2560 px; launch et accès à 390 px; Playwright vert. | Chromium responsive n’équivaut pas à un test sur téléphone physique, Safari iOS ou lecteur d’écran complet. | P1 | Faire un test physique iOS/Android de parcours et de téléchargement avant d’élargir le pilote. |
| **Motion Design** | Animations CSS et orbite visuelle/effet 3D CSS visibles sur le site; respect réduit du mouvement partiellement couvert dans les leçons. | Aucune scène WebGL/3D temps réel démontrée; audit exhaustif de `prefers-reduced-motion` cross-site non fait. | P2 | Ne pas parler de « vraie 3D »; garder les animations décoratives, contrôlées et mesurées. |
| **Sécurité** | BFF authentifié, contrôles de rôle, RLS/migrations et contrats négatifs présents; protections d’identité et de billing revues ci-dessous. | En-têtes HTTP CSP/HSTS/Referrer-Policy/Permissions-Policy absents sur la réponse statique observée; rate limiter mémoire non distribué; backend réel non audité en staging. | P1 | Configurer une couche d’en-têtes au CDN/serveur; staging RLS/secrets/webhooks; Redis/limiteur distribué si multi-instance. |
| **Déploiement** | Main `01165ab9` publié sur GitHub Pages; CI, disponibilité et workflows qualité réussis; domaine officiel vérifié. | Le correctif de progression et les nouveaux documents sont encore sur branche d’audit; aucun déploiement ne peut être revendiqué pour eux. | **P0 de clôture** | Pousser une PR propre; attendre revue/merge autorisé; vérifier le déploiement effectif par SHA puis la page réelle. |

## 5. Audit SEO, contenu et performance

### Pages et indexabilité

Le sitemap public répond 200 et contient exactement ces 12 pages, toutes en 200, sans redirection au contrôle :

`/`, `/commencer/`, `/launch/`, `/about/`, `/terms/`, `/privacy/`, `/cookies/`, `/imprint/`, `/risks/`, `/accessibility/`, `/contact/`, `/faq/`.

`/live/`, `/business/`, `/experts/`, `/community/` et `/ai/` sont accessibles en 200, mais portent `noindex, follow` et ne figurent pas dans le sitemap. La page Academy (`/academy.html`) demeure volontairement non indexable. `robots.txt` n’interdit pas les pages publiques du sitemap; il conserve une exclusion ciblée pour `/go/`. Les réponses statiques examinées n’avaient pas d’en-tête `X-Robots-Tag`; les décisions d’indexation sont donc portées par les directives HTML/robots.

### Métadonnées, maillage et accessibilité

Les pages examinées ont un titre et une description spécifiques, un canonical HTTPS auto-référencé, Open Graph/Twitter, la langue `fr-FR`, le favicon et la configuration viewport. `/launch/` ne réutilise plus une description générique. `/commencer/` garde son CTA gratuit direct. Le crawl contractuel confirme une structure à un H1 par page et des niveaux de titres sans saut repéré; aucune image n’est sans attribut `alt` (les `alt=""` de la homepage correspondent à des éléments décoratifs). Les données JSON-LD présentes sont Organization, WebSite et WebPage; aucune donnée Course, note, certification ou avis fictif n’a été ajoutée.

La homepage offre un CTA Free compréhensible qui mène à `/commencer/`. Les pages publiques et institutionnelles proposent un retour vers l’accès gratuit. Les contrats SEO/lien ont passé les tests de la suite actuelle. Les liens YouTube sont de la source externe et doivent toujours être distingués de vidéos hébergées par DDA.

### Performance (laboratoire, un seul run)

Run Lighthouse mobile sur `/` : performance **0,71**, LCP **4,4 s**, CLS **0**, TBT **340 ms**, Speed Index **5,3 s**. Le plus grand élément de contenu identifié est l’image de bannière héro; l’audit d’images estime environ 40 KiB de gain possible avec un dimensionnement responsive adapté. INP n’était pas mesuré par ce run laboratoire; seul le RUM/CrUX ou une mesure terrain peut établir l’INP réel.

La mesure est un signal d’amélioration P1, pas une mesure p75 terrain. Le fichier vidéo de présentation de landing pèse environ 7,16 Mo; vérifier qu’il n’est pas téléchargé/lu automatiquement sur les connexions faibles avant d’en faire une cause LCP. Ne pas retirer un asset ou refaire la landing dans cette tranche sans mesure.

### En-têtes HTTP

La homepage servie par GitHub Pages répond avec `server: GitHub.com`. Au contrôle, aucun `Content-Security-Policy`, `Strict-Transport-Security`, `Referrer-Policy`, `Permissions-Policy` ou `X-Robots-Tag` n’était visible en en-tête. Les politiques HTML existantes constituent une partie des contrôles, mais ne remplacent pas les en-têtes, notamment HSTS. GitHub Pages ne permet pas forcément de piloter ces en-têtes; évaluer le domaine/CDN avant d’affirmer leur présence.

## 6. Sécurité — réévaluation des PR #121 et #245

- **PR #245** (`fix: enforce authenticated learner identity`) est fusionnée le 13 novembre 2026. Les changements d’identité apprenant et le test de bascule de compte sont intégrés à `main`; ils empêchent de traiter une identité locale comme l’autorité de la session authentifiée.
- **PR #121** (`fix: harden Chariow identity, retries and local proof rendering`) est **fermée sans merge**. Ne pas rouvrir ou cherry-pick sa branche entière. Son document de validation affirme trois remédiations HIGH; il reste une preuve de revue historique, non une preuve autonome de déploiement.
- Les protections pertinentes sont aujourd’hui présentes dans le code/test de la base auditée : quota login/register/reset (défaut 10 requêtes par minute, 429 et `Retry-After`), session de compte non actif révoquée avec réponse générique, rejeu/idempotence Pulse et transition membership monotone face aux événements périmés, identité apprenant côté serveur. Les contrats associés passent dans les 118 fichiers testés.
- **Gap M1 distinct :** le contrôle serveur `premium_track` ne couvre pas automatiquement `advanced_modules`. En production, les trois bundles `m1-*.js` sont servis en clair à tout visiteur; un gate JavaScript/local ne protège pas leur contenu. C’est un blocage de sécurité avant d’accorder ou vendre un accès avancé, même si la page publique dit correctement que M1 n’est pas inclus dans Free.
- **Risque résiduel :** le rate limiter est en mémoire de processus et ne coordonne pas plusieurs instances. Le remplacer par Redis/edge/provider seulement si le BFF fonctionne en multi-instance. Le vrai staging Supabase/Chariow, les secrets, les politiques RLS déployées et les webhooks réels n’ont pas été vérifiés par accès privilégié.

La documentation `DDA_SECURITY_PII_HARDENING_2026-09-27.md` décrit un prototype local de septembre et ne reflète pas seule l’architecture BFF actuelle. Les protections de minimisation restent utiles; son état d’architecture doit être lu comme historique.

## 7. Risques de cohérence documentaire

Le `README.md` précédent affirmait qu’aucun backend, compte serveur ou assistant IA n’était activé, ce qui ne décrivait plus le code et les routes présentes. Il a été corrigé avec les limites de vérification ci-dessus. Plusieurs pièces plus anciennes (notamment le route map et les bilans de septembre/octobre) conservent également des hypothèses qui ont changé depuis. Elles ne sont pas réécrites rétroactivement : les quatre registres datés et ce rapport deviennent le point de situation opérationnel le plus récent.

La page `/launch/` est cohérente sur le nombre et le périmètre annoncé : six leçons au catalogue, trois M0 incluses en Free et trois M1 hors Free, soumises au droit avancé. Mais le gate M1 n’est pas réellement imposé côté serveur et les bundles sont publics; l’exactitude éditoriale ne constitue donc pas une protection technique. Le commentaire interne `Standard/Pro` ne doit pas être exposé comme plan validé.

## 8. Plan d’exécution réaliste

### P0 — avant d’annoncer l’ouverture du pilote

1. **Progression :** revue et CI de la PR du correctif 0 %; merge uniquement après approbation du propriétaire; attendre la publication; refaire le test sur le domaine officiel et joindre une capture.
2. **Smoke test Free en production :** suivre la homepage → `/commencer/` → accès Free → première leçon → exercice → quiz → résultat → prochaine leçon → progression; tester largeur 390 px et au moins un téléchargement. Si le parcours requiert une identité réelle, utiliser un compte de test contrôlé par le propriétaire, jamais des credentials partagés dans un commit.
3. **Message pilote :** limiter l’annonce à un pilote Free; rappeler progression principalement locale, graphique pédagogique, aucune donnée live ni conseil de marché. Exécuter le pilote avec de vrais apprenants et noter les retours sans publier de statistiques non vérifiées.
4. **Premium :** le garder en aperçu; pas de checkout ou frais, pas de prix actif, pas d’annonce d’abonnement.
5. **M1 / droit avancé :** avant toute offre ou attribution commerciale M1, déplacer les trois contenus vers le BFF, vérifier le membership `advanced_modules` côté serveur, supprimer les fichiers statiques exposés et prouver les réponses non autorisées/autorisé par tests. Cette tranche n’effectue pas ce changement de livraison de contenu.

### P1 — avant ou pendant la première semaine de pilote

1. Faire approuver le mapping commercial interne `advanced_modules`; garder Free/Premium dans la copie publique, sans modifier les droits dans cette tranche.
2. Contrôler le rendu sur un téléphone Android et Safari iOS réels, ainsi que clavier/focus pour les parcours d’accès et de leçon.
3. Optimiser l’image héro de façon responsive après profilage; viser un LCP plus bas sans refaire la direction artistique.
4. Évaluer des en-têtes HTTP de sécurité au niveau du fournisseur de domaine/CDN.
5. Mettre à jour les documents historiques progressivement, sans écraser l’historique ni mélanger les branches #271/#299 avec le correctif de progression.

### P2 — après validation du pilote

- Tester auth/synchronisation/suppression multi-appareils en staging Supabase avec RLS.
- Configurer et valider Chariow en sandbox : vente réussie, signature invalide, webhook dupliqué/ancien, échec, remboursement/expiration/révocation; seulement ensuite décider de l’activation commerciale.
- Valider le budget/quota et la configuration de DDA AI avant activation.
- Réévaluer les besoins médias, communautaires, données live et outils de marché à partir des retours réels; ne pas ajouter de capacité non demandée au lancement.

## 9. Travail en cours, PR et gouvernance

Les PR indépendantes **#299** (`perf(academy): reduce dashboard image transfer`) et **#271** (revert de la vidéo institutionnelle sur la landing) étaient déjà ouvertes; elles restent intactes. Le correctif de progression et le présent audit sont dans la [PR #300](https://github.com/mbouaricha12/DDA-digital-acad-my-/pull/300), dont le commit initial de correction est `ce86574262355165c93458c93558eee016e9168c`; la PR est ouverte et non fusionnée. Ses checks finaux sont **9 réussis, 2 ignorés, 0 échec, 0 en attente**. Le job de vérification Pages a réussi, le job de déploiement Pages est non applicable à l’événement `pull_request`, et Vercel a produit une preview; aucun déploiement de production de cette branche n’a eu lieu.

Le protocole multi-agent détaillé est dans `docs/DDA_MULTI_AGENT_HANDOFF_2026-11-18.md`. Les registres opérationnels datés sont :

- `docs/PROJECT_STATUS.md`
- `docs/EXECUTION_LOG.md`
- `docs/DECISION_LOG.md`
- `docs/RISK_REGISTER.md`

Chaque agent doit partir du SHA de `origin/main`, utiliser une branche/worktree propre, déclarer les fichiers qu’il possède, ne pas modifier les zones d’un autre agent, n’ajouter aucun secret, exécuter les tests ciblés et complets utiles, ouvrir une PR, et ne jamais merger/déployer sans autorisation. À toute reprise, lire d’abord `PROJECT_STATUS`, puis le présent rapport et les registres.

## 10. Artifacts de preuve

Les captures et le run Lighthouse sont regroupés dans l’archive séparée **`DDA-live-audit-evidence-2026-11-18.zip`**. Elles représentent la production au SHA `01165ab9`, avant merge de la correction de progression. L’archive n’inclut aucun secret ni donnée apprenant.

**Conclusion :** DDA dispose d’un noyau Free réellement visible, cohérent et testable pour un pilote prudent. Le lancement commercial Premium, une protection serveur réelle de M1, l’IA active, le flux marché live et la synchronisation serveur ne sont pas démontrés. Priorité immédiate : publier et vérifier le correctif de progression, exécuter le smoke test Free sur le domaine avec un compte contrôlé par le propriétaire et traiter l’exposition M1 dans une PR sécurité séparée avant toute offre avancée.
