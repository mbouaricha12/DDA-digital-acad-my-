# DDA — Diagnostic complet du site

**Date :** 27 septembre 2026  
**Dépôt :** `mbouaricha12/DDA-digital-acad-my-`  
**Branche auditée :** `chore/final-art-direction`  
**Commit de départ :** `6ff3d71`  
**Statut :** prototype Private Alpha statique, non connecté

## 1. Résumé exécutif

Le site est cohérent avec le travail historique du dépôt : la branche auditée est construite directement au-dessus de `main` (`8465e2e`) et conserve l’architecture Learning Engine, les routes, le Terminal, les leçons, la progression, les ressources, le Market Intelligence de démonstration, le Broker Hub, le support et les préférences locales.

La landing publique est maintenant une surface réellement différenciée : direction éditoriale navy/bleu/or, photographie humaine, message sans promesse de gain, offre DDA Free avancée dans le parcours, différenciation « pas de signal », CTA mesurables, navigation publique distincte du shell apprenant et traitement mobile dédié.

Aucune capacité de production n’a été découverte : pas d’authentification serveur, pas de base distante, pas de paiement, pas de flux marché temps réel, pas de lien affilié actif, pas de support réseau et pas d’IA active.

## 2. Architecture constatée

- Application SPA statique servie depuis `dist/`.
- Aucun dossier `src/` ni pipeline de build détecté.
- Routage par hash et attributs `data-view`.
- État utilisateur local versionné via `localStorage`.
- Curriculum piloté par données et registre unique des leçons.
- Learning Engine séparé du rendu des leçons.
- Service worker avec cache-first shell historique puis stratégie network-first/fallback.
- Configuration d’hébergement statique dans `.openai/hosting.json` (`dist`).

## 3. Routes et surfaces

21 vues HTML ont été recensées :

- Public : `landing`.
- Accès : `access`.
- Apprenant : `dashboard`, `path`, `progress`, `journal`, `resources`, `profile`.
- Curriculum : `lesson`, `lesson-m02`, `lesson-m03`, `lesson-m11`, `lesson-m12`, `lesson-m13`.
- Premium / marchés : `membership`, `markets`, `brokers`.
- Futur / support : `support`, `community`, `practice`, `intelligence`.

Les liens `data-view` pointent vers des vues existantes, à l’exception de `back`, qui est une commande de navigation volontairement résolue par `smartBackTarget()`.

`Market Intelligence`, `Communauté`, `Pratique avancée` et `Intelligence DDA` affichent des états de prévisualisation honnêtes : « bientôt disponible », « aperçu », « non connecté » ou « rien ici n’est actif ». Aucun écran futur n’est présenté comme une fonctionnalité de production.

## 4. Fonctionnel vérifié

- Visiteur anonyme : arrivée sur `#landing`, jamais sur un faux dashboard.
- CTA landing : accès réel à `#access`.
- Inscription : interaction locale, confirmation du stockage local.
- Onboarding : deux étapes locales.
- M0.1, M0.2 et M0.3 : leçon, exercice, verrouillage quiz, feedback, résultat et progression.
- M1.1, M1.2 et M1.3 : contenu authored, gates séquentiels et entitlement Standard/Pro simulé.
- Terminal : prochaine action et état de curriculum complet honnêtes.
- Progression : persistance locale des validations.
- Practice Terminal → Journal : handoff fonctionnel.
- Broker Hub : quatre fiches homogènes, aucun clic affilié réel.
- Analytics acquisition : instrumentation locale/debug et minimisation des propriétés.
- Navigation directe vers `#dashboard` : renvoi vers `#access` pour un visiteur anonyme.

## 5. Audit visuel et responsive

La landing a été vérifiée en desktop 1440px et en mobile 360/390px.

Résultats :

- débordement horizontal : `0px` aux trois largeurs testées ;
- CTA mobile initial : masqué pour ne pas doubler le CTA du Hero ;
- CTA sticky mobile : apparaît après le début du scroll (`> 520px`) ;
- barre de confiance : visible sous le Hero ;
- domaines : rendus comme lignes éditoriales avec tags espacés, jamais comme mots collés ;
- vision future : hiérarchie label → titre → description → actions ;
- Hero mobile : taille ajustée pour éviter le mot orphelin « des » ;
- nouvelles images Learn Markets et institutionnelle Afrique : intégrées et servies correctement ;
- `prefers-reduced-motion` conservé.

Captures principales :

