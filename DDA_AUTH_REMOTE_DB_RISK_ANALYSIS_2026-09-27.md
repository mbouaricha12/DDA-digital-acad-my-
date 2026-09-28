# DDA Academy — Analyse des risques Authentification & Base distante

**Date :** 27 septembre 2026  
**Dépôt audité :** `mbouaricha12/DDA-digital-acad-my-`  
**Base auditée :** `main` — `95b6708 ci: run E2E regression on every push`  
**Périmètre :** préparation P3 uniquement ; aucune nouvelle fonctionnalité produit implémentée dans cette analyse.

## 1. Conclusion exécutive

Le prototype P2 est prêt pour une **décision d’architecture**, mais pas pour une migration directe en production.

Le produit actuel est une SPA statique servie par GitHub Pages. L’identité, le profil, la progression, le Journal, les preuves Premium et le plan sont conservés dans `localStorage` au format v4. Les droits Free/Premium sont calculés côté client à partir de `state.membership.plan`.

> **Décision principale :** ne jamais considérer `localStorage`, `DDA.setPlan()` ou `DDA.can()` comme des contrôles de sécurité après ouverture d’un backend. Ils doivent devenir une façade d’interface ; l’API et la base distante doivent être l’autorité pour l’identité, la propriété des données et les entitlements.

### Niveau de risque global

| Domaine | Niveau avant migration | Commentaire |
|---|---:|---|
| Confidentialité des données locales | Élevé | Nom, e-mail, Journal et progression sont lisibles par toute personne ou extension ayant accès au profil navigateur. |
| Usurpation Premium | Élevé | `membership.plan` est modifiable côté client ; acceptable en démo, inacceptable pour une offre réelle. |
| Authentification serveur | Non applicable aujourd’hui | Aucun compte serveur, mot de passe, session ou token n’existe actuellement. |
| Autorisation objet par objet | Élevé à traiter | Le futur backend devra empêcher l’accès à l’état d’un autre utilisateur, pas seulement vérifier « connecté ». |
| Migration de données | Élevé | Les données locales peuvent être absentes, falsifiées, anciennes ou appartenir à un autre utilisateur du navigateur. |
| Exposition réseau | Faible aujourd’hui / à requalifier | Le prototype ne synchronise pas le Journal ; une API introduira tokens, cookies, logs, backups et nouveaux sous-traitants. |
| Exploitation opérationnelle | Élevé à traiter | Backups, restauration, rétention, suppression de compte, alertes et réponse à incident sont absents. |

## 2. État de sécurité actuel — points positifs

Les éléments suivants constituent une bonne base, mais ne remplacent pas une sécurité serveur :

- sanitation v4 des textes, du Journal, des preuves Premium et des événements ;
- allowlists pour les événements analytics et l’attribution ;
- filtrage des UTM et du referrer ;
- absence de paiement réel, de données de marché live et de secrets dans `dist/` ;
- garde-fous Free/Premium explicites et testés ;
- CI GitHub Actions avec contrats, syntaxe et suite E2E ;
- données Premium P2 conçues comme contenu pédagogique non sensible ;
- migration v1–v4 locale déjà testée sans suppression de la copie legacy en cas d’échec d’écriture ;
- garde-fous documentés sur la présence future de CSP, HSTS et `Permissions-Policy`.

## 3. Risques prioritaires à traiter avant toute base distante

### R1 — Les entitlements sont falsifiables côté client — **Critique**

Aujourd’hui `DDA.setPlan(state, 'premium')` et `DDA.can()` fonctionnent dans le navigateur. C’est cohérent avec une démonstration locale, mais un utilisateur peut modifier `localStorage`, appeler les fonctions depuis DevTools ou fabriquer une requête si le frontend commence à appeler une API.

**Impact :** accès indu à des contenus, ressources ou fonctions Premium ; incohérence entre abonnement et interface ; facturation impossible à faire respecter.

**Mesure P3 obligatoire :**

