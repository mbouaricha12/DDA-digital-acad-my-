# DDA — Rapport d’audit complet de la plateforme

**Date :** 20 octobre 2026  
**Dépôt :** `mbouaricha12/DDA-digital-acad-my-`  
**Référence audit :** branche `fix/chariow-pulse-identity-retry-audit`  
**Commits correctifs :** `0d9afe2`, `59073ef`  
**Statut :** audit du dépôt et de l’expérience locale terminé ; aucune clé réelle, aucun paiement réel et aucune connexion Chariow/Supabase de production n’ont été activés.

## 1. Résumé exécutif

DDA est un prototype SPA statique à orientation éducative, organisé autour de trois surfaces : public/acquisition, authentification et application apprenant. Le produit respecte globalement le positionnement institutionnel : apprentissage des marchés, pratique guidée et preuve de progression, sans signal de marché ni exécution financière.

La couverture automatisée locale est solide : la suite navigateur complète termine à **58 tests réussis, 0 échec**. Les contrats de navigation, permissions, accessibilité, Journal, Dashboard, BRVM, BFF, RLS, Chariow et Supabase passent également dans les commandes exécutées pendant cet audit.

L’audit a cependant confirmé que le branchement commercial réel n’est pas encore activable. Le BFF, les migrations et l’adaptateur Chariow sont préparés, mais il manque encore un environnement de staging réellement configuré, les secrets gérés, un endpoint checkout exposé au parcours produit, la validation d’un Pulse réel et la preuve du cycle complet checkout → webhook → entitlement → révocation.

## 2. Périmètre vérifié

### Frontend et expérience

- `dist/index.html` : landing publique, acquisition et surfaces légales.
- `dist/academy.html` : shell apprenant et routes internes.
- `dist/app.js` : registre des leçons, permissions, navigation, Dashboard, Journal et états Premium locaux.
- `dist/dda-core.js` et `dist/learning-engine.js` : état local, curriculum et progression.
- `dist/sw.js` : cache offline et stratégie de navigation.
- `dist/lesson-renderer.js` : rendu des leçons et médias.

### Backend et données

- `bff/src/app.js` : sessions, permissions serveur et entitlements.
- `bff/src/server.js` : serveur HTTP, endpoint Pulse Chariow et assemblage des stores.
- `bff/src/chariow.js` : signature HMAC, mapping des événements et checkout provider.
- `bff/src/billing-store.js` : idempotence, memberships et entitlements PostgREST.
- `bff/supabase/schema.sql` et `supabase/migrations/0004_chariow_billing.sql` : tables et RLS Billing.
- migrations BRVM `0005_brvm_publications.sql` et contrats de publication fail-closed.

### Gouvernance et navigation

- `DDA_ROUTE_MAP.md` : 18 routes SPA contrôlées.
- `DDA_MASTER_BUILD_REGISTER.md` : registre maître et statut des tranches.
- workflows GitHub Actions : E2E, Product Gate, CodeQL, Pages, RLS et contrats curriculum.

## 3. Résultats de validation

### Tests réussis

- Suite navigateur Playwright : **58 passed, 0 failed**.
- Contrat BFF implementation : **PASS**.
- Contrat intégration BFF/frontend : **PASS**.
- Contrat Chariow Pulse et checkout : **PASS**.
- Contrat BillingStore Supabase : **PASS**.
- Inventaire des migrations P3/P4/P5 : **PASS**.
- Audit statique RLS : **PASS**.
- Contrat Free/Premium/Access : **PASS**.
- Contrats Dashboard, Journal, BRVM, landing, accessibilité et navigation : **PASS**.
- Vérification route/register : **PASS** — 18 routes analysées, 38 lignes de registre.
- Vérification syntaxique de tous les fichiers `bff/src/*.js` et `dist/*.js` : **PASS**.
- `git diff --check` : **PASS**.

### Limite de reproductibilité locale

La première exécution de la suite navigateur a échoué uniquement parce que le module `playwright` n’était pas installé dans le sandbox. Playwright 1.55.0 et Chromium ont ensuite été installés hors dépôt, puis la suite a produit le résultat 58/58. Le workflow CI installe déjà Playwright explicitement.

## 4. Failles et incohérences corrigées

### 4.1 Identité DDA insuffisamment fail-closed

**Problème :** le mapping Pulse acceptait auparavant un e-mail Chariow sans `dda_user_id`. Le store Supabase ne pouvait ensuite pas créer proprement le membership car il exige un UUID DDA serveur.

**Correction :**

