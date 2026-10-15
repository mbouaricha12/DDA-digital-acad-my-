# DDA — Audit complet Free, vidéos et Premium

**Date :** 15 octobre 2026  
**Branche :** `feat/dda-free-to-premium-foundation`  
**Base :** `baeea2c` — main fusionné  
**Règle d’audit :** un élément n’est `TERMINÉ` qu’après inspection du contenu, du runtime et des contrats associés.

## 1. Synthèse

Le dépôt contient une base fonctionnelle et testée pour le parcours Free local, un ensemble de leçons M0 et M1 authored, un Journal local, un Terminal pédagogique et une vertical slice Premium P2 locale. La suite de régression existante confirme les parcours principaux.

En revanche, le dépôt ne contient aucun fichier vidéo ni URL vidéo publiée. Les composants vidéo existent comme infrastructure de fallback, mais aucune vidéo de cours ne peut être marquée publiée. Le paiement, les abonnements, les droits serveur et la synchronisation multi-appareils restent bloqués par l’absence de backend configuré et de choix de fournisseur.

## 2. Inventaire des leçons

| Élément | Statut | Preuve / limite |
|---|---|---|
| M0.1 — leçon d’introduction | TERMINÉ | Contenu authored, exercice, quiz, pratique, progression et contrat M0 validés. |
| M0.2 — Support & Résistance | TERMINÉ | Contenu authored, 4 pratiques, challenge, quiz, prérequis M0.1 et tests de pratique validés. |
| M0.3 — Lire une tendance | TERMINÉ | Contenu authored, 3 pratiques, challenge, quiz, prérequis M0.2 et tests de progression validés. |
| M1.1 — Pourquoi les prix évoluent ? | TERMINÉ | Fichier authored dédié, pratiques pression/équilibre, exercice et quiz ; accès `advanced_modules`. |
| M1.2 — Comment les ordres s’exécutent ? | TERMINÉ | Fichier authored dédié, ordres marché/limite, spread, slippage, exercice et quiz ; contrat d’ordre validé. |
| M1.3 — Comment les marchés s’organisent ? | TERMINÉ | Fichier authored dédié, acteurs/types/organisation, exercice et quiz ; registre et absence de leçon fantôme validés. |
| P2.1 — Risk Before Entry | TERMINÉ comme démonstration locale | Leçon authored Premium P2, quiz et preuve locale ; aucun droit serveur. |
| P2.2 — The Anatomy of a Controlled Trade | TERMINÉ comme démonstration locale | Leçon authored Premium P2, quiz et passage vers Lab ; aucun paiement ni accès serveur. |
| M2 et modules ultérieurs | MANQUANT / planifié | L’interface indique honnêtement que les prochains modules seront disponibles ultérieurement. |

## 3. Inventaire des vidéos

| Catégorie | Statut | Constat |
|---|---|---|
| Fichiers vidéo locaux MP4/WebM/MOV | MANQUANT | Aucun fichier vidéo trouvé dans `dist/` ou le dépôt. |
| URLs Vimeo/YouTube publiées dans les leçons | MANQUANT | Le renderer accepte des embeds Vimeo sûrs, mais aucune vidéo n’est déclarée dans les contenus inspectés. |
| Lecteur vidéo | PARTIEL | Le renderer supporte vidéo directe, Vimeo HTTPS, chargement, fallback et état d’erreur. |
| Miniatures vidéo | MANQUANT | Aucun média vidéo publié ne justifie une miniature de cours. |
| Fiches de production | MANQUANT | Les vidéos nécessitent encore les décisions de contenu, d’enregistrement et d’hébergement. |
| Vidéos Free publiées | MANQUANT | Ne pas présenter les écrans de fallback « Vidéo bientôt disponible » comme des vidéos publiées. |
| Vidéos Premium publiées | MANQUANT | Aucun fichier ou URL Premium réellement fourni. |

**Action bloquée :** il faut recevoir ou produire les vidéos, leurs droits, leur hébergement et leurs métadonnées avant intégration. Aucune URL fictive ne doit être créée.

## 4. Inventaire des outils Free

| Outil | Statut | Limite actuelle |
|---|---|---|
| Parcours et leçons M0 | TERMINÉ | Progression locale sur l’appareil. |
| Exercices et quiz | TERMINÉ | Résultats pédagogiques locaux, pas une certification. |
| Terminal d’observation | TERMINÉ | Série pédagogique locale, sans données temps réel ni signal. |
| Tracés et pratique Terminal | TERMINÉ | Preuve locale et handoff vers Journal testés. |
| Journal | TERMINÉ | Création, modification, suppression, échappement HTML et persistance locale. |
| Plan d’apprentissage | TERMINÉ | Formulaire local, sauvegarde locale et affichage d’état. |
| Fil de maîtrise / Progression | TERMINÉ | Reflète les validations locales et explicite les limites. |
| Market Intelligence | PARTIEL | Surface éditoriale/pédagogique ; ne constitue pas une source temps réel ni un signal. |
| Broker Hub | PARTIEL | Fiches de critères et structure testées ; aucune recommandation ni exécution. |
| Support | PARTIEL | Interface de support présente ; formulaire local/non connecté. |
| Communauté / notifications | PARTIEL | Préférences locales uniquement ; aucune inscription serveur réelle. |
| Profil | TERMINÉ localement | Profil et préférences dans le navigateur ; pas de compte serveur en production. |

