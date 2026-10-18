# DDA — Analyse des retours utilisateurs potentiels et plan d’évolution

**Date :** 17 octobre 2026  
**Version produit observée :** Free en production, Premium en aperçu local  
**Référence de déploiement :** commit `224c125`  
**Statut :** plan d’observation et de priorisation — aucune donnée utilisateur réelle inventée

## 1. Lecture exécutive

Le produit est techniquement prêt pour un **pilote Free contrôlé**. Les risques principaux de la prochaine phase ne sont pas des erreurs de code déjà connues, mais des écarts possibles entre :

- ce que DDA veut expliquer et ce que le visiteur comprend en quelques secondes ;
- la progression conçue et la prochaine action réellement identifiée par l’apprenant ;
- la valeur pédagogique de Free et la valeur supplémentaire perçue de Premium ;
- la persistance locale annoncée et les attentes naturelles d’un utilisateur qui pense avoir créé un compte ;
- un aperçu Premium honnête et la perception possible d’un produit déjà commercialisable.

**Décision recommandée :** ne pas ajouter de nouvelles surfaces majeures avant d’avoir observé 5 à 8 apprenants, classé les retours par gravité et corrigé les blocages reproduits.

## 2. Ce qui doit être appris avant de construire davantage

### Questions produit prioritaires

1. Un débutant comprend-il la promesse de DDA Free sans explication orale ?
2. Sait-il où cliquer pour commencer et où il se trouve après l’inscription ?
3. Comprend-il pourquoi l’onboarding pose des questions sur son niveau, son objectif et son temps ?
4. Distingue-t-il une leçon, un exercice, un quiz, une preuve et une entrée Journal ?
5. Comprend-il que les graphiques sont pédagogiques et non des signaux ?
6. Retrouve-t-il sa prochaine action après un rechargement ou une interruption ?
7. Comprend-il que la progression est locale et qu’elle peut disparaître avec les données du navigateur ?
8. Perçoit-il Premium comme une profondeur de pratique ou simplement comme « plus de contenu » ?
9. Identifie-t-il clairement ce qui est disponible, local, futur ou non activé ?
10. Sait-il quel canal utiliser lorsqu’il bloque : FAQ, e-mail, Telegram ou WhatsApp ?

## 3. Retours utilisateurs potentiels à surveiller

| Zone | Feedback probable | Risque | Preuve à recueillir | Priorité initiale |
|---|---|---|---|---|
| Landing | « Je comprends l’idée, mais je ne sais pas ce que je vais faire concrètement. » | Abandon avant accès | Reformulation spontanée de la promesse et clic initial | P0 |
| Landing | « Free est gratuit, mais qu’est-ce que je termine réellement ? » | Valeur perçue faible | Demander au participant de décrire le résultat de Free | P0 |
| CTA | « Commencer gratuitement » est visible mais le parcours suivant paraît différent | Rupture de confiance | Observation du premier clic jusqu’à l’onboarding | P1 |
| Onboarding | « Pourquoi me demande-t-on ces informations ? » | Réponses arbitraires ou abandon | Temps, hésitations et verbatim sur chaque champ | P0 |
| Onboarding | Les choix mobile ressemblent à un formulaire long | Friction sur iPhone SE / petits écrans | Nombre de retours arrière, clavier et débordement | P1 |
| M0.1 | « Je ne sais pas si je dois lire, répondre ou valider. » | Blocage pédagogique | Première action sans aide | P0 |
| Exercice / quiz | « Quelle est la différence entre les deux ? » | Validation superficielle | Reformulation après une réponse correcte et incorrecte | P0 |
| M0.2 | « Support et résistance sont des lignes exactes » | Mauvaise compréhension de la notion | Langage utilisé par l’apprenant dans l’explication | P1 |
| Terminal | « Est-ce un signal d’achat ? » | Risque de mauvaise interprétation | Question posée spontanément devant la série synthétique | P0 |
| Parcours | « Pourquoi certains modules sont verrouillés ? » | Impression de produit incomplet | Compréhension de la notion de prérequis | P1 |
| Progression | « Je vois des chiffres, mais je ne sais pas quoi faire ensuite. » | Perte de momentum | Prochaine action citée sans aide | P1 |
| Journal | « Est-ce que j’écris une prédiction ou une observation ? » | Confusion méthodologique | Première entrée produite et termes employés | P0 |
| Stockage local | « J’ai créé un compte, donc je pensais retrouver mes données ailleurs. » | Déception future / perte de données | Question posée sur appareil secondaire ou après nettoyage | P0 |
| Mobile | « Le bouton est trop bas, petit ou masqué par le clavier. » | Abandon technique | Tests SE, Android étroit, Fold fermé | P1 |
| Support | « Je ne sais pas si je dois écrire par e-mail ou Telegram. » | Demandes dispersées | Canal choisi pour trois scénarios de support | P1 |
| Premium | « Je peux déjà l’utiliser, pourquoi payer plus tard ? » | Mauvaise compréhension du statut | Reformulation de la différence aperçu / abonnement | P0 |
| Premium | « Le Premium ajoute des outils, mais pas encore de service serveur. » | Valeur commerciale prématurée | Carte de valeur retenue spontanément | P1 |
| Confiance | « Les mentions provisoires me font hésiter. » | Frein à l’activation commerciale | Note de confiance après lecture des pages légales | P1 |
| Accessibilité | « Les mouvements ou contrastes me fatiguent. » | Exclusion d’une partie du public | Observation clavier, zoom, réduction de mouvement | P1 |

