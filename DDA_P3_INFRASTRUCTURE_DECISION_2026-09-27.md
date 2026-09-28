# DDA Academy — Décision d’infrastructure P3

**Date de décision :** 27 septembre 2026  
**Rôle :** Responsable architecture et sécurité DDA  
**Périmètre :** choix du domaine, du fournisseur d’identité/base, de la région, de la conservation et de la suppression pour P3.  
**Statut :** recommandation conditionnelle — **aucune provision, aucun paiement et aucune ouverture de production**.

> **Avertissement juridique.** Ce document est une recommandation d’architecture et de sécurité, pas un avis juridique ni une certification de conformité. Une revue juridique locale/DPO est nécessaire avant de figer la résidence, les transferts internationaux, la notice de confidentialité, les bases légales, les règles applicables aux mineurs et les délais d’effacement.

## 1. Décision recommandée

### 1.1 Choix cible

Retenir **Supabase Auth + Postgres comme candidat principal**, placé derrière une **API/BFF DDA**. Supabase est le meilleur compromis des options étudiées pour P3.1, car Auth, Postgres et Storage peuvent suivre une région primaire explicite, et Postgres/RLS peuvent soutenir les contrôles `owner_id` et l’autorisation objet par objet. Ce choix n’est acceptable que si les écarts de session, de conservation et de suppression sont fermés avant production.

Architecture cible :

```text
Navigateur — app.example.dda.academy
    │ HTTPS, credentials, CSRF double-submit, Origin allowlist
    ▼
API/BFF DDA — api.example.dda.academy/v1
    │ session opaque __Host-dda_session, server-side authorization
    │ owner_id et entitlements dérivés côté serveur
    ▼
Supabase Auth + Postgres + Storage — région primaire UE explicite
```

Le BFF DDA est obligatoire pour respecter le contrat P3.2 : la SPA ne doit pas utiliser directement un JWT/refresh token persistant comme autorité, ni exposer une clé secrète. Supabase peut vérifier l’identité, mais **DDA reste propriétaire de la session applicative, de l’identité métier, des entitlements, de l’ownership et de l’orchestration de suppression/export**.

### 1.2 Ce qui est accepté et ce qui ne l’est pas

- **Accepté :** Supabase comme fournisseur d’identité et de base, clé publishable côté navigateur uniquement, BFF DDA pour l’échange/vérification et l’émission du cookie opaque.
- **Accepté :** le Journal, la progression, les preuves Premium, les memberships et l’audit dans le stockage DDA/Postgres, avec RLS et autorisation serveur.
- **Non accepté :** une intégration directe `supabase-js` depuis la SPA comme architecture finale si elle persiste les sessions lisibles par JavaScript ; une table exposée sans RLS ; un `owner_id` fourni par le client ; des entitlements calculés depuis `localStorage` ; un refresh token en `localStorage` ; le stockage du Journal dans des metadata d’IdP.
- **Non accepté :** considérer une région CDN, une présence réseau en Afrique ou une région générale « Europe » comme preuve de résidence de toutes les données.
- **Non accepté :** annoncer un effacement instantané de toutes les copies tant que les backups, logs, exports et sous-traitants ne sont pas couverts par un mécanisme et des engagements vérifiés.

### 1.3 Conditions de passage en production

La décision devient « go » uniquement après :

1. validation humaine de l’exigence de résidence (UE stricte, US, Afrique ou autre) ;
2. confirmation écrite du fournisseur sur la région primaire, réplications, Auth, Storage, logs, backups, support et sous-traitants effectivement activés ;
3. déploiement du BFF avec le cookie P3.2, CSRF, CORS fermé, contrôle `Origin`, rotation/révocation et timeouts ;
4. activation et tests des RLS/grants et de l’autorisation par objet ;
5. ajout des endpoints d’export, de suppression et de statut de purge ;
6. politique de conservation approuvée par DDA et revue juridique locale ;
7. test de restauration isolée avec replay des suppressions ;
8. tests négatifs avec au moins deux comptes distincts ;
9. absence de données sensibles dans logs, analytics, emails et événements d’audit ;
10. acceptation explicite qu’aucune facturation ou activation Premium commerciale n’est requise pour résoudre ces décisions.

