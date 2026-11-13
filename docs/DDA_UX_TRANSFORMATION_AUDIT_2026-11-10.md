# DDA — Audit UX de transformation

Date : 10 novembre 2026.

## Périmètre et méthode

Audit réalisé avant modification du produit, conformément au cahier des charges « DDA — UX Transformation ».

Périmètre : landing, pages publiques, Academy, Dashboard, parcours, leçons, Journal, Progression, Profil, Premium, ressources, univers en préparation et Back-office.

Contrôles effectués :

- lecture de la structure HTML/JS/CSS et des routes déclarées ;
- inventaire des vues `data-view` et des liens inter-pages ;
- recherche des marqueurs techniques, répétitions, états vides et placeholders ;
- ouverture des pages publiques dans Chromium sur desktop 1440×1000 et mobile 390×844 ;
- détection des erreurs JavaScript et des pages sans titre ou contenu ;
- vérification de l’alignement avec l’architecture existante : HTML/CSS/JS vanilla, BFF et état local/remote conservés.

## Verdict global

La base est exploitable et déjà riche : les pages publiques sont présentes, les parcours Free et Premium existent, les contenus pédagogiques authored sont disponibles, le BFF est branché et les contrôles de navigation passent globalement.

L’expérience donne toutefois encore par endroits l’impression d’un produit de démonstration technique plutôt que d’une Academy commercialisable. Le principal problème n’est pas l’absence de fonctionnalités, mais la hiérarchie : les limites techniques prennent parfois la place de la proposition pédagogique, tandis que certaines vues avancées sont difficiles à découvrir sans connaître les identifiants internes du produit.

## Constats par surface

### 1. Landing page

**Forces**

- proposition Free claire et CTA « Commencer gratuitement » répété de manière cohérente ;
- garde-fous sérieux sur les signaux, les données de marché et les promesses financières ;
- accès vers les pages publiques, FAQ, communauté et espaces futurs ;
- contenu responsive et absence d’erreur JavaScript observée.

**Points à corriger**

- la barre et plusieurs cartes utilisent encore « aperçu local », « en préparation », « série locale », « prototype » et des mentions techniques répétées ;
- les mêmes informations sont exposées à plusieurs endroits : statut des espaces, limites de données, nature pédagogique, stockage local ;
- des chips d’écosystème ressemblent à des fonctionnalités activées alors que plusieurs ouvrent seulement une vue de statut ;
- la hiérarchie CTA pourrait mieux séparer « commencer le parcours Free » de « découvrir l’offre Premium » ;
- l’erreur du scan textuel sur la landing vient de mots comme « local »/« prototype » et non d’un écran vide, mais cela confirme que le langage produit reste trop technique.

**Priorité** : P0 avant lancement commercial.

### 2. Pages publiques et footer

**Forces**

- les 17 URLs du sitemap répondent `200` en production ;
- les pages À propos, FAQ, Risques, Accessibilité, Contact et pages légales ont un contenu réel ;
- les liens de retour et d’accès à l’Academy sont présents ;
- pas de page publique vide détectée.

**Points à corriger**

- les pages Live, Business, Experts et Communauté restent principalement des pages de statut ; elles sont honnêtes, mais trop légères pour soutenir une conversion ;
- la navigation documentaire est très répétitive et pourrait être regroupée en catégories « Comprendre DDA », « Apprendre », « Confiance » ;
- le footer de la landing mélange liens actifs, pages informatives et états futurs dans une même densité visuelle ;
- les documents publics restent parfois plus administratifs que pédagogiques.

**Priorité** : P1, après clarification de la landing.

### 3. Academy / Dashboard

**Forces**

- navigation persistante vers Accueil, Parcours, Journal, Progression et Profil ;
- présence d’un bloc de reprise d’apprentissage et de progression ;
- accès aux ressources, au parcours Premium et aux exercices ;
- l’architecture des vues existe déjà et ne nécessite pas de migration.

**Points à corriger**