- `dda_user_id` doit être un UUID DDA valide ;
- l’e-mail seul ne crée jamais un droit ;
- une livraison sans référence DDA est ignorée sans attribution d’accès ;
- le checkout refuse désormais l’appel si `dda_user_id` est absent ou invalide.

### 4.2 Référence fournisseur manquante

**Problème :** une vente ou licence sans `sale.id` ni `license.id` pouvait atteindre la persistance et produire une erreur de contrainte.

**Correction :** l’événement est ignoré avec `missing_provider_reference` avant toute écriture de membership.

### 4.3 Perte des retries après échec de traitement

**Problème :** une livraison déjà enregistrée pouvait rester bloquée dans l’idempotence après un traitement échoué.

**Correction :**

- une livraison `failed` peut être revendiquée à nouveau ;
- son statut repasse à `accepted` avant retraitement ;
- le hash SHA-256 du corps brut est conservé ;
- les doublons déjà `processed` restent ignorés.

### 4.4 JSON Pulse invalide marqué implicitement comme accepté

**Problème :** le corps était revendiqué avant le parsing JSON ; un JSON invalide pouvait donc empêcher un retry utile.

**Correction :** le parsing est dans le bloc de traitement ; un JSON invalide est marqué `failed` et renvoie `400`.

### 4.5 Double marquage du statut traité

**Problème :** le serveur marquait une transition traitée dans `server.js` alors que le handler central devait gérer le statut.

**Correction :** le marquage `processed/failed` est centralisé dans `handleChariowPulse`, ce qui rend le comportement cohérent pour les succès, erreurs et retries.

### 4.6 Divulgation de détails d’exception dans les logs webhook

**Problème :** le serveur écrivait `error.message` dans le log d’échec du webhook.

**Correction :** le log conserve seulement l’événement générique `chariow_webhook_failed`, sans contenu fournisseur, payload ou message libre.

### 4.7 Injection HTML via preuve Practice locale

**Problème :** `practice.feedback`, `sourceLessonTitle` et `proof.id`, issus de l’état local, étaient interpolés sans échappement dans `innerHTML`.

**Correction :** ces valeurs passent désormais par `escapeHtml()` avant rendu. Un contrat de sécurité a été ajouté pour empêcher la régression.

## 5. Architecture et état fonctionnel

### Surface publique

La landing expose le positionnement DDA, le parcours Free, les garde-fous et les surfaces légales. Les campagnes UTM sont filtrées par allowlist, les valeurs inconnues et les données personnelles sont rejetées, et le referrer est réduit à une origine HTTP(S) sans identifiants.

### Authentification

La surface `#access` possède des formulaires réels, des états d’erreur et une redirection contrôlée. Les routes apprenant redirigent vers l’accès lorsqu’un visiteur anonyme tente un deep-link protégé.

### Application apprenant

Le Dashboard agit comme cockpit : Fil de maîtrise, action suivante unique et preuve récente. Le Journal possède une navigation dédiée, un compositeur en trois étapes et des champs échappés. Le Terminal utilise des séries pédagogiques synthétiques et ne présente pas de cotation temps réel.

### Permissions

Les permissions locales et serveur sont distinctes. Les droits Premium réels ne peuvent venir que d’un entitlement serveur actif. `localStorage`, retour navigateur, preuve pédagogique ou champ de plan local ne doivent jamais accorder un droit réel.

### BRVM

La pole BRVM est fail-closed : absence de source vérifiée = état vide honnête ; échec BFF = état d’erreur sans liens ; les publications rendues sont échappées et doivent provenir de la projection serveur autorisée.

## 6. Risques résiduels importants

### 6.1 Paiement réel non activé

Le dépôt prépare Chariow mais ne prouve pas encore un paiement réel. Aucun secret réel, produit réel ou Pulse de production ne doit être ajouté au dépôt.

### 6.2 Endpoint checkout non intégré au parcours BFF public

`createChariowCheckout()` existe comme adaptateur serveur, mais l’audit ne trouve pas encore de route BFF publique branchée qui l’expose au parcours d’achat authentifié. Avant toute activation commerciale, il faut décider et implémenter une route serveur authentifiée qui construit elle-même le checkout et injecte le `dda_user_id` issu de la session serveur.

### 6.3 Chariow récurrent non confirmé

Les événements équivalents à `invoice.paid`, `subscription.updated`, `subscription.cancelled` et `payment_failed` ne sont pas confirmés dans le dépôt. DDA ne doit pas annoncer de renouvellement automatique tant que Chariow n’a pas documenté et validé ces événements pour le produit choisi.