- `artifacts/audit-captures/landing-mobile-390.png`
- `artifacts/audit-captures/landing-desktop-1440.png`
- `artifacts/mobile-domains-future-polished.png`
- `artifacts/mobile-hero-no-sticky.png`
- `artifacts/mobile-after-scroll-sticky.png`
- `artifacts/audit-captures/broker-hub-desktop-1440.png`

## 6. Tests exécutés

### Harnais E2E Playwright

```text
31 passed, 0 failed
```

Couverture : état/migration, permissions visitor/free/premium, accès, signup/onboarding, M0.1, acquisition, minimisation analytics, Broker Hub, landing publique, funnel complet et overflow 360/390/1440.

### Smoke boot jsdom

```text
24 checks passed
```

Couverture : landing, signup, onboarding, gates séquentiels M0/M1, leçons authored, résultats, persistance complète du parcours.

### Contrats Node

Tous les fichiers `tests/test_*.js` et `tests/verify_route_register_consistency.js` passent. La vérification des routes retourne `PASS`.

### Syntaxe et hygiène

- Syntaxe de tous les scripts JavaScript : PASS.
- Équilibre CSS : PASS.
- `git diff --check` : PASS.
- Assets référencés par le site : présents.
- Fichiers critiques HTTP (`index`, CSS, JS, manifeste, service worker, images) : HTTP 200.

## 7. Correction appliquée pendant l’audit

Le service worker `dda-shell-v13` ne préchargeait pas `alpha-polish.css`, alors que cette feuille contient une partie importante de la direction visuelle actuelle. Une première installation hors ligne pouvait donc perdre la finition premium.

Correction :

- cache porté à `dda-shell-v14` ;
- `alpha-polish.css` ajouté au shell initial ;
- images principales de la landing, des vues futures et du curriculum ajoutées au cache initial ;
- couverture des entrées PWA vérifiée sans chemin manquant.

## 8. Limites confirmées

- Inscription et compte : local uniquement.
- Authentification serveur : absente.
- Synchronisation multi-appareils : absente.
- Paiement et abonnement : simulés, aucun paiement réel.
- Market Intelligence : contenu statique de démonstration, pas de données temps réel.
- Support : formulaire local, aucun message envoyé.
- Communauté, IA et pratique avancée : aperçus honnêtes, non actifs.
- Analytics externe : aucune transmission sans clé PostHog configurée.
- Les captures dans `artifacts/` sont des preuves locales et ne constituent pas un build de production.

## 9. Préparation au domaine réel

Le projet est techniquement compatible avec un hébergement statique grâce à `.openai/hosting.json` et au dossier `dist/`. Avant une mise en ligne réelle, il faudra toutefois valider séparément :

1. la fusion de `chore/final-art-direction` dans `main` ;
2. le choix de l’hébergeur ;
3. les DNS du domaine ;
4. HTTPS et redirections ;
5. la politique de confidentialité et le consentement analytics ;
6. le passage éventuel d’un compte local à une authentification réelle.

## 10. Conclusion

Le produit est fonctionnellement cohérent pour une Private Alpha locale et la landing est prête pour une validation de direction. Le noyau pédagogique réel est plus avancé que les surfaces futures ; les limites de production sont documentées et non masquées.

La prochaine tranche recommandée est une revue authentifiée ciblée des écrans Terminal, Parcours, Leçon, Progression et Profil, suivie d’une décision de fusion dans `main`. Aucune activation commerciale ou publication publique ne doit être déduite du simple fait que la prévisualisation est accessible.


## 11. Tranche authentifiée — correction Parcours mobile

La revue des écrans authentifiés `Terminal`, `Parcours`, `Leçon`, `Progression` et `Profil` a confirmé zéro débordement horizontal à 390px et 1440px. Un défaut réel a toutefois été trouvé sur `Parcours` : après un déplacement programmatique ou une navigation vers le chapitre courant, le bouton « Continuer » pouvait se retrouver sous la barre de navigation mobile fixe.

Le correctif ajoute une marge de défilement basse au chapitre courant afin que son action reste entièrement visible au-dessus de la barre mobile. Vérification dédiée : recouvrement mesuré avant correction `68px`, après correction `0px`.

La suite de non-régression après ce correctif reste verte : **31 tests E2E**, **24 smoke checks** et l’ensemble des contrats Node passent sans échec.


## 12. Refonte de la vue Access / inscription

La vue `#access` a été réalignée sur le registre institutionnel Deep Navy demandé par la direction.

