# Audit complet de DDA — dossier de transmission à Claude

**Date de l’audit :** 21 octobre 2026<br>
**Dépôt examiné :** `mbouaricha12/DDA-digital-acad-my-`, branche locale `main`<br>
**URL publique contrôlée :** <https://mbouaricha12.github.io/DDA-digital-acad-my-/><br>
**Périmètre :** site public, application Academy, BFF, modules AutoTrader, schémas, migrations Supabase, workflows GitHub Actions, tests et état de lancement.<br>
**Limite opérationnelle :** audit du code et tests locaux, plus inspection HTTP en lecture seule du site Pages. Aucun déploiement BFF, accès au projet Supabase, accès Chariow, appel coté Twelve Data avec une clé réelle, publication, commit ou push n’a été effectué.

## Conclusion pour décision

DDA est une plateforme pédagogique statique assez avancée, dotée d’un prototype Academy navigable, de parcours de cours, de progression/journal locaux et d’une importante suite de contrats et tests. Le dépôt local comprend aussi un BFF Node, des contrats de données, des migrations Supabase et un socle AutoTrader d’analyse, de simulation, de coûts et de droits Premium.

**Verdict : pas prêt pour une commercialisation Premium d’AutoTrader.** Le prototype possède des garde-fous utiles — pas d’exécution réelle, droit spécifique `autotrader.analysis`, quotas et refus en cas de données insuffisantes — mais la source Twelve Data n’est pas activée, l’instrument/place/unité de temps n’ont pas été choisis, la licence de redistribution n’est pas attestée et aucun déploiement de production du BFF/Supabase/Chariow n’a été vérifié. Les migrations et exemples de configuration présents dans le dépôt ne constituent pas une preuve de staging ou de production.

**Le site public ne correspond pas à l’état local contrôlé.** Les fichiers `dist/academy.html`, `dist/app.js`, `dist/bff-client.js` et `dist/sw.js` ont des empreintes différentes entre le répertoire local et Pages au moment de l’inspection. La branche locale porte de nombreux changements non commités et fichiers non suivis. Ils ne sont donc pas présents dans la version publique par le seul fait d’être dans le workspace. Aucun changement n’a été poussé.

## Ce que contient la plateforme

### Site et expérience d’apprentissage

Le site est servi comme application statique en deux surfaces : une landing publique et `academy.html`, qui porte la SPA Academy. Le registre `dist/manus-routes.json` déclare les parcours publics, les vues Academy et plusieurs pages d’information (conditions, confidentialité, risques, accessibilité, contact et FAQ). Le contenu authored observé comprend M0.1 à M0.3, M1.1 à M1.3 et un aperçu Premium P2.1/P2.2. La progression, le journal, le Terminal de pratique et plusieurs preuves sont conservés dans le stockage local du navigateur dans le prototype.

La suite Playwright existante couvre les permissions locales, l’inscription/onboarding simulés, les parcours de cours, la progression, le journal, les retours navigateur, le responsive, le funnel d’acquisition et les garde-fous éditoriaux. La suite navigateur générale a réussi avec **59 tests passés et 0 échoué**. Le test de lancement final a également réussi pour les vues responsive, P2, la frontière d’accès serveur simulée, l’import descriptif historique et l’honnêteté des contenus vidéo.

### BFF, identité et facturation

Le BFF Node expose l’authentification, les sessions, les opérations de compte et des routes métier. Le code applique notamment la validation d’origine sur les méthodes non sûres, un jeton CSRF lié à un cookie, des cookies de session HttpOnly, des réponses JSON `no-store`, une validation stricte de la configuration runtime et une clé de chiffrement de session attendue sur 32 octets décodés. L’authentification et les entitlements serveur sont distincts du statut de démo local.

