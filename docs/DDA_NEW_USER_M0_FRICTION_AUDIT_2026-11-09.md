# DDA — Audit du parcours nouvel utilisateur jusqu’à la fin de M0

**Date :** 9 novembre 2026  
**Périmètre :** landing publique → accès Academy → inscription → onboarding → M0.1 → M0.2 → M0.3 → fin du module M0  
**Viewport principal du replay UX :** 390 × 844 px  
**Version vérifiée :** `main` après les PR #236 et #235, commit de production `e86854e`

## 1. Méthode et preuves

Le parcours a été vérifié avec plusieurs niveaux de contrôle :

- landing et tunnel d’inscription sur un navigateur propre : **3 scénarios réussis, 0 échec** ;
- authentification E2E complète : **15 réussis, 0 échec** ;
- replay du parcours Academy à 390 px avec les vrais sélecteurs de l’application, de l’accès jusqu’à la validation de M0.3 ;
- contrats M0.1/M0.2/M0.3 et intégration M1 : **31 assertions ciblées réussies** ;
- régression navigateur de production du dernier déploiement : **verte** ;
- domaine officiel : landing et Academy répondent en HTTP 200 après le dernier déploiement.

Le smoke test jsdom n’a pas été comptabilisé : la dépendance `jsdom` n’est pas installée dans la sandbox. La validation navigateur réelle reste disponible et a passé les contrôles CI.

## 2. Parcours observé

### Étape A — Landing → entrée Academy

Le CTA principal **« Commencer gratuitement »** est visible et mène bien vers `academy.html#access`. La promesse est cohérente avec l’offre : démarrage gratuit, sans choix d’abonnement imposé avant l’apprentissage.

**État :** fonctionnel.  
**Friction critique :** aucune détectée.

### Étape B — Inscription

Le formulaire de création de compte est utilisable dans un contexte propre. Le mot de passe, le consentement et le bouton de soumission répondent correctement. Le faux message indiquant qu’une progression existait déjà a été supprimé pour un nouvel apprenant.

**État :** fonctionnel et corrigé en production.  
**Friction critique :** aucune détectée.

### Étape C — Onboarding

Après la soumission de l’inscription, l’écran conserve le même espace `#access`, mais passe à l’étape de calibration. Les trois choix demandés sont : niveau, objectif et temps disponible. Le CTA devient **« Construire mon parcours »**, puis l’apprenant est envoyé vers M0.1.

**Point positif :** le modèle « créer → calibrer → commencer M0.1 » est compréhensible et évite un mur de contenu avant l’action.  
**Point à surveiller :** le changement d’étape se produit à l’intérieur de la même vue. Sur mobile, il faut maintenir très visible l’indicateur `02 Calibrer` et le titre de l’étape afin que l’utilisateur comprenne qu’il ne s’agit pas d’un formulaire bloqué.

**État :** fonctionnel.  
**Sévérité :** P2 — clarté visuelle à surveiller, pas un blocage.

### Étape D — M0.1

M0.1 affiche :

- la leçon **« Le trading comme commerce »** ;
- la progression du module à 0 % ;
- une séquence guidée ;
- un bouton **« Passer à l’exercice »** ;
- un onglet séparé **« Exercice/Quiz »** ;
- un quiz verrouillé jusqu’à la réussite de l’exercice.

Le replay a confirmé le chemin : compréhension → exercice → mauvaise réponse avec feedback → bonne réponse → résultat. Le résultat affiche ensuite **« Continuer vers Support & Résistance »**.

**Point positif :** la prochaine action est déterministe et le verrou pédagogique est compréhensible.  
**Friction P2 :** l’écran mentionne actuellement **« Aucune vidéo publiée pour cette leçon »**. Le texte est honnête, mais il peut donner l’impression que M0.1 est incomplet alors que la séquence textuelle et interactive est utilisable. Ce n’est pas un défaut fonctionnel ; c’est un risque de perception produit.

### Étape E — M0.2

M0.2 affiche **« Support & Résistance »**, avance à 33 %, puis propose une observation, une identification de zone, un exercice de décision et un quiz final. Après validation, la progression passe à 67 % et la prochaine action est **« Continuer vers Lire une tendance »**.

