# DDA Academy — Suivi de durcissement PII

**Date :** 27 septembre 2026  
**Dépôt :** `mbouaricha12/DDA-digital-acad-my-`  
**Base :** `main` — commit `c191e32` (art direction intégrée)  
**Branche de travail :** `fix/privacy-pii-hardening`  
**Périmètre :** SPA statique, données v4 en `localStorage`, analytics PostHog optionnel, GitHub Pages  
**Statut au moment du rapport :** correctifs locaux validés; PR, CI et publication encore à confirmer.

> Le rapport de neuf findings mentionné dans le contexte transmis n’est pas présent dans ce checkout. Ce document ne prétend donc pas le reproduire mot pour mot : il consolide les neuf surfaces de risque effectivement recoupées dans le code et les corrige ou les revalide avec les preuves ci-dessous.

## Résumé exécutif

La passe réduit les risques de fuite depuis les formulaires, l’historique d’acquisition, les états hérités du navigateur et les propriétés d’analytics. Les changements conservent le produit comme prototype local : aucun backend, compte serveur, paiement ou transport de formulaires n’a été ajouté.

Les protections importantes sont en défense en profondeur : les paramètres sont filtrés dans le HTML avant le chargement du SDK, revalidés par le cœur v4, puis filtrés une seconde fois dans l’adaptateur analytics. Les formulaires locaux sont inutilisables jusqu’à l’installation de tous leurs handlers et ne peuvent pas retomber sur une soumission GET native.

## Findings et état

| # | Surface de risque | Mesure appliquée ou revalidée | Preuve |
|---|---|---|---|
| 1 | Identité ou téléphone dans les UTM/referrer | Les tags source/medium/campaign sont fermés par taxonomie; emails et longues suites de chiffres sont refusés. Le referrer persistant est réduit à l’origine HTTP(S), sans credentials, chemin, query ni fragment. | Tests d’email/téléphone, d’origine referrer et de tags libres; état v4 et queue analytics vérifiés. |
| 2 | Query/fragment identifiant visible par un SDK ou conservé comme URL de campagne | Un petit bootstrap dans le `<head>` normalise les UTM et remplace immédiatement l’URL par le pathname et un hash de route connu avant les scripts analytics. L’app consomme puis efface le conteneur temporaire. | Test PostHog simulé : son script ne voit ni query ni adresse e-mail; test de fragment inconnu et de route sûre. |
| 3 | Données de formulaires exportées par fallback navigateur | Les six formulaires locaux (`signup`, `onboarding`, journal, plan, support, profil) utilisent `method="dialog"`; les submits sont désactivés dans le HTML et activés seulement au tout dernier point d’initialisation, après les handlers. | Contexte navigateur avec JavaScript réellement désactivé : 6 submits désactivés et aucune destination GET. Test JS actif : activation des 6 submits après binding. |
| 4 | Copie PII maintenue dans les anciennes clés après migration v4 | `DDA.load()` normalise l’état legacy et appelle `save()`; `save()` écrit d’abord v4, puis retire toutes les clés legacy seulement si l’écriture v4 réussit. | Migration v1 : v4 existe et les clés v3/v2/v1 sont absentes; scénario quota : v4 absent et copie legacy conservée. |
| 5 | Historique de navigation résiduel après reset du profil | `resetPilot()` supprime `dda-nav-previous-view`, remet aussi l’état mémoire `previousView` à null, puis revient à l’accès. | Reset Profil en navigateur, contrôle de `sessionStorage`, de l’état local et du résultat après reload. |
| 6 | Métadonnées analytics non bornées | L’adaptateur ne transmet que les propriétés déclarées; vues, positions, sections et brokers sont des enums exacts; tags attribution suivent leurs propres allowlists. Les clés libres, valeurs texte, PII et catégories non reconnues sont éliminées. | PostHog simulé inspecté sur l’appel réseau logique, avec propriétés sûres et entrées PII/non autorisées. |
| 7 | Fragment arbitraire conservé dans `acquisition.landingPath` | Le schéma v4 n’accepte que les 21 routes produit connues au format `#route`; tout autre chemin, query ou fragment devient `null`. | Test de route connue (`#lesson-m02`) et fragment avec adresse/nom refusé. |
| 8 | Requête tierce de polices exposant IP/referrer à Google Fonts | Les préconnects et stylesheet Google Fonts ont été retirés. Les piles éditoriales utilisent les polices système; la politique HTML est `no-referrer`. Le shell SW est passé à `dda-shell-v16`. | Scan des ressources, tests navigateur, vérification du cache; aucun lien réseau Google Fonts ni nom de famille distante restant dans le CSS livré. |
| 9 | `visitorId` arbitraire pouvant devenir un distinct ID analytics | Le cœur et le transport n’acceptent que le UUID de `crypto.randomUUID()` ou le format de repli `visitor-<timestamp>-<random>`. Une valeur invalide est supprimée avant persistence et ne peut pas être utilisée par `identify()`. | Tests acquisition, funnel end-to-end et simulation PostHog; l’identifiant reste stable et pseudonyme pour les événements permis. |

