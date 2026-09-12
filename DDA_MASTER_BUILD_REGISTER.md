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
| Apprenant | Darius Terminal | CONSTRUIT | Accueil, prochaine action, progression et raccourcis |
| Apprenant | Parcours M0–M9 | PARTIEL | M0.1 seul module réellement authored et jouable ; les 10 modules (M0–M9) sont désormais représentés dans le curriculum et rendus dynamiquement sur Parcours/Progression avec leurs états (verrouillé/prochainement/disponible/en cours/terminé) — aucun contenu M0.2–M9 inventé, seulement la structure |
| Apprenant | Module / Leçon / Lecteur | PARTIEL | M0.1 fonctionnel ; lecteur média final absent |
| Apprenant | Résumé / Exercice / Quiz | CONSTRUIT | M0.1 avec déverrouillage progressif |
| Apprenant | Résultat / feedback | CONSTRUIT | Validation locale et retour de test |
| Apprenant | Progression / compétences | SIMULÉ | Indicateurs locaux, non synchronisés |
| Credentials | Badges | FUTUR | À définir après parcours validés |
| Credentials | Certification interne | PARTIEL | Fondations documentées, émission réelle absente |
| Ressources | Bibliothèque / Glossaire | CONSTRUIT | Guides locaux, lecteur intégré |
| Compte | Profil / Préférences | CONSTRUIT | Profil local et mode économie de données |
| Monétisation | Premium / upgrade | SIMULÉ | Aperçu local, aucun paiement |
| Communauté | Espace communauté | FUTUR | Non activé |
| Marchés | Market Intelligence / BRVM | SIMULÉ | Cadre pédagogique, pas de données temps réel |
| Partenaires | Broker Hub | SIMULÉ | Comparaison démonstrative, aucun lien partenaire |
| Support | FAQ / Support | SIMULÉ | Formulaire local, aucun envoi |
| Système | Loading / empty / locked / success / offline / error | PARTIEL | États homogénéisés visuellement (spinner de chargement, verrouillage, résultat, hors-ligne) sur les écrans réels ; couverture des écrans FUTUR/ABSENT encore à définir |
| UI/UX | Couche visuelle responsive et micro-interactions | PARTIEL | Montée en gamme de la direction artistique (identité navy/bleu/cyan/or, typographie, système d'icônes SVG, illustrations pédagogiques inline) et refonte mobile-first sur Terminal, Parcours, Leçon M0.1/Exercice/Quiz/Résultat, Progression, Ressources, Profil ; navigation, entitlements, persistance locale et PWA inchangés et revérifiés ; audit visuel Markets/Broker Hub/Support/Membership fait mais moins prioritaire ; photographie/illustration étendue, contenu M0.2+ et back-office visuel restent à faire |

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
| Analytics produit | SIMULÉ | événements locaux anonymes sur appareil |
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