- l’API détermine l’utilisateur authentifié et ses droits depuis une source serveur ;
- chaque endpoint vérifie l’entitlement côté serveur ;
- le frontend ne reçoit qu’un état dérivé, jamais une autorité ;
- le contenu Premium sensible ne doit pas être livré dans le bundle public avant autorisation serveur ;
- `DDA.can()` reste un helper d’affichage et ne doit plus être décrit comme une protection.

### R2 — Absence d’identité serveur et de propriété des données — **Critique**

Le modèle local contient un identifiant `local-*`, un nom et un e-mail, mais aucun compte vérifié. Lors d’une synchronisation, il faut décider à quel compte rattacher une entrée, une preuve ou une progression.

**Impact :** fusion de données entre personnes, écrasement de progression, accès à un Journal tiers, impossibilité de traiter correctement suppression et export.

**Mesure P3 obligatoire :**

- identifiant serveur immuable (`user_id`) généré côté serveur ;
- `owner_id` obligatoire sur toute table personnelle ;
- contraintes et politiques d’accès au niveau base/API ;
- aucune confiance dans un `user_id` envoyé par le navigateur ;
- tests négatifs d’accès à l’objet d’un autre utilisateur.

### R3 — Migration des données locales — **Élevé**

`localStorage` est en clair, modifiable, parfois obsolète et peut être partagé par plusieurs utilisateurs du même navigateur. Une migration automatique pourrait importer des données falsifiées ou rattacher le mauvais Journal au mauvais compte.

**Mesure recommandée :** migration explicite et réversible :

1. afficher les catégories à importer ;
2. demander une confirmation claire ;
3. envoyer via une API authentifiée et idempotente ;
4. marquer chaque lot avec `migration_id`, version et date ;
5. ne jamais supprimer immédiatement la copie locale ;
6. permettre un rollback logique ou un export ;
7. détecter les conflits serveur/local et les présenter au lieu de fusionner silencieusement ;
8. conserver les champs inconnus dans un journal de migration, pas dans les tables métier.

### R4 — Choix du mécanisme de session — **Élevé**

Le prototype ne possède aucun mécanisme de session. Une implémentation naïve en `localStorage` pour un JWT augmenterait le risque de vol par XSS ou extension.

**Recommandation par défaut pour une SPA :**

- session courte via cookie `HttpOnly`, `Secure`, `SameSite=Lax` ou `Strict` selon les flux ;
- renouvellement contrôlé côté serveur ;
- rotation et révocation des sessions ;
- protection CSRF adaptée aux cookies ;
- déconnexion de toutes les sessions ;
- journalisation des connexions et changements sensibles, sans secrets ni tokens.

Éviter de stocker des refresh tokens dans `localStorage`. Si un fournisseur d’identité externe est choisi, ses paramètres de redirect, scopes, rotation et gestion de logout doivent être verrouillés avant intégration.

### R5 — Contrôles CSRF, CORS et transport — **Élevé**

Une API distante introduira des requêtes mutantes et potentiellement des cookies. Les protections actuelles ne couvrent pas ces menaces.

**Conditions minimales :**

- HTTPS uniquement et HSTS sur le domaine réel ;
- CORS fermé aux origines DDA connues, jamais `*` avec credentials ;
- jeton CSRF ou stratégie équivalente pour toute mutation basée sur cookie ;
- contrôle strict de `Origin`/`Referer` selon le fournisseur ;
- validation du content type et taille maximale des requêtes ;
- limites de débit par IP, compte et endpoint ;
- réponses d’erreur ne révélant ni existence de compte ni structure interne.

### R6 — Injection, XSS stockée et sortie HTML — **Élevé**

Le code actuel rend plusieurs valeurs dans des fragments `innerHTML`. La sanitation texte existante réduit le risque dans le prototype, mais une API distante rend les entrées persistantes et potentiellement hostiles. Toute donnée qui revient du serveur doit être considérée comme non fiable, y compris les données créées par l’utilisateur lui-même.