## 4. Protocole de feedback recommandé

### Cohorte initiale

- **5 à 8 participants** ; majorité débutants, au maximum deux personnes déjà familières des marchés.
- Un identifiant de test par participant ; aucune donnée bancaire, pièce d’identité, mot de passe ou connexion de courtier.
- Au moins : deux téléphones, un ordinateur portable et un écran étroit type iPhone SE / Galaxy Fold fermé.
- Une séance observée de 30 à 45 minutes, puis une période libre de 3 à 7 jours.

### Règles d’observation

1. Ne pas expliquer le bouton ou la notion avant que l’hésitation soit observée.
2. Demander : **« Que penses-tu devoir faire maintenant ? »** plutôt que **« Est-ce clair ? »**.
3. Noter le premier moment où le participant relit une consigne, revient en arrière ou demande de l’aide.
4. Capturer les mots exacts, sans les transformer immédiatement en interprétation produit.
5. Rejouer chaque anomalie avant de la classer comme défaut.
6. Séparer les problèmes de compréhension, contenu, interface, accessibilité et technique.

### Fiche minimale par session

```text
ID test :
Appareil / navigateur / largeur approximative :
Niveau déclaré :
Durée :
Étape atteinte sans aide :
Première hésitation :
Première incompréhension :
Verbatim exact :
Erreur technique reproduite :
Confusion apprentissage / signal : Oui / Non
Compréhension du stockage local : Oui / Non
Compréhension Free / Premium : Oui / Non
Suggestion prioritaire :
Consentement pour analyse interne : Oui / Non
```

## 5. Grille de sévérité

- **P0 — Bloquant :** empêche de commencer, de progresser, de comprendre une notion essentielle ou crée une interprétation financière dangereuse.
- **P1 — Majeur :** provoque une hésitation répétée, un abandon probable ou une fausse attente sur le produit.
- **P2 — Important :** gêne l’expérience mais possède un contournement clair.
- **P3 — Amélioration :** détail visuel, éditorial ou confort sans impact immédiat sur le parcours.

Une correction ne devient prioritaire qu’après au moins une reproduction fiable ; un feedback isolé reste une hypothèse à investiguer.

## 6. Évolutions recommandées par phase

### Phase 0 — Observer avant d’ajouter (maintenant)

- Exécuter le pilote Free avec la checklist existante.
- Consolider les verbatims par étape et par appareil.
- Produire une liste courte des 5 problèmes les plus fréquents.
- Ne publier aucun témoignage ni taux de réussite sans consentement et vérification.
- Conserver le message honnête : progression locale, vidéos en préparation, Premium non payant.

**Sortie attendue :** une décision documentée sur les corrections P0/P1, pas une nouvelle fonctionnalité.

### Phase 1 — Réduire la friction de compréhension

À déclencher uniquement selon les retours reproduits :

- reformuler la promesse de la landing en résultat concret du parcours Free ;
- ajouter une micro-explication de l’onboarding au moment où les questions apparaissent ;
- rendre la séquence « leçon → exercice → quiz → preuve → prochaine action » plus explicite ;
- renforcer les libellés du Terminal pour éloigner toute lecture de signal ;
- afficher la prochaine action dans Progression et après chaque validation ;
- rendre la nature locale du stockage visible au moment où le profil est créé, pas seulement dans les documents.

**Critère de sortie :** les participants peuvent expliquer leur prochaine action et la nature du produit sans aide.

### Phase 2 — Renforcer la boucle pédagogique