Le fond global est désormais `#060d17`. Les cartes de formulaire utilisent `#0a1424` avec une bordure fine `rgba(255,255,255,.08)`. Les titres utilisent `#f8fafc`, les descriptions, champs et textes secondaires `#94a3b8`, et les CTA reprennent le bleu électrique DDA avec un accent doré discret au survol et au focus.

Le bandeau d’information est également sombre lorsque Access est actif. L’état de vue a été nommé `access-mode` afin d’éviter une collision avec la classe structurelle `.access-shell`. Cette collision avait temporairement révélé un débordement desktop de 610px pendant l’implémentation ; elle a été corrigée et la mesure finale est revenue à **0px** à 390px comme à 1440px.


## 13. Composant Dropdown DDA sur mesure

Les trois champs d’onboarding (`Niveau`, `Objectif pédagogique`, `Temps disponible`) utilisent désormais un composant visible DDA au lieu du menu natif du navigateur. Les éléments `select` restent présents en couche sémantique masquée : ils demeurent la source de vérité du formulaire, conservent la validation HTML et restent compatibles avec les tests et la soumission existante.

Le composant ajoute des options sous forme de surfaces sombres respirantes, un état sélectionné bleu électrique avec liseré doré, la navigation clavier, `Échap`, la fermeture au clic extérieur et une Bottom Sheet mobile positionnée au-dessus de la navigation fixe. Vérification réelle sur mobile : panneau `fixed`, de `y=456` à `y=764`, navigation à `y=776`, donc aucun recouvrement.


## 14. Élévation pédagogique des questions-réponses

Le moteur commun des leçons a été renforcé sans modifier les contrats de progression. Les choix de réponse sont maintenant rendus comme des cartes numérotées, avec une hiérarchie visuelle, un état focus/tap, une illumination bleue et un liseré doré. Les réponses correctes et incorrectes gardent leurs états distincts sans réduire le retour à une couleur seule.

Chaque réponse affiche désormais un bloc structuré **Darius Insight** : un intitulé de lecture confirmée ou de point à revoir, suivi d’une explication pédagogique authored. Les feedbacks réutilisent les faits de la leçon et explicitent le raisonnement : liquidité, exécution, déséquilibre, volatilité et séparation entre observation, hypothèse, plan et décision.

M0.1 a également été réécrit autour de deux situations concrètes : absorption de liquidité vendeuse et volatilité soudaine. Le contenu reste pédagogique et ne transforme aucune observation en signal, promesse ou recommandation de position.

Validation finale : **31 tests E2E**, **24 smoke checks**, contrats de curriculum et syntaxe JavaScript passés sans échec. Une interaction réelle fausse puis correcte a confirmé les deux variantes de `Darius Insight` sur mobile.


## 15. Couverture des espaces produit rappelés

Le rappel d’architecture a été recroisé avec les routes existantes :

- **Pratique et analyse** : Journal & Plan est réel et local ; les briques Revue guidée hebdomadaire, Decision Replay et Analyse assistée sont maintenant explicitées comme prochaines couches du Journal ; Pratique avancée documente aussi la future mesure du processus.
- **Marchés et outils** : Market Intelligence / BRVM et Broker Hub disposent déjà d’écrans de démonstration honnêtes, sans flux réel ni lien affilié actif.
- **Offres et communauté** : Premium, Profil et Support sont réels dans le prototype local ; Communauté dispose désormais d’un cadrage éditorial sur les espaces futurs, la modération et le lien entre échanges et compétences.
- **Intelligence future** : Intelligence DDA expose maintenant la frontière produit « elle pourra / elle ne fera jamais », incluant l’interdiction des signaux, prédictions, transactions et diagnostics financiers.
- **Trading Lab / Trader DNA / Skill Graph** : restent des aperçus non actifs dans Pratique avancée, conformément au cahier des charges ; aucun score, résultat ou analyse fictive n’a été ajouté.

Cette tranche remplit les espaces d’explication et de continuité produit sans transformer des capacités futures en fonctionnalités disponibles. Les seuls moteurs réellement actifs restent ceux déjà authored et testés : apprentissage, progression, Journal & Plan local, ressources, aperçu marchés et Broker Hub démonstratif.


## 16. Ressources pédagogiques — glossaire renforcé

Le glossaire Free couvre maintenant les notions réellement utilisées dans le parcours : actif, acheteur, vendeur, liquidité, volatilité, spread, invalidation et risque. Les définitions restent descriptives et pédagogiques ; elles ne donnent aucun signal ni conseil personnalisé. Le lecteur de ressource reste local, léger et compatible avec le mode faible consommation.
