# DDA — Audit stratégique et technique avant accélération

**Date :** 21 octobre 2026<br>
**Dépôt :** `mbouaricha12/DDA-digital-acad-my-`, branche locale `main`<br>
**Site public contrôlé :** <https://mbouaricha12.github.io/DDA-digital-acad-my-/><br>
**Auteur :** Manus AI<br>
**Statut de la mission :** audit seulement. Aucun fichier applicatif n’a été modifié pour cette analyse; aucun commit, push, déploiement, paiement ou appel réel à un fournisseur financier n’a été effectué. Les corrections de sécurité déjà réalisées dans la tranche précédente sont signalées comme présentes dans l’état local, pas comme publiées.

## Verdict

DDA a déjà une expérience d’apprentissage interactive qui mérite d’être conservée : le parcours authored M0/M1, des exercices et quiz, une progression qui s’appuie sur des validations, un Journal et un Terminal de pratique pédagogique. Le produit va au-delà d’un simple catalogue vidéo, mais la progression et les preuves sont en grande partie locales à l’appareil et ne constituent pas des attestations vérifiables côté serveur.

La prochaine étape la plus utile n’est pas d’ajouter de nouveaux domaines ni de commercialiser AutoTrader. C’est de mettre le parcours Free existant devant de vrais apprenants selon le protocole pilote déjà préparé, de mesurer où ils comprennent et terminent, et de corriger les problèmes reproduits. Le résultat du pilote n’existe pas encore dans les preuves examinées.

Le code local a progressé vers un BFF, des droits d’accès, des quotas, une facturation Chariow préparée et des modules AutoTrader. Toutefois, ces capacités ne sont pas vérifiées de bout en bout sur staging ou en production. La version publique GitHub Pages contrôlée diffère de plusieurs fichiers locaux. En conséquence, ne pas présenter comme opérationnelles les fonctionnalités qui n’existent que dans la branche locale ou dans des tests simulés.

## Partie A — État réel du projet

### Niveaux de preuve à distinguer

- **Local** : présent dans le checkout actuel, qui comprend de nombreux changements non commités et non suivis.
- **Testé localement** : couvert par les contrats Node, les tests BFF ou les tests navigateur exécutés dans le workspace.
- **Site public** : visible dans la réponse actuellement servie par GitHub Pages. Les pages publiques et Academy interrogées répondaient en HTTP 200; plusieurs fichiers critiques ont des empreintes différentes du local.
- **Production de bout en bout** : fonctionnement avec les vrais comptes, services, secrets, données et utilisateurs. **Non vérifié** pour le BFF, Supabase, Chariow et AutoTrader.

### Inventaire

