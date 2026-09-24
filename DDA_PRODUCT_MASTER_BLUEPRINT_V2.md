# DDA — PRODUCT MASTER BLUEPRINT V2

**Statut :** référence produit de travail  
**Date :** septembre 2026  
**Autorité finale :** Richard Darius, CEO

## 1. North Star

DDA est un **Trading & Financial Markets Learning Operating System**.

Promesse : **Learn Markets. Build Skills. Prove Progress.**

Boucle produit :
**DISCOVER → JOIN → LEARN → PRACTICE → ANALYZE → MEASURE → IMPROVE → FOLLOW MARKETS → RETURN → PROVE PROGRESS → SHARE.**

DDA ne doit pas devenir un catalogue vidéo, une plateforme de quiz, un groupe de signaux, un casino/crypto dashboard, un clone de TradingView, un template SaaS générique ou une vitrine agressive de brokers.

## 2. Réalité actuelle

### CONSTRUIT / réellement utilisable
- SPA et navigation principale.
- Darius Terminal comme cockpit d’apprentissage.
- Learning Engine générique.
- Lesson Renderer par blocs typés.
- M0.1, M0.2 Support & Résistance, M0.3 Lire une tendance.
- M1.1/M1.2 authored selon le registre actuel.
- Exercices, décisions, quiz, feedback et progression locale.
- Journal & Plan local.
- Progression et preuves d’apprentissage locales.
- Ressources.
- Market Intelligence / BRVM en mode démonstration, sans données réelles.
- Broker Hub factuel, sans activation commerciale.
- Profil, support, offline/PWA et low-data.
- Instrumentation d’acquisition en mode debug/local tant qu’aucune clé réelle n’est fournie.

### PARTIEL / SIMULÉ
- Compte utilisateur : localStorage.
- Free/Premium : entitlements locaux.
- Analytics : funnel instrumenté mais non activé en production.
- Credentials / badges : fondation locale.
- UI/UX : forte montée en gamme déjà effectuée, mais expérience globale encore incomplète.
- Terminal : cockpit d’apprentissage réel, pas encore véritable environnement d’analyse graphique.

### ABSENT / FUTUR
- Authentification serveur et synchronisation multi-appareils.
- Paiement réel.
- Données de marché réelles.
- Darius Terminal analytique complet.
- Trading Lab / replay / backtesting pédagogique.
- Decision Replay.
- Weekly Review.
- Skill Graph / Trader DNA.
- Darius AI.
- Community réelle.
- Back-office/CMS.
- Certification externe/accréditée.
- Activation broker/affiliation réelle.

## 3. Problème produit actuel

Le noyau Learning est maintenant solide, mais l’expérience peut encore être perçue comme :

**leçon → question → exercice → quiz → résultat**

alors que DDA doit devenir :

**comprendre → observer → manipuler → décider → recevoir du feedback → prouver → mesurer → journaliser → revenir.**

Les quiz et exercices sont donc des composants du système, pas la définition du produit.

## 4. Architecture cible

### A. DDA Learn
Module → Leçons → blocs pédagogiques → pratique → évaluation → feedback → preuve → compétence.

### B. Darius Terminal
Cockpit quotidien reliant :
- prochaine action ;
- reprise du parcours ;
- compétences ;
- activité récente ;
- Journal & Plan ;
- Market Intelligence ;
- pratique ;
- ressources ;
- progression.

Évolution en quatre niveaux :
1. Learning Terminal — état actuel.
2. Analysis Terminal — graphiques pédagogiques interactifs.
3. Practice Terminal — missions, annotations, scénarios, validation.
4. Market Terminal — données réelles et contexte marché après validation infrastructurelle.

### C. Market Intelligence
Toujours selon :
**FAIT → POURQUOI C’EST IMPORTANT → NOTION À COMPRENDRE → CONTENU DDA ASSOCIÉ.**

Jamais un flux de signaux.

### D. Journal & Plan
Doit devenir le pont :
**Analyse → Hypothèse → Plan → Résultat → Review → Progression.**

### E. Progression / Skill Graph
Ne pas afficher uniquement un pourcentage global.
Afficher progressivement :
- compétences acquises ;
- compétences en construction ;
- preuves ;
- erreurs récurrentes ;
- prochaine pratique recommandée.

### F. Darius AI
Copilote pédagogique futur.
Il peut expliquer, questionner, comparer des scénarios, aider à journaliser et proposer une activité.
Il ne doit jamais devenir un générateur autonome de signaux ou de recommandations de position.