## Validation exécutée

- `node tests/run.js` : **45 tests Playwright réussis, 0 échec**.
- `tests/smoke_app_boot.js` avec jsdom fourni temporairement hors dépôt : **25 checks réussis**.
- Tous les `tests/test_*.js` et `tests/verify_route_register_consistency.js` : **PASS**.
- `node --check` sur les scripts JavaScript du dossier `dist/` : **PASS**.
- `git diff --check` : **PASS**.
- Tests responsive existants : largeur 360, 390 et 1440 px; aucun débordement horizontal. Les contrôles mobiles du Terminal conservent leurs dimensions testées.
- Le test de formulaires désactive complètement JavaScript; le test analytics intercepte le chargement PostHog simulé après le nettoyage d’URL.

Les étapes du workflow GitHub Pages sont configurées pour vérifier la PR et publier sur `main` après merge. Aucune publication ne doit être annoncée sur la seule base des validations locales.

## Risques résiduels / décisions hors périmètre

1. **Données volontairement locales :** nom, e-mail, journal et plan restent stockés en clair dans `localStorage` afin que le prototype fonctionne. Toute personne ayant accès au profil navigateur ou à un script injecté (XSS/extension compromise) peut les lire. Cette tranche ne chiffre pas les données ni ne les synchronise.
2. **PostHog optionnel :** sans clé configurée, aucune requête analytics externe n’est initiée. Si une clé est fournie, l’application charge le SDK distant et transmet les événements allowlistés avec un identifiant pseudonyme; comme pour toute requête externe, le fournisseur ou l’infrastructure peut voir l’adresse IP de connexion. Cette tranche coupe l’autocapture, les pageviews automatiques et l’enregistrement de session, mais ne règle pas la conservation IP côté fournisseur, le consentement réglementaire ou la politique de rétention. À décider avant activation en production.
3. **Détection de PII :** les filtres regex seuls sont imparfaits; les taxonomies fermées réduisent l’entrée libre pour les champs connus, sans constituer une preuve formelle que tout texte arbitraire est anonyme.
4. **Headers d’hébergement :** les en-têtes HTTP serveur (CSP stricte, HSTS, Permissions-Policy) doivent être évalués dans la configuration GitHub Pages/domaine réel. Ils ne sont pas modifiés ici.
5. **Design de formulaires :** si un futur flux exige une soumission distante, il faudra un endpoint explicitement autorisé, une politique de conservation et un contrôle produit séparé; ne pas remplacer `method="dialog"` par un GET natif.

## Statut de livraison

Correctifs disponibles sur `fix/privacy-pii-hardening`; non fusionnés à ce stade. Après revue et CI, le merge sur `main` déclenchera le workflow GitHub Pages. Le lien de déploiement existant reste le build de `main` tant que ce merge n’a pas réussi.