| Composant | État local | Preuve de test local | Public | Production de bout en bout |
|---|---|---|---|---|
| Landing et documents publics | Construits en HTML statique; landing française, pages About, FAQ, Contact, accessibilité, risques, conditions, confidentialité, cookies et mentions légales présentes | Tests structure, accessibilité et parcours landing | Pages interrogées en HTTP 200; dernière modification HTTP de la racine observée au 18 octobre 2026 | Non vérifié au-delà des réponses HTTP publiques |
| Academy / routeur SPA | Vues apprenant, routeur, permissions, composants de cours et modules lazy-loadés présents | Harness Playwright; tests de routes et contrats | `academy.html` public, mais markup/scripts diffèrent des fichiers locaux | Pas de compte ni suivi synchronisé prouvé sur production |
| Curriculum | M0.1–M0.3, M1.1–M1.3 et P2.1/P2.2 présents; modules ultérieurs indiqués comme à venir | Tests golden lesson, M1 et parcours P2 | Plusieurs états publics reposent sur une version antérieure du local actuel | Compréhension et achèvement par de vrais apprenants non vérifiés |
| Exercices, quiz, progression, Journal, Terminal | Parcours jouables; preuves et progression locale dans le prototype | Les tests couvrent la progression, les retries, le handoff Terminal→Journal, la persistance locale et des formats mobiles | Des éléments sont visibles selon la version publiée; parité exacte non établie | Synchronisation multi-appareils, preuves de compétence vérifiables et analytics de cohorte non vérifiés |
| Vidéos | Infrastructure de lecteur/fallback et scripts vidéo documentés; aucun contenu vidéo publié confirmé par l’audit daté | Contrats de contenu et tests d’honnêteté | Aucun inventaire public de vidéos prouvant leur disponibilité | Hébergement, sous-titres, licences et lecture réelle non vérifiés |
| Market Intelligence / Broker Hub | Surfaces pédagogiques et démo, sans preuve d’un flux live ni d’une exécution broker | Contrats UI et tests de garde-fous | Présentation de démonstration dans le prototype | Données de marché live et connexion broker non vérifiées |
| Premium pédagogique | P2.1/P2.2, Risk Plan Lab, assessment et Weekly Review sont disponibles en aperçu local | Parcours Playwright complet P2, preuve locale et Journal | Le site public ne reflète pas nécessairement les changements locaux récents | Paiement, droits Premium et certification officielle non vérifiés; les preuves locales ne sont pas une certification |
| BFF identité/données métier | Modules Node, routes auth, sessions, stores Supabase et contrôles d’origine/CSRF présents | `npm test --prefix bff` passe dans l’environnement de travail | Le déploiement du BFF n’est pas observé sur l’origine Pages | Domaines, secrets, callbacks, DB, monitoring et cycle utilisateur réels non vérifiés |
| Chariow / droits | Traitement de webhooks et transitions de droits présents en code; procédure identifie des événements et limites à confirmer | Tests de stores et payloads simulés | Non visible comme vente opérationnelle vérifiée | Compte marchand, produits, signature réelle, ordre/réessais d’événements et remboursements non vérifiés |
| Supabase | Migrations racines incluant les migrations AutoTrader 0006/0007 et politiques RLS documentées | Inventaire et audit statique passent, 21 déclarations publiques examinées | Pas une preuve de schéma appliqué en ligne | Migration de staging/production, RLS réel, sauvegardes/restauration non vérifiés |
| AutoTrader | Analyse descriptive, règles de risque, backtest, recommandations théoriques, modèle de coût, entitlement/quota et adaptateur Twelve Data présents dans le local | Suites Node dédiées, schémas Draft 2020-12 et tests HTTP avec mocks | Les derniers panneaux et le client fournisseur ne sont pas identiques aux assets publics contrôlés | Pas d’appel Twelve Data réel, instrument et timeframe non décidés, droits de licence et staging non vérifiés |
| IA | Le cahier produit prévoit une intelligence indépendante du fournisseur; le dépôt examiné ne prouve pas un AI Coach de production | Pas de preuve d’une IA publique connectée | Non vérifié comme fonctionnalité publique active | Non vérifié; ne pas commercialiser un coach IA comme actif |
| CI / tests | Plusieurs workflows Actions dont Pages, Product Gate, E2E, CodeQL et RLS; améliorations locales récentes aux workflows | 77 fichiers de tests Node balayés avec succès, BFF, Playwright 59/0, audit launch, RLS statique, migrations, `git diff --check` | Le statut public observé ne prouve pas le résultat du prochain workflow | Résultats de CI GitHub sur les changements locaux non vérifiés tant qu’ils ne sont pas commités et exécutés |

Le checkout local est sur `main`, avec de nombreux fichiers modifiés et non suivis. Aucune remise à zéro, purge, commit, push ou déploiement n’a été faite. Il faut examiner le statut Git et les fichiers non suivis avant toute suite.

## Partie B — Forces et faiblesses

### À conserver

DDA a une identité produit cohérente autour de « comprendre, pratiquer, prouver sa progression ». Le moteur de rendu de leçons est séparé des contenus authored, ce qui permet d’ajouter une leçon sans créer un runtime entièrement différent. Les prérequis, le retry, les exercices et les quiz contribuent à un apprentissage actif. Le Terminal de pratique et le Journal créent un pont entre observation et réflexion plutôt que de se limiter à regarder une leçon.

Les garde-fous éditoriaux constituent une force : les scénarios synthétiques sont étiquetés, les surfaces de démonstration ne prétendent pas fournir des cours live, l’aperçu Premium local n’est pas confondu avec une vente active, et le produit ne promet pas de gains. Les contrats et les tests navigateur soutiennent les parcours et la réactivité mobile.

### À corriger ou compléter

La distinction entre « preuve pédagogique dans ce navigateur » et « compétence vérifiée » doit rester visible dans toute offre. Le stockage local ne synchronise pas l’apprenant entre appareils et peut être modifié par lui. Les vidéos, la communauté native, l’IA active et plusieurs domaines sont encore absents ou futurs. Ces absences ne sont pas des défauts s’il s’agit de choix assumés, mais deviennent un risque si la landing ou le discours commercial laisse croire qu’elles sont opérationnelles.

