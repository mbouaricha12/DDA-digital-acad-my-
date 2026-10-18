# DDA — Audit BRVM et modèle serveur des publications

**Date :** 18 octobre 2026  
**Branche auditée :** `feat/brvm-phase1-traceable` / PR #116, non fusionnée  
**Périmètre :** vue `#markets`, gouvernance des sources et préparation à une galerie de publications vérifiées

## Constat technique

La vue `#markets` contient déjà une galerie « Publications financières BRVM » dans l’identité Deep Navy de DDA. Elle expose un état vide annoncé par lecteur d’écran, les métadonnées attendues et le principe « aucun lien ou chiffre sans validation ». Les règles CSS existantes replient les métadonnées en une colonne sur les petits écrans.

Dans `dist/app.js`, le registre `BRVM_PUBLICATIONS` est explicitement vide. Le filtre de rendu refuse les publications incomplètes, non vérifiées, obsolètes, sans droits ou dont les dates et l’URL sont incohérentes. C’est un bon garde-fou de présentation, mais le registre et son filtre vivent dans le navigateur : ils ne constituent pas un registre serveur ni une autorisation de publication.

Le BFF contient les services de compte et de facturation, mais aucun endpoint ni adaptateur BRVM. Les migrations existantes protègent les données d’apprentissage et la facturation ; elles ne définissent ni sources BRVM, ni documents, ni rôles de revue BRVM. La variable d’URL BFF de la SPA est vide par défaut, le BFF n’est pas déployé et aucune source officielle n’est connectée. Aucun document, prix, calendrier réel ou date de publication financière n’est donc livré.

## Modèle serveur proposé

Le modèle proposé se compose de trois tables privées et d’une vue de lecture contrôlée :

- `dda_brvm_sources` conserve l’identité de la source, son URL canonique HTTPS, son type, son contact et la référence de licence, son périmètre, sa politique de mise à jour, le statut de redistribution et les personnes/dates de revue des droits et de la source.
- `dda_brvm_documents` conserve l’identifiant du document, sa source, son titre, son type, l’URL d’origine, la date de référence, la date de récupération, le SHA-256, la version du transformateur, les statuts d’import, de vérification, de fraîcheur, de droits et de publication, ainsi que les relecteurs et les dates d’approbation/publication. Les champs d’erreur sont bornés et ne sont jamais renvoyés dans la vue publique.
- `dda_brvm_audit_events` enregistre les insertions, changements de statut et suppressions avec l’acteur disponible dans les claims, le rôle de base et les anciens/nouveaux statuts. Les rôles web n’ont aucun accès direct et les événements ne sont pas modifiables par les rôles applicatifs.
- `dda_brvm_publications` est la seule projection consultée par le BFF. Elle n’expose que les documents publiés, vérifiés, frais, autorisés et rattachés à une source approuvée dont les droits de redistribution sont autorisés. Les contacts, références contractuelles et détails d’erreur restent privés.

Le moteur de base impose les transitions de source `proposed → rights_pending → review_pending → approved`, avec rejet possible et expiration depuis une source approuvée. Les transitions documentaires sont `draft → review_pending → approved → imported → published`, avec rejet ou expiration comme issues de sécurité. La publication exige un manifest complet, un import réussi, des statuts `verified`, `current` et `authorized`, des dates cohérentes, une source approuvée, ainsi que des identifiants distincts pour la revue des droits et la revue éditoriale. Un identifiant distinct de publication est conservé pour la traçabilité.

Le schéma seul n’active pas un workflow d’administration. Aucun endpoint d’écriture n’est ajouté. Les écritures restent réservées à une opération contrôlée par un administrateur de base, avec revue humaine documentée ; le BFF ne reçoit que le droit de lire la vue filtrée. Aucune table ni migration n’a été appliquée à Supabase distant.

## Contrat API et rendu de la galerie

Le BFF expose `GET /v1/publications/brvm`, sans authentification apprenant, qui renvoie `{ "items": [] }` lorsqu’il n’existe aucun document admissible. Le BFF échoue explicitement en `503` si le magasin n’est pas configuré ; une erreur du stockage ne doit jamais être transformée en succès vide. Les réponses ne contiennent que les métadonnées nécessaires à la galerie et utilisent `Cache-Control: no-store`.

La galerie demande ces données seulement si `DDA_BFF_BASE_URL` est configurée. Sans BFF, elle conserve l’état vide honnête actuel. Avec BFF, elle annonce un état de chargement, puis un état vide ou les documents filtrés côté serveur et revalidés côté navigateur. En cas d’indisponibilité ou de réponse mal formée, elle affiche un état d’erreur sans lien ni chiffre. Les chaînes sont échappées avant insertion dans le DOM. Cette intégration ne modifie ni le Terminal, ni le Journal, ni les parcours M0/M1/P2.

## Risques et limites

La validation des identifiants distincts ne crée pas à elle seule un RBAC applicatif : aucun rôle `responsable des droits`, `relecteur éditorial` ou `administrateur BRVM` n’existe actuellement. La préparation ne fournit pas d’écran d’administration, d’upload, de stockage documentaire, d’antivirus, de vérification cryptographique d’une source, de connecteur automatique ou de mécanisme de renouvellement des droits. Les valeurs « frais » et « approuvé » ne pourront être fiables qu’après définition d’une source et exécution de la revue humaine.

La migration doit être revue et appliquée séparément dans l’environnement Supabase choisi. Avant tout premier document, une décision humaine reste nécessaire sur la source, la licence de lecture/archivage/redistribution, les politiques de fraîcheur, la conservation des documents et des journaux, l’identité et la séparation des rôles de relecture, ainsi que le déploiement et le domaine du BFF. Aucun de ces choix n’est deviné dans le code.

## Vérifications de cette tranche

Les validations prévues couvrent les contrats unitaires du magasin et de l’endpoint, le rejet des réponses incomplètes côté client, les états sans BFF/chargement/erreur/vide, la galerie à 360 et 390 px sans débordement, le test de syntaxe, tous les contrats Node, le smoke test Academy et l’ensemble du harness Playwright. Les documents de test utilisent uniquement des chaînes de test et ne sont pas ajoutés au registre de publication.


## Décisions humaines toujours requises

Avant d’activer la migration ou de fournir une première publication, DDA doit désigner la source et confirmer contractuellement les droits de lecture, d’archivage et de redistribution. Il faut aussi fixer la période de fraîcheur et la conservation, nommer des relecteurs distincts pour les droits et l’éditorial, décider comment leurs identités sont reliées aux claims d’audit, puis choisir l’environnement et le domaine de déploiement du BFF. Sans ces décisions, le comportement opérationnel reste le registre vide.


## Validation exécutée

Les six contrats BRVM passent, ainsi que les **60 contrats Node** du dépôt et les **24 checks du smoke test Academy**. Le harness Playwright complet termine à **58 scénarios réussis, 0 échec** ; les états vide, chargement, erreur, liens HTTPS et l’absence de débordement à 360/390 px sont couverts. La syntaxe des scripts JavaScript passe, l’auditeur RLS confirme les privilèges deny-by-default, `git diff --check` est propre et le parseur PostgreSQL accepte les 33 instructions de la migration.

Ces résultats valident le code et la grammaire SQL uniquement. La migration n’a pas été appliquée à une base distante, le BFF n’a pas été déployé, aucune source ni publication n’a été ajoutée, et la PR #116 demeure ouverte et non fusionnée.
