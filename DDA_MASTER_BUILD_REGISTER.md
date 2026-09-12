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
| Apprenant | Parcours M0–M9 | PARTIEL | M0.1 actif ; architecture des autres modules à compléter |
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
| Système | Loading / empty / locked / success / offline / error | PARTIEL | États principaux présents, couverture à homogénéiser |
| UI/UX | Couche visuelle responsive et micro-interactions | PARTIEL | Profondeur, transitions, focus et feedback renforcés ; audit multi-appareils restant |

## Fondations produit et données

| Fondation | État | Limite actuelle |
|---|---|---|
| Modèle utilisateur | SIMULÉ | localStorage uniquement |
| Curriculum module → leçon → pratique → évaluation | PARTIEL | M0.1 réel, modèle réutilisable en cours de formalisation |
| Learning Engine state helpers | CONSTRUIT | États et prochaine action centralisés côté frontal local |
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