- la bannière permanente « Version d’apprentissage DDA » est explicitement contraire au cahier des charges ; elle doit devenir un statut contextuel discret ou disparaître de l’interface normale ;
- le dashboard mélange orientation, explications de stockage, statut produit et contenu pédagogique ;
- le nom par défaut « Richard » et les mentions « Mon profil (local) » sont trop visibles et peuvent donner l’impression d’une identité codée en dur ;
- la distinction entre « reprendre », « explorer », « journal », « progression » et « Premium » doit être structurée autour d’actions primaires et secondaires ;
- les informations de persistance doivent rester accessibles dans le Profil/Confidentialité, pas dominer le Dashboard.

**Priorité** : P0.

### 4. Academy / Parcours et modules

**Forces**

- le catalogue et les modules authored existants sont riches ;
- les leçons Free et Premium ont des objectifs, exercices, quiz et feedback ;
- les accès Premium sont contrôlés et les limitations sont honnêtes.

**Points à corriger**

- les modules futurs M3 à M9 sont représentés comme des structures vides « À venir », ce qui peut ressembler à des liens cassés ;
- l’utilisateur doit pouvoir comprendre le niveau, la durée, le résultat attendu et la prochaine étape sans lire des marqueurs internes ;
- il faut distinguer visuellement « disponible maintenant », « aperçu éditorial » et « prochainement », avec une action utile pour chaque état ;
- la navigation précédente/suivante et le retour au catalogue doivent être évalués ensemble dans chaque leçon.

**Priorité** : P0 pour les modules visibles, P1 pour les domaines futurs.

### 5. Leçons et exercices

**Forces**

- contenu réel et authored ;
- exercices, quiz, retry et feedback disponibles ;
- les limites des vidéos absentes sont honnêtement indiquées.

**Points à corriger**

- « Vidéo en préparation », « validation locale » et « entraînement local » apparaissent dans le flux principal, au lieu d’être présentés comme des informations secondaires ;
- l’absence de vidéo ne doit pas donner l’impression que la leçon est incomplète si le contenu textuel est complet ;
- les actions de fin de leçon doivent orienter explicitement vers « pratiquer », « revoir », « journaliser » ou « prochaine leçon ».

**Priorité** : P1.

### 6. Journal et Progression

**Forces**

- les données sont séparées par utilisateur local/remote selon l’état disponible ;
- la progression est reliée aux preuves, exercices et revue hebdomadaire ;
- les états vides sont généralement explicites.

**Points à corriger**

- « Journal local », « activité locale » et « preuve locale » reviennent trop souvent ;
- il faut distinguer le statut de conservation des données de la valeur pédagogique de l’écran ;
- les états vides doivent toujours proposer une action de départ contextualisée, pas seulement constater l’absence de données ;
- la Progression doit être le centre de preuve d’apprentissage, pas un tableau technique d’événements.

**Priorité** : P1.

### 7. Profil et identité

**Forces**

- le profil a une surface dédiée ;
- le BFF expose `/v1/me` et les routes de session nécessaires ;
- les contrôles d’accès existent.

**Points à corriger**

- le fallback visible « Richard » doit être remplacé par une présentation neutre tant que l’identité réelle n’est pas confirmée ;
- « Mon profil (local) » ne doit pas être le titre principal quand une session BFF est active ;
- préférences, identité, données pédagogiques et sécurité doivent être regroupées en sections distinctes ;
- le statut de synchronisation doit être clair : connecté, hors ligne/local, ou synchronisation indisponible.

**Priorité** : P0, car l’identité et la confiance sont critiques pour la commercialisation.

### 8. Premium

**Forces**

- l’offre Premium est décrite honnêtement comme une démonstration sans paiement ;
- P2, Risk Plan Lab, Controlled Decision et Weekly Review sont réellement présents ;
- les routes BFF protègent le contenu Premium côté serveur.

**Points à corriger**

- trop de variantes de « démo Premium locale », « aperçu local », « preuve locale » ;
- l’utilisateur doit distinguer plus rapidement : ce qui est accessible maintenant, ce qui est une démonstration, et ce qui nécessite une future offre payante ;
- le parcours Premium doit être présenté comme une progression pédagogique, non comme une collection de cartes ;
- les prix ne doivent pas être affichés avant validation, conformément au cahier des charges.

