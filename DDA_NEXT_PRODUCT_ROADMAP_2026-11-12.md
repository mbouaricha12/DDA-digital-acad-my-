# DDA — Feuille de route produit suivante

**Date :** 12 novembre 2026  
**Base documentaire :** `DDA_Cahier_des_Charges_Produit_OS_V1.md`, `DDA_PRODUCT_MASTER_BLUEPRINT_V2.md`, `docs/DDA_AUDIT_GLOBAL_BASELINE_2026-11-09.md`, `docs/DDA_UX_TRANSFORMATION_AUDIT_2026-11-10.md`  
**État de référence :** Academy Free fonctionnelle en mode local ; Premium en aperçu ; BFF/auth préparés mais environnement distant non certifié ; données de marché, paiement réel et IA de production non activés.

## 1. Décision de reprise

DDA ne doit pas poursuivre par accumulation de pages ou de fonctionnalités futures. La prochaine séquence doit renforcer la boucle qui différencie réellement le produit :

> **Comprendre → observer → manipuler → décider pédagogiquement → recevoir un feedback → conserver une preuve → voir sa compétence progresser → documenter son raisonnement → revenir.**

Les couches restent séparées :

1. **Produit :** valeur, parcours, règles d’accès et critères de réussite.
2. **UX/UI :** hiérarchie, orientation, états, feedback et cohérence visuelle.
3. **Architecture :** stockage, API, droits serveur, observabilité et migrations.

Aucune fonctionnalité Premium commerciale, donnée réelle, IA décisionnelle ou affiliation ne doit être activée simplement parce qu’une route ou un composant existe déjà dans le dépôt.

## 2. État actuel utile à la planification

### Déjà exploitable

- Landing et pages publiques structurées.
- Academy Free avec M0/M1 authored, exercices, quiz, feedback et progression.
- Parcours, leçons, Journal, Plan, Progression, Ressources et Profil.
- Terminal pédagogique avec scénario synthétique et mission de pratique.
- Premium Track, Risk Plan Lab, évaluation et preuve locale en aperçu.
- BFF/auth, routes d’accès, contrôles de rôles et audit d’accès préparés.
- Contrats structurels, smoke tests et audits navigateur présents dans le dépôt.

### Encore partiel ou non certifié

- Progression principalement locale ; pas de synchronisation multi-appareils certifiée.
- Entitlements Premium réels, paiement et cycle de révocation non activés.
- Market Intelligence éditoriale, sans flux de marché réel confirmé.
- IA pédagogique dépendante de la configuration fournisseur et de la gouvernance des données.
- Back-office de comptes et d’accès, mais pas encore CMS pédagogique complet.
- Community, Credentials partageables, Trader DNA, Trading Lab complet et Broker/Affiliation non activés.

## 3. Ordre recommandé des prochaines tranches

### Tranche 0 — Clôture de stabilisation et confiance

**But produit :** rendre l’expérience actuelle suffisamment claire et rassurante avant d’ajouter une nouvelle capacité visible.

**Périmètre :**