Les fichiers du dépôt contiennent les adaptateurs Supabase, le traitement Chariow, le stockage de sessions, les entitlements et les quotas. Cela ne prouve pas que les migrations ont été appliquées, que les clés de production sont correctement configurées, que les callbacks e-mail et domaines sont alignés, que les webhooks réels ont été éprouvés ni que la révocation immédiate a été validée de bout en bout sur un environnement déployé.

### AutoTrader local

Le dépôt local comporte des validateurs de données de marché v1/v2, une analyse technique, un évaluateur de risque de simulation, un contrat de recommandation v2, des niveaux ATR explicitement heuristiques, un modèle de coûts versionné, un backtest historique causal et des schémas JSON Draft 2020-12. La séparation entre identité et entitlement AutoTrader est conçue au niveau BFF et Supabase. Un import CSV historique existe dans le frontend, sous le droit AutoTrader, et reste descriptif : l’interface ne doit pas transformer son résultat en signal ou en ordre.

Un adaptateur Twelve Data en lecture seule est ajouté côté BFF. Le code exige une clé uniquement côté serveur, un allowlist d’instruments, une référence interne de licence, un timeout, un plafond de taille de réponse, une validation du format et une normalisation fail-closed. Son existence dans le dépôt n’est pas une preuve que l’API a été appelée en production, que la donnée ou ses droits conviennent au produit, ou que la licence couvre la visualisation/redistribution prévue.

L’étape de choix utilisateur sur l’instrument n’a pas été finalisée : il manque le symbole Twelve Data, la place/venue exacte et l’unité de temps. Aucun paramètre de marché n’a été inventé pour contourner ce manque.

## Constatations de sécurité et corrections effectuées

### Corrigé pendant cette tranche

1. **Path traversal dans les serveurs statiques des tests navigateur.** Les serveurs locaux des fichiers `tests/run.js` et `tests/test_launch_final_audit.js` assemblaient le chemin de requête après décodage sans vérifier qu’il restait sous `dist`. Une requête encodée du type `/%2e%2e/bff/.env.example` pouvait résoudre vers un fichier voisin si un service de test était joignable. Ce n’était pas une route du site public ni du BFF de production, mais cela exposait potentiellement les fichiers du workspace pendant les tests. Les deux serveurs valident maintenant le chemin résolu, répondent `404` pour un chemin hors racine, utilisent le loopback `127.0.0.1`, et les réponses statiques de test définissent `nosniff`/`no-store`. Une assertion de non-divulgation a été ajoutée. Les deux suites navigateur concernées passent.

2. **Secret de base Supabase dans l’audit CI RLS.** Le workflow RLS lançait `psql` avec `SUPABASE_DB_URL` sur des événements `pull_request`/`push` et le SQL du dépôt. Exécuter du SQL contrôlé par une contribution non approuvée avec un secret de base disponible créait une frontière d’exécution dangereuse. Le workflow est devenu statique uniquement, avec `contents: read`, sans secret de base ni étape distante. Un éventuel audit distant doit être relancé séparément depuis un environnement d’administration protégé, après approbation.

3. **Permissions des workflows.** Le workflow Pages n’octroie plus `pages: write` et `id-token: write` au job de vérification; ces droits sont limités au job de déploiement. Les checkouts des workflows édités ne conservent plus le credential Git. Le Product Gate couvre également `bff/**`, `contracts/**`, `supabase/**`, `scripts/**` et tous les workflows GitHub, avec permissions de contenu en lecture seule. L’E2E épingle Playwright à `1.55.0`. CodeQL inclut désormais l’analyse JavaScript/TypeScript en plus des GitHub Actions.

### Observations à traiter ou vérifier

1. **Headers de sécurité HTTP du site public.** La réponse GitHub Pages observée fournit HTTPS/HSTS et `Cache-Control`, mais aucun `Content-Security-Policy`, `X-Content-Type-Options`, `Referrer-Policy` ou `Permissions-Policy` n’apparaissait dans les headers de la landing. Sur l’origine publique, cela réduit la défense en profondeur contre injection, MIME sniffing et abus de fonctionnalités navigateur. GitHub Pages ne fournit pas une configuration `_headers` standard pour poser librement ces entêtes. Évaluer un proxy/hébergeur qui permet les headers, ou renforcer l’architecture en supprimant les scripts inline et en définissant une CSP compatible avec les ressources réellement nécessaires. Ne pas publier une CSP approximative qui casse l’application.