La parité entre code local et site public est un enjeu immédiat. Le site public sert une version différente de plusieurs assets essentiels. Les corrections récentes ne doivent pas être considérées comme disponibles aux apprenants avant merge, workflow Pages réussi et contrôle des fichiers servis.

L’instrumentation d’acquisition mesure certains événements de funnel, mais elle ne démontre pas l’usage réel, la rétention ou la volonté de payer. La suite automatisée vérifie que le code se comporte selon le contrat; elle ne mesure pas si les explications sont comprises.

La politique de confidentialité du site décrit des données locales et des traitements futurs possibles. Tout déploiement du BFF/analytics doit être accompagné d’un inventaire réel des données collectées, de la finalité, du stockage, de la durée, des sous-traitants et des options de suppression. Les informations juridiques de l’éditeur restent provisoires selon les mentions observées.

## Partie C — Valeur pour l’apprenant

### Public le mieux soutenu par le contenu actuel

Le parcours observé correspond d’abord à des apprenants francophones débutants ou peu expérimentés qui veulent acquérir des bases de lecture des marchés. M0 couvre des notions fondamentales; M1 introduit des mécanismes de marché, les ordres et les acteurs. P2.1/P2.2 approfondissent la discipline avant une décision, mais seulement en démonstration locale. Le dépôt ne fournit pas de données d’audience permettant de confirmer la taille, la localisation, le niveau ou les besoins d’un public réel.

### Résultat d’apprentissage vérifiable dans le prototype

Un apprenant peut terminer des leçons, répondre à des exercices et quiz, retry après une erreur, pratiquer l’identification de zones dans un Terminal pédagogique et consigner sa réflexion dans le Journal. L’application peut refléter localement les étapes terminées et un prochain élément du parcours. Les tests démontrent que ces interactions se déroulent comme codées; ils ne démontrent pas que l’apprenant a transféré cette compétence à un marché réel ni qu’il a obtenu une performance financière.

La meilleure preuve pédagogique actuellement disponible est une trace locale liée à une réponse, une mission ou une entrée de Journal. Pour démontrer davantage, DDA devra définir des tâches observables et des rubriques de correction : par exemple, l’apprenant explique la différence entre un ordre marché et un ordre limite, justifie une zone à partir d’éléments précis, ou documente une invalidation dans un scénario synthétique. Ces exemples sont des propositions d’évaluation, pas des résultats mesurés.

### Causes probables de friction à tester, pas à présumer

Le fait que la progression soit locale peut surprendre l’utilisateur qui change d’appareil ou vide son navigateur. Les notions techniques, le vocabulaire franco-anglais, la longueur des écrans et la disponibilité d’une connexion mobile peuvent aussi influer sur l’expérience, mais aucune observation terrain n’est fournie ici. Il faut les tester par observation plutôt que les présenter comme des problèmes avérés.

Le protocole de pilote préparé dans `docs/DDA_FREE_PILOT_CHECKLIST_2026-10-16.md` est une bonne base : 5–8 apprenants, principalement débutants, plusieurs appareils, observation sans expliquer la solution, et 3–7 jours d’usage libre. Il demande de ne pas collecter de données bancaires, de mots de passe ou de documents d’identité.

### Valeur susceptible de justifier un paiement

La valeur payante ne peut pas être confirmée par inspection du code. Une hypothèse raisonnable à tester serait l’accompagnement plus structuré autour de la discipline de risque : progression guidée, scénarios, correction, ressources réutilisables et revue pédagogique. Le code Premium actuel peut servir de prototype de contenu, mais il n’établit ni l’intention de payer ni le modèle de droits, ni la conformité nécessaire à l’encaissement.

## Partie D — Architecture cible

Conserver un noyau commun plutôt que créer cinq applications : identité et sessions côté serveur, profil, progression, catalogue de contenu, entitlement, billing, quotas, notifications, support et audit. À court terme, ne pas synchroniser toutes les traces pédagogiques sans une décision sur consentement, rétention et export; garder une séparation claire entre les données locales et les données de compte serveur.

Les domaines doivent être des partitions de navigation et de droits, pas des doublons de comptes ou de paiement :