**Mesure obligatoire :**

- préférer `textContent`, propriétés DOM et templates sûrs ;
- encoder selon le contexte HTML, attribut, URL ou CSS ;
- ne jamais interpoler directement un texte serveur dans un attribut ou un bloc HTML ;
- valider côté serveur avec schémas et longueurs maximales ;
- conserver une sanitation côté client comme défense en profondeur, jamais comme unique contrôle ;
- CSP restrictive avec nonce/hash si des scripts inline doivent subsister ;
- supprimer les sinks HTML inutiles avant ouverture publique.

### R7 — E-mails, récupération de compte et énumération — **Élevé**

Le formulaire actuel collecte un e-mail sans vérification et sans authentification. Une vraie identité nécessite des décisions de cycle de vie.

**À définir avant construction :**

- inscription avec vérification d’e-mail ;
- récupération de compte à réponse uniforme ;
- expiration et usage unique des liens ;
- hash de mot de passe Argon2id ou fournisseur d’identité géré ;
- protection contre credential stuffing et rate limiting ;
- politique de changement d’e-mail ;
- détection des sessions suspectes ;
- MFA au minimum pour les fonctions administratives, idéalement optionnelle pour les apprenants.

Ne pas construire un système maison de mots de passe si un fournisseur d’identité correctement configuré peut porter cette responsabilité.

### R8 — Journal et preuves : confidentialité, rétention, export — **Élevé**

Le Journal peut contenir des habitudes, méthodes, décisions et réflexions personnelles. Les preuves Premium peuvent devenir des données pédagogiques sensibles, même sans données financières réelles.

**Mesures :**

- classification des champs : identité, progression, réflexion libre, événements, preuve ;
- collecte minimale ;
- chiffrement en transit et au repos ;
- accès support strictement contrôlé et audité ;
- export utilisateur lisible ;
- suppression complète et vérifiable ;
- politique de rétention et purge des événements ;
- ne jamais envoyer le texte libre à l’analytics ou à un modèle IA sans consentement et finalité explicite ;
- ne pas confondre « preuve pédagogique » et certificat officiel.

### R9 — Logs, analytics et PII — **Élevé**

L’adaptateur analytics actuel filtre les propriétés, mais un backend ajoutera automatiquement des surfaces de fuite : URLs, logs d’erreur, traces de requêtes, e-mails, IDs et payloads.

**Mesure :**

- interdiction de logger tokens, cookies, mots de passe, e-mails complets et texte du Journal ;
- pseudonymisation stable mais non réutilisée comme secret ;
- allowlist serveur des événements et propriétés ;
- désactivation des autocaptures non nécessaires ;
- politique de conservation et droit d’effacement ;
- séparation stricte entre télémétrie produit et contenu pédagogique ;
- revue du fournisseur analytics et de sa localisation avant activation.

### R10 — Base de données et opérations — **Élevé**

Une base distante crée des risques de configuration et de disponibilité absents du prototype local.

**Contrôles minimaux :**

- migrations versionnées et réversibles ;
- contraintes de schéma, clés étrangères, types et limites ;
- sauvegardes chiffrées testées par restauration réelle ;
- plan RPO/RTO ;
- séparation dev/staging/production ;
- secrets hors dépôt, rotation et moindre privilège ;
- comptes de service distincts ;
- alertes sur erreurs, latence, taux de 401/403/429 et accès anormaux ;
- procédure de réponse à incident ;
- accès DBA limité et audité.

## 4. Architecture cible recommandée pour P3

```text
Navigateur SPA
  └── session cookie HttpOnly / CSRF
        ↓ HTTPS
API DDA
  ├── Auth middleware
  ├── Authorization / entitlements serveur
  ├── Validation de schéma et rate limiting
  ├── Journal d’audit sans contenu sensible
  └── Services métier
        ↓
Base distante
  ├── users / sessions
  ├── memberships / entitlements
  ├── lesson_progress
  ├── journal_entries / journal_plans
  ├── premium_attempts / proofs / reviews
  └── audit_events
```