2. **Stockage local non fiable par conception.** L’état local peut être modifié par l’utilisateur, un script de même origine ou les outils navigateur. Les données pédagogiques ainsi stockées ne doivent jamais faire foi pour facturation, entitlement, certification ou décisions financières. Le code d’accès AutoTrader local dépend d’une vérification serveur, ce qui est la bonne frontière; il faut maintenir ce principe pour toute nouvelle fonctionnalité.

3. **Test de dépendances incomplet.** `bff/package.json` ne déclare pas de dépendance applicative externe et aucun lockfile n’est présent. `npm audit --prefix bff --omit=dev` n’a pas pu être exécuté : npm exige un lockfile existant. Ne pas créer/committer un lockfile automatiquement durant cet audit sans décision de gestion des dépendances. Une revue de vulnérabilités supply-chain n’est donc pas attestée par ce rapport.

4. **Mise à jour du site public.** Pages répondait en `200` pour `/`, `/launch/`, `/about/`, `/terms/`, `/privacy/`, `/cookies/`, `/imprint/`, `/risks/`, `/accessibility/`, `/contact/`, `/faq/` et `/academy.html`. Sa date `Last-Modified` observée pour la racine était le 18 octobre 2026. Les différences d’empreinte sur les assets essentiels indiquent que les modifications locales plus récentes ne sont pas déployées. Tout lancement doit attendre une PR/merge et le workflow Pages vert, puis une vérification du build réellement servi.

5. **Risque éditorial/réglementaire et identité de l’éditeur.** Les mentions légales du prototype reconnaissent que l’entité n’est pas encore immatriculée et que les informations administratives définitives restent à fournir. Les documents reconnaissent également le statut d’aperçu. C’est plus honnête que de revendiquer une entreprise déjà constituée, mais ce statut bloque une mise en vente officielle tant que l’identité juridique, les obligations locales/internationales, les conditions, la politique de confidentialité et le traitement des données n’ont pas été revus par des personnes compétentes dans les juridictions visées.

6. **Observabilité et disponibilité BFF.** Le code utilise des logs structurés, des identifiants de requête, des limites de payload et une réponse publique de santé. Cet audit ne prouve pas le rate limiting d’infrastructure, la surveillance d’erreurs, les alertes, la rotation de secrets, le plan de sauvegarde/restauration ni les objectifs de disponibilité. À vérifier chez l’hébergeur et dans le projet Supabase réel.

## Résultats de validation locale

Exécution dans le workspace sur la branche locale `main` :

- **77 fichiers de test Node** passés dans le balayage `tests/test_*.js` et `tests/smoke_app_boot.js`.
- `npm test --prefix bff` passé.
- Régression Playwright principale : **59 passed, 0 failed**.
- `tests/test_launch_final_audit.js` passé.
- Contrat/audit statique RLS passé : **21 déclarations de tables publiques inspectées**.
- Inventaire des migrations P3 et réconciliation passés.
- `git diff --check` passé.
- Les tests des serveurs statiques rejettent le chemin de traversal encodé.

Ces résultats sont des preuves de code et de tests locaux. Ils ne remplacent pas une recette de staging avec vraies configurations, une revue juridique, un audit externe ni une validation de données de marché sous licence.

## État Git et livraison

La branche contrôlée est `main`. Le statut contenait de nombreux fichiers modifiés et non suivis avant la production de ce rapport; ces changements incluent du travail AutoTrader, de l’authentification/facturation, des contrats et migrations, l’interface, des tests et les workflows. Ils ont été laissés en place. Aucun `git reset`, nettoyage, commit, push ou déploiement n’a été lancé.

