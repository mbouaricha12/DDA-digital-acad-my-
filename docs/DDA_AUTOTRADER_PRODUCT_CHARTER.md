# DDA AutoTrader — objectif produit et feuille de route

## Objectif produit

Construire progressivement un outil fiable, contrôlable, auditable et utile à l’apprentissage et à la pratique du trading, sans promettre de gains. Les utilisateurs autorisés doivent pouvoir consulter des analyses, recevoir des signaux structurés, tester des stratégies historiques, utiliser un environnement simulé, définir des limites de risque, consulter les positions/transactions/performance à partir de sources autorisées, suspendre immédiatement les fonctions AutoTrader et consulter un historique transparent.

Le produit cible aussi une connexion sécurisée à MetaTrader 5. La connexion envisagée dans les jalons documentés ici est **en lecture seule** : données de compte, positions et historique uniquement, sans accès à une opération d’écriture.

## Principes de conception

1. **Séparer les responsabilités.** Identité DDA, droit commercial, quota, données marché, analyse, risque, simulation, notifications et historique ont des contrats distincts.
2. **Étiqueter chaque état.** `analyse`, `proposition non soumise`, `simulation/paper` et données lues depuis un compte ne doivent jamais être confondus.
3. **Fail closed.** Donnée périmée/incomplète, droit non confirmé, politique risque absente, quota indisponible ou source inconnue = pas de résultat exploitable et pas de contournement mémoire.
4. **Risque avant confiance.** Un dépassement bloque une nouvelle proposition; il ne signifie pas qu’une position réelle a été fermée ni que la perte est plafonnée.
5. **Traces minimales mais auditables.** Conserver versions de contrat, de règle, source, timestamps, résultats, hypothèses de coût et transitions d’accès; ne pas journaliser secrets, tokens ou identifiants personnels inutiles.
6. **Arrêt contrôlé.** Le kill switch AutoTrader doit empêcher les nouvelles analyses/simulations/notifications selon son niveau et invalider les caches de droit. En lecture seule, il ne ferme pas une position de compte.
7. **Aucune promesse de performance.** Un signal, un backtest ou un résultat paper n’est ni un fill garanti, ni un rendement futur attendu.

## Architecture cible, sans écriture broker

```text
Interface DDA
   │ session DDA + entitlement dédié + quota serveur
   ▼
BFF/API ── kill switch AutoTrader ── journal d’audit
   ├── adaptateurs de données marché en lecture seule
   ├── analyse descriptive et indicateurs versionnés
   ├── propositions structurées non soumises
   ├── moteur de risque et limites explicites
   ├── moteur historique et simulateur paper événementiel
   ├── notifications (risque, objectifs partiels, stop simulé, clôture simulée)
   └── adaptateur MT5 strictement en lecture seule
          └── compte, positions et historique autorisés
```

L’architecture n’accorde jamais au navigateur une clé fournisseur ou un secret de compte. Les droits d’analyse, les accès paper et les accès de lecture de compte doivent être autorisés séparément côté serveur. Le snapshot d’un compte réel reste une donnée sensible, minimisée et non reproduite dans les logs.

## Intelligence du bot et stratégies versionnées

L’analyse est agnostique du fournisseur d’IA : chaque moteur est un composant sélectionnable, identifié par `engine_id` et version, derrière une interface commune qui consomme un contexte marché validé et renvoie des faits/observations structurés avec leurs preuves. Le calcul déterminant doit rester reproductible et explicite. Un LLM peut éventuellement aider à reformuler une justification à partir des champs validés; il ne constitue ni source de cotations, ni calculateur de performance, ni oracle de backtest, ni autorité de risque. Les valeurs numériques affichées doivent provenir des données sources ou de fonctions déterministes dont les entrées, unités, formules et versions sont journalisées.

Chaque stratégie est un artefact versionné et testable, avec au minimum : instruments/classes et timeframes autorisés, fenêtres d’historique, indicateurs ou transformations exactes, conditions d’entrée, conditions d’invalidation, niveaux de stop et objectifs si la règle les définit, paramètres, coûts applicables, et tests de référence. L’analyse indépendante de la stratégie ne doit pas fabriquer des niveaux absents de sa spécification. `dda.trend-confirmation.v1` reste un filtre directionnel. Un composant séparé `dda.autotrader.atr-levels.v1` propose désormais, à titre théorique et non validé, une référence sur la dernière clôture, un stop à 1,5 × Wilder ATR(14) et un objectif unique à 2R; le backtest historique actuel ne valide pas ces niveaux.

Une carte de proposition peut contenir une entrée de référence, un stop et des objectifs **théoriques**, mais doit rester `proposed_unsubmitted`, `order_ready=false`, `order_plan=null`, `execution_enabled=false`. Le R/R brut est théorique. Le modèle `dda.autotrader.cost-model.v1` peut calculer un R/R net uniquement avec commissions, spread, glissement, financement long/short, emprunt short, spécifications de contrat, multiplicateur, devise compatible et horizon explicite; ces hypothèses sont fournies par l’appelant, non vérifiées, et aucun horizon n’est supposé. Sans élément requis, `net_ratio` reste `null`. Aucun niveau n’est un cours exécutable ou une perte maximale garantie.