- **DDA Skills / App apprenant** : cœur actuel le plus concret, avec parcours, leçons, exercices, quiz, progression, Journal et ressources.
- **Trading & Financial Markets** : contenu M0/M1 réel et AutoTrader comme expérimentation distincte. Toute donnée marché doit suivre son entitlement, sa source et ses droits propres. AutoTrader ne doit pas être assimilé à un compte broker ni à un service d’exécution.
- **DDA AI Lab** : ne l’ouvrir que lorsqu’un assistant réel a une fonction définie, des limites, un modèle de données et une évaluation. L’IA ne doit pas inventer les cotations, les corrections ou les résultats.
- **DDA Business** : aucun produit métier autonome suffisamment démontré par les parcours inspectés. Évaluer par entretiens et prototypes avant un domaine actif.
- **DDA Automation** : différencier clairement l’enseignement de l’automatisation d’un service d’automatisation disponible. Ne pas lancer de promesse de bots opérationnels sur la base de pages de vision.

Le futur écosystème Expert (création de cours, gestion d’étudiants, paiements, analytics et marketplace) est indiqué comme non construit dans `DDA_INFORMATION_ARCHITECTURE_TARGET.md`. Garder cette branche en roadmap. L’activer exigerait rôles multi-parties, gouvernance de contenu, paiements, protection contre abus, support et contrôles de qualité.

## Partie E — Priorités

### P0 — Intégrité, sécurité, frontières de vérité

**P0.1 — Préserver et intégrer le travail local de façon revue.** Constat : la branche `main` contient des changements locaux et de nombreux fichiers non suivis; le public diffère du local. Preuve : `git status` de la session et empreintes HTTP des assets. Impact : un audit peut décrire des fonctionnalités absentes du site et des fichiers oubliés à la livraison. Action : inventaire, revue fichier par fichier, branche/PR dédiée, checks CI. Acceptation : aucun changement non compris; fichiers nouveaux explicitement suivis; CI verte; diff public revérifié après merge. Dépendances : décision du propriétaire sur l’ordre de merge. Vérification : `git status`, liste des fichiers PR, workflows GitHub, requête HTTP des assets déployés. Risque : élevé si un déploiement part d’un état incomplet.

**P0.2 — Isoler staging de production.** Constat : aucun environnement de staging réel n’a été examiné. Impact : tests de webhook ou de migrations pourraient toucher des données commerciales réelles. Action : projet Supabase et BFF distincts, origines dédiées, secrets de staging uniquement dans le gestionnaire de secrets. Acceptation : vérification écrite que chaque URL/clé vise le staging, tests sans données réelles, procédure de retour arrière connue. Dépendances : accès autorisés de l’exploitant et choix d’hébergeur. Vérification : contrôle des variables expurgées, endpoints health, projet Supabase cible, aucun secret dans logs/client/dépôt. Risque : très élevé en cas de mélange.

**P0.3 — Maintenir l’exécution de trading interdite.** Constat : les modules locaux décrivent propositions non soumises; aucune intégration d’exécution réelle n’est validée. Impact : confusion entre indicateur et ordre réel pourrait causer un préjudice financier. Action : garder `execution_enabled=false`, aucun credential de broker et aucun endpoint d’écriture; afficher les avertissements à proximité des données. Acceptation : les tests et revue statique confirment l’absence d’appel transactionnel et l’UI mentionne clairement « pédagogique/simulation ». Dépendances : aucune pour préserver la limite actuelle. Vérification : tests de contrats, revue des routes et scripts de build. Risque : très élevé si la frontière est rompue.

**P0.4 — Verrouiller droit et facturation côté serveur avant accès payant.** Constat : entitlements et transitions sont préparés, mais événements Chariow et ordre de livraison restent à confirmer; le renouvellement désactivé n’est pas équivalent à une expiration. Preuve : `DDA_AUTOTRADER_REVOCATION_V1.md` et tests simulés BillingStore. Impact : accès injustifié ou révocation incorrecte. Action : confirmer schémas d’événements signés, dates d’effet, annulation à échéance, remboursement et ordre; protéger contre ancienne activation après révocation. Acceptation : tests staging signés montrent achat, renouvellement, expiration, annulation, remboursement, doublon, retry et désordre sans accès fantôme. Dépendances : mode sandbox fournisseur, produits configurés, identité légale et offre définie. Vérification : journal d’événements expurgé et lecture des entitlements côté serveur. Risque : élevé.

