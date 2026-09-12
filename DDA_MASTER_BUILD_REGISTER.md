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
| Accès | Inscription | SIMULÉ | Formulaire local, aucun compte serveur |
| Accès | Connexion | ABSENT | À préparer pour authentification future |
| Accès | Récupération de compte | FUTUR | Après authentification réelle |
| Accès | Onboarding | SIMULÉ | Deux étapes, sauvegarde locale |
| Apprenant | Darius Terminal | CONSTRUIT | Restructuré en véritable cockpit (directive CEO §7) : hors « où j'en suis » (carte de reprise + anneau de progression) et « prochaine action » déjà présents, deux zones réelles ajoutées — « Dernière activité » (accomplissements tirés du journal d'événements réel `state.events`, jamais fabriqués) et un indicateur « Activité » (jours distincts d'usage sur cet appareil, calculé, pas simulé) ; le bloc DDA Insight est sorti de la grille de cartes uniformes pour devenir une bannière d'attention distincte avec un message dynamique sur la prochaine étape réelle |
| Apprenant | Parcours M0–M9 | PARTIEL | M0.1 seul module réellement authored et jouable ; les 10 modules (M0–M9) sont désormais représentés dans le curriculum et rendus dynamiquement sur Parcours/Progression avec leurs états (verrouillé/prochainement/disponible/en cours/terminé) — aucun contenu M0.2–M9 inventé, seulement la structure |
| Apprenant | Module / Leçon / Lecteur | PARTIEL | M0.1 fonctionnel ; lecteur média final absent |
| Apprenant | Résumé / Exercice / Quiz | CONSTRUIT | M0.1 avec déverrouillage progressif |
| Apprenant | Résultat / feedback | CONSTRUIT | Validation locale et retour de test |
| Apprenant | Progression / compétences | SIMULÉ | Signature visuelle propre à DDA (directive CEO §10) : bandeau de statistiques réelles (modules amorcés, XP total, jours d'activité), compteurs de compétence en paliers (remplace la barre générique, honnête à zéro tant qu'aucune donnée n'existe), timeline « Preuves d'apprentissage » construite sur les vrais jalons/horodatages de M0.1 (étapes à venir affichées mais jamais marquées faites), aperçu de badges explicitement verrouillés (aucun débloqué, cohérent avec Credentials/Badges = FUTUR) ; toujours local, non synchronisé |
| Credentials | Badges | FUTUR | À définir après parcours validés |
| Credentials | Certification interne | PARTIEL | Fondations documentées, émission réelle absente |
| Ressources | Bibliothèque / Glossaire | CONSTRUIT | Guides locaux, lecteur intégré |
| Compte | Profil / Préférences | CONSTRUIT | Profil local et mode économie de données |
| Monétisation | Premium / upgrade | SIMULÉ | Aperçu local, aucun paiement ; montée en gamme éditoriale : tagline par formule, teaser de la Premium Value Stack (Journal & Plan → ... → Trader DNA, explicitement non activée) et rappel visuel des garde-fous de reprise directement sourcé du registre |
| Communauté | Espace communauté | FUTUR | Non activé |
| Marchés | Market Intelligence / BRVM | SIMULÉ | Écran densifié (indices BRVM Composite/BRVM 30 avec badge « Non connecté » explicite sur chaque carte, calendrier de publications démonstratif avec sociétés génériques et statut « À confirmer », aucun chiffre/date/nom réel), rendu par un module de données dédié (`MARKET_DEMO` + `renderMarketIntelligence()`) prêt à être remplacé par une vraie source sans retoucher le template ; fait structurel stable ajouté (BRVM = bourse commune aux 8 pays de l'UEMOA) |
| Partenaires | Broker Hub | SIMULÉ | Comparaison démonstrative, aucun lien partenaire ; grille de lecture ajoutée (disponibilité/transparence/vérification) et badge « à vérifier » explicite sur chaque fiche pour ne jamais laisser croire à une validation réelle |
| Support | FAQ / Support | SIMULÉ | Formulaire local, aucun envoi ; FAQ complétée d'une question honnête sur la non-synchronisation multi-appareil, identité visuelle alignée sur le reste du produit |
| Système | Loading / empty / locked / success / offline / error | PARTIEL | États homogénéisés visuellement (spinner de chargement, verrouillage, résultat, hors-ligne) sur les écrans réels ; couverture des écrans FUTUR/ABSENT encore à définir |
| UI/UX | Couche visuelle responsive et micro-interactions | PARTIEL | Montée en gamme de la direction artistique (identité navy/bleu/cyan/or, typographie, système d'icônes SVG, illustrations pédagogiques inline) et refonte mobile-first sur Terminal, Parcours, Leçon M0.1/Exercice/Quiz/Résultat, Progression, Ressources, Profil, Membership, Markets/BRVM, Broker Hub et Support ; **directive de refonte visuelle globale validée par le CEO (identité premium/humaine/institutionnelle/technologique)** — première tranche livrée : composant photographie éditoriale réutilisable (`.photo-frame`, placeholder honnête tant qu'aucun asset licencié n'est fourni, jamais d'image cassée) appliqué à l'écran d'accès, et BRVM densifié en conséquence ; logo : nouveau logo validé par le CEO mais asset officiel pas encore fourni — logotype texte actuel conservé en attendant ; photographie réelle sur le reste des écrans, Terminal en véritable cockpit, rythme éditorial des leçons, signature visuelle de la Progression et contenu M0.2+ restent à faire (voir roadmap) |

## Fondations produit et données

| Fondation | État | Limite actuelle |
|---|---|---|
| Modèle utilisateur | SIMULÉ | localStorage uniquement |
| Curriculum module → leçon → pratique → évaluation | PARTIEL | Modèle de données réutilisable formalisé (10 modules, lessons[] structurées avec pratique/évaluation/xp) ; seul M0.1 est authored, M1–M9 sont des emplacements structurels vides prêts à recevoir du contenu sans reconstruction |
| Learning Engine state helpers | CONSTRUIT | `learning-engine.js` réécrit en moteur générique curriculum+état (statuts leçon/module à 4-5 valeurs, déverrouillage séquentiel, prochaine action calculée sur tout le curriculum, XP agrégé) ; état de progression migré vers un schéma par leçon (`state.lessons[id]`, schemaVersion 4) avec migration automatique et sans perte depuis les données v1–v3 déjà déployées ; Terminal, Parcours et Progression consomment ce moteur au lieu de valeurs figées sur M0.1 |
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