### 6.4 Staging et secrets

Il manque encore la preuve contrôlée de :

- projet Supabase staging réel ;
- migrations 0001 à 0004 appliquées et auditées à distance ;
- URL BFF HTTPS publique ;
- secrets stockés dans un gestionnaire serveur ;
- produit Chariow staging et IDs allowlistés ;
- Pulse signé réel ;
- tests de remboursement, expiration, révocation, rejeu et ordre hors séquence.

### 6.5 Audit RLS distant optionnel

Le workflow CI possède un audit distant via `SUPABASE_DB_URL`, mais il est ignoré si le secret GitHub n’est pas configuré. Le PASS actuel est donc un PASS statique, pas une preuve de configuration distante de production.

### 6.6 Headers de sécurité statiques

GitHub Pages ne permet pas de définir librement tous les headers HTTP de sécurité. Le dépôt possède notamment une politique de referrer côté HTML, mais une CSP, HSTS et des headers serveur complets doivent être traités au niveau de l’hébergement ou d’un reverse proxy avant un lancement commercial.

### 6.7 Renderer de contenu authored

Le renderer de leçons contient plusieurs interpolations de contenus authored. Elles sont actuellement fournies par des fichiers du dépôt et non par une source distante. Si les leçons deviennent administrables ou distantes, il faudra échappement systématique, validation de schéma et politique stricte des URLs avant de les injecter dans le DOM.

## 7. Actions manuelles recommandées

### Supabase staging

1. Créer ou sélectionner un projet staging séparé.
2. Appliquer les migrations dans l’ordre 0001 → 0004.
3. Vérifier les tables `dda_billing_deliveries` et `dda_billing_memberships`.
4. Exécuter l’audit RLS distant.
5. Vérifier qu’aucun rôle navigateur ne peut écrire les tables Billing.

### Chariow staging

1. Créer le produit Premium staging.
2. Confirmer prix, devise, taxes et remboursement.
3. Relever l’ID produit réel.
4. Créer une clé API serveur dédiée.
5. Créer le Pulse HTTPS vers `/webhooks/chariow`.
6. Configurer `CHARIOW_PULSE_SECRET` côté BFF uniquement.
7. Vérifier que le payload de vente conserve `custom_metadata.dda_user_id`.

### BFF

Configurer uniquement dans le gestionnaire de secrets :

```env
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_PUBLISHABLE_KEY=<publishable-key>
SUPABASE_SERVICE_ROLE_KEY=<server-only-key>
SESSION_ENCRYPTION_KEY=<random-32-byte-key>
ALLOWED_ORIGINS=https://<domain-dda-exact>
BFF_COOKIE_SECURE=true
EMAIL_REDIRECT_TO=https://<domain-dda>/access
CHARIOW_API_KEY=<server-only-key>
CHARIOW_PULSE_SECRET=<server-only-secret>
CHARIOW_PREMIUM_PRODUCT_IDS=<allowlisted-product-id>
CHARIOW_CHECKOUT_REDIRECT_URL=https://<domain-dda>/academy.html#membership
```

### Scénario GO obligatoire

```text
session DDA authentifiée
→ route checkout BFF
→ metadata.dda_user_id serveur
→ checkout Chariow staging
→ Pulse HMAC valide
→ claim idempotent Supabase
→ membership active
→ entitlement premium_track
→ accès Premium serveur
→ expiration/révocation
→ accès refusé
```

Tout échec de ce scénario est **NO-GO** pour une vente publique.

## 8. Référence de la correction poussée

Branche : `fix/chariow-pulse-identity-retry-audit`  
Commit sécurité Chariow/Supabase : `0d9afe2`  
Commit sécurité frontend : `59073ef`  
Branche distante : https://github.com/mbouaricha12/DDA-digital-acad-my-/tree/fix/chariow-pulse-identity-retry-audit

La branche n’a pas encore été fusionnée dans `main` et aucune PR corrective n’a été créée automatiquement. Une revue humaine est recommandée avant fusion.

## 9. Verdict final

**Prototype pédagogique et surfaces Free : validés par les contrats et la suite navigateur locale.**

**Fondation BFF/RLS/Chariow : corrigée sur branche dédiée, prête pour revue.**

**Encaissement Premium réel : NO-GO tant que le checkout BFF, le staging, le Pulse réel, les secrets, la révocation, le remboursement et la validation juridique ne sont pas prouvés.**

**DDA reste conforme à la règle : apprendre les marchés, construire des compétences, prouver la progression — sans signal ni exécution financière.**
