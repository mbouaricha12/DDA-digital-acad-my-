# DDA — Structure Guardrails & Trust Contract

**Statut :** garde-fous actifs du prototype local

Ce document protège la structure produit validée. Il ne crée aucune nouvelle
fonctionnalité, aucun backend et aucune connexion externe.

## 1. Frontières non négociables

### Surface publique — `#landing`

Mission : expliquer DDA, sa méthode, sa valeur et sa prochaine étape.

La navigation publique reste **éditoriale et interne à la landing** :

- Accueil ;
- La méthode ;
- Le produit ;
- DDA Free ;
- Domaines ;
- Vision.

Les seules sorties vers l’application sont des CTA explicites vers `#access` :
connexion, inscription ou démarrage gratuit.

La landing ne doit pas devenir un menu déguisé du Dashboard. Elle ne doit pas
renvoyer directement vers Parcours, Journal, Progression, Ressources,
Market Intelligence ou Communauté depuis son header principal.

### Surface authentification — `#access`

Mission : créer ou reprendre un accès local et compléter l’onboarding.

Elle ne doit pas afficher le chrome apprenant ni donner l’impression qu’un
compte est déjà actif. Les formulaires restent contrôlés par JavaScript et
fail-closed avant initialisation.

### Surface apprenant

Missions distinctes et protégées : Dashboard, Parcours, leçons, Progression,
Journal, Ressources, Market Intelligence, Communauté, Profil et Premium.

Toute vue apprenant doit passer par le registre `viewPermissions` et par
`DDA.can(...)`. Aucun lien visuel ne constitue une autorisation.

## 2. Règles de confiance

- Les visiteurs ne peuvent pas atteindre directement les surfaces apprenant.
- Les états différés sont visibles uniquement comme **« bientôt »** ou comme
  aperçu clairement simulé ; ils ne doivent pas exposer de route active.
- Les séries de marché affichées dans la landing restent synthétiques et
  pédagogiques ; elles ne doivent jamais être présentées comme des données
  temps réel, un signal ou une recommandation.
- Le prototype ne collecte pas de données personnelles réelles et ne connecte
  ni paiement, ni broker, ni IA, ni source de marché réelle.
- La progression doit rester fondée sur des preuves ou événements réellement
  enregistrés, jamais sur une barre décorative.
- Le shell public ne doit pas exposer le prototype banner, la sidebar ou les
  contrôles apprenant.
- La politique `no-referrer` et le comportement fail-closed des formulaires
  doivent rester en place.

## 3. Garde-fous automatisés

Le contrat `tests/test_landing_structure_contract.js` protège la structure
éditoriale de la landing.

Le contrat `tests/test_surface_boundary_contract.js` protège :

- la séparation public / authentification / app ;
- l’absence de bypass de permissions dans la navigation publique ;
- le registre de permissions et l’appel `DDA.can(...)` ;
- les entitlements visitor/free/premium ;
- les fonctionnalités différées ;
- les marqueurs fail-closed et la politique de referrer ;
- le masquage du chrome prototype sur la landing.

La CI existante exécute automatiquement tous les fichiers `tests/test_*.js` via
le product gate. Une modification de structure qui casse un invariant doit donc
échouer avant livraison.

## 4. Protocole obligatoire avant toute modification future

1. **Observer** : identifier la surface et sa mission primaire.
2. **Vérifier** : confirmer la source de vérité et le permission gate concerné.
3. **Modifier au minimum** : ne pas déplacer une route pour résoudre un problème
   de contenu ou de style.
4. **Ajouter ou ajuster un contrat** si un invariant nouveau apparaît.
5. **Exécuter** les contrats ciblés puis toute la suite `tests/test_*.js`.
6. **Vérifier** la navigation dans un navigateur sur desktop et mobile.
7. **Inspecter** le diff, les marqueurs de conflit et les changements de surface.
8. **Documenter** la décision et la limite dans le registre produit.

## 5. Interdictions de régression

Ne pas :

- remettre les routes apprenant dans le header de la landing ;
- transformer un libellé « bientôt » en bouton fonctionnel sans décision validée ;
- contourner `showView()` ou `viewPermissions` pour aller plus vite ;
- mélanger le contenu d’acquisition et les données personnelles apprenant ;
- remplacer une preuve réelle par un indicateur décoratif ;
- connecter une source externe ou une capacité future sans validation écrite ;
- supprimer un contrat parce qu’il bloque une modification de présentation.

> **Principe de confiance :** une évolution DDA doit pouvoir expliquer sa
> frontière, sa permission, sa source de vérité, son état différé et son test de
> non-régression avant d’être considérée comme sûre.