Le rapport est ajouté sous `docs/`. Les corrections réalisées pendant cette tranche touchent aussi les deux serveurs de test navigateur et cinq workflows GitHub Actions. Il faut inclure explicitement les fichiers non suivis à la revue de code : ils ne figurent pas dans un diff Git classique tant qu’ils ne sont pas ajoutés au suivi.

## Décisions requises avant lancement

1. Choisir et consigner le symbole Twelve Data exact, son venue, son intervalle/timeframe et la convention de prix/volume attendue.
2. Obtenir une confirmation écrite que la licence/plan de données autorise l’usage commercial et l’affichage envisagés, puis renseigner une référence de licence vérifiable; sans cela, garder le fournisseur désactivé.
3. Déployer le BFF avec secrets dans le gestionnaire de secrets, origins HTTPS exactes, cookies sécurisés, callback d’e-mail et domaine vérifiés; vérifier que les routes ne peuvent accéder qu’aux tables via le service-role côté serveur.
4. Appliquer et réconcilier les migrations 0001–0007 sur un environnement de staging, contrôler les privilèges RLS depuis des rôles navigateur et service, puis tester création, paiement simulé/autorisé, renouvellement, expiration, remboursement et révocation.
5. Exécuter un scénario complet de quotas individuels et globaux, y compris concurrence, reset de période, fournisseur en panne, réponse malformée et entitlement révoqué entre réservation et résultat.
6. Valider les chiffres et hypothèses du backtest (données, devise, spread, commission, slippage, financement, prix ajustés, frais et biais de survivance). Publier les limites avec chaque résultat. Les niveaux ATR restent heuristiques distinctes de la stratégie backtestée et ne doivent pas être présentés comme performance validée.
7. Finaliser la revue d’éditeur, les documents légaux, les déclarations relatives à la donnée financière et le support utilisateur avant encaissement.
8. Fusionner le code via revue et checks verts, vérifier le build Pages public après déploiement et confirmer que les assets/l’API affichés correspondent à la version attendue. Le déploiement de Pages seul ne déploie pas le BFF.

## Consignes de continuation pour Claude

Claude doit d’abord examiner `git status`, les changements locaux et les migrations; préserver chaque changement et ne pas faire de reset, checkout destructif, commit ou push sans consigne explicite. Il doit traiter cette branche comme un prototype pré-lancement, pas comme un produit prêt à vendre. Les prochaines tâches sûres sont de faire une revue de code détaillée des changements, finaliser la sélection des paramètres instrument/venue/timeframe, ajouter les checks de sécurité pertinents aux workflows et préparer une recette de staging. Il ne faut pas activer Twelve Data avant accord sur les droits de licence ni ajouter une exécution MT5 réelle : aucune intégration d’exécution n’a été auditée ou autorisée ici.

## Références du dépôt

- Charte AutoTrader : `docs/DDA_AUTOTRADER_PRODUCT_CHARTER.md`
- Recherche Twelve Data en lecture seule : `docs/DDA_TWELVE_DATA_READONLY_RESEARCH.md`
- Audit de lancement antérieur : `docs/DDA_AUTOTRADER_PREMIUM_LAUNCH_AUDIT_2026-10-19.md`
- Registre de réalisation : `DDA_MASTER_BUILD_REGISTER.md`
- Adaptateur marché : `bff/src/autotrader/twelve-data-market-provider.js`
- Route BFF : `bff/src/app.js`
- Contrats : `contracts/autotrader/`
- Migrations : `supabase/migrations/`
- Workflows CI : `.github/workflows/`
- Régression navigateur : `tests/run.js`, `tests/test_launch_final_audit.js`

## Sources externes consultées

- Site Pages public de DDA : <https://mbouaricha12.github.io/DDA-digital-acad-my-/>
- Dépôt GitHub sélectionné : <https://github.com/mbouaricha12/DDA-digital-acad-my->