## 2. Principes non négociables issus de P3.1/P3.2

- Le client est **non fiable** et `localStorage` n’est jamais une autorité.
- `user_id`, `owner_id`, timestamps, memberships et entitlements sont générés/validés côté serveur.
- Toute lecture, création, modification, export et suppression est limitée aux objets dont `owner_id` correspond à la session authentifiée.
- L’API ignore ou rejette tout `owner_id` fourni par le navigateur.
- Les événements d’audit sont append-only, server-owned et ne contiennent jamais mots de passe, tokens, cookies, adresses email complètes, texte du Journal ni raw bodies.
- La migration v4 est explicite, consentie, idempotente, réversible et conserve la copie locale jusqu’à la confirmation de l’import et au résumé visible par l’utilisateur.
- La session finale est un cookie opaque `__Host-dda_session`, `Secure`, `HttpOnly`, `SameSite=Lax` par défaut, stocké sous forme de hash côté serveur. Le cookie CSRF `__Host-dda_csrf` est lisible par la SPA et recopié dans `X-CSRF-Token`.
- Les mutations exigent CSRF et `Origin` autorisée ; le CORS n’autorise jamais `*` avec credentials.
- Les inscriptions et récupérations utilisent des réponses uniformes et ne révèlent pas l’existence d’un compte.
- Le design P3.2 est un contrat, pas une implémentation déployée : les endpoints d’export, suppression et purge doivent être ajoutés explicitement.

## 3. Tableau comparatif des fournisseurs

| Fournisseur | Rôle possible | Adéquation P3.1/P3.2 | Région et transferts | Conservation/suppression | Décision |
|---|---|---|---|---|---|
| **Supabase Auth + Postgres** | IdP, Auth, Postgres, Storage ; API/BFF DDA à ajouter | **Meilleur candidat conditionnel.** Bon alignement Postgres/RLS et ownership. Écart : `supabase-js` navigateur persiste normalement la session et n’est pas le cookie opaque P3.2. | Projet dans une région primaire. Régions UE spécifiques documentées : Ireland, Paris, Frankfurt, Stockholm, entre autres. Pas de région Afrique documentée. La région ne couvre pas automatiquement logs, backups, fonctions et sous-traitants. | Backups quotidiens selon niveau de service ; 7/14/jusqu’à 30 jours documentés. Suppression Auth invalide les refresh tokens, mais un JWT déjà émis reste valide jusqu’à expiration. Pas de purge utilisateur sélective documentée dans les backups. | **Retenir comme candidat principal**, sous réserve BFF, région/DPA, purge et tests de restauration. |
| **Auth0 / Okta CIC** | IdP OIDC externalisé, pas base applicative | Bon IdP conditionnel, mais ne doit pas porter Journal, progression, preuves ou entitlements. BFF DDA nécessaire pour `__Host-dda_session`. | Public Cloud : US, UK, Europe, Australie, Japon, Canada ; aucune région Afrique Public Cloud listée. South Africa apparaît en Private Cloud Enterprise. CDN/support/email/SMS et sous-traitants peuvent élargir la zone. | Logs courts selon plan ; export asynchrone ; suppression du profil immédiate dans le système mais backups offline pouvant rester jusqu’à 14 mois selon le support. DDA doit supprimer ses propres données. | **Alternative IdP uniquement** si OIDC, résidence, DPA et sauvegardes sont acceptables. Non retenu comme backend. |
| **Clerk** | IdP/session pour SPA | Adéquation seulement conditionnelle. Peut alimenter une SPA, mais ne fournit ni API DDA ni autorisation objet par objet. Son modèle de cookies/JWT doit être adapté au contrat P3.2. | Données hébergées aux États-Unis et traitements potentiellement mondiaux selon la documentation. Pas de régionalisation sélectionnable UE/Afrique documentée. Sous-traitants à confirmer dans Trust Center. | Suppression utilisateur via API/webhook, mais pas cascade automatique des données DDA ; DPA : retour puis suppression des copies de fin de contrat sous 90 jours, sans SLA public de backup par utilisateur. | **Ne pas retenir pour P3** si résidence UE/Afrique ou purge individuelle contractuelle est exigée. Aucun provisionnement. |
| **GitHub Pages** | Hébergement statique/public du frontend | Ne remplace ni IdP, ni BFF, ni base. GitHub déconseille Pages pour les transactions sensibles comme l’envoi de mots de passe/cartes. | La localisation GitHub/CDN/support n’est pas une résidence DDA. Le périmètre des sous-traitants applicable au dépôt doit être confirmé. | Pas un système de cycle de vie des données DDA. | **Public/non authentifié uniquement**. Ne pas y porter le parcours de mot de passe et de données sensibles en production. |