## 5. Inventaire des outils Premium

| Outil | Statut | Limite actuelle |
|---|---|---|
| Premium Track P2 | TERMINÉ comme démo locale | Déverrouillage local simulé ; pas une autorisation sécurisée. |
| P2.1 Risk Before Entry | TERMINÉ comme démo locale | Contenu et quiz authored ; scénarios synthétiques. |
| P2.2 Controlled Trade | TERMINÉ comme démo locale | Contenu et quiz authored ; aucune donnée de marché réelle. |
| Risk Plan Lab | TERMINÉ comme démo locale | Validation pédagogique locale, exemple de risque éducatif ; pas un calculateur universel. |
| Controlled Decision Assessment | TERMINÉ comme démo locale | Crée une preuve locale ; ce n’est pas une certification officielle. |
| Skill Evidence / preuve | TERMINÉ comme démo locale | Stockage local ; non vérifiable côté serveur. |
| Weekly Review | TERMINÉ comme démo locale | Relecture des entrées locales ; pas de synchronisation. |
| Aperçu certification | PARTIEL | Surface et preuve locale présentes ; aucune certification officielle. |
| Calculateur de risque universel | MANQUANT | Aucun support complet des instruments, devises, valeurs de point et courtiers. |
| Calculateur Risk/Reward | MANQUANT | Aucun outil dédié identifié. |
| Taille de position | MANQUANT | Aucun outil universel et validé identifié. |
| Tableau de bord performance | MANQUANT | Les données disponibles ne permettent pas de calculer une performance financière réelle. |
| Statistiques trading | MANQUANT | Aucun jeu de trades réels ni métriques fiables de drawdown/gains/pertes. |
| IA connectée | MANQUANT | Aucun service IA public connecté dans le prototype. |
| Abonnement et droits Premium | BLOQUÉ | Backend, fournisseur de paiement, webhooks, base de données et modèle d’entitlements à fournir. |

## 6. Persistance et sécurité

Le prototype utilise principalement `localStorage` pour l’état pédagogique et `sessionStorage` pour une mémoire de navigation limitée à l’onglet. Les données locales peuvent contenir le profil de démonstration, l’e-mail saisi, la progression, le Journal, le Plan, les preuves et certains événements de diagnostic.

Le BFF est prévu via `DDA_BFF_BASE_URL`, `bff-client.js` et des routes d’authentification, mais aucune base URL publique n’est configurée dans la version déployée. Le mode local reste donc la source de vérité du prototype Free.

Le champ local de plan Premium ne doit jamais être traité comme une autorisation serveur. La prochaine implémentation doit valider les droits côté serveur à partir d’un abonnement confirmé par webhook signé et idempotent.

## 7. Correction appliquée pendant cet audit

La politique de confidentialité affichée dans `dist/public.js` indiquait encore que le contact relatif aux données restait à confirmer, alors que l’adresse officielle DDA avait été fournie et publiée dans le footer. Le texte a été corrigé pour afficher `dariusdigitalacademy@gmail.com`, tout en maintenant l’avertissement que l’identité juridique complète doit être complétée avant une ouverture commerciale.

Les dates des documents légaux affichés ont été actualisées au 15 octobre 2026.

## 8. Décision de lancement

**DDA Free :** prêt pour un pilote contrôlé, sous réserve de validation pédagogique avec de vrais utilisateurs.  
**Vidéos :** non prêtes ; aucune vidéo ne doit être annoncée comme publiée.  
**Premium local :** prêt pour démonstration et test pédagogique, pas pour vente.  
**Premium commercial :** à terminer avant toute vente.  
**Paiement et abonnement :** bloqués par des choix et ressources externes : fournisseur, compte marchand, backend, base de données, sécurité, fiscalité et validation juridique.

## 9. Prochaine séquence recommandée

1. Tester le parcours Free avec un petit groupe d’apprenants.
2. Compléter les contenus ou consignes qui provoquent une incompréhension réelle.
3. Produire et héberger les vidéos réellement retenues.
4. Définir l’offre Premium à partir des besoins observés, sans multiplier les outils artificiellement.
5. Choisir le fournisseur d’authentification, de base de données et de paiement.
6. Implémenter d’abord les comptes et la synchronisation Free.
7. Implémenter ensuite les entitlements Premium côté serveur.
8. Tester le paiement en sandbox et les webhooks avant toute activation publique.

## 10. Passe motion/design institutionnelle — 15 octobre 2026

La landing a reçu une couche de motion légère et orientée conversion : entrée progressive du message principal, ligne de navigation institutionnelle, micro-interaction de balayage sur les CTA, respiration du visuel 3D CSS, animation douce des appareils et accentuation contrôlée des cartes interactives. Les mouvements ne portent aucune information essentielle et sont neutralisés avec `prefers-reduced-motion: reduce`.

Le hero a aussi été resserré pour les très petites hauteurs et largeurs : le CTA principal reste visible à 280×653, 375×667, 717×512 et 1440×900, sans débordement horizontal. La vérification navigateur finale a confirmé la présence de la landing, du CTA et de la scène 3D à ces formats.

Enfin, le libellé `Parcours M0–M9` a été remplacé par `Parcours DDA` et `Certification` par `Aperçu de certification`, afin de ne pas suggérer que les modules futurs ou une certification officielle sont déjà disponibles.
