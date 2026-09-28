# DDA Academy — P3.2 Conception API d’identité & sessions

**Statut :** conception contractuelle, aucun backend déployé  
**Contrat amont :** P3.1 — données & ownership  
**Contrat machine-readable :** [`contracts/p3-identity-session-api-v1.json`](contracts/p3-identity-session-api-v1.json)

## 1. Décision d’architecture

P3.2 adopte une session serveur opaque portée par cookie sécurisé. Le navigateur ne devient jamais l’autorité de l’identité, du plan ou des permissions.

Le frontend conserve éventuellement une façade d’état locale pendant la transition, mais :

- `user_id` est créé par le serveur ;
- `owner_id` est dérivé de la session authentifiée ;
- le plan et les entitlements sont lus depuis le serveur ;
- les timestamps sont générés par le serveur ;
- aucun refresh token n’est stocké dans `localStorage` ;
- aucune donnée de mot de passe, session ou token n’est envoyée à l’analytics.

Le document est un **design**. Il ne crée ni route API, ni compte, ni base, ni cookie dans le site actuel.

## 2. Précondition de domaine

Le site actuel est servi par GitHub Pages. Avant d’activer une session par cookie, il faudra décider un domaine applicatif contrôlé par DDA, par exemple `app.<domaine-dda>` et `api.<domaine-dda>`.

Une SPA GitHub Pages et une API sur des sites distincts peuvent rendre `SameSite=Lax` insuffisant pour les requêtes XHR avec credentials. La configuration recommandée est donc :

1. domaine applicatif DDA contrôlé ;
2. API sous un sous-domaine DDA ;
3. CORS limité à l’origine applicative exacte ;
4. `credentials: include` seulement pour cette origine ;
5. si un hébergement cross-site est imposé, `SameSite=None; Secure` uniquement avec vérification stricte de `Origin`, CSRF et revue spécifique.

## 3. Cookies et session

### Cookie de session

Nom recommandé : `__Host-dda_session`.

Attributs : `Secure`, `HttpOnly`, `Path=/`, `SameSite=Lax` par défaut et absence de `Domain`. La valeur est opaque et aléatoire ; le serveur ne stocke que son hash et les métadonnées de session.

La session prévue possède :

- durée d’inactivité : 12 heures ;
- durée absolue : 30 jours maximum ;
- rotation après login ;
- rotation après changement de privilège ;
- révocation à la déconnexion ;
- révocation globale après récupération ou changement de mot de passe ;
- liste de sessions sans secret ni token exposé.

Ces durées sont des valeurs de design à confirmer avec le fournisseur d’identité et l’analyse de risque finale.

### Protection CSRF

Nom recommandé : `__Host-dda_csrf`.

Le token CSRF est aléatoire, non `HttpOnly` afin que la SPA puisse le recopier dans `X-CSRF-Token`. Toute mutation `POST`, `PUT`, `PATCH` ou `DELETE` exige :

- cookie CSRF présent ;
- en-tête `X-CSRF-Token` correspondant ;
- vérification stricte de `Origin` ;
- content type JSON attendu ;
- session valide pour les routes authentifiées.

Une route `GET /v1/security/csrf` permet d’émettre ou de renouveler le cookie. Les requêtes `GET` doivent rester sans effet métier.

## 4. Flux d’identité

### Inscription

`POST /v1/auth/register`

Le flux crée un compte `pending`, envoie un lien de vérification et renvoie toujours une réponse d’acceptation générique. Il ne doit pas révéler si l’e-mail existe déjà.

Le mot de passe doit être traité par un fournisseur d’identité géré ou un service utilisant Argon2id. Le frontend ne doit jamais implémenter lui-même le stockage ou la comparaison des mots de passe.

Aucune session n’est créée avant vérification de l’e-mail.

### Vérification d’e-mail

`POST /v1/auth/verify-email`

Le token est à usage unique, stocké sous forme de hash, limité dans le temps et invalidé après consommation. Une erreur de token expiré, inconnu ou déjà utilisé reste générique.

### Connexion

`POST /v1/auth/login`

En cas de succès, le serveur crée et pose le cookie de session. En cas d’échec, la réponse ne distingue pas « utilisateur inexistant », « mauvais mot de passe » ou « e-mail non vérifié ».

La route doit être protégée par rate limiting, backoff progressif et détection des tentatives anormales.

### Déconnexion

- `POST /v1/auth/logout` révoque la session courante ;
- `POST /v1/auth/logout-all` révoque toutes les sessions de l’utilisateur ;
- `DELETE /v1/sessions/{sessionId}` révoque une autre session appartenant au même utilisateur.

Aucun endpoint ne permet de révoquer une session appartenant à un autre compte.

### Récupération de compte