### Conclusion comparative

Supabase est le seul candidat analysé qui traite directement le besoin de base relationnelle, RLS et région primaire explicite. Auth0 est une bonne brique OIDC mais laisserait la base et l’orchestration à DDA. Clerk est défavorisé par la résidence et le contrôle des backups. Dans tous les cas, **le fournisseur n’est pas l’autorité métier DDA**.

## 4. Domaine cible et topologie

### 4.1 Domaine canonique recommandé

- **Frontend authentifié :** `https://app.example.dda.academy`
- **API/BFF :** `https://api.example.dda.academy/v1`
- **Site public/documentation :** domaine GitHub Pages éventuellement personnalisé, séparé du parcours authentifié.

`api.example.dda.academy` est la forme déjà réservée par P3.2 ; elle ne doit être remplacée qu’après décision d’infrastructure et mise à jour du contrat. Le domaine doit être détenu et administré par DDA, avec DNS, certificats, HSTS, CSP et `Permissions-Policy` sous contrôle DDA.

La SPA authentifiée peut conserver un frontend statique, mais **le parcours de mot de passe, la session et les données DDA ne doivent pas être considérés comme hébergés/protégés par GitHub Pages**. Si Pages reste utilisé pour les bundles, la surface authentifiée doit appeler exclusivement le BFF et aucun secret ne doit être livré au bundle.

### 4.2 Règles de cookies et origines

- Cookie de session émis uniquement par l’API : `__Host-dda_session`, `Path=/`, `Secure`, `HttpOnly`, `SameSite=Lax`.
- Cookie CSRF : `__Host-dda_csrf`, `Secure`, non `HttpOnly`, même périmètre de chemin, valeur aléatoire.
- `credentials: include` uniquement vers l’API DDA.
- CORS allowlist exacte : `https://app.example.dda.academy`, sans wildcard de production.
- Vérification stricte de `Origin` pour toute mutation ; contrôle `Referer` en défense complémentaire selon le flux.
- Aucun cookie de session ne doit être modifié par un proxy, addon ou script tiers.
- CSP restrictive, absence de scripts tiers non nécessaires sur les pages authentifiées, et tests XSS sur le texte libre.

## 5. Région recommandée et incertitudes

### 5.1 Recommandation

Si DDA confirme une exigence UE, choisir une **région AWS UE spécifique**, avec **Ireland comme candidate initiale** et Paris comme alternative opérationnelle à comparer. Ne pas sélectionner le groupe générique « Europe », car il peut inclure Londres ou Zurich, hors UE. La région exacte est une décision de déploiement à confirmer par la disponibilité réelle du tenant et par le DPA.

La confirmation doit couvrir séparément :

- Postgres primaire ;
- Supabase Auth ;
- Storage et objets de preuves ;
- backups, PITR et clones/restaurations ;
- logs Auth/API/Postgres/Storage ;
- Edge Functions ou workers ;
- export et support ;
- emails, SMS/MFA, CDN, observabilité et autres sous-traitants ;
- accès du support et éventuels transferts hors région.