Pour un ratio brut, valider d’abord l’ordre des niveaux : position longue `target > entry > stop`, puis `(target - entry) / (entry - stop)`; position courte `stop > entry > target`, puis `(entry - target) / (stop - entry)`. Le modèle ATR v1 utilise `R = 1,5 × ATR(14)` et un objectif à `2R`, sur les barres et le timeframe fournis. Les égalités, dénominateurs nuls/négatifs ou prix manquants donnent un ratio non calculable et un motif explicite. Le ratio net applique des coûts/fills explicites au gain net objectif et à la perte modélisée au stop, avec le même horizon explicite pour les deux scénarios; ce n’est ni une prévision ni une promesse de gain.

Le validateur de marché v2 transporte déjà symbole canonique, venue, devise, timeframe, type/source, horodatages, OHLC et sémantique de volume. La fraîcheur doit être fixée par politique explicite au timeframe et à l’usage; le seuil par défaut du validateur ne vaut pas validation universelle de données intraday. La stratégie exige des barres closes et chronologiques, sans look-ahead. Price Action, structure, liquidité, Order Blocks et Fibonacci ne deviennent des critères de décision qu’après spécification mathématique reproductible, règles de données minimales, tests de cas limites et validation hors échantillon; un libellé produit ou une description générée par LLM ne suffit pas.

## États visibles dans l’interface

L’interface responsive doit afficher exclusivement un état soutenu par des preuves : `démo`, `simulation/paper`, `compte connecté en lecture seule`, `en pause`, `arrêté` ou `en erreur`, avec source et dernière synchronisation quand elles s’appliquent. Un état de connexion ne doit jamais être simulé. Aucun statut `réel` ou `trading actif` ne doit apparaître comme opérationnel dans le périmètre livré. L’expiration d’un abonnement retire le droit d’utiliser les nouvelles fonctions réservées, mais ne doit ni effacer l’historique requis ni prétendre fermer une position; le suivi en lecture seule suit une règle d’accès documentée.

## Jalons proposés

### 0. Fondations présentes dans le dépôt local

- Contrats de séries OHLCV v1/v2, validateur et analyse descriptive.
- Indicateurs techniques v2, moteur de limites de risque en simulation, générateur de propositions non soumises et backtester historique.
- Droit dédié `autotrader.analysis`, politique de quota et procédure de révocation documentés; route d’analyse avec contrôle d’accès et quota.
- Format de notifications décrit pour simulation, alertes de risque et stop-loss dynamique.
- Règle directionnelle `dda.trend-confirmation.v1`, niveaux théoriques ATR `dda.autotrader.atr-levels.v1` et modèle de coût/R:R net `dda.autotrader.cost-model.v1` existent en bibliothèques backend testées. Le modèle de coûts partagé est appliqué au backtest historique; les niveaux ATR ne sont pas simulés par ce backtest. Aucune route produit ne fournit encore de profil de coûts validé ni les niveaux ATR/R:R nets, et aucun flux live n’est configuré. Aucun plugin IA générique n’est livré.

Ces composants sont des changements locaux non déployés. Après confirmation du droit serveur, la vue Intelligence peut envoyer un import CSV historique borné à la route d’analyse descriptive v1; elle ne consomme pas les recommandations v2, les niveaux ATR ni le R/R net. La provenance du fichier importé n’est pas vérifiée indépendamment. Un adaptateur Twelve Data en lecture seule, un endpoint BFF d’analyse historique v2 protégé et une méthode du client BFF sont maintenant implémentés, mais l’allowlist d’instruments, la clé serveur et la référence interne de licence restent vides; l’interface ne permet pas encore de sélectionner un instrument fournisseur et aucun appel réel n’a été effectué. Le premier symbole, la place/MIC, le timeframe et les droits d’affichage restent à confirmer. Aucune connexion MT5 n’est présente, le simulateur événementiel/notifieur n’est pas livré et aucun kill switch global n’est encore câblé.

### 1. Stabiliser l’accès et les politiques

- Appliquer et valider en staging les migrations Supabase d’entitlement et de quota.
- Terminer le lien serveur entre compte DDA, checkout et produit allowlisté; valider les transitions Chariow et leur ordre.
- Fixer limites, fenêtres et règles d’alerte; ajouter un kill switch serveur par environnement et tester la panne/relance.
- Garder `execution_enabled=false` et les propositions non soumises.

### 2. Données de marché en lecture seule