### P1 — Indispensable à une première offre fiable

**P1.1 — Exécuter le pilote Free avant de bâtir de nouvelles offres.** Constat : la checklist existe, résultats terrain absents. Impact : développer à l’aveugle et manquer les difficultés de compréhension. Action : recruter le panel pilote selon le protocole existant; observer utilisateurs sans les guider, inclure téléphone et ordinateur. Acceptation : résultats par étape, incompréhensions récurrentes, erreurs, retours et décisions documentés; aucun chiffre marketing non consenti. Dépendances : version de site connue et consentement des participants. Vérification : fiches du pilote, anomalies reproduites en tests. Risque : moyen.

**P1.2 — Décider les droits de données avant activation Twelve Data.** Constat : clé, allowlist et licence restent non renseignées; instrument, venue/MIC et timeframe non choisis. Preuve : `docs/DDA_TWELVE_DATA_READONLY_RESEARCH.md` et configuration d’exemple désactivée. Impact : coût/quota ou affichage non autorisé, ou horodatages/volumes erronés. Action : obtenir confirmation écrite des droits, choix instrument, place, intervalle et sémantique; documenter les conversions des bougies et préciser volume non vérifié si nécessaire. Acceptation : revue de licence, fixtures exactes, métadonnées retournées cohérentes et réponses fail-closed en staging. Dépendances : décision propriétaire et fournisseur. Vérification : tests fixtures/documentation + une recette lecture seule autorisée seulement après approbation. Risque : élevé.

**P1.3 — Réconcilier Supabase et prouver les politiques en staging.** Constat : audit RLS local couvre 21 tables; migrations non prouvées appliquées. Impact : différences entre migrations et base peuvent créer faille d’accès ou indisponibilité. Action : appliquer migrations 0001–0007 dans l’ordre au staging, comparer le schéma, vérifier accès anon/auth/service. Acceptation : navigateur ne peut lire/écrire billing, entitlement ou quota; service BFF réalise uniquement opérations attendues. Dépendances : accès staging protégé. Vérification : audit distant depuis contexte admin séparé; journal des résultats; rollback prêt. Risque : élevé.

**P1.4 — Vérifier export/suppression, support et résilience.** Constat : stores et textes de politique existent, mais opérations réelles et sauvegardes ne sont pas confirmées. Impact : incapacité à traiter une demande, perdre une progression serveur ou gérer un incident. Action : tester export et suppression compte sur staging, définir rétention, contact support, sauvegarde/restauration et alertes BFF. Acceptation : demande test clôturée avec preuve, restauration de test réussie et incident/owner identifiés. Dépendances : système de déploiement réel et politique de données. Vérification : exercices planifiés; comptes et traces de staging. Risque : élevé avant ventes.

### P2 — Expérience, acquisition, conversion

**P2.1 — Renforcer la découvrabilité page par page.** Constat : pages publiques statiques et titles/descriptions existent, mais les pages contrôlées n’ont pas toutes les métadonnées de partage/canonical; l’inventaire local n’indique pas de sitemap/robots dédié. `dist/index.html` porte des contenus significatifs; les pages Academy privées/de compte ne doivent pas être indexées. Impact : partage social/recherche irrégulier et possibilité d’indexation mal cadrée. Action : définir les URLs publiques, canonicals absolues, `og:url`, sitemaps et robots cohérents; vérifier les réponses publiques brutes et vrais codes HTTP. Acceptation : chaque page indexable a corps HTML, title, description, OG, canonical corrects; Academy privée est exclue; routes inconnues renvoient un vrai 404. Dépendances : domaine canonique stable et hébergement capable de servir les fichiers nécessaires. Vérification : inspection curl/crawler. Risque : modéré.

**P2.2 — Simplifier le premier résultat apprenant.** Constat : la proposition Free affiche plusieurs fonctions et outils; le parcours complet va de l’accès au Journal. Impact : choix multiples peuvent nuire au démarrage, mais cela reste une hypothèse. Action : observer si les nouveaux apprenants trouvent immédiatement le premier exercice et comprennent la prochaine étape. Acceptation : résultats d’observation et modification seulement si un problème se répète; critères définis après baseline, pas avant. Dépendances : pilote. Vérification : observation et test de régression, métriques de démarrage/achèvement.