## 5. Darius Terminal — priorité produit

Le Terminal ne doit pas être un clone de TradingView.

Il doit devenir un environnement propriétaire DDA inspiré des workflows utiles d’analyse graphique.

### Phase Terminal 1 — pédagogique
- instrument pédagogique ;
- timeframe ;
- graphique historique contrôlé ;
- zoom/pan ;
- crosshair ;
- annotations ;
- support/résistance ;
- Fibonacci ;
- zones ;
- sauvegarde d’observation.

### Phase Terminal 2 — pratique
- mission guidée ;
- identification de structure ;
- choix de scénario ;
- invalidation ;
- justification ;
- validation ;
- feedback ;
- preuve de compétence.

### Phase Terminal 3 — intégration
- Journal & Plan ;
- progression ;
- Skill Graph ;
- Decision Replay ;
- missions personnalisées.

### Phase Terminal 4 — marché
- sources de données validées ;
- Market Intelligence ;
- calendrier ;
- BRVM ;
- contexte macro ;
- historique/replay.

Aucune donnée réelle ne doit être simulée comme réelle.

## 6. Priorités de construction

### P0 — Noyau produit
1. Stabiliser le Learning Engine.
2. Généraliser proprement la progression au curriculum authored.
3. Consolider le Terminal actuel.
4. Construire la première version Analysis Terminal pédagogique.
5. Connecter Terminal ↔ Lesson ↔ Practice ↔ Journal.
6. Généraliser les preuves/compétences sans inventer de contenu.

### P1 — Différenciation
1. Practice Terminal.
2. Missions graphiques.
3. Journal enrichi par contexte graphique.
4. Skill Graph réel.
5. Market Intelligence reliée au curriculum.
6. Weekly Review.
7. Decision Replay.

### P2 — Infrastructure
1. Auth serveur.
2. Base distante.
3. Synchronisation multi-device.
4. CMS/back-office.
5. Analytics production.
6. Support réel.
7. Paiement lorsque le produit et l’offre sont validés.

### P3 — Intelligence et écosystème
1. Darius AI.
2. Trading Lab/backtesting pédagogique.
3. Community.
4. Trader DNA.
5. Credentials plus avancés.
6. Broker/Affiliate/Referral selon décisions commerciales séparées.

## 7. Règles de construction

- Ne pas créer une page future simplement parce qu’elle existe dans la vision.
- Une fonctionnalité n’est CONSTRUIT que si elle est réellement utilisable.
- Ne jamais inventer données, résultats, membres, scores, prix ou connexions.
- Ne pas casser une fonction existante pour améliorer le design.
- Toute nouvelle brique doit être extensible et compatible avec l’architecture actuelle.
- Préserver les deux registres visuels :
  - Public/Learning : clair, humain, institutionnel.
  - Terminal/Tools : sombre, précis, fintech.
- Les animations doivent communiquer un état, une progression ou une interaction ; pas être décoratives.
- Mobile-first réel, y compris appareils modestes et faible connexion.
- Toute décision structurante ou externe (paiement, données réelles, broker, publication, architecture majeure) nécessite validation CEO.

## 8. Gouvernance des agents

Tous les agents travaillent à partir de cette hiérarchie :
1. décisions explicites du CEO ;
2. architecture/cahier des charges validés ;
3. ce Blueprint ;
4. Master Build Register ;
5. code réellement présent ;
6. propositions des agents.

Un agent ne peut pas transformer une proposition en décision produit.

Format obligatoire de fin de tranche :

**TRANCHE EXÉCUTÉE**  
**FICHIERS MODIFIÉS**  
**ÉCRANS AMÉLIORÉS**  
**COMPOSANTS CRÉÉS/REFACTORÉS**  
**TESTS EXÉCUTÉS**  
**RÉGRESSIONS**  
**MASTER BUILD REGISTER MIS À JOUR**  
**LIMITES RESTANTES**  
**PROCHAINE TRANCHE**

## 9. Définition du produit final

DDA doit permettre à un apprenant de :

**apprendre une notion → la voir sur un marché → la manipuler → prendre une décision pédagogique → recevoir un feedback → conserver une preuve → voir sa compétence progresser → documenter son raisonnement → revenir pour une nouvelle pratique.**

C’est cette boucle qui doit guider les prochaines tranches, avant l’ajout massif de fonctionnalités secondaires.