Une région primaire UE **ne permet pas à elle seule d’affirmer un traitement intégralement UE**. La revue juridique locale doit déterminer si l’exigence est résidence stricte, localisation des données au repos, limitation des accès, ou simple préférence de latence.

### 5.2 Scénarios alternatifs

- **Résidence US acceptée :** une région US spécifique peut être retenue après le même inventaire de flux et validation contractuelle.
- **Résidence Afrique obligatoire :** décision bloquée avec les résultats actuels. Supabase et Auth0 Public Cloud ne documentent pas de région de stockage Afrique ; South Africa Auth0 est documenté seulement en Private Cloud Enterprise, à confirmer commercialement. Une présence CDN/Regional Services en Afrique ne prouve pas un stockage DDA en Afrique.
- **Résidence UE stricte non négociable :** Clerk est écarté selon les éléments vérifiés ; Auth0 Public Cloud reste conditionnel à la cartographie de ses sous-traitants ; Supabase reste candidat uniquement après confirmation du périmètre hors région.

## 6. Politique de conservation proposée

Les durées ci-dessous sont des **cibles minimales DDA proposées**, non des garanties des fournisseurs. Elles doivent être validées par DDA, le DPO/conseil local et les engagements contractuels. Toute exception légale doit être documentée, limitée et communiquée lorsque requis.

| Catégorie | Classification / contenu | Conservation cible DDA | Action à la suppression | Points de contrôle |
|---|---|---:|---|---|
| Compte, email vérifié, profil minimal | Identité/profil | Tant que le compte est actif ; revue des comptes inactifs à 24 mois avec notification préalable | Désactivation immédiate, puis purge applicative sous 30 jours après vérification de la demande | Le fournisseur ne doit contenir que les attributs IAM minimaux ; pas de texte libre dans metadata |
| Sessions et tokens serveur | Sécurité | Inactivité 720 min ; durée absolue 30 jours, conformément à P3.2 | Révocation immédiate de la session courante et de toutes les sessions ; purge des lignes de session sous 30 jours | Vérifier `session_id` pour les opérations sensibles afin d’éviter qu’un JWT émis reste utilisable |
| Onboarding, préférences, progression, terminal | Données d’apprentissage | Tant que le compte est actif et que la finalité pédagogique existe | Export préalable sur demande, puis cascade et purge sous 30 jours | `owner_id` serveur, RLS, pas de synchronisation implicite de données locales |
| Journal et plans | `free-text-sensitive` | Tant que le compte est actif ; aucune conservation indéfinie après fin de finalité | Suppression logique immédiate, purge du contenu et des index/caches sous 30 jours | Jamais dans analytics, logs, audit brut, metadata IdP ou prompts IA sans consentement/finalité distincte |
| Preuves et progression Premium | `learning-proof`, server-validated | Tant que l’accès pédagogique est actif ou que l’utilisateur les conserve | Révocation des entitlements, suppression des objets liés et preuve d’exécution sous 30 jours | Le client ne peut jamais écrire `proof_level`, `passed` ou `entitlement` |
| Audit événements | Métadonnées opérationnelles append-only | 90 jours en cible, sauf exception sécurité/légale documentée | Pseudonymiser l’acteur si nécessaire ; ne pas restaurer de texte personnel | Aucun email complet, secret, cookie, token, Journal ou raw body |
| Logs techniques et sécurité | Observabilité | 30 jours en ligne ; extension uniquement pour incident documenté, idéalement exportée et contrôlée | Purger les copies DDA et appliquer la procédure aux sous-traitants | Les rétentions natives Auth0/Supabase varient ; l’export/log streaming doit être évalué avant de promettre 30 jours |
| Acquisition/analytics | Pseudonyme, device-scoped | Non synchronisée par défaut ; si consentement et finalité, 90 jours | Supprimer l’association et les données applicables ; ne jamais promouvoir `visitor_id` en `user_id` | Allowlist d’événements, pas de contenu du Journal |
| Exports utilisateur | Copie portable sensible | Artefact chiffré, lien à usage contrôlé, 24 h ; suppression forcée sous 7 jours | Révoquer le lien et purger le fichier et ses copies temporaires | Ne pas utiliser un export admin contenant des hashes de mots de passe comme export utilisateur |
| Demandes de suppression | Métadonnées de workflow | Jusqu’à 30 jours après clôture, sans contenu personnel non nécessaire | Garder seulement la preuve minimale de traitement, avec pseudonymisation | Statut asynchrone, idempotence, erreurs partielles et preuve de fin |
| Backups et PITR | Copies de reprise | Cible maximale 14 jours pour les données personnelles, à confirmer selon le service choisi | Rejouer des tombstones après restauration ; bloquer une promesse d’effacement immédiat si purge sélective impossible | Supabase documente 7/14/jusqu’à 30 jours selon niveau ; la fenêtre réellement disponible doit être contractualisée |
| Copie locale v4 | Donnée sous contrôle du navigateur | Jusqu’au résumé de migration confirmé, puis suppression locale explicite ; rappel à l’utilisateur | Ne pas supprimer avant confirmation ; proposer export/rollback | Copie falsifiable, possiblement partagée entre utilisateurs ; jamais autorité |