**P2.3 — Mettre les limites au bon endroit.** Constat : la landing indique l’accès Free et le statut pédagogique/synthétique; la progression est locale. Impact : l’utilisateur peut surestimer synchronisation, certification ou présence de données live. Action : afficher le statut local, l’absence de vidéos/live et la nature non certifiante dans les moments de décision, pas seulement dans les pages légales. Acceptation : participants reformulent correctement les limites lors du pilote. Dépendances : tests utilisateurs. Vérification : réponses de compréhension, audit de la version publique.

### P3 — Fonctionnalités à différer

**P3.1 — Différer les cinq nouveaux domaines comme produits autonomes.** Constat : Skills/Trading sont amorcés; AI Lab, Business et Automation sont principalement des pistes ou de la vision; le portail Expert est futur. Impact : fragmentation et doublons avant validation du noyau. Action : conserver une seule identité, navigation/domaines documentaires et services transversaux; créer une nouvelle offre seulement quand elle a un public, une tâche et des preuves d’usage. Acceptation : décision produit par domaine avec owner, persona validée, contenu fonctionnel et coût d’exploitation. Dépendances : données du pilote/entretiens. Vérification : roadmap et architecture, pas simple présence d’une tuile.

**P3.2 — Différer MT5, IA de trading et paper simulator événementiel avancé.** Constat : pas de connexion MT5, pas de simulateur paper événementiel ni de kill switch global câblé selon la charte. Impact : les lancer maintenant multiplierait les risques et les prérequis. Action : maintenir hors du premier lancement; formaliser les contrats et critères seulement après preuve d’usage de l’apprentissage de base. Acceptation : démonstration sans écriture broker, métriques de simulation causales et arrêt testable avant toute extension future. Dépendances : revue de sécurité et décisions produit distinctes. Vérification : contrats de simulation et vérification de kill switch. Risque : élevé si accéléré sans preuves.

## Partie F — Première offre phare

Trois pistes au plus, sans prix ni intention d’achat présumés :

1. **Pilote DDA Free — recommandation immédiate pour la validation.** Public : débutants francophones souhaitant comprendre les marchés. Problème : apprentissage dispersé sans pratique structurée. Résultat possible : terminer M0/M1, réussir des tâches pédagogiques et tenir un Journal sur leur appareil. Disponible : parcours, exercices, quiz, progression locale et protocole d’essai. Manque : tests utilisateurs, persistance multi-appareils si nécessaire, suivi de complétion réel et contenu vidéo réel. Test : pilote de 5–8 participants préparé dans la checklist. Cette option est la plus justifiée par les capacités existantes, mais ce n’est pas une offre payante.
2. **Parcours Premium de discipline et pratique guidée — hypothèse à tester, non à vendre maintenant.** Public : apprenants ayant terminé les fondations et souhaitant organiser leurs décisions. Problème : appliquer une méthode de risque à un scénario. Résultat visé : produire un plan pédagogique cohérent, expliquer invalidation et risque, puis faire une revue. Disponible : P2.1/P2.2, Risk Plan Lab et Controlled Decision en démo locale. Manque : validation pédagogique terrain, droits payants réels, persistance vérifiable, revue légale, prix/devise/conditions et support. Test : présenter un prototype sans paiement, demander d’abord de réaliser une tâche et recueillir ensuite l’intérêt à payer sans le compter comme achat.
3. **Atelier/kit de ressources téléchargeables sur l’observation et le Journal — hypothèse de faible coût.** Public : personnes qui veulent une activité brève et réutilisable sur mobile ou connexion limitée. Problème : démarrer la pratique sans s’engager dans un long parcours. Disponible : exercices et modèles pédagogiques dans l’app, Journal et scripts vidéo documentés. Manque : ressources exportables/accessibles hors connexion, test de compréhension, formats bilingues/localisés si le besoin est confirmé. Test : offrir une fiche gratuite et suivre l’usage volontaire avec consentement; interviewer les participants, sans fabriquer taux de téléchargement ou demande.

**Choix recommandé :** ne pas choisir maintenant une offre payante phare. Choisir le pilote Free comme prochain livrable expérimental, puis utiliser les difficultés et demandes spontanées observées pour sélectionner, ou rejeter, la piste Premium. Le dépôt ne prouve pas que les apprenants paieraient pour AutoTrader ou P2.

## Partie G — Plan de validation sur 30 jours