- Fournisseur candidat sélectionné : Twelve Data. Confirmer avant activation l’instrument, la place/MIC, le timeframe, les unités, les horaires, le coût, les quotas et les droits d’usage externe.
- L’adaptateur serveur et `POST /v1/autotrader/provider-analysis` sont implémentés, mais restent désactivés sans clé serveur, allowlist et référence d’audit licence; seuls les timeframes intrajournaliers fixes `1m`, `5m`, `15m`, `30m`, `1h`, `4h` sont actuellement admis.
- L’adaptateur exclut les bougies non clôturées, conserve la provenance, borne la taille, vérifie les métadonnées fournisseur et marque le volume `unavailable/not_verified`. L’analyse est explicitement historique et descriptive; aucune bougie brute ni recommandation n’est renvoyée par ce nouvel endpoint.
- La route vérifie le droit serveur `autotrader.analysis`, réserve de façon atomique le quota utilisateur et le quota fournisseur, puis revalide le droit avant de répondre. Les tests sont simulés; aucun appel à Twelve Data ni test staging n’a été effectué.
- Vérifier instrument, timeframe configuré, dernière barre close, horodatages source/récupération et unités avant tout moteur; faire échouer l’analyse fermement si un champ critique manque.
- Ne jamais présenter des fixtures historiques/synthétiques comme des cours live.

### 2a. Contrat de signal et moteur de stratégie

- Garder une règle déterministe clairement définie comme référence; séparer le moteur de stratégie des moteurs descriptifs et de toute reformulation IA.
- Contrat v2 de niveaux théoriques et hypothèses de coûts versionnées créé; étape restante : valider la méthode ATR hors échantillon, vérifier les coûts avec des barèmes applicables à l’instrument, puis raccorder et tester les routes avant toute mise en vente.
- Couvrir chaque règle par tests unitaires/reproductibles et backtests causaux; refuser les règles non déterministes, les données insuffisantes et les valeurs numériques non justifiées.
- Ne promouvoir les concepts Price Action/structure/liquidité/Order Blocks/Fibonacci qu’après formalisation précise et tests; sinon les laisser hors décision de la stratégie.

### 3. Simulation paper et notifications événementielles

- Construire un moteur paper qui génère des événements causaux reproductibles : proposition, entrée simulée, objectif partiel, stop dynamique simulé, clôture, coûts et résultat net simulés.
- Définir les règles de fill, de gap, de spread/slippage, de commissions, de financement et de précision de contrat avant de rendre un résultat net.
- Émettre les notifications uniquement à partir de ces événements enregistrés; signaler ce qui est simulé et ce qui est non calculable.

### 4. Consultation de compte MT5 en lecture seule

- Concevoir, après revue de sécurité, un adaptateur distinct qui ne lit que les données nécessaires au reporting autorisé : identité de compte pseudonymisée, positions, transactions/closed deals, exposition, P&L et coûts.
- Ne pas stocker de mot de passe de courtier dans l’application. Ne pas utiliser les données de lecture pour appeler des opérations d’écriture.
- Comparer les résultats affichés aux événements et relevés du compte, en séparant fills observés et simulations.

### 5. Historique, alertes et audit

- Ajouter un ledger événementiel append-only avec identifiants pseudonymes, hash/versions de payload non sensibles, provenance et corrélation demande→analyse→simulation.
- Fournir filtres par mode, instrument, stratégie et période; corrections/retentions doivent laisser une trace sans conserver les secrets.
- Définir qui peut consulter ou exporter les données; prévoir révocation de sessions de fonctionnalité, export et suppression réglementaire.

## Arrêt d’urgence — sémantique minimale

Tant qu’AutoTrader n’a pas de fonction de trading réelle, l’arrêt coupe au minimum la création de nouvelles analyses, propositions, simulations et notifications; il peut aussi bloquer les lectures de compte selon la politique produit. Les événements déjà enregistrés restent consultables par les rôles autorisés. L’arrêt n’affirme pas avoir fermé, annulé ou modifié un ordre. Toute situation où une position réelle doit être gérée reste hors du périmètre des services de ce dépôt.

## Limite de périmètre

Le produit peut viser des fonctions plus larges, mais l’assistance de ce projet reste limitée à l’analyse, aux signaux non soumis, au backtesting, au paper trading, aux contrôles de risque, au monitoring non transactionnel et aux intégrations de données strictement en lecture seule. **Je ne peux pas concevoir, coder, connecter ou tester une fonction qui soumet, route, modifie ou annule de vrais ordres auprès de MT5 ou d’un broker.** Le chemin livré doit rester sans effet transactionnel.

## Décisions nécessaires avant les prochains jalons

1. Twelve Data est le fournisseur candidat; quel symbole exact, quelle place/MIC, quelle devise et quel timeframe intrajournalier sont approuvés comme première source, et quels droits contractuels couvrent leur affichage aux utilisateurs ?
2. Quelle stratégie/règle versionnée alimente les événements paper ?
3. Quels seuils explicites (par utilisateur, portefeuille, perte journalière, exposition) et quels niveaux d’alerte warning le produit adopte-t-il ?
4. Quel mécanisme MT5 en lecture seule sera autorisé, et quelles données minimales seront conservées ?
5. Qui peut déclencher/réinitialiser le kill switch, avec quel périmètre (analyses, paper, notifications, compte read-only) et quelle trace d’audit ?
