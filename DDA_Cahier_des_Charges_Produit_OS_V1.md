# DARIUS DIGITAL ACADEMY — Cahier des charges produit évolutif

**Extension stratégique « DDA Learning Operating System » — Version CDCP-OS 1.0**

**Statut : ARCHITECTURE PRODUIT ET CAHIER DES CHARGES UNIQUEMENT — NON CONSTRUIT, NON PUBLIÉ, NON CONNECTÉ.**

**Date : 29 août 2026**

**Autorité fonctionnelle conservée : DDA — Architecture V2.1 corrigée**

**Objet : intégrer la vision long terme de DDA sans reconstruire le projet, sans supprimer les acquis validés et sans autoriser une implémentation automatique.**

> 📥 _Document reçu par collage direct le 24 septembre 2026 et archivé tel quel dans le dépôt (la pièce jointe n'est jamais arrivée dans le sandbox de build). Reproduction fidèle du texte transmis ; les balises ⚠️ signalent les portions visiblement tronquées dans le collage — leur contenu exact reste à confirmer par la direction, rien n'a été reconstitué ni inventé. Voir `experiments/CDCP_OS_1_0_ALIGNEMENT.md` pour l'analyse d'alignement et les décisions requises._

## 0. Décision de cadrage

La présente extension ne remplace pas l'Architecture V2.1 corrigée. Elle l'enrichit par une architecture produit long terme et une roadmap de différenciation.

La hiérarchie documentaire devient :

1. décisions explicites de la direction DDA ;
2. règles de sécurité, de conformité et de gouvernance multi-agent ;
3. Architecture DDA V2.1 corrigée pour les fondations fonctionnelles, commerciales, techniques et opérationnelles ;
4. présent cahier des charges CDCP-OS 1.0 pour l'évolution produit ;
5. dossier UX/UI validé et futurs design system/handoffs ;
6. documents d'exécution autorisés ultérieurement.

En cas de contradiction, le niveau supérieur prévaut. Une contradiction ne peut jamais être résolue silencieusement par un agent de conception ou de construction.

### 0.1 Ce que ce document autorise

- cadrage ;
- recherche ;
- prototypage non connecté expressément validé ;
- tests utilisateurs préparatoires ;
- définition de données, événements et critères d'acceptation ;
- estimation et comparaison d'options.

### 0.2 Ce que ce document n'autorise pas

- développement ;
- modification de Base44 ou d'une application existante ;
- publication ;
- connexion de paiement, broker, données de marché, IA ou domaine ;
- import de données personnelles ;
- activation commerciale ;
- promesse publique de fonctionnalité, de capacité ou de calendrier ;
- collecte de données comportementales nouvelles sans validation.

## 1. Résumé exécutif

DDA évolue d'une plateforme de formation vers un Trading & Financial Markets Learning Operating System : un système continu permettant à l'utilisateur d'apprendre, pratiquer, être évalué, comprendre ses faiblesses, améliorer ses compétences, suivre les marchés dans un cadre pédagogique et prouver sa progression.

La proposition internationale de marque est conservée comme candidate à tester, non comme slogan publié :

> DDA — Learn Markets. Build Skills. Prove Progress.
> Built from Africa. Designed for the world.

Le produit repose progressivement sur six piliers :

1. DDA Learn — apprentissage structuré ;
2. DDA Practice / Trading Lab — entraînement et simulation ;
3. DDA Intelligence — Skill Graph, AI Coach et Trader DNA pédagogiques ;
4. DDA Market Intelligence — actualité transformée en apprentissage ;
5. DDA Ecosystem — communauté, outils, partenaires et Broker Hub transparent ;
6. DDA Credentials — Passport, Risk Passport et preuve de progression.

Le lancement reste concentré sur la fondation. Les éléments distinctifs sont introduits par paliers mesurables. Aucun pilier futur ne doit retarder une V1 fiable, mobile, accessible et pédagogiquement cohérente.

## 2. Positionnement produit

### 2.1 DDA n'est pas

- un groupe de signaux ;
- une promesse de rentabilité ;
- un catalogue vidéo ;
- un clone de YouTube, Telegram ou d'une plateforme de trading ;
- un comparateur de brokers guidé par la commission ;
- une plateforme exclusivement Forex ;
- un produit dont la valeur dépend en permanence de la présence du fondateur.

### 2.2 DDA devient progressivement

Un environnement d'apprentissage longitudinal dont l'actif principal est la progression vérifiable de l'utilisateur.

La proposition de valeur se structure autour de quatre raisons :

| Objectif | Réponse produit attendue |
|---|---|
| S'inscrire | Comprendre immédiatement le bénéfice pédagogique et commencer sans risque |
| Revenir | Trouver une prochaine action utile, un défi, une progression ou un contexte de marché expliqué |
| Payer | Accéder à une expérience, une pratique, une personnalisation et une preuve de compétence impossibles à reproduire par une simple playlist |
| Recommander | Pouvoir partager une expérience crédible et, plus tard, une progression volontairement vérifiable |

### 2.3 North Star

La métrique directrice n'est ni le temps passé, ni le nombre de trades simulés, ni le volume déposé chez un broker.

North Star candidate : nombre d'apprenants actifs réalisant une boucle d'amélioration pédagogique vérifiable par période.

Une boucle d'amélioration est comptée lorsqu'un utilisateur :

1. apprend ou révise un concept ;
2. réalise une activité d'évaluation ou de pratique ;
3. reçoit un feedback ;
4. met à jour une compétence ;
5. entreprend une action recommandée cohérente avec cette faiblesse.

La définition exacte et la fenêtre temporelle doivent être testées en V1.5 avant d'en faire un KPI contractuel.

## 3. Préservation des acquis V2.1

Les fondations suivantes sont maintenues sans réduction de protection :

| Acquis V2.1 | Décision CDCP-OS 1.0 |
|---|---|
| Trois formules administrables Découverte, Standard, Pro | Conservées |
| Prix par pays/devise/périodicité | Conservé |
| Moteur commercial indépendant du prestataire | Conservé |
| Paiement validé côté serveur, webhook signé, idempotence | Conservé |
| Ledger financier append-only | Conservé |
| Programme Partenaire DDA à un niveau | Conservé |
| Séparation Partenaire / Ambassadeur / affiliation brokers | Conservée |
| Darius Assistance distincte de Darius IA | Conservée |
| Certificat interne, jamais diplôme reconnu | Conservé et futur moteur Credentials encadré |
| Hub brokers pédagogique | Conservé et enrichi progressivement |
| Internationalisation par pays, langue, devise, réglementation et catalogue | Conservée et renforcée |
| Progression fondée sur des événements vérifiables | Conservée et étendue |
| Contenu/version vidéo immuable après publication | Conservé |
| Séparation MVP / bêta / post-bêta / vision long terme | Remappée en V1 / V1.5 / V2 / V3 |
| Base44 comme candidat à tester | Conservé ; aucune capacité supposée |
| Export et migration dès le Jour 1 | Conservés et renforcés |
| Aucune donnée BRVM réelle sans licence | Étendu à toutes les données de marché |
| Aucune IA donnant signal, prédiction ou conseil personnalisé | Conservé |

## 4. Conflits et résolutions obligatoires

### 4.1 Darius Free / Darius Pro contre Découverte / Standard / Pro

Conflit : la nouvelle vision parle de Darius Free et Darius Pro, alors que l'autorité V2.1 définit trois offres administrables.

Résolution :

- Découverte reste le nom de l'offre gratuite dans le moteur commercial ; « Darius Free » peut devenir un nom marketing ou un espace produit seulement après validation de la nomenclature.
- Standard reste l'offre cœur et ne doit pas disparaître.
- Pro reste l'offre avancée ; « Darius Pro » peut être son nom d'expérience publique.
- les noms affichés sont localisables et distincts des identifiants techniques stables.

### 4.2 « Darius Free M0–M9 existant » contre la matrice des droits

Conflit : V2.1 autorise M0 en Découverte, M0–M6 en Standard et M0–M9 en Pro. La phrase « Darius Free M0–M9 existant » pourrait laisser croire que M0–M9 deviennent gratuits.

Résolution : le catalogue M0–M9 peut exister techniquement et être visible en aperçu, mais les droits d'accès demeurent ceux de V2.1 jusqu'à décision formelle. Aucun agent ne peut rendre M1–M9 gratuits sur la base de cette formulation.

### 4.3 Darius IA contre DDA AI Coach

Résolution : DDA AI Coach est l'évolution produit de Darius IA, pas un troisième assistant. Darius Assistance reste l'aide produit déterministe. Le nom public définitif reste ouvert.

### 4.4 Certificat Engine contre DDA Credentials

Résolution : le certificat interne V1 demeure immuable et vérifiable. Passport, Risk Passport et Proof of Skill sont des couches ultérieures alimentées par des preuves versionnées. Ils ne transforment jamais DDA en organisme délivrant un diplôme professionnel reconnu sans accréditation externe.

### 4.5 Darius Terminal en V1 contre Terminal complet

Résolution : V1 reçoit un Terminal Foundation limité à la continuité pédagogique, la progression et les prochaines actions. Market Room, AI Coach, Community native et Tools avancés sont activés selon la roadmap. Aucun faux module vide ne doit être présenté comme disponible.

### 4.6 Internationalisation contre expansion immédiate

Résolution : l'architecture est global-ready dès V1, mais la disponibilité commerciale reste pays par pays. La capacité technique multilingue n'équivaut pas à une conformité réglementaire mondiale.

## 5. Architecture produit cible

### 5.1 Couches

| Couche | Rôle | Source de vérité |
|---|---|---|
| Identité & consentements | Compte, pays, langue, préférences, autorisations | Profil versionné |
| Catalogue & curriculum | Parcours, modules, leçons, ressources, prérequis | CMS pédagogique |
| Learning Engine | Progression, tentatives, validation, recommandations simples | Événements d'apprentissage |
| Practice Engine | Exercices graphiques, missions, simulations, replay | Scénarios versionnés |
| Assessment Engine | Quiz, rubriques, Process Score, compétences | Preuves d'évaluation |
| Skill Intelligence | Skill Graph et Trader DNA pédagogique | Agrégats explicables |
| Market Intelligence | Événements, briefs, concepts reliés | Sources licenciées + édition |
| Credentials | Certificats, Passport, Risk Passport, partage | Preuves signées/versionnées |
| Community | Espaces thématiques, modération, liens curriculum | Contenu communautaire |
| Ecosystem | Broker Hub, Tools, partenaires | Référentiels administrés |
| Commerce | Formules, offres, droits, transactions | Moteur commercial V2.1 |
| Analytics & expérimentation | Mesure produit, pédagogie, CRO | Événements classifiés |
| Gouvernance & audit | Permissions, décisions, versions, incidents | Journal append-only |

### 5.2 Principe d'architecture

Les interfaces consomment des capacités indépendantes. Elles ne portent ni règles financières critiques, ni calcul final de droits, ni décision de certification. Les identifiants métier restent indépendants de Base44 afin de permettre une migration vers une architecture cible telle que React/Next.js, PostgreSQL, fonctions serveur et fournisseurs spécialisés.

### 5.3 Terminal modulaire

Le Terminal est un orchestrateur, non une base de données séparée. Ses cartes sont assemblées selon les droits, le pays, le niveau et l'état réel des modules.

Ordre candidat V1 :

1. reprendre l'apprentissage ;
2. prochaine action ;
3. progression ;
4. activité récente ;
5. échéances ou notifications pédagogiques.

Ordre cible ultérieur :

1. Continue Learning ;
3. Market Brief pédagogique ;
4. Progress / Skill Graph ;
6. Practice / Mission ;
8. Community / Tools selon droits.

Chaque module possède les états : indisponible, non éligible, prêt, chargement, vide, erreur, obsolète, complété. Une fonctionnalité différée ne doit pas être simulée comme active.

## 6. Les six piliers

### 6.1 Pilier 1 — DDA Learn

**Finalité** : transformer le contenu en parcours actif, et non en bibliothèque passive.

La boucle pédagogique de référence est configurable par leçon. Une vidéo ne doit pas être obligatoire lorsque le même objectif peut être atteint avec un format plus léger.

**Capacités**

- contenus courts et longs ;
- transcription et sous-titres ;
- exercices ;
- prérequis ;
- progression versionnée ;
- XP et badges pédagogiques ;
- parcours recommandés ;
- ressources téléchargeables à faible consommation.

**Critères de valeur**

- chaque leçon possède un objectif observable ;
- chaque évaluation correspond à l'objectif ;
- l'utilisateur sait toujours pourquoi une activité lui est proposée ;
- la complétion n'est jamais fondée sur la seule ouverture d'une page.

### 6.2 Pilier 2 — DDA Practice / Trading Lab

**Finalité** : créer un environnement où l'utilisateur explique et exerce son processus de décision sans exécuter de trade réel.

**Types d'activités**

- supports/résistances ;
- BOS/CHoCH ;
- Fibonacci ;
- Order Blocks ;
- entrée et invalidation ;
- stop-loss pédagogique ;
- scénarios macroéconomiques ;
- paper trading éducatif.

Le résultat simulé et la qualité du processus sont deux mesures séparées.

Un Process Score peut agréger :

| Dimension | Exemple de preuve |
|---|---|
| Lecture du contexte | Régime et structure correctement identifiés |
| Hypothèse | Scénario explicite avant révélation |
| Invalidation | Niveau cohérent et justifié |
| Risque | Taille compatible avec la règle donnée |
| Patience | Confirmation attendue lorsque requise |
| Discipline | Décision conforme au plan déclaré |
| Réflexion | Justification compréhensible |

Les pondérations sont versionnées par mission. Le score doit être explicable et contestable. Aucun score ne prédit la rentabilité réelle.

### 6.3 Pilier 3 — DDA Intelligence

L'AI Coach entraîne à partir du curriculum DDA et des preuves pédagogiques autorisées. Il peut expliquer une erreur, recommander une activité ou générer une révision bornée.

Il ne peut pas :

- recommander un actif à acheter ou vendre ;
- produire un signal ;
- exécuter une transaction ;
- présenter un score comme diagnostic psychologique ou financier professionnel ;
- modifier directement un score officiel sans preuve déterministe.

**Skill Graph**

Le Skill Graph représente des compétences versionnées reliées à des objectifs, activités et preuves.

Exemple de hiérarchie : domaine → compétence → sous-compétence → indicateur observable.

Chaque score doit contenir : valeur, niveau de confiance, preuves utilisées, date, version du modèle de calcul et date de péremption éventuelle.

**Trader DNA**

Trader DNA est un profil pédagogique dynamique décrivant des tendances observées en simulation et apprentissage. Les formulations restent prudentes : « tendance observée », jamais « vous êtes » ou « vous serez rentable ».

L'utilisateur peut consulter les preuves, demander correction d'une donnée et désactiver les usages non essentiels selon la politique validée.

### 6.4 Pilier 4 — DDA Market Intelligence

> ⚠️ _Titre de section reconstitué d'après la liste des six piliers (§1) : le collage transmis reprend directement au contenu sans l'en-tête §6.4._

**Finalité** : relier l'actualité au curriculum afin de donner une raison utile de revenir.

**Unité éditoriale** — chaque événement publié répond à :

1. Que s'est-il passé ?
4. Quelle leçon ou activité permet de travailler ce concept ?

> ⚠️ _Numérotation 1 → 4 telle que transmise : les points 2 et 3 sont absents du collage._

**Garde-fous**

- source, date, fuseau et statut de fraîcheur visibles ;
- séparation fait / interprétation / exercice ;
- aucune alerte formulée comme signal ;
- validation éditoriale avant publication ;
- licences de données et droits de republication vérifiés.

### 6.5 Pilier 5 — DDA Ecosystem

Le Broker Hub compare avec transparence pays, disponibilité, autorisations/licences déclarées, instruments, plateformes, coûts, dépôts/retraits, support et limites. Toute donnée est datée, sourcée et administrable.

Les liens affiliés sont divulgués au point de décision. Le classement ne peut pas être acheté clandestinement. Une commission ne modifie pas le score pédagogique ou la présentation des risques.

La communauté est organisée par besoins et compétences, non comme un chat unique : Beginner Hub, Gold Lab, Forex, Macro Room, Risk Management, Technical Analysis, Crypto Lab, African Markets, BRVM.

La modération, le signalement, les sanctions, la protection des mineurs éventuels, la lutte contre les arnaques et la confidentialité sont des prérequis à une communauté native.

Chaque outil ou partenaire possède une fiche : finalité, droits requis, pays disponibles, données utilisées, coût, risques, propriétaire, procédure de retrait et alternative de migration.

### 6.6 Pilier 6 — DDA Credentials

Certificat interne lié à une version de parcours et à des conditions d'émission vérifiables.

**DDA Passport** : vue dynamique privée par défaut — parcours, compétences, niveaux, XP, badges, missions et preuves.

**Risk Passport** : évaluation pédagogique de position sizing, leverage, drawdown, séries de pertes, stop-loss, news risk, revenge trading, probabilités et discipline.

Le badge candidat « DDA Risk Ready — Educational competency verified » exige une validation juridique et linguistique avant publication.

**Proof of Skill** : partage volontaire, granulaire, révocable et limité dans le temps. La page publique ne montre aucune donnée privée, historique financier réel ou conclusion de rentabilité.

## 7. DDA Crypto & Digital Assets

### 7.1 Positionnement

Le parcours Crypto enseigne la technologie, les marchés, la recherche et la sécurité. Il ne distribue pas de listes de tokens à acheter.

### 7.2 Architecture de curriculum

| Domaine | Contenu cible | Horizon initial |
|---|---|---|
| Crypto Foundations | Bitcoin, Ethereum, blockchain, wallets, clés, seed phrase, CEX/DEX, stablecoins, consensus | V1.5 recherche, V2 contenu |
| Crypto Markets | Spot, futures, perpetuals, leverage, liquidations, funding, cycles, liquidité | V2 |
| Crypto Research Lab | Produit, équipe, adoption, tokenomics, supply, unlocks, gouvernance, revenus, concurrence, risques | V2 |
| Web3 | Smart contracts, DeFi, lending, staking, pools, bridges, DAO, L1/L2, oracles | V2/V3 |
| NFT & tokenisation | Standards, propriété numérique, marketplaces, utilité, risques, spéculation | V2/V3 |
| Security Lab | Phishing, drainers, faux airdrops, permissions, rug pulls, social engineering | Priorité V1.5/V2 |

### 7.3 Sécurité pédagogique

- aucune seed phrase ni clé privée collectée ;
- aucun wallet connecté en V1/V1.5 ;
- aucune transaction blockchain nécessaire à l'apprentissage ;
- adresses et transactions de démonstration clairement fictives ou publiques ;
- liens externes contrôlés contre le phishing ;
- contenu sécurité révisé fréquemment ;
- avertissements spécifiques au leverage et aux smart contracts.

## 8. DDA Missions

### 8.1 Structure canonique

Contexte → données → décision → justification → simulation → résultat → feedback → score → compétence mise à jour.

### 8.2 Modèle de mission

Une mission contient :

- identifiant et version ;
- objectifs et compétences ;
- prérequis ;
- décisions admissibles ;

> ⚠️ _Liste visiblement tronquée dans le collage (s'arrête à « décisions admissibles ») : les rubriques suivantes du modèle de mission restent à transmettre._

Missions candidates nommées dans le collage :

- Mission Risk Management ;
- Mission CPI ;
- Mission Gold ;
- Mission Market Structure ;
- Mission Trading Psychology ;
- Mission Crypto Security.

La première mission pilote doit être choisie pour sa valeur pédagogique et sa simplicité de preuve, non pour son effet spectaculaire.

> ⚠️ _La sous-section §8.3 éventuelle est absente du collage._

## 9. Gamification responsable

### 9.1 Récompenses admissibles

- constance d'apprentissage ;
- maîtrise démontrée ;
- amélioration ;
- exercices de risque réussis ;
- décisions disciplinées ;
- achèvement d'un parcours ;
- retour après erreur et correction.

### 9.2 Récompenses interdites

- volume de trades ;
- levier ;
- taille de dépôt ;
- perte récupérée rapidement ;
- nombre de liens brokers ouverts ;
- gains virtuels bruts sans mesure du processus ;
- maintien artificiel d'une streak au détriment de la santé ou de la qualité.

### 9.3 Règles

| Palier | Mécanisme | Horizon |
|---|---|---|
| P0 | Choix utilisateur et règles simples | V1 |
| P1 | Recommandations selon progression et quiz | V1.5 |
| P2 | Skill Graph et difficultés observées | V1.5/V2 |
| P3 | AI Coach contextuel avec consentement | V2 |

Toute recommandation doit présenter une justification courte : « recommandé parce que… ». L'utilisateur conserve la possibilité de choisir un autre parcours lorsque les prérequis le permettent.

> ⚠️ _La section §10 est absente du collage (le texte enchaîne directement de 9.3 à 11)._

## 11. Global by Design et low-data

### 11.1 Fondations V1

- chaînes de texte externalisées ;
- locale, langue, devise et fuseau séparés ;
- identifiants non liés à une langue ;
- formats de date/nombre localisés ;
- offres et catalogues par pays ;
- consentements et avertissements versionnés par juridiction ;
- budgets de performance définis avant construction.

### 11.2 Budgets candidats à valider

Les chiffres définitifs doivent être fixés après prototype, mais les contrôles couvrent au minimum : poids initial, images, polices, JavaScript, temps d'interactivité, consommation vidéo et fonctionnement sous réseau lent.

### 11.3 Modes de sobriété

- images adaptatives ;
- transcription avant vidéo ;
- résumé texte/visuel léger ;
- téléchargement volontaire des ressources ;
- reprise de lecture ;
- qualité vidéo adaptative ;
- absence d'autoplay vidéo ;
- cache contrôlé ;
- PWA/offline différés après analyse de sécurité et stockage.

Le hors-ligne ne doit pas permettre de contourner les droits, exposer des contenus premium non chiffrés ou conserver des données sensibles sur un appareil partagé.

## 12. Business model

Le modèle commercial V2.1 demeure l'autorité.

| Ligne de revenu | Rôle | Horizon | Condition |
|---|---|---|---|
| Découverte / Darius Free | Acquisition et confiance | V1 | Valeur autonome, sans tromperie |
| Standard | Offre cœur d'apprentissage | V1 lorsque paiement prêt | Prix et droits validés |
| Pro / Darius Pro | Avancé, pratique et intelligence | V1 puis enrichissements | Fonctions réellement disponibles |
| DDA Tools | Achat ou abonnement | V2+ | Utilité, support et conformité |
| Broker Hub | Affiliation divulguée | Post-validation | Accords, données exactes, neutralité |
| Crypto Education | Free + payant selon profondeur | V2 | Curriculum et revue sécurité |
| B2B | Licences/cohortes | V3 | Isolation locataire et conformité |
| Events/Partnerships | Opportunités ponctuelles | Futur | Validation séparée |

### Roadmap produit (extrait transmis)

> ⚠️ _Le tableau de roadmap est visiblement tronqué en tête dans le collage (les premières lignes et l'en-tête manquent) ; reproduction fidèle des lignes reçues._

| Élément | Statut | Horizon | Condition |
|---|---|---|---|
| Design final | À CONSTRUIRE | V1 | Direction artistique validée |
| Low-data | À CONSTRUIRE | V1 | Budgets et tests réseau/appareil |
| Passport | À CONSTRUIRE | V1.5 | Modèle de preuve |
| Skill Graph | À RECHERCHER puis construire | V1.5 | Taxonomie et validité des scores |
| Market Intelligence | À RECHERCHER | V1.5 | Workflow, sources, droits, coût |
| Broker Hub enrichi | À AMÉLIORER | V1.5 | Données officielles et politique de classement |
| Exercices graphiques | À RECHERCHER | V1.5 | Interaction pilote |
| Gamification responsable | À RECHERCHER | V1.5 | Règles anti-incitation |
| Trading Lab | À DIFFÉRER | V2 | Données, moteur et scoring |
| Missions/replay | À DIFFÉRER | V2 | Licence historique et auteur pédagogique |
| Process Score | À RECHERCHER | V2 | Rubriques et validation humaine |
| AI Coach | À DIFFÉRER | V2 | DPIA/équivalent, corpus, garde-fous, coût |
| Trader DNA | À RECHERCHER | V2 | Validité, explicabilité, wording |
| Risk Passport | À DIFFÉRER | V2 | Référentiel de compétence et revue juridique |
| Crypto Research Lab | À DIFFÉRER | V2 | Curriculum et Security Lab |
| Community native | À DIFFÉRER | V3 | Modération, sécurité, coût |
| Proof of Skill public | À DIFFÉRER | V3 | Consentement, révocation, vérification |
| B2B/cohortes | À DIFFÉRER | V3 | Recherche marché et architecture multi-tenant |

### Taxonomie d'événements (extrait transmis)

> ⚠️ _Le tableau de taxonomie des événements est aussi tronqué en tête dans le collage ; reproduction fidèle des lignes reçues, avec les colonnes inférées (événement / horizon / finalité / donnée interdite en analytics)._

| Événement | Horizon | Finalité | Interdit en analytics |
|---|---|---|---|
| daily_challenge_completed | V1.5 | Retour utile | — |
| market_brief_opened | V1.5 | Usage éditorial | Données de trading réel |
| mission_decision_submitted | V2 | Practice | Texte libre non filtré |
| process_score_generated | V2 | Évaluation | Conclusion de rentabilité |
| score_explanation_viewed | V2 | Explicabilité | — |
| ai_coach_recommendation | V2 | Coaching | Prompt complet dans analytics |
| safety_refusal_triggered | V2 | Sécurité IA | Contenu personnel brut |
| passport_shared/revoked | V3 | Credentials | Token public dans analytics |

### Couverture fonctionnelle (extrait transmis)

> ⚠️ _Tableau également tronqué en tête dans le collage ; lignes reçues :_

| Domaine | Couverture | Remarque |
|---|---|---|
| Community | Modération, signalement, recherche, anti-spam | V3 ou solution externe contrôlée |
| B2B | Multi-tenant, cohortes, rôles, exports, SLA | Nouvelle revue d'architecture |
| Global | i18n, catalogue/paiement/conformité pays | Configuration, pas branches de code |
| Low-data | CDN, compression, cache, vidéo adaptative | Budgets testés par appareil/réseau |
| Credentials | Preuves vérifiables | Wording honnête |
| Community | Relations et connaissance collective | Modération forte |
| Brand | Confiance et singularité | Cohérence produit/marketing |

---

**Règle de classement des livrables** : chaque livrable reçu doit être classé — conforme, conforme sous conditions, à corriger, refusé — avec preuves, écarts, décision requise et action suivante. La présence d'un fichier ne vaut jamais validation de son contenu.