Ce plan est une proposition, pas un calendrier déjà engagé. Les objectifs de départ et les résultats observés sont actuellement **non disponibles**; établir une baseline au jour 0.

### Jours 1–5 : rendre l’essai fiable et recruter

Geler une version identifiée du site à tester; vérifier que l’URL cible et le parcours fonctionnent. Recruter le panel prévu de 5–8 participants débutants ou peu expérimentés, avec au moins deux téléphones et un ordinateur selon disponibilité. Expliquer que la progression reste sur l’appareil, que les exemples sont pédagogiques et qu’il n’y a pas de trading live. Recueillir seulement les données nécessaires avec consentement.

Indicateurs à instrumenter manuellement : personnes invitées/acceptant, appareil/navigateur, démarrage sans aide, première étape atteinte et blocages. Valeur de départ : à mesurer, pas présumée.

### Jours 6–12 : observer les tâches

Observer la landing, l’inscription/onboarding, M0.1, M0.2/Terminal, M0.3, une leçon M1, Progression et Journal. Ne pas donner la solution avant que le participant manifeste un blocage. Consigner la tâche, la première hésitation, les mots non compris, le nombre d’aides et les erreurs techniques. Séparer problèmes de compréhension, contenu, interface et technique.

Indicateurs : taux de démarrage effectif; complétion par étape; réussite d’un exercice sans aide; demandes d’aide; reprises; participants qui créent une entrée Journal; participants qui comprennent que la progression est locale et que les exemples ne sont pas des signaux. Aucun seuil marketing ne doit être fixé avant baseline.

### Jours 13–19 : usage libre et correction

Laisser une fenêtre libre de 3–7 jours telle que recommandée par le protocole. Demander aux participants de revenir sans incitation à investir. Noter s’ils retrouvent leur progression sur le même appareil, s’ils terminent le parcours et quelles ressources manquent. Regrouper les anomalies, corriger seulement les problèmes reproduits, puis écrire un test pour les régressions importantes.

Indicateurs : retour volontaire, continuation du parcours, achèvement, retour au Journal, problème récurrent par appareil. Les résultats doivent inclure le nombre brut de participants et les limites de l’échantillon; ne pas en déduire une demande marché générale.

### Jours 20–25 : tester la valeur et l’offre sans encaissement

Présenter une seule hypothèse payante à la fois sous forme de prototype descriptif, après une tâche gratuite. Demander ce que le participant ferait ensuite, ce qui lui manque, ce qu’il pense obtenir et s’il envisagerait de payer; distinguer une intention déclarée d’un achat réel. Ne pas annoncer de prix sans décision de l’éditeur, ne pas collecter de paiement et ne pas faire croire à une offre ouverte.

Indicateurs : compréhension de la promesse, demandes spontanées, obstacles à l’usage, intention déclarée, objection principale. Le nombre de « oui » ne prouve pas une volonté de payer; la preuve éventuelle nécessiterait une offre réelle, cadre légal, politique de remboursement et système de paiement prêt.

### Jours 26–30 : synthèse et décision

Présenter les résultats avec les méthodes et dénominateurs. Décider : poursuivre Free et améliorer; préparer un test Premium non payant; ou suspendre le domaine AutoTrader jusqu’à la résolution des licences et du staging. N’annoncer ni résultats financiers ni preuve de compétence certifiée. Définir une nouvelle mission sur les anomalies les plus fréquentes et un seul résultat produit.

Tableau d’indicateurs à conserver : visites/invitations de l’essai, inscriptions/démarrages, exercices commencés/réussis, achèvements, Journal créé, retours sur 3–7 jours, demandes d’aide, intention déclarée et paiement seulement s’il est légalement et techniquement autorisé. **Aucune de ces valeurs n’est observée à ce jour dans l’audit.**

## Partie H — Décisions à prendre