**Important :** le délai de 30 jours proposé pour la purge applicative est un objectif d’exploitation, pas une obligation automatiquement fournie par Supabase, Auth0 ou Clerk. Il devient un critère bloquant si le fournisseur ne permet pas d’en démontrer l’exécution ou si un DPA impose une autre durée incompatible.

## 7. Suppression et export de compte

### 7.1 Endpoints à ajouter au contrat P3.2

P3.2 ne définit actuellement aucun endpoint explicite d’export ou de suppression. Ajouter au minimum :

- `POST /v1/account/export` — demande authentifiée, réauthentification ou étape de confirmation forte ;
- `GET /v1/account/export/{jobId}` — statut sans divulgation ;
- `GET /v1/account/export/{jobId}/download` — artefact signé, chiffré, expirant ;
- `POST /v1/account/deletion` — demande idempotente et confirmation ;
- `GET /v1/account/deletion/{jobId}` — statut, erreurs partielles, date de clôture et preuve synthétique.

Les noms sont proposés et doivent être intégrés au contrat OpenAPI avant implémentation.

### 7.2 Export

1. Authentifier la session et confirmer l’intention ; pour un export complet, demander une réauthentification ou un contrôle équivalent.
2. Lire uniquement les données du compte via l’API/BFF : profil, onboarding, progression, terminal, Journal, plans, preuves, préférences et memberships selon la politique produit.
3. Exclure secrets, mots de passe, tokens, cookies, clés privées et données internes de sécurité. L’audit est inclus uniquement dans une forme minimale et documentée.
4. Générer un format lisible et versionné, par exemple JSON + fichiers associés ; ne pas confondre avec un CSV d’administration.
5. Produire un job asynchrone idempotent, un artefact chiffré, un lien à usage contrôlé et une expiration courte.
6. Purger l’artefact, les files temporaires et les caches dans le délai cible ; enregistrer uniquement la preuve minimale de clôture.

### 7.3 Suppression

1. Authentifier, confirmer la demande et informer clairement du périmètre, des exceptions et des éventuels délais de backup.
2. Marquer le compte `deletion_pending`, bloquer les nouvelles mutations et révoquer immédiatement toutes les sessions et entitlements.
3. Créer un `deletion_job` idempotent ; ne jamais dépendre d’un seul webhook fournisseur.
4. Supprimer ou anonymiser les lignes owned : onboarding, progression, terminal, Journal, plans, preuves, reviews, préférences, memberships et objets Storage.
5. Demander la suppression au fournisseur IAM/IdP et traiter les retries ; supprimer aussi les copies DDA, exports, caches, queues et systèmes d’email/analytics autorisés.
6. Conserver au maximum une tombstone pseudonymisée et la preuve minimale nécessaire au suivi de suppression, sans email complet ni texte personnel.
7. Traiter les backups : marquer les identifiants supprimés, empêcher leur réapparition applicative et rejouer les tombstones après toute restauration. Si une purge sélective de backup n’est pas possible, l’indiquer dans la notice et dans la décision juridique ; ne pas promettre l’effacement instantané de toutes les copies.
8. Exposer un statut d’avancement, les erreurs partielles et une preuve de fin. Une tâche échouée doit être relançable sans doublon.
9. Tester la restauration dans un environnement isolé, puis vérifier que le compte supprimé n’est pas recréé par une restauration sans replay des suppressions.