**État :** fonctionnel.  
**Point positif :** le parcours ne promet pas un prix exact ni un signal d’achat/vente ; il enseigne l’observation d’une zone.

### Étape F — M0.3 et fin de M0

M0.3 affiche **« Lire une tendance »**, avance à 67 %, puis atteint 100 % après l’exercice et le quiz. Les trois leçons sont marquées terminées dans le rail du module.

**État :** fonctionnel.  
**Friction principale observée :** la carte de validation finale propose encore **« Continuer vers Pourquoi les prix évoluent ? »**. Cette destination correspond à M1.1, qui est Premium-gated pour un apprenant Free. L’action fonctionne — elle ouvre le garde-fou Premium — mais le libellé ressemble à une leçon immédiatement disponible. L’utilisateur peut donc croire que M0 n’est pas réellement terminé ou que le bouton est cassé lorsqu’un écran Premium apparaît.

**Sévérité :** P1 UX — confusion probable à la frontière Free/Premium, sans perte de données ni blocage technique.

## 3. Frictions classées

| Priorité | Friction | Impact | Recommandation mesurable |
|---|---|---|---|
| P1 | La fin de M0 annonce une leçon M1.1 comme prochaine action alors qu’elle est protégée Premium | Confusion sur la fin du module et sur la disponibilité réelle | Remplacer le CTA Free par **« Découvrir l’aperçu Premium : Pourquoi les prix évoluent ? »** ou afficher explicitement **« M0 terminé · voir ce que Premium débloque »**. Mesurer les clics vers la gate et les retours arrière immédiats. |
| P2 | M0.1 indique qu’aucune vidéo n’est publiée | Impression de contenu incomplet malgré un parcours utilisable | Conserver l’honnêteté mais reformuler en **« Séquence guidée disponible maintenant — vidéo à venir »**. Mesurer l’abandon avant l’exercice. |
| P2 | L’onboarding reste dans la même vue entre les étapes | Risque de ne pas percevoir le passage Créer → Calibrer | Renforcer le changement d’étape par un titre/état plus explicite, sans créer une nouvelle page. Mesurer le taux de soumission de l’étape 2. |
| P3 | Le tableau de sélection des boutons principaux contient plusieurs actions montées mais masquées | Pas visible pour l’utilisateur, mais augmente le risque de confusion dans les tests et futures évolutions | Conserver le DOM actuel si nécessaire pour les modes Login/Signup, mais auditer les états `hidden` et les labels visibles dans chaque mode. |

## 4. Ce qui ne doit pas être modifié

- Ne pas supprimer M0.1, M0.2 ou M0.3.
- Ne pas remplacer les quatre étapes pédagogiques : comprendre, essayer, vérifier, continuer.
- Ne pas ouvrir M1.1 gratuitement par accident pour résoudre le problème de libellé.
- Ne pas ajouter un nouveau dashboard ou une nouvelle rubrique uniquement pour afficher la fin de M0.
- Ne pas transformer la vidéo en prérequis : la séquence guidée actuelle permet déjà d’apprendre et de valider.

## 5. Correctif recommandé comme prochain lot

Le prochain changement doit rester limité à la cohérence Free/Premium à la fin de M0 :

1. détecter qu’un apprenant Free atteint la validation de M0.3 ;
2. conserver la preuve de module complété à 100 % ;
3. modifier le texte du CTA final pour annoncer clairement l’aperçu Premium ;
4. conserver l’ouverture de la gate Premium comme destination ;
5. vérifier que le dashboard, la progression et le rail affichent tous **M0 terminé** ;
6. ajouter un contrat de non-régression pour empêcher un CTA Free ambigu vers une leçon verrouillée.

Ce correctif améliore la compréhension sans ajouter de fonctionnalité et relie directement apprentissage, progression et découverte Premium.

## Conclusion

Le parcours d’un nouvel utilisateur fonctionne de bout en bout jusqu’à la fin de M0. Les problèmes restants ne sont pas des pannes d’inscription ou de progression. La principale amélioration mesurable concerne la **transition entre la réussite de M0 et la découverte de Premium** : l’utilisateur doit comprendre simultanément qu’il a terminé son parcours Free et que M1.1 est une possibilité Premium, pas une leçon Free immédiatement accessible.
