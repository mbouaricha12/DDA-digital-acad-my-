# DDA Academy — Addendum de stabilisation

**Date :** 11 novembre 2026
**Base de travail :** `main` / commit `e86854e`
**Branche locale :** `fix/profile-state-account-scope`
**Statut :** corrections locales non commit, non poussées; aucune PR créée ou fusionnée.

Cet addendum complète l’[audit produit de lancement du 9 novembre 2026](/home/ubuntu/DDA_AUDIT_MASTER_PRODUCT_LAUNCH_2026-11-09.md). Il consigne les correctifs P0 exécutés et les vérifications finales. Il ne remplace pas la validation de la configuration réelle en production.

## Correctifs exécutés

### Isolation des profils et des données

Le stockage de l’application utilise maintenant un espace distinct par `user_id` fourni par le BFF; le mode invité possède sa propre clé. L’Academy attend la vérification de session avant de rendre le contenu personnalisé. La progression historique sans propriétaire vérifiable n’est jamais attribuée silencieusement à un compte et reste intacte.

Une commande explicite dans le Profil permet à l’apprenant de transférer uniquement les preuves de leçon et l’onboarding historiques. Elle exclut le nom et l’e-mail historiques, le Journal, le Terminal, les préférences et les événements. L’import est synchronisé au BFF et marqué comme effectué pour le compte concerné. L’historique DDA AI est également séparé par `user_id` et ne se mélange pas entre comptes.

Le Profil propose une déconnexion BFF. Après cette action, l’interface repasse sur l’espace invité et efface les copies d’identité du DOM, sans supprimer le travail enregistré dans le namespace du compte. En cas d’échec réseau, les données locales du compte sont masquées et l’interface indique honnêtement que la fermeture côté serveur n’a pas pu être confirmée. Le garde-fou Premium reste fondé sur l’autorisation serveur; aucune modification du paiement, des webhooks ou des règles d’entitlement BFF n’a été faite.

Les noms de démonstration codés en dur ont été retirés des surfaces de l’Academy, y compris le fallback du certificat; un contrôle de contrat le protège contre leur réapparition.

### Academy, vidéos et pédagogie

Dans la bibliothèque et les leçons YouTube, un lien « Ouvrir sur YouTube » reste disponible en dehors du lecteur intégré, pour contourner les erreurs d’embed, notamment Error 153. Ce repli donne un chemin d’accès, mais ne résout pas à lui seul les restrictions de lecture de chaque vidéo.

DDA AI est relié à `askAI()` côté BFF avec les états déjà prévus pour l’envoi, la disponibilité, les erreurs et l’historique scoped. Les garde-fous restent explicites : assistant d’apprentissage seulement, sans signaux, prédictions ni recommandations d’achat ou de vente. La configuration de la clé Anthropic en production n’a pas été vérifiée dans ce travail.

La leçon BRVM précise maintenant que la capitalisation boursière correspond au nombre d’actions en circulation multiplié par leur cours. Le texte distingue la valeur de marché des fonds propres cotés de la valeur d’entreprise, et rappelle que le remboursement d’une obligation n’est pas garanti en cas de défaut de l’émetteur.

M1.3 dispose désormais d’un schéma SVG accessible présentant les acteurs ainsi que le marché primaire et le marché secondaire, avec la destination correcte des fonds. L’asset est local et n’introduit ni dépendance ni changement du moteur pédagogique.

Le design Deep Navy/Elite, les routes existantes, le Terminal et le Journal ont été conservés. Les tests mobiles couvrent les débordements de l’interface de profil et du site.

## Vérifications finales

- **Playwright : 122 réussis, 0 échec** sur la suite complète du dépôt.
- **Playwright ciblé :** isolation/import/déconnexion BFF 1/1; galerie BRVM 3/3; parcours Premium et Journal après rechargement 1/1; scénarios BFF d’entitlement et DDA AI 5/5. Le scénario de profil vérifie aussi l’absence de débordement à 390 px.
- **Contrats Node :** les 91 scripts `tests/test_*.js` se terminent avec succès.
- **Syntaxe JavaScript :** `node --check` sur `dist/*.js` et `tests/*.js`, sans erreur.
- **Registre et routes :** cohérence réussie; 18 routes et 38 lignes de registre analysées.
- **Contrats ciblés :** stockage scoped, registre pédagogique M1.3/BRVM et interface DDA AI réussis.
- **Assets et diff :** SVG M1.3 valide comme XML; `git diff --check` ne signale aucun problème.

Les messages `INFO [ARCHIVED_TEST_REFERENCE]` observés pendant la suite identifient des références de tests historiques qui ne sont pas des échecs de test.

## Fichiers de la tranche

Les changements couvrent `dist/academy.html`, `dist/app.js`, `dist/bff-client.js`, `dist/dda-core.js`, `dist/dda-lazy-modules.js`, `dist/lesson-renderer.js`, `dist/styles.css`, `dist/alpha-polish.css`, les leçons `dist/m1-3-lesson.js` et `dist/mbrvm-1-lesson.js`, le nouveau schéma `dist/images/lessons/m13-market-actors.svg`, et les contrats `tests/run.js`, `tests/test_profile_storage_scope.js`, `tests/test_lesson_registry.js` et `tests/test_dda_ai_chat_ui_contract.js`.

Le harness Playwright accepte désormais `DDA_TEST_ONLY` pour exécuter un scénario ciblé pendant le diagnostic; sans cette variable, la suite complète s’exécute normalement.

## À valider avant lancement

La suite simulée prouve l’isolation et les chemins fonctionnels, mais ne remplace pas ces contrôles de production : confirmer que `GET /v1/me` renvoie bien le `user_id` canonique; vérifier la configuration de la clé Anthropic et son état honnête lorsqu’elle est absente; confirmer la disponibilité de toutes les vidéos en lecture réelle, notamment celles dont l’embed renvoie Error 153; enfin, refaire une vérification des secrets et des domaines autorisés CORS sur l’environnement de production.

Aucun déploiement, push, commit, fusion de PR ou changement de protection GitHub n’a été effectué. Les modifications restent dans la branche de travail locale indiquée plus haut.