## 8. Critères de validation avant ouverture

### Résidence, contrats et gouvernance

- [ ] Région primaire choisie explicitement et confirmée par écrit.
- [ ] Cartographie base/Auth/Storage/backups/logs/fonctions/CDN/support/email/SMS/analytics produite.
- [ ] Liste des sous-traitants et pays applicables au tenant retenu approuvée.
- [ ] DPA, SCC/équivalent, mécanismes de transfert et accès support examinés par le responsable juridique local.
- [ ] Politique de confidentialité, consentement et âge cible des apprenants approuvés ; le service Clerk n’est pas supposé adapté aux moins de 16 ans.
- [ ] Aucun fournisseur ni région présenté comme « conforme » sans validation juridique et contractuelle.

### Domaine, session et API

- [ ] `app.example.dda.academy` et `api.example.dda.academy` sont sous contrôle DNS DDA et HTTPS.
- [ ] CORS exact, credentials, CSRF double-submit, contrôle Origin et cookies testés.
- [ ] `__Host-dda_session` est opaque, `HttpOnly`, `Secure`, `SameSite=Lax`, hashé côté serveur et révoqué côté serveur.
- [ ] Aucun refresh token ou secret dans `localStorage`, le bundle public, les logs ou les analytics.
- [ ] Timeouts 720 minutes/30 jours, rotation, logout, logout-all, révocation individuelle et récupération testés.
- [ ] Réponses d’inscription/récupération uniformes ; rate limits par IP, compte et endpoint ; erreurs 429 gérées avec retries bornés et idempotence.

### Données et autorisation

- [ ] RLS/grants testés automatiquement et négativement entre deux comptes.
- [ ] `owner_id` dérivé de la session ; toute valeur client est ignorée ou rejetée.
- [ ] Memberships et entitlements calculés côté serveur ; aucune mutation client ne peut donner Premium.
- [ ] Journal et preuves encodés en sortie sûre ; payloads et tailles validés côté serveur.
- [ ] Audit sans secrets, email complet, texte libre ni raw body.
- [ ] Migration v4 explicite, idempotente, réversible, sans fusion silencieuse et avec conservation locale jusqu’à confirmation.

### Conservation, export, suppression et opérations

- [ ] Matrice de conservation approuvée et implémentée par catégorie.
- [ ] Export complet DDA testé ; aucun export admin avec hashes de mots de passe exposé à l’utilisateur.
- [ ] Suppression en cascade et webhook/retry testés ; statut asynchrone et preuve de fin disponibles.
- [ ] Backups chiffrés, RPO/RTO, fenêtre de conservation et replay des tombstones testés.
- [ ] Purge des logs, analytics, exports, Storage, caches et files vérifiée.
- [ ] Staging et production séparés ; secrets hors dépôt ; MFA administrateur ; accès support moindre privilège et audité.
- [ ] Pilote limité avant toute ouverture publique ; aucun paiement ou abonnement activé pour contourner les décisions restantes.

## 9. Décisions nécessitant encore une validation humaine — bloqueurs