**Principe important :** le frontend peut conserver une façade `prototypeState` pendant la transition, mais les écritures doivent progressivement devenir des commandes API avec gestion de chargement, erreur, retry et conflit. Le backend doit être la source de vérité dès qu’une donnée est déclarée synchronisée.

## 5. Plan de migration en étapes

### Étape A — Décisions produit et gouvernance

- confirmer que le prototype local reste disponible ;
- définir les données synchronisées et celles qui restent locales ;
- choisir le fournisseur d’identité et l’hébergement API/base ;
- fixer région, sous-traitants, rétention et procédure de suppression ;
- rédiger politique de confidentialité, consentement et conditions d’utilisation ;
- définir qui peut accéder aux données en support.

### Étape B — Contrat de données

- documenter les tables et propriétaires ;
- définir IDs, timestamps, version de schéma et idempotence ;
- publier les règles de validation et champs facultatifs ;
- écrire les tests de migration v4 → serveur ;
- définir conflits, suppression, export et restauration.

### Étape C — Authentification isolée

- créer staging séparé ;
- implémenter signup/login/logout/recovery ;
- protéger les cookies et les mutations ;
- tester enumeration, brute force, session fixation, logout et rotation ;
- ne pas encore activer la facturation ni les droits Premium commerciaux.

### Étape D — Lecture seule puis synchronisation limitée

- commencer par profil et progression ;
- ajouter un endpoint Journal avec ownership testé ;
- introduire une file de synchronisation idempotente ;
- afficher les erreurs et conflits ;
- garder la copie locale tant que la restauration n’est pas validée.

### Étape E — Entitlements serveur et contenu Premium

- déplacer les droits vers la base et/ou le fournisseur d’abonnement ;
- vérifier chaque endpoint côté serveur ;
- retirer progressivement le contenu Premium sensible du bundle public ;
- ajouter tests Free/Premium, accès croisé et révocation immédiate.

### Étape F — Préproduction et ouverture contrôlée

- tests E2E avec deux comptes distincts ;
- tests de sécurité automatisés et revue manuelle ;
- restauration de backup validée ;
- monitoring et rollback prêts ;
- pilote limité avant toute ouverture publique.

## 6. Garde-fous de non-régression

Avant d’accepter la migration, les tests suivants doivent être obligatoires :

- un utilisateur A ne peut jamais lire ou modifier les données de B ;
- un compte Free ne peut pas accéder à un endpoint Premium en modifiant le frontend ;
- la révocation d’un droit invalide les sessions ou droits selon la politique choisie ;
- un token expiré, réutilisé ou révoqué est refusé ;
- une requête CSRF est refusée ;
- une origine non autorisée est refusée ;
- les payloads dépassant les limites sont refusés ;
- les textes du Journal ressortent sans XSS stockée ;
- les logs et analytics ne contiennent ni texte libre ni secrets ;
- une migration répétée ne duplique rien ;
- une migration interrompue peut reprendre sans perte ;
- suppression et export fonctionnent réellement ;
- backup restauré dans un environnement isolé donne le résultat attendu ;
- les scénarios locaux P2 restent passants pendant la coexistence local/serveur.

## 7. Décision recommandée

**Ne pas démarrer par le paiement, le CMS ou l’IA.**

L’ordre recommandé est :

1. contrat de données et ownership ;
2. fournisseur d’identité et sessions ;
3. API minimale ;
4. migration contrôlée du profil/progression ;
5. Journal synchronisé avec tests d’accès objet ;
6. entitlements Premium serveur ;
7. seulement ensuite abonnement, back-office et nouvelles couches Premium.

Le passage en production doit être considéré comme **bloqué** tant que R1, R2, R3, R4, R5 et R10 ne sont pas traités et testés. Le prototype P2 peut rester déployé et démontré en mode local ; cette analyse ne recommande aucune modification immédiate du code produit.