1. Confirmer que la prochaine priorité est le pilote Free et nommer la personne responsable de le conduire et d’analyser les retours.
2. Décider la politique de progression : locale seulement pour le pilote ou synchronisée plus tard; définir les données, consentements, export, suppression et durée de conservation.
3. Clarifier les domaines actifs et ceux qui restent des pistes; ne pas transformer AI Lab, Business, Automation ou Expert en offres avant validation.
4. Pour une future offre Premium, choisir public, résultat livré, contenus, mode de support, droits/entitlements et conditions; prix, devise et fréquence ne sont pas connus ici.
5. Pour AutoTrader, décider si l’analyse de données marché est encore prioritaire; si oui, choisir symbole Twelve Data, place/MIC, devise et timeframe intrajournalier et obtenir l’autorisation contractuelle écrite d’affichage externe avant activation.
6. Nommer l’entité juridique et la juridiction de vente, et obtenir une revue compétente des conditions, remboursements, confidentialité et obligations applicables.
7. Choisir l’hébergement et les responsables du BFF/Supabase; séparer les environnements, organiser secrets, sauvegarde, surveillance, réponse incident et rotation de clés.
8. Fixer le seuil d’acceptation du pilote après observation initiale, et distinguer les métriques produit des métriques marketing.

## Conclusion demandée

### 1. Que possède déjà DDA qui mérite d’être conservé ?

Le noyau pédagogique interactif : parcours M0/M1 authored, exercices/quiz avec retries, progression, Journal et Terminal de pratique, plus le moteur de rendu réutilisable et les contrats/tests qui protègent le comportement. Les garde-fous d’honnêteté sur les démos, le local, les vidéos absentes et les fonctions futures doivent rester.

### 2. Quels sont les trois risques ou blocages les plus importants ?

D’abord, le décalage entre l’état local et la version publique, aggravé par des changements locaux non intégrés. Ensuite, l’absence de validation terrain réelle de la compréhension et de la complétion, alors que la valeur commerciale demeure hypothétique. Enfin, la non-validation des services payants et AutoTrader en environnement réel : migrations/RLS, événements de facturation, licences de données, instrument et droit serveur. L’identité juridique provisoire constitue également un blocage de vente.

### 3. Quel est le plus petit produit crédible à valider auprès de vrais utilisateurs ?

Le parcours Free de fondations de marchés, avec M0/M1, un exercice, un quiz, une pratique synthétique, une trace Journal et une progression clairement locale. Il est déjà assez concret pour observer un résultat pédagogique; il ne doit pas être présenté comme une certification ou un conseil financier.

### 4. Quelles actions faut-il éviter ?

Éviter de construire simultanément cinq nouveaux domaines, de présenter Premium ou AutoTrader comme déjà vendu/opérationnel, de développer MT5 ou l’exécution réelle, d’activer Twelve Data avant confirmation de licence et paramètres instrument, d’inventer prix ou statistiques, d’ajouter une IA qui fabrique des données, ou de déployer les changements locaux sans revue et vérification de la parité publique.

### 5. Quelle est la prochaine mission de développement la plus utile ?

Exécuter le pilote Free préparé, sans extension majeure du produit. La mission doit livrer des observations anonymisées par étape, les incompréhensions répétées, les problèmes mobiles/techniques, une décision sur les améliorations et des tests de non-régression. Après cette preuve d’usage, choisir une seule hypothèse Premium à tester. Le chantier staging AutoTrader peut progresser en parallèle seulement après décisions de licence/instrument et de configuration, sans retarder le pilote apprenant.

## Références locales

- `docs/DDA_COMPLETE_AUDIT_2026-10-15.md` — inventaire pédagogique, vidéo, Free/Premium et limites de persistance.
- `docs/DDA_LAUNCH_PREPARATION_REPORT_2026-10-16.md` — protocole pilote Free, scripts vidéo et checklist Premium.
- `docs/DDA_FREE_PILOT_CHECKLIST_2026-10-16.md` — tâches observables et fiche de retour des participants.
- `DDA_INFORMATION_ARCHITECTURE_TARGET.md` — domaines actuels et futurs, sans activation prématurée.
- `DDA_MASTER_BUILD_REGISTER.md` — registre d’état et avertissements sur les preuves historiques de tests.
- `docs/DDA_AUTOTRADER_PRODUCT_CHARTER.md` — périmètre AutoTrader, règles de risque et jalons.
- `docs/DDA_TWELVE_DATA_READONLY_RESEARCH.md` — configuration fournisseur, paramètres et licence à confirmer.
- `docs/DDA_AUTOTRADER_REVOCATION_V1.md` — limites des transitions Chariow et révocation.
- `tests/run.js`, `tests/test_launch_final_audit.js`, `bff/package.json`, `.github/workflows/` — preuves locales de test et CI.
- `dist/index.html`, `dist/academy.html`, `dist/manus-routes.json` — surface publique et application locale.