**Priorité** : P1.

### 9. Back-office

**Forces**

- surface dédiée avec vues Aperçu, Utilisateurs, Abonnements et Contenu ;
- accès protégé par le BFF et les rôles admin/owner ;
- état non connecté explicite.

**Points à corriger**

- le Back-office apparaît vide/non disponible hors environnement BFF, ce qui est techniquement honnête mais doit être présenté comme une porte d’administration réservée ;
- il faut éviter qu’un apprenant normal découvre une page admin sans contexte ;
- les états de chargement, erreur, absence de droits et absence de données doivent être différenciés visuellement.

**Priorité** : P2, sauf problème d’exposition dans la navigation publique.

## Principes de transformation retenus

1. **Conserver l’architecture** : aucune migration React, aucun remplacement du moteur de navigation, aucune réécriture BFF.
2. **Réduire le langage technique dans les zones d’apprentissage** : déplacer les détails de stockage, de démo et de mode local dans Profil, Confidentialité ou des disclosures contextuels.
3. **Ne rien inventer** : conserver les mentions de sécurité, d’absence de données live, d’absence de paiement et d’espaces non ouverts, mais les afficher au bon endroit.
4. **Orienter chaque vue** : une action principale, une action secondaire, une sortie claire.
5. **Respecter les états réels** : Free, Premium démo, Premium serveur, visiteur, apprenant connecté et administrateur ne doivent pas être confondus.
6. **Préserver les données et tests** : toute correction doit être additive ou localisée, avec validation E2E et mobile.

## Lots de correction proposés

### Lot UX-1 — Nettoyage de confiance et orientation

- supprimer la bannière permanente de version ;
- remplacer les fallbacks d’identité visibles par une présentation neutre ;
- réduire les répétitions « local/prototype/démo » dans Dashboard et Profil ;
- conserver les disclosures indispensables dans un bloc contextuel ;
- clarifier les CTA Landing → Access → Academy.

### Lot UX-2 — Dashboard comme centre d’orientation

- hiérarchiser « Continuer », « Explorer les parcours », « Journal », « Progression » ;
- afficher la dernière leçon réelle lorsqu’elle existe ;
- proposer un état vide avec action de départ ;
- présenter Premium en encart clair, sans blocage du parcours Free.

### Lot UX-3 — Academy ouverte et navigation pédagogique

- renforcer catalogue/niveaux/modules ;
- remplacer les cartes vides par des états éditoriaux explicites ;
- ajouter ou vérifier précédent/suivant/retour ;
- rendre la prochaine étape visible après chaque leçon.

### Lot UX-4 — Journal, Progression, Profil et identité

- séparer preuve pédagogique et statut de stockage ;
- afficher l’identité BFF réelle lorsqu’elle existe ;
- clarifier le statut de synchronisation ;
- améliorer les états vides et actions de démarrage.

### Lot UX-5 — Commercialisation et pages publiques

- simplifier footer et navigation documentaire ;
- différencier pages disponibles, en préparation et informatives ;
- clarifier Free aujourd’hui et Premium démonstration ;
- ne pas afficher de prix ou de fonctionnalité non active.

## Critères de validation avant modification suivante

- aucune page publique du sitemap ne perd son contenu ou ses liens ;
- aucun changement de contrat BFF, RLS ou ownership ;
- aucune identité codée en dur affichée à un utilisateur connecté ;
- les états Free/Premium/visiteur/admin restent distincts ;
- chaque vue Academy possède un titre, une action principale et une sortie ;
- tests contractuels, E2E, mobile et accessibilité passent ;
- aucun message de sécurité ou de limitation réelle n’est supprimé, seulement repositionné.

## Conclusion

DDA dispose déjà du socle fonctionnel d’une Academy commercialisable. La priorité n’est pas d’ajouter une nouvelle architecture ou de multiplier les fonctionnalités, mais de transformer la hiérarchie de l’interface : moins de démonstration technique au premier plan, plus d’orientation, de continuité pédagogique, d’identité fiable et de clarté commerciale.