1. **Exigence de résidence :** UE stricte, US, Afrique, ou simple préférence de latence ; définition de ce qui doit rester dans la zone (données, backups, support, CDN, sous-traitants).
2. **Choix fournisseur final :** approbation de Supabase comme candidat principal ou décision de retenir Auth0 comme IdP séparé ; refus ou exception documentée si Afrique obligatoire.
3. **Région précise :** Ireland ou Paris comme candidat UE, avec confirmation de disponibilité du tenant et de tous les flux hors région.
4. **Domaine et hébergement :** maintien de GitHub Pages seulement pour le public, ou hébergement contrôlé DDA de l’application authentifiée ; propriété DNS et gestion des certificats.
5. **BFF/API :** budget, opérateur, disponibilité, secrets, rate limiting et responsabilité de l’émission du cookie P3.2.
6. **Conservation :** approbation des durées cibles, notamment 24 mois d’inactivité, audit 90 jours, logs 30 jours, exports 7 jours et backups maximum 14 jours.
7. **Suppression :** acceptation du délai cible de 30 jours, du statut asynchrone, des exceptions d’audit et du traitement des backups restaurables.
8. **DPA et sous-traitants :** validation des pays, du support, de l’email/SMS/MFA, de l’observabilité et des mécanismes de notification/objection.
9. **Public cible et âge :** confirmation de l’âge des apprenants, notamment la présence éventuelle de moins de 16 ans, et revue juridique locale correspondante.
10. **Flux de données sensibles :** confirmation que le Journal, les preuves et le texte libre restent hors IdP metadata, analytics, logs et systèmes IA par défaut.
11. **MFA, emails et recovery :** fournisseur retenu, limites de débit, délivrabilité, coûts potentiels et exigences de sécurité, sans activation commerciale à ce stade.
12. **Critère de lancement :** validation formelle par architecture, sécurité, produit, exploitation et juridique local ; aucun déploiement public avant signature de cette décision.

## 10. Références de travail

### Contrats DDA

- [`contracts/p3-data-contract-v1.json`](contracts/p3-data-contract-v1.json)
- [`contracts/p3-identity-session-api-v1.json`](contracts/p3-identity-session-api-v1.json)
- [`DDA_AUTH_REMOTE_DB_RISK_ANALYSIS_2026-09-27.md`](DDA_AUTH_REMOTE_DB_RISK_ANALYSIS_2026-09-27.md)

### Documentation fournisseur et plateforme examinée

- [Supabase regions](https://supabase.com/docs/guides/platform/regions) et [régions disponibles](https://supabase.com/regions)
- [Supabase sessions](https://supabase.com/docs/guides/auth/sessions), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [backups](https://supabase.com/docs/guides/platform/backups), [gestion des utilisateurs](https://supabase.com/docs/guides/auth/managing-user-data), [DPA](https://supabase.com/legal/customer-resources/data-processing-addendum)
- [Auth0 cloud deployment](https://auth0.com/platform/cloud-deployment), [subprocessors](https://www.okta.com/legal/trustandcompliance/subprocessors/), [stockage utilisateur](https://auth0.com/docs/secure/security-guidance/data-security/user-data-storage), [token storage](https://auth0.com/docs/secure/security-guidance/data-security/token-storage), [export/suppression](https://auth0.com/docs/secure/data-privacy-and-compliance/gdpr/gdpr-right-to-access-correct-and-erase-data)
- [Clerk security](https://clerk.com/security), [privacy](https://clerk.com/legal/privacy), [DPA](https://clerk.com/legal/dpa), [subprocessors](https://clerk.com/legal/subprocessors), [sessions](https://clerk.com/docs/guides/sessions/session-tokens)
- [GitHub Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits), [custom domains](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site)

## Décision synthétique

**Recommandation P3 :** poursuivre avec **Supabase Auth + Postgres, région UE spécifique candidate Ireland, API/BFF DDA et domaines contrôlés `app.example.dda.academy` / `api.example.dda.academy`**, sans provisionnement immédiat. Le choix reste bloqué tant que résidence, DPA/sous-traitants, session P3.2, conservation des backups et suppression/export de bout en bout ne sont pas validés humainement et testés. Si une résidence Afrique est obligatoire, **ne pas retenir ce choix sur la base des résultats actuels** ; lancer une évaluation d’un fournisseur offrant une résidence de stockage Afrique explicitement contractualisée.