- intégrer et vérifier les PR de stabilisation ouvertes (#242, #244, #246) après passage de tous les checks ;
- supprimer ou déplacer les mentions techniques répétées du Dashboard : « local », « prototype », « démo », « stockage » ;
- conserver les disclosures nécessaires, mais dans un emplacement secondaire et cohérent ;
- maintenir une identité neutre tant que l’identité réelle n’est pas confirmée ;
- rendre distincts les états **Disponible maintenant**, **Aperçu**, **Bientôt** et **Réservé** ;
- vérifier le chemin Landing → Access → Academy → première action sur mobile et desktop.

**Critères de sortie :**

- chaque vue principale possède un titre, une action primaire et une sortie claire ;
- aucune identité codée en dur n’est montrée comme identité confirmée ;
- Free, Premium aperçu, Premium serveur, visiteur et administrateur restent visuellement distincts ;
- tests contractuels, E2E, accessibilité, mobile et performance passent ;
- aucune donnée ni route fonctionnelle n’est supprimée.

**Ne pas faire dans cette tranche :** paiement, nouvelle IA, communauté, données live ou refonte d’architecture.

### Tranche 1 — Terminal Foundation : fermer la boucle pédagogique

**But produit :** transformer le Terminal actuel en première expérience propriétaire DDA réellement différenciante, sans devenir un clone de TradingView.

**Périmètre produit :**

- instrument pédagogique et timeframe explicitement identifiés ;
- série historique synthétique ou contrôlée, avec statut clairement affiché ;
- zoom, déplacement, crosshair et annotations ;
- outils limités : zone support/résistance, ligne, Fibonacci pédagogique ;
- mission guidée : contexte → observation → hypothèse → invalidation → justification ;
- feedback explicable et non financier ;
- sauvegarde d’une observation dans le Journal ;
- preuve reliée à la leçon source et à la Progression.

**Contrat de données minimal :**

- `scenario_id` et `scenario_version` ;
- `source_lesson_id` ;
- `dataset_status` : `synthetic`, `controlled`, `licensed_real` ;
- outils et annotations ;
- décision pédagogique ;
- feedback ;
- preuve générée ;
- timestamp et statut de sauvegarde.

**Critères de sortie :**

- une mission complète est réalisable sur mobile sans débordement ;
- le résultat simulé est séparé de la qualité du processus ;
- le score éventuel est explicable, versionné et contestable ;
- aucune formulation ne ressemble à un signal ou à une recommandation d’achat/vente ;
- le handoff Terminal → Journal → Progression est testé par navigateur.

**Dépendances :** aucune donnée de marché réelle ; réutilisation du moteur de progression et du Journal existants.

### Tranche 2 — Progression structurée et Skill Graph léger

**But produit :** montrer ce que l’apprenant maîtrise, ce qu’il construit et pourquoi une activité lui est proposée.

**Périmètre :**

- taxonomie initiale limitée aux compétences réellement couvertes par M0/M1 et le Terminal ;
- relation leçon → activité → feedback → preuve → compétence ;
- niveaux simples : non commencé, en construction, pratiqué, consolidé ;
- preuve utilisée, date, version de la règle et niveau de confiance ;
- prochaine pratique recommandée avec justification courte ;
- correction ou contestation d’une preuve locale ;
- séparation stricte entre preuve pédagogique et statut de stockage.

**Critères de sortie :**

- aucun score n’est présenté comme diagnostic psychologique ou financier ;
- aucune compétence n’est affichée sans preuve déterministe ;
- la recommandation « parce que… » est compréhensible ;
- les états vides conduisent vers une action utile ;
- les tests couvrent migration de l’état local et absence de régression des anciennes leçons.

**Hors périmètre :** Trader DNA, profil psychologique, IA de recommandation et badge public.

### Tranche 3 — Identité serveur et synchronisation multi-appareils

**But produit :** permettre à un apprenant authentifié de retrouver son parcours sans perdre la clarté du mode local.

**Préconditions obligatoires :**

- projet Supabase de staging identifié ;
- migrations relues et appliquées dans un environnement isolé ;
- URL HTTPS du BFF ;
- secrets configurés uniquement côté serveur ;
- origine, cookies, CSRF, rate limiting et logs vérifiés ;
- politique de conservation, export et suppression validée.

**Périmètre :**

- création de compte, connexion, déconnexion, confirmation e-mail et récupération ;
- lecture et écriture des données du seul utilisateur connecté ;
- import explicite de la progression locale vers le compte ;
- synchronisation Journal, Plan, progression et préférences ;
- stratégie de conflit documentée ;
- distinction visible entre synchronisé, local/hors ligne et synchronisation indisponible ;
- export lisible et suppression des données testée.

**Critères de sortie :**

- deux appareils de test retrouvent le même état après authentification ;
- un compte ne peut jamais lire les données d’un autre ;
- une panne BFF ne devient pas silencieusement un succès local ou Premium ;
- déconnexion, expiration, suppression et export sont couverts par E2E ;
- le mode local reste utilisable sans contourner les droits serveur.

### Tranche 4 — Premium serveur, mais uniquement après décision commerciale

**Cette tranche est bloquée par des décisions du propriétaire DDA.** Aucun checkout réel ne doit être activé avant réception et validation des éléments externes.

**Décisions requises :**

- nom public et contenu exact de l’offre ;
- périodicité, prix, devise, taxes et politique de remboursement ;
- identité légale, juridiction et conditions commerciales ;
- produit Chariow et identifiant réel ;
- URL BFF et domaine définitifs ;
- secret webhook et procédure de test ;
- politique de conservation, suppression et support.

**Périmètre technique futur :**

- checkout sandbox ;
- webhook signé et idempotent ;
- activation, expiration, suspension, remboursement et révocation ;
- entitlement calculé côté serveur ;
- ressource Premium protégée côté serveur, jamais par CSS ou `localStorage` ;
- E2E des événements valides, invalides, dupliqués et hors ordre.

**Go/no-go :** tant qu’une seule condition critique manque, DDA reste en **pilote Free** et **aperçu Premium local**.

### Tranche 5 — Market Intelligence éditoriale contrôlée

**But produit :** donner une raison pédagogique de revenir sans créer un flux de signaux.

**Avant développement :**

- choisir les sources autorisées ;
- vérifier licence de redistribution ;
- définir fréquence, fuseau, fraîcheur et responsabilité éditoriale ;
- définir un schéma de provenance et un workflow de validation ;
- décider si la première version est manuelle, semi-automatique ou connectée à un fournisseur.

**Unité éditoriale :**

1. fait observé ;
2. pourquoi c’est important ;
3. notion à comprendre ;
4. leçon ou activité DDA associée.

**Critères de sortie :**

- source, date, fuseau et fraîcheur visibles ;
- fait, interprétation et exercice séparés ;
- aucun titre ou CTA ne ressemble à une alerte de trading ;
- un brief ouvre une leçon ou une mission réellement disponible ;
- aucune valeur réelle n’est remplacée silencieusement par une donnée synthétique.

### Tranche 6 — IA pédagogique sous gouvernance

**À différer jusqu’à ce que les tranches 1 à 3 fournissent des preuves propres et un consentement clair.**

L’IA pourra :

- expliquer une erreur ;
- poser une question de révision ;
- comparer deux scénarios pédagogiques ;
- aider à formuler une entrée de Journal ;
- proposer une activité déjà autorisée par le curriculum.

Elle ne pourra jamais :

- produire un signal ;
- recommander un actif à acheter ou vendre ;
- exécuter une transaction ;
- transformer un score en diagnostic financier ou psychologique ;
- modifier directement une preuve officielle sans validation déterministe.

## 4. Fonctionnalités volontairement repoussées

Les éléments suivants ne doivent pas devenir les prochaines tâches d’implémentation :

- Community native et chat temps réel ;
- marketplace d’experts/formateurs ;
- affiliation broker et classement commercial ;
- Trading Lab/backtesting complet ;
- Trader DNA ;
- Risk Passport public ;
- Proof of Skill partageable ;
- crypto research lab complet ;
- B2B/cohortes multi-tenant ;
- données live BRVM ou Forex sans licence et provenance validées.

Ils peuvent rester dans la vision, mais ne doivent pas être présentés comme disponibles.

## 5. Ordre opérationnel immédiat

1. Attendre les checks finaux des PR #242, #244 et #246, puis vérifier leur contenu après éventuelle fusion.
2. Mettre à jour le registre de reprise avec les commits effectivement intégrés à `main`.
3. Exécuter la Tranche 0 : confiance, orientation et statuts d’état.
4. Faire valider la Tranche 0 avant de toucher à la prochaine fonctionnalité produit.
5. Construire ensuite la Tranche 1 : Terminal Foundation et handoff complet vers Journal/Progression.
6. Préparer en parallèle uniquement les décisions et schémas de la Tranche 3 ; ne pas activer l’auth serveur sans environnement de staging certifié.

## 6. Décisions à obtenir du propriétaire avant activation commerciale

- Quelle offre doit être vendue en premier : Standard ou Pro ?
- Quel contenu précis est inclus dans cette offre ?
- Prix, devise, périodicité et politique de remboursement ?
- Quel pays et quelle juridiction de lancement ?
- Quelle politique de synchronisation et de suppression des données ?
- Quelle date et quels testeurs pour le staging Supabase/BFF ?
- Les données de marché doivent-elles rester entièrement pédagogiques dans la prochaine version ?

## 7. Définition de réussite de la prochaine grande tranche

Un apprenant doit pouvoir :

> ouvrir une leçon, comprendre un concept, l’observer dans le Terminal pédagogique, manipuler une annotation, justifier une décision, recevoir un feedback explicable, enregistrer son raisonnement dans le Journal et voir une preuve reliée à sa Progression.

Si cette boucle n’est pas complète, ajouter une page Community, un catalogue d’experts, un paiement ou une IA ne constitue pas une avancée produit prioritaire.
