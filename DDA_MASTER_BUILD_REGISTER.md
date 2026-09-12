# DDA — MASTER BUILD REGISTER

**Reprise :** 11 septembre 2026  
**Base :** prototype V10 + travaux Private Alpha déployés  
**Autorité finale :** Richard Darius, CEO

## Légende

- **CONSTRUIT** : présent et utilisable dans le prototype.
- **PARTIEL** : structure présente, couverture ou finition incomplète.
- **SIMULÉ** : interaction locale ou donnée de démonstration, non production.
- **ABSENT** : prévu mais non présent dans le prototype actuel.
- **FUTUR** : volontairement différé après validation du noyau.

## Écrans et parcours

| Domaine | Élément | État | Preuve / limite actuelle |
|---|---|---|---|
| Public | Landing Page | PARTIEL | Présente dans les archives V10, non intégrée au terminal actuel |
| Accès | Inscription | SIMULÉ | Formulaire local, aucun compte serveur ; **identité visuelle « public/learning » distincte du Terminal** (directive CEO) : l'écran d'accès (seul point d'entrée public existant à ce jour) adopte un fond éditorial clair (ivoire/papier, encre foncée) au lieu d'hériter du fond sombre du Terminal — chrome de l'application (barre latérale/barre du haut) volontairement inchangé, sombre et technologique ; illustration et placeholder photo adaptés au fond clair |
| Accès | Connexion | ABSENT | À préparer pour authentification future |
| Accès | Récupération de compte | FUTUR | Après authentification réelle |
| Accès | Onboarding | SIMULÉ | Deux étapes, sauvegarde locale |
| Apprenant | Darius Terminal | CONSTRUIT | Restructuré en véritable cockpit (directive CEO §7) : hors « où j'en suis » (carte de reprise + anneau de progression) et « prochaine action » déjà présents, deux zones réelles ajoutées — « Dernière activité » (accomplissements tirés du journal d'événements réel `state.events`, jamais fabriqués) et un indicateur « Activité » (jours distincts d'usage sur cet appareil, calculé, pas simulé) ; le bloc DDA Insight est sorti de la grille de cartes uniformes pour devenir une bannière d'attention distincte avec un message dynamique sur la prochaine étape réelle |
| Apprenant | Parcours M0–M9 | PARTIEL | M0.1 seul module réellement authored et jouable ; **écran Parcours reconstruit en véritable expérience de journey** (fin de la répétition de 10 cartes identiques dénoncée par le CEO) : un vrai chapitre en cours (module M0, données réelles — durée, nombre de leçons, statut, action) mis en avant visuellement, suivi d'un rail connecté honnête pour les 9 modules à venir (statut réel « à suivre », résumé réel affiché uniquement quand il existe — M1/M2 — jamais de description inventée pour M3–M9) ; rendu par un module `renderPathJourney()` dédié, entièrement piloté par les données du curriculum ; aucun contenu M0.2–M9 inventé, seulement la structure |
| Apprenant | Module / Leçon / Lecteur | CONSTRUIT | **Learning Experience V1** (mandat « Learning Experience V1 ») : M0.1 devient le golden sample — architecture pédagogique réutilisable Parcours→Module→Leçon→Sections→Média→Pratique→Évaluation→Feedback→Résultat, formalisée en données (`lesson.content`/`practice`/`evaluation`/`result` dans `dda-core.js`) et rendue par un moteur de rendu générique dédié (`lesson-renderer.js`) qui ne connaît aucun id de leçon en dur — M0.2–M9 n'auront qu'à fournir les mêmes données, sans reconstruire l'écran ; lecteur média final toujours absent |
| Apprenant | Résumé / Exercice / Quiz | CONSTRUIT | M0.1 avec déverrouillage progressif ; rythme éditorial complet (Learning Experience V1) : entrée → concept → explication visuelle → exemple concret → synthèse (comparaison) → pratique → feedback → évaluation → résultat, avec un stepper d'étapes (Comprendre→Exercice→Quiz→Résultat) et un sommaire de leçon tous deux reflétant l'état réel ; feedback d'erreur propre à chaque mauvaise réponse (exercice et quiz) |
| Apprenant | Résultat / feedback | CONSTRUIT | Résultat pédagogique réel (Learning Experience V1) : compétence concernée, XP réellement obtenu sur la leçon, prochaine étape réelle (honnête — « prochain module bientôt disponible » tant qu'aucun n'existe, jamais inventée), lien direct vers la Progression en plus du Terminal ; la validation locale et le retour de test restent disponibles |
| Apprenant | Progression / compétences | SIMULÉ | Signature visuelle propre à DDA (directive CEO §10) : bandeau de statistiques réelles (modules amorcés, XP total, jours d'activité), compteurs de compétence en paliers (remplace la barre générique, honnête à zéro tant qu'aucune donnée n'existe), timeline « Preuves d'apprentissage » construite sur les vrais jalons/horodatages de M0.1 (étapes à venir affichées mais jamais marquées faites), aperçu de badges explicitement verrouillés (aucun débloqué, cohérent avec Credentials/Badges = FUTUR) ; nouveau panneau « Certification » (aperçu réel, voir Credentials) inséré juste avant les badges ; toujours local, non synchronisé |
| Credentials | Badges | FUTUR | À définir après parcours validés |
| Credentials | Certification interne | SIMULÉ | L'entitlement `certificate_preview` existait dans le modèle de droits depuis la refonte de la Progression mais n'était relié à aucun écran — la promesse « Aperçu de certification » de la formule Premium restait sans effet réel. Panneau « Certification » ajouté sur Progression, avec trois états honnêtes : verrouillé tant que M0.1 n'est pas terminé, réservé à Premium (réutilise le composant `.premium-gate` déjà en place pour les Ressources) une fois éligible en Free, puis maquette de certificat une fois Premium — nom réel de l'apprenant, module/leçon réellement complétés, date réelle de l'événement `quiz_complete`. Ruban diagonal « Aperçu » et mention explicite « aucune certification officielle n'est délivrée » pour qu'elle ne puisse jamais être confondue avec un vrai document ; émission réelle toujours absente |
| Ressources | Bibliothèque / Glossaire | CONSTRUIT | Guides locaux, lecteur intégré |
| Compte | Profil / Préférences | CONSTRUIT | Profil local et mode économie de données |
| Monétisation | Premium / upgrade | SIMULÉ | Aperçu local, aucun paiement ; montée en gamme éditoriale : tagline par formule, teaser de la Premium Value Stack (Journal & Plan → ... → Trader DNA, explicitement non activée) et rappel visuel des garde-fous de reprise directement sourcé du registre |
| Communauté | Espace communauté | FUTUR | Non activé |
| Marchés | Market Intelligence / BRVM | SIMULÉ | Écran densifié (indices BRVM Composite/BRVM 30 avec badge « Non connecté » explicite sur chaque carte, calendrier de publications démonstratif avec sociétés génériques et statut « À confirmer », aucun chiffre/date/nom réel), rendu par un module de données dédié (`MARKET_DEMO` + `renderMarketIntelligence()`) prêt à être remplacé par une vraie source sans retoucher le template ; fait structurel stable ajouté (BRVM = bourse commune aux 8 pays de l'UEMOA) |
| Partenaires | Broker Hub | SIMULÉ | Comparaison démonstrative, aucun lien partenaire ; grille de lecture (disponibilité/transparence/vérification) et badge « à vérifier » explicite sur chaque fiche ; fiches étendues à 4 critères de comparaison (disponibilité, transparence, régulation, dépôt minimum), tous honnêtement « à vérifier avant publication » — aucune valeur inventée ; garantie explicite « classement jamais basé sur une commission » ajoutée au disclosure (mandat §15) |
| Support | FAQ / Support | SIMULÉ | Formulaire local, aucun envoi ; FAQ complétée d'une question honnête sur la non-synchronisation multi-appareil, identité visuelle alignée sur le reste du produit |
| Système | Loading / empty / locked / success / offline / error | PARTIEL | États homogénéisés visuellement (spinner de chargement, verrouillage, résultat, hors-ligne) sur les écrans réels ; robustesse ajoutée : l'échec d'écriture du stockage local (quota plein, navigation privée) ne casse plus l'application — `DDA.save` capture l'erreur, l'état reste actif en mémoire pour la session, et un bandeau honnête informe l'apprenant que sa progression ne sera pas conservée ; couverture des écrans FUTUR/ABSENT encore à définir |
| UI/UX | Couche visuelle responsive et micro-interactions | PARTIEL | Montée en gamme de la direction artistique (identité navy/bleu/cyan/or, typographie, système d'icônes SVG, illustrations pédagogiques inline) et refonte mobile-first sur Terminal, Parcours, Leçon M0.1/Exercice/Quiz/Résultat, Progression, Ressources, Profil, Membership, Markets/BRVM, Broker Hub et Support ; **directive de refonte visuelle globale validée par le CEO (identité premium/humaine/institutionnelle/technologique)** — première tranche livrée : composant photographie éditoriale réutilisable (`.photo-frame`, placeholder honnête tant qu'aucun asset licencié n'est fourni, jamais d'image cassée) appliqué à l'écran d'accès, et BRVM densifié en conséquence ; logo : nouveau logo validé par le CEO mais asset officiel pas encore fourni — logotype texte actuel conservé en attendant ; photographie réelle sur le reste des écrans, Terminal en véritable cockpit, rythme éditorial des leçons, signature visuelle de la Progression et contenu M0.2+ restent à faire (voir roadmap) ; accessibilité clavier renforcée sur les deux fenêtres modales (aperçu Premium, lecteur de ressource) — fermeture à l'Échap, focus posé à l'ouverture et restitué au déclencheur à la fermeture — et sur le quiz verrouillé, désormais réellement hors du parcours de tabulation et pas seulement recouvert visuellement ; les trois formulaires (inscription, onboarding, profil) marquent les champs invalides et y ramènent le focus ; **Learning Experience V1** : composant « exemple concret » (nouveau, distinct du principe), bande de statistiques de résultat, motif visuel de rythme narratif (tick doré devant chaque eyebrow de section à l'intérieur de la leçon) — identité DDA propre, pas des cartes SaaS génériques ; indicateur « LEÇON X SUR Y » du Terminal corrigé pour refléter le nombre réel de leçons authored du module au lieu d'un chiffre fixe non connecté à la donnée ; **Parcours reconstruit en journey narratif** (chapitre en cours + rail connecté) à la place de 10 cartes identiques empilées — un des cas concrets de « répétition de cartes » explicitement visés par le CEO est désormais traité |

## Fondations produit et données

| Fondation | État | Limite actuelle |
|---|---|---|
| Modèle utilisateur | SIMULÉ | localStorage uniquement |
| Curriculum module → leçon → pratique → évaluation | PARTIEL | Modèle de données réutilisable formalisé et approfondi (Learning Experience V1) : chaque leçon authored porte désormais son contenu narratif complet en données (`content.lead/concept/principle/diagram/example/comparison`, `practice`/`evaluation` avec choix et feedback par réponse, `result`, `competency`) ; seul M0.1 est authored, M1–M9 restent des emplacements structurels vides — aucun contenu inventé |
| Learning Engine state helpers | CONSTRUIT | `learning-engine.js` réécrit en moteur générique curriculum+état (statuts leçon/module à 4-5 valeurs, déverrouillage séquentiel, prochaine action calculée sur tout le curriculum, XP agrégé) ; état de progression migré vers un schéma par leçon (`state.lessons[id]`, schemaVersion 4) avec migration automatique et sans perte depuis les données v1–v3 déjà déployées ; Terminal, Parcours et Progression consomment ce moteur au lieu de valeurs figées sur M0.1 |
| Lesson rendering engine | CONSTRUIT | Nouveau `lesson-renderer.js` (Learning Experience V1) : fonctions pures et curriculum-agnostiques qui transforment les données d'une leçon en composants pédagogiques DDA (hero, concept, principe, diagramme, exemple concret, synthèse, exercice, évaluation, résultat, sommaire) ; `#lesson` dans `index.html` n'est plus qu'une coquille + points de montage — aucun id de leçon en dur dans le HTML ; M0.2–M9 réutiliseront ce même moteur dès que leur contenu sera fourni |
| Tentative / exercice / quiz / progression | SIMULÉ | événements locaux, aucune base distante |
| Compétence / badge / certificat | PARTIEL | affichage et règles à compléter |
| Formule / droits / Premium | SIMULÉ | Free/Premium local, sans abonnement |
| Consentement | SIMULÉ | consentement de stockage local |
| Analytics produit | SIMULÉ | événements locaux anonymes sur appareil ; un sous-ensemble (jalons d'apprentissage réels) est désormais aussi affiché à l'utilisateur lui-même dans « Dernière activité » du Terminal |
| Subscription Engine | FUTUR | architecture à préserver, aucun paiement |
| Affiliate Revenue Engine | FUTUR | disclosure et attribution à préparer, aucun lien réel |
| Referral/Ambassador Engine | FUTUR | distinct de l’affiliation, non activé |
| Back-office contenu / utilisateurs / support | ABSENT | à construire après noyau Private Alpha |
| Auth serveur / base distante / synchronisation | FUTUR | décision et infrastructure ultérieures |

## Vision long terme (non activée)

| Couche | État |
|---|---|
| Journal & Plan | FUTUR — à évaluer tôt, sans bloquer M0.1 |
| Market Intelligence → statistiques personnelles → Weekly Review | FUTUR |
| Analyse assistée → Decision Replay | FUTUR |
| Darius AI copilote pédagogique | FUTUR — jamais générateur de signaux |
| Trading Lab / Backtesting pédagogique | FUTUR |
| Trader DNA / Skill Graph | FUTUR |

## Garde-fous de reprise

Paiement réel, renouvellement automatique, broker réel, lien affilié réel, commission, publicité payante, données temps réel, IA autonome et lancement public : **NON ACTIVÉS**.

Critère Private Alpha : un débutant comprend où aller, termine M0.1, retrouve sa progression et identifie naturellement la prochaine action.