- Ajouter des explications contextualisées après les erreurs récurrentes, pas seulement « retry ».
- Relier plus clairement chaque entrée Journal à la leçon source et à la notion travaillée.
- Ajouter un résumé de fin de module : acquis, point à revoir, action suivante.
- Ajuster le vocabulaire selon les mots réellement utilisés par les débutants.
- Produire les premières vidéos uniquement pour les notions où elles réduisent une incompréhension observée.

**Critère de sortie :** une vidéo ou une nouvelle interface résout un problème identifié ; elle n’est pas ajoutée pour remplir une roadmap.

### Phase 3 — Préparer Premium sans brûler les étapes

- Tester la compréhension de la promesse Premium localement, sans paiement.
- Définir une proposition commerciale courte : pour qui, quelle transformation pédagogique, quelles limites.
- Transformer les six zones de valeur en livrables vérifiables : plan de risque, décision contrôlée, preuve, revue, ressources, progression.
- Décider ce qui doit être serveur et ce qui peut rester local.
- Déployer le BFF et Supabase en staging avant toute activation publique.
- Tester checkout → webhook signé → entitlement → accès → révocation.
- Tester l’export, la suppression, les conflits de synchronisation et la reprise après panne.

**Critère de sortie :** aucun bouton de vente public tant que l’accès Premium ne dépend pas d’un entitlement serveur vérifié.

### Phase 4 — Préparer l’ouverture commerciale

- Compléter l’identité légale, les conditions de vente, le prix, la devise, le remboursement et la résiliation.
- Valider Chariow en sandbox avec produits réels de test.
- Vérifier les logs, la limitation de débit, les cookies sécurisés et les origines autorisées.
- Réaliser une revue humaine Go / No-go.
- Refaire une cohorte de validation après les changements de compte et de paiement.

## 7. Instrumentation à ajouter seulement si elle reste compatible avec la vie privée

Les événements utiles peuvent rester agrégés et pseudonymes :

- `landing_cta_click` ;
- `signup_started`, `signup_completed`, `qualification_completed` ;
- `lesson_started`, `exercise_attempt`, `quiz_completed` ;
- `journal_entry_created` ;
- `progression_next_action_clicked` ;
- `support_route_opened` ;
- `premium_preview_opened` ;
- `local_storage_notice_seen`.

Ne pas envoyer à un outil externe : nom, e-mail, réponses détaillées, contenu du Journal, données financières, identifiant de compte ou verbatim brut. Les événements doivent servir à localiser une friction, jamais à fabriquer une preuve de réussite.

## 8. Décisions à prendre par le propriétaire DDA

1. Qui compose la première cohorte et qui observe les sessions ?
2. Quel canal sécurisé reçoit les fiches de retour anonymisées ?
3. Quelle juridiction et quelle identité juridique porteront l’offre commerciale ?
4. Premium sera-t-il mensuel, annuel, ponctuel ou hybride ?
5. La synchronisation multi-appareils est-elle requise au lancement Premium ?
6. Quelles vidéos doivent être produites en premier après observation ?
7. Quelle politique de support et de remboursement sera réellement tenue ?
8. Quelle date cible de staging est réaliste pour BFF, Supabase et Chariow ?

## 9. Règle de décision pour les prochaines demandes

Avant toute évolution, répondre à ces cinq questions :

1. Quel feedback réel ou risque reproductible cette évolution traite-t-elle ?
2. Quelle étape du parcours est améliorée ?
3. Comment vérifiera-t-on que le changement aide sans créer une fausse promesse ?
4. La modification touche-t-elle la sécurité, la confidentialité, le paiement ou le statut légal ?
5. Peut-elle être livrée sans présenter comme disponible un service qui ne l’est pas ?

Si une réponse est inconnue, l’action correcte est d’observer ou de préparer en staging, pas de publier une fonctionnalité ambiguë.

## 10. Prochaine séquence d’exécution

1. Recruter 5 à 8 participants Free.
2. Exécuter les sessions sur mobile et desktop avec observation silencieuse.
3. Regrouper les retours dans la grille P0/P1/P2/P3.
4. Reproduire les trois premiers problèmes avant correction.
5. Livrer une petite passe UX testable.
6. Rejouer le même scénario avec une seconde observation.
7. Mettre à jour la FAQ et les textes publics uniquement selon les incompréhensions confirmées.
8. Continuer la préparation vidéo et Premium en parallèle, sans encaissement.

> **Décision recommandée :** le prochain livrable produit doit être un pilote Free mesuré et une passe UX issue de retours réels, pas une nouvelle couche Premium ou un nouveau décor visuel.