- `POST /v1/auth/password-reset/request` envoie éventuellement un message, mais renvoie toujours la même réponse ;
- `POST /v1/auth/password-reset/confirm` consomme un token unique ;
- toutes les sessions existantes sont révoquées après changement de mot de passe.

## 5. Endpoints de compte

### `GET /v1/me`

Retourne uniquement : `user_id`, e-mail, statut, état de vérification, nom d’affichage et entitlements serveur.

Ne retourne jamais : mot de passe, hash, cookie, token, secret de session, plan local ou données d’un autre utilisateur.

### `PATCH /v1/me`

Le premier périmètre autorise uniquement `display_name`. Le serveur ignore ou rejette les champs suivants : `user_id`, `owner_id`, e-mail vérifié, statut, membership, plan, entitlements, timestamps et rôles.

## 6. CORS et transport

La configuration cible doit respecter les règles suivantes :

- HTTPS obligatoire ;
- HSTS sur le domaine réel ;
- `Access-Control-Allow-Origin` limité à une liste exacte ;
- jamais `Access-Control-Allow-Origin: *` avec credentials ;
- `Access-Control-Allow-Credentials: true` uniquement pour l’origine applicative autorisée ;
- méthodes et en-têtes explicitement allowlistés ;
- absence de token dans l’URL ;
- taille maximale des requêtes ;
- validation stricte du `Content-Type` ;
- réponses d’erreur sans détail interne.

## 7. Réponses et erreurs

Toutes les erreurs JSON suivent la forme :

```json
{
  "code": "validation_error",
  "message": "Request could not be processed.",
  "request_id": "req_...",
  "field_errors": {}
}
```

Les codes de design sont : `validation_error`, `unauthenticated`, `authentication_failed`, `csrf_failed`, `not_found`, `rate_limited`, `conflict` et `internal_error`.

Les messages utilisateurs peuvent être localisés, mais les logs internes ne doivent pas contenir de secret ni de texte du Journal. `request_id` sert à faire le lien avec le support sans exposer les données personnelles.

## 8. Limites de débit initiales

| Flux | Limite de design | Garde-fou |
|---|---|---|
| Inscription | 5 / heure / IP ; 3 / heure / e-mail normalisé | Réponse générique |
| Connexion | 10 / 15 min / compte logique et IP | Backoff progressif |
| Récupération | 5 / heure / IP et e-mail normalisé | Pas d’énumération |
| Vérification | 10 / heure / IP et famille de token | Token à usage unique |
| Mutations authentifiées | 120 / minute / utilisateur et IP | `clientMutationId` idempotent |

Les limites finales devront être mesurées en staging avant activation.

## 9. Contrat avec l’ownership P3.1

Le middleware d’authentification doit construire un contexte serveur du type :

```text
requestContext = {
  userId: session.user_id,
  sessionId: session.session_id,
  membership: serverMembership,
  entitlements: serverEntitlements,
  requestId: generatedRequestId
}
```

Les services métier ne doivent pas accepter `owner_id` depuis le payload. Ils reçoivent `userId` depuis le contexte authentifié et appliquent la condition d’ownership avant lecture, écriture, export ou suppression.

Pour les preuves Premium, le client peut envoyer une réponse, une réflexion ou une entrée de review. Le niveau, la réussite, l’entitlement, la source authored et la date de preuve sont contrôlés côté serveur conformément au contrat P3.1.

## 10. Sécurité opérationnelle

Le futur service doit prévoir :

- secrets hors dépôt et rotation ;
- séparation dev/staging/production ;
- stockage hashé des sessions et tokens ;
- logs limités à la route, au statut, à la latence, au `request_id` et à un résultat grossier ;
- interdiction de journaliser mots de passe, tokens, cookies, Authorization, e-mails complets, corps bruts et texte du Journal ;
- alertes sur 401, 403, 429, erreurs 5xx et accès anormaux ;
- procédure de révocation et incident ;
- backups chiffrés et restauration testée.

## 11. Critères de passage avant implémentation

P3.2 ne doit pas encore être branché au frontend. L’implémentation ne pourra commencer qu’après validation de :

1. fournisseur d’identité ou décision documentée de service dédié ;
2. domaine applicatif et API ;
3. stratégie `SameSite`/CORS/CSRF ;
4. durée de session et révocation ;
5. politique e-mail, récupération et support ;
6. région d’hébergement et conservation ;
7. tests d’accès croisé et d’énumération ;
8. environnement staging isolé ;
9. procédure de rollback ;
10. revue du contrat OpenAPI par le responsable produit et le responsable sécurité.

## 12. Hors périmètre

Cette tranche ne crée pas :

- serveur API ;
- base de données ;
- fournisseur d’identité ;
- formulaire fonctionnel distant ;
- cookies dans l’application actuelle ;
- abonnement ou facturation ;
- synchronisation de la progression ou du Journal.
