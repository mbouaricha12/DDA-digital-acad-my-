# DDA — audit de clarté produit & version commercialisable (pré-lancement)

Date : 5 novembre 2026  
Objectif : préparer une ouverture publique progressive dès la semaine prochaine, sans confondre fonctions disponibles, démonstrations et chantiers futurs.

## 1. Décision produit — ce qui peut être proposé maintenant

### DDA Free — offre d'entrée réellement utilisable
- Parcours de fondations de l'Academy et leçons publiées.
- Exercices, quiz, feedback et possibilité de recommencer.
- Journal et progression enregistrés localement dans le navigateur/appareil.
- Terminal et séries de marché explicitement pédagogiques/synthétiques.
- Accès sans carte bancaire ni paiement.

**Limite à afficher partout :** progression locale, non synchronisée au serveur et non sauvegardée automatiquement. Changement d'appareil ou effacement du navigateur peut faire perdre les données.

### DDA Lab — pilote pédagogique
- LAB1–LAB3 accessibles selon le parcours Free.
- Les missions sont des exercices d'apprentissage (notamment IA), pas une promesse de résultat.
- LAB4 et capstone : contenus Premium en préparation / gated selon la configuration actuelle.

### DDA Premium — ne pas vendre comme abonnement actif
- Leçons et éléments de démonstration existent.
- Paiement, checkout, entitlement et renouvellement ne constituent pas encore un parcours commercial complet.
- Aucun tarif, prélèvement ou abonnement ne doit être présenté comme actif tant que le paiement réel et les droits serveur ne sont pas validés.

## 2. Parcours visiteur attendu

1. **Comprendre en quelques secondes :** DDA enseigne à comprendre les marchés, pratiquer un raisonnement et garder une trace des apprentissages.
2. **Choisir un point de départ :** « Commencer gratuitement » doit rester l'action principale et conduire à l'accès Free, pas à un écran ambigu.
3. **Savoir quoi faire :** première leçon recommandée, exercice/quiz, feedback, prochaine action.
4. **Comprendre la limite :** les données pédagogiques ne sont pas des cotations live; DDA ne donne ni signal ni conseil d'investissement.
5. **Voir la suite sans fausse promesse :** espaces « En préparation » étiquetés clairement; Premium présenté comme aperçu/démonstration tant que paiement non activé.

## 3. État éditorial repéré sur la landing

La page présente déjà une promesse forte et plusieurs informations honnêtes, mais elle est longue et répète certains concepts :
- « Learn / Practice / Prove » et la progression par preuve reviennent plusieurs fois.
- Plusieurs blocs décrivent des aperçus du produit avant que le nouveau visiteur ne sache quelle action choisir.
- Les statuts « Actif », « Aperçu local » et « En préparation » doivent rester cohérents dans tous les menus, cartes, FAQ et CTA.
- Les chiffres de leçons doivent distinguer les fondations Academy du contenu Lab ajouté.
- Les termes « terminal », « Journal », « Market Intelligence », « Lab » et « Premium » doivent être expliqués au premier usage.

## 4. Back-office — état observé

Le back-office accessible dans `dist/admin.html` est un outil d'administration de comptes, pas un CMS éditorial :
- Aperçu
- Utilisateurs
- Abonnements
- Export CSV de la page utilisateurs
- Retour Academy / déconnexion

Il n'est donc pas « rempli » de modules administratifs nombreux; le besoin principal est la **lisibilité des libellés et la séparation des fonctions**. Ne pas ajouter des rubriques qui n'ont pas de données ni d'action opérationnelle. Les tables doivent afficher un état vide explicite, un chargement, une erreur et la pagination clairement.

## 5. Transparence obligatoire (checklist de lancement)

- [ ] Free : aucun paiement, aucune carte bancaire, aucune promesse de sauvegarde cloud.
- [ ] Progression : « enregistrée sur cet appareil » et avertissement de perte possible.
- [ ] Premium : « aperçu / en préparation », aucun checkout actif.
- [ ] AI : assistant DDA non actif tant que le BFF indique `ai_not_configured`; ne pas afficher une conversation comme service disponible.
- [ ] Marchés : BRVM et autres graphiques identifiés « série pédagogique/synthétique », pas de flux live.
- [ ] Brokers/affiliation : aucun lien partenaire actif sans disclosure, vérification réglementaire et conditions visibles.
- [ ] Communauté, Experts, Live, Business : étiquette « En préparation » et CTA non trompeur.
- [ ] CGU, risques, confidentialité, contact et support accessibles depuis l'entrée publique.

## 6. Priorités avant ouverture (ordre de travail)

### P0 — bloquant
1. Corriger et obtenir une CI verte sur PR #197 (syntax, contracts, E2E, browser regression).
2. Vérifier que le CTA « Commencer gratuitement » conduit bien au parcours Free et que le premier exercice est visible/exécutable.
3. Vérifier mobile (390 px), navigation retour, état de progression et sortie d'une leçon.
4. Repasser toutes les promesses Premium/AI/market data et retirer toute formulation qui suggère une disponibilité inexistante.

### P1 — forte valeur
5. Simplifier la landing : moins de répétitions, une hiérarchie claire « Qu'est-ce que DDA ? / commencer / ce qui est inclus / limites / suite ».
6. Harmoniser le vocabulaire et les statuts sur landing, Academy, FAQ, commencer, Premium et navigation.
7. Back-office : libellés cohérents, états vides/erreurs et contrôle des accès, sans ajouter de fonctions non nécessaires.

### P2 — après ouverture progressive
8. Synchronisation de progression, paiement Chariow et Premium serveur, assistant IA opérationnel, espaces communautaires.
9. Développement des modules avancés uniquement à partir des retours utilisateurs.

## 7. Règle de validation
Une fonctionnalité n'est « disponible » que si elle est accessible à un utilisateur cible, fonctionne sur le parcours réel, a été testée et présente ses limites. Une maquette ou un écran de démonstration ne vaut pas une fonctionnalité commerciale.

**Position recommandée :** ouvrir d'abord DDA Free comme produit pédagogique autonome, puis annoncer les extensions à mesure qu'elles sont vérifiées. Ne pas vendre Premium avant l'activation et le test du paiement + droits d'accès.
