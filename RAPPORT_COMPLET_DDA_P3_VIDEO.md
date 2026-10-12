# Rapport complet — Darius Digital Academy (DDA)

**Date du rapport :** 9 octobre 2026  
**Branche active :** `chore/p3-reconciliation`  
**Commit actuellement testé :** `5f46ef9` — `feat: add secure responsive lesson video surface`  
**Dépôt :** `DDA-digital-acad-my-`  
**Statut de la branche :** propre, en avance d’un commit sur `origin/chore/p3-reconciliation`  
**Branche `main` :** non fusionnée et non modifiée par le dernier travail

---

## 1. Résumé exécutif

Le projet **Darius Digital Academy** est une Learning Operating System dédiée à l’apprentissage structuré du trading. Le produit combine :

- une landing page publique institutionnelle ;
- une application apprenant séparée ;
- un parcours pédagogique progressif ;
- des exercices interactifs et des quiz de validation ;
- un Terminal d’analyse pédagogique ;
- un Journal & Plan ;
- un suivi de progression et de preuves de compétence ;
- des surfaces Free, Premium et Premium Demo ;
- un BFF Node.js pour certaines opérations serveur ;
- une suite de tests contractuels et Playwright.

La branche `chore/p3-reconciliation` a consolidé le socle UX/UI, la sécurité du Journal, les limites d’accès Premium, l’idempotence serveur et les parcours d’acquisition. Le dernier travail ajoute un **composant vidéo responsive et sécurisé** au moteur de leçons, avec prise en charge future de Vimeo institutionnel et des fallbacks qui préservent l’apprentissage si la vidéo est absente ou indisponible.

La dernière vérification Playwright est entièrement verte :

> **54 tests réussis, 0 échec.**

---

## 2. État Git et gouvernance

### Branche et commits récents

La branche active est :

```text
chore/p3-reconciliation
```

Historique récent :

```text
5f46ef9 feat: add secure responsive lesson video surface
6815ea5 feat: streamline DDA daily dashboard
6bcdd9b feat: clarify DDA access onboarding mission
adf5d71 feat: tighten DDA landing editorial rhythm
d91cf01 feat: make BFF mutations idempotent by client mutation id
3fae629 chore: reconcile existing P3 account lifecycle work
e46a139 fix: redact raw BFF exception messages
90801ed feat: enforce server-side premium entitlement boundary
c430f7b chore: add versioned P3 migrations and reconciliation evidence
98891e9 fix: secure journal rendering and separate market context
```

### Règle de gouvernance respectée

Le travail a été réalisé sur `chore/p3-reconciliation` conformément à l’instruction de ne pas fusionner prématurément sur `main`.

Le dernier commit vidéo contient :

```text
4 fichiers modifiés
65 insertions
15 suppressions
```

---

## 3. Architecture actuelle

### 3.1 Séparation publique / apprenant

L’architecture distingue désormais clairement :

- `dist/index.html` : landing page publique ;
- `dist/academy.html` : shell principal de l’application apprenant ;
- `dist/app.js` : logique de navigation, montage des leçons, progression, permissions et interactions ;
- `dist/dda-core.js` : curriculum et données principales ;
- `dist/lesson-renderer.js` : moteur de rendu block-based des leçons ;
- `dist/learning-engine.js` : logique pédagogique et progression ;
- `dist/bff-client.js` : communication BFF ;
- `dist/dda-analytics.js` : adaptation analytics et minimisation des données ;
- `dist/styles.css` et `dist/alpha-polish.css` : système visuel et couche de finition.

Cette séparation évite que la landing publique charge inutilement la logique de l’application apprenant.

### 3.2 Design system DDA

L’identité visuelle repose sur :

- Deep Navy : `#060d17` ;
- surfaces Navy graduées ;
- accents Brass / Gold ;
- textes ivoire et blancs ;
- textures et effets minéraux ;
- esthétique fintech institutionnelle ;
- hiérarchie éditoriale forte ;
- composants à bordures sobres, rails et chaînes de progression ;
- responsive mobile-first.

Le système visuel a été renforcé pour éviter une apparence générique et donner aux pages un positionnement plus professionnel.

---

## 4. Travail produit et UX déjà réalisé

### 4.1 Landing page

La landing page présente désormais :

- l’identité de DDA ;
- le positionnement Learning OS ;
- le message : comprendre les marchés, construire des compétences, prouver sa progression ;
- l’ancrage institutionnel à Abidjan et en Afrique francophone ;
- une entrée claire vers l’accès apprenant ;
- les étapes du parcours ;
- les plans et niveaux d’accès ;
- les garde-fous pédagogiques ;
- des éléments de démonstration sans chiffres fabriqués ;
- une CTA mobile qui n’obstrue pas le contenu.

### 4.2 Mission Rails

Les pages ont été réorganisées afin que chaque surface possède une mission distincte et qu’un clic mène à une action ou une information différente.

Les redondances ont été réduites notamment entre :

- Dashboard / Aujourd’hui ;
- Terminal ;
- Market Intelligence ;
- Parcours ;
- Journal & Plan ;
- Progression.

### 4.3 Dashboard / Terminal / Market Intelligence

Les dernières itérations ont renforcé :

- la hiérarchie de la page Aujourd’hui ;
- le rôle du Terminal comme espace d’analyse et d’action ;
- le rôle de Market Intelligence comme espace de contexte ;
- la distinction entre observation, apprentissage et validation ;
- la réduction des répétitions de BRVM, de contenu marché et de plans ;
- la cohérence des CTA et des handoffs.

### 4.4 Parcours apprenant

Le parcours actuel contient notamment :

- M0.1 — Le trading comme commerce ;
- M0.2 — Support & Résistance ;
- M0.3 — Lire une tendance ;
- M1.1 — Pourquoi les prix évoluent ? ;
- M1.2 — Comment les ordres s’exécutent ? ;
- M1.3 — Comment les marchés s’organisent ? ;
- P2.1 — Risk Before Entry ;
- P2.2 — The Anatomy of a Controlled Trade.

Les étapes sont séquentielles et les prérequis sont gérés avant le montage des leçons.

---

## 5. Curriculum et moteur de leçons

### 5.1 Moteur block-based

Le fichier `dist/lesson-renderer.js` rend des blocs typés indépendants du contenu spécifique de chaque leçon.

Les types existants incluent notamment :

- `text_short` ;
- `diagram` ;
- `image_explainer` ;
- `video` ;
- `case_study` ;
- `scenario` ;
- `mini_simulation` ;
- `graphical_exercise` ;
- `decision_choice` ;
- `chart_observe` ;
- `zone_identify` ;
- `quiz` ;
- `competency_check` ;
- `journal_link` ;
- `summary`.

Le moteur reste data-driven : le rendu ne contient pas de logique de progression ou de stockage. Ces responsabilités restent dans `app.js` et les modules pédagogiques.

### 5.2 Progression pédagogique

Le parcours suit une logique en quatre temps :

1. **Observer / Comprendre** ;
2. **Appliquer / Exercice** ;
3. **Prouver / Quiz** ;
4. **Revoir / Résultat et Journal**.

Les validations sont reliées aux états locaux existants :

- leçon vue ;
- exercice complété ;
- quiz complété ;
- compétence confirmée ;
- preuve de progression ;
- handoff vers le Journal ou le Terminal.

Aucune modification vidéo ne change ces états ni leurs clés de stockage.

---

## 6. Intégration vidéo sécurisée

### 6.1 Objectif

Ajouter une vidéo institutionnelle dans le lecteur de leçons, compatible notamment avec Vimeo, sans casser :

- la progression ;
- le stockage local ;
- les gates exercice → quiz ;
- les routes ;
- le rendu des leçons existantes ;
- les tests E2E.

### 6.2 Métadonnées supportées

Une leçon peut maintenant fournir un objet `video` optionnel :

```js
video: Object.freeze({
  title: 'Pourquoi les prix évoluent ?',
  caption: 'Séquence motion design institutionnelle — en préparation.',
  vimeoId: '123456789'
})
```

Les formats acceptés par le renderer sont :

- `vimeoId` ;
- `videoUrl` ;
- `embedUrl` ;
- `src` HTTPS pour une vidéo native ;
- `poster` facultatif pour une source native.

### 6.3 Allow-list et normalisation Vimeo

Le renderer :

- accepte uniquement les URLs HTTPS ;
- autorise `player.vimeo.com` ;
- autorise `vimeo.com` et convertit un lien public vers le player Vimeo ;
- accepte les sous-domaines Vimeo ;
- ajoute `dnt=1` pour la confidentialité Vimeo ;
- ajoute les paramètres de présentation minimaux : `title=0`, `byline=0`, `portrait=0` ;
- rejette les domaines arbitraires ;
- ne transforme pas une URL hostile en iframe.

Exemple de source générée :

```text
https://player.vimeo.com/video/123456789?dnt=1&title=0&byline=0&portrait=0
```

### 6.4 Durcissement iframe

Les iframes Vimeo utilisent :

```html
loading="lazy"
allow="autoplay; fullscreen; picture-in-picture"
allowfullscreen
referrerpolicy="strict-origin-when-cross-origin"
```

Aucun accès caméra, microphone, paiement ou permission non nécessaire n’est ajouté.

### 6.5 Ratio responsive

Le conteneur vidéo utilise :

```css
aspect-ratio: 16 / 9;
```

Le frame est contraint à `width: 100%` et `height: 100%`, avec `min-width: 0`, afin d’éviter les débordements dans la grille du lecteur mobile.

### 6.6 Fallback sans vidéo

Si aucune source valide n’est renseignée, le lecteur affiche un état institutionnel :

> Vidéo bientôt disponible — le parcours reste entièrement accessible : lis la séquence puis réalise l’exercice.

La vidéo n’est donc jamais une dépendance bloquante.

### 6.7 Fallback en cas d’échec

Après le montage de la leçon, `app.js` écoute les événements `error` sur :

- les iframes Vimeo ;
- les éléments `<video>` natifs.

En cas d’erreur :

- la surface passe à l’état `error` ;
- la source média est masquée ;
- le fallback est affiché ;
- le contenu pédagogique reste visible ;
- l’exercice et le quiz restent utilisables.

### 6.8 Leçon équipée

La leçon **M1.1** contient maintenant un emplacement vidéo explicite avec état « en préparation ». Cela permet de vérifier le comportement réel avant de recevoir l’URL Vimeo institutionnelle finale.

---

## 7. Sécurité déjà présente dans le projet

### 7.1 Journal

Une vulnérabilité XSS critique dans le rendu du Journal a été corrigée. Le rendu n’injecte plus directement des valeurs non sûres dans le DOM.

### 7.2 BFF

Le BFF dispose notamment de :

- mutations idempotentes via `clientMutationId` ;
- contrôle serveur des droits Premium ;
- redaction des exceptions BFF brutes ;
- migrations P3 versionnées ;
- flux d’export et suppression de compte ;
- tables métier et politiques RLS auditées.

### 7.3 Analytics

Les contrôles analytics vérifient :

- la minimisation des données ;
- le filtrage des UTM ;
- l’absence d’email, de nom ou de téléphone dans l’acquisition ;
- la conservation de la première attribution ;
- le cloisonnement entre événements locaux et événements externes ;
- l’activation unique après validation du quiz M0.1.

### 7.4 Vidéo

La nouvelle intégration vidéo ajoute une validation côté renderer et ne permet pas à une URL arbitraire de devenir une iframe.

La vérification directe effectuée sur le renderer a confirmé :

- normalisation correcte d’un `vimeoId` ;
- présence des attributs de durcissement iframe ;
- rejet d’un domaine hostile ;
- affichage du fallback si la source est invalide.

---

## 8. Vérification de couverture des tests

## 8.1 Suite Playwright principale

La commande utilisée est :

```bash
node tests/run.js
```

Résultat sur `chore/p3-reconciliation` :

```text
54 passed, 0 failed
```

### 8.2 Groupes fonctionnels couverts

| Groupe | Couverture |
|---|---:|
| État local, migration, reset profil | 6 scénarios |
| Permissions visiteur / Free / Premium | 6 scénarios |
| Accès, navigation et onboarding | 7 scénarios |
| M0.1 — exercice et quiz | 2 scénarios |
| Acquisition, UTM et confidentialité | 7 scénarios |
| Analytics et minimisation | 5 scénarios |
| Broker Hub | 2 scénarios |
| Landing et surface publique | 3 scénarios |
| Funnel complet landing → activation | 1 scénario |
| Cohérence du curriculum M1 | 1 scénario |
| UX/UI, responsive et navigation mobile | 8 scénarios |
| Terminal → Journal → Progression | 3 scénarios |
| **Total** | **54 scénarios** |

### 8.3 Scénarios importants passés

La suite vérifie notamment :

- la migration des anciens états localStorage ;
- la conservation du stockage en cas d’échec d’écriture ;
- le reset complet du profil ;
- la limite de 50 événements ;
- les droits Free et Premium ;
- l’absence de contenu Premium avant activation ;
- le parcours Premium complet vers le Lab et la Progression ;
- l’accès public et la redirection vers l’onboarding ;
- le formulaire d’inscription ;
- les selects onboarding clavier et mobile ;
- le gate exercice → quiz de M0.1 ;
- le résultat après validation du quiz ;
- le filtrage des UTM et PII ;
- le tracking du funnel ;
- l’accès Broker Hub ;
- l’isolation de la landing ;
- le funnel landing → accès → onboarding → activation ;
- la fin du curriculum M1 sans leçon fantôme ;
- la couverture Elite UI ;
- DDA Aurora ;
- le back/forward mobile ;
- les largeurs 360, 390 et 1440 px ;
- le Terminal et le handoff Journal ;
- le parcours Terminal → preuve → Journal → Progression.

### 8.4 Tests contractuels complémentaires

Le dossier `tests/` contient **38 fichiers `test_*.js`** couvrant notamment :

- architecture des shells ;
- intégration BFF ;
- idempotence `clientMutationId` ;
- sécurité du Journal ;
- structure et profondeur du contenu ;
- thème Elite UI ;
- structure de la landing ;
- registre des leçons ;
- curriculum M0, M1.1, M1.2 et M1.3 ;
- routes et prérequis ;
- responsive gutters ;
- cycle de vie P3 ;
- schéma métier ;
- données P3 ;
- identité et session ;
- migrations ;
- Chariow ;
- missions de pages ;
- progression ;
- Premium P2 ;
- cartes de preuve ;
- audit RLS ;
- frontières de surface ;
- Terminal / Journal ;
- Practice et preuves typées.

### 8.5 CI GitHub

La suite Playwright est également appelée dans les workflows GitHub suivants :

- `.github/workflows/e2e.yml` ;
- `.github/workflows/pages.yml` ;
- `.github/workflows/product-gate.yml`.

Des workflows séparés exécutent aussi les contrats de registre, curriculum, RLS et intégration.

---

## 9. Limites actuelles de la couverture

La suite actuelle mesure une **couverture comportementale E2E**, mais ne produit pas encore de pourcentage de couverture de code JavaScript.

Aucun instrument `c8`, `nyc`, Istanbul ou équivalent n’est actuellement configuré pour mesurer :

- les lignes exécutées ;
- les branches exécutées ;
- les fonctions couvertes ;
- les lignes non couvertes.

### Couverture vidéo manquante

La suite globale est verte, mais aucun scénario Playwright dédié n’exécute encore explicitement les cas suivants :

1. rendu d’un `vimeoId` valide ;
2. conversion d’un lien `vimeo.com` vers `player.vimeo.com` ;
3. rejet d’un domaine externe hostile ;
4. fallback lorsque `lesson.video` est absent ;
5. fallback après événement `error` sur iframe ;
6. fallback après erreur sur vidéo native ;
7. ratio 16:9 mesuré dans le navigateur ;
8. absence de débordement vidéo sur 360, 390 et 1440 px.

Ces cas ont été vérifiés directement par un test renderer de sécurité pour les points principaux, mais ils doivent encore être intégrés à `tests/run.js` pour bénéficier d’une couverture E2E durable et visible dans le résultat `54 passed`.

---

## 10. Fichiers importants

### Shells et application

- `dist/index.html` — landing publique ;
- `dist/academy.html` — shell apprenant ;
- `dist/app.js` — navigation, montage et interactions ;
- `dist/dda-core.js` — curriculum principal ;
- `dist/learning-engine.js` — progression et modèle pédagogique.

### Leçons

- `dist/m1-1-lesson.js` — M1.1 ;
- `dist/m1-2-lesson.js` — M1.2 ;
- `dist/m1-3-lesson.js` — M1.3 ;
- `dist/p2-lessons.js` — Premium P2.

### Rendu et styles

- `dist/lesson-renderer.js` — moteur block-based et composant vidéo ;
- `dist/styles.css` — styles principaux et responsive ;
- `dist/alpha-polish.css` — finition visuelle Premium.

### Tests

- `tests/run.js` — suite Playwright principale ;
- `tests/test_lesson_registry.js` — registre et montage des leçons ;
- `tests/test_m1_runtime_contract.js` — intégration M1 ;
- `tests/test_journal_security_and_market_boundary.js` — sécurité Journal ;
- `tests/test_premium_p2_contract.js` — parcours Premium ;
- `tests/test_surface_boundary_contract.js` — frontières de surface ;
- `tests/verify_route_register_consistency.js` — cohérence routes / registre.

---

## 11. Prochaines étapes recommandées

### Priorité 1 — Ajouter les tests vidéo E2E

Créer des scénarios dédiés dans `tests/run.js` pour :

- vérifier l’iframe Vimeo générée ;
- vérifier les attributs de sécurité ;
- vérifier le fallback M1.1 ;
- simuler un événement `error` ;
- mesurer le ratio 16:9 ;
- vérifier l’absence d’overflow aux trois largeurs clés.

### Priorité 2 — Ajouter l’URL Vimeo institutionnelle réelle

Lorsque la vidéo est prête :

```js
video: Object.freeze({
  vimeoId: 'ID_VIMEO_INSTITUTIONNEL',
  title: 'Pourquoi les prix évoluent ?',
  caption: 'Séquence pédagogique DDA.'
})
```

Il faudra ensuite vérifier côté Vimeo :

- domain-locking ;
- domaine GitHub Pages de production ;
- domaine de preview éventuel ;
- politique d’intégration ;
- restrictions de téléchargement ;
- confidentialité et analytics.

### Priorité 3 — Ajouter une couverture de code

Si une métrique chiffrée est nécessaire, installer et configurer `c8` ou Istanbul pour :

- `dist/app.js` ;
- `dist/lesson-renderer.js` ;
- `dist/learning-engine.js` ;
- modules de sécurité et de transformation.

La couverture de code doit être interprétée avec prudence car l’application est une SPA statique avec beaucoup de branches DOM et d’états navigateur.

### Priorité 4 — Vérifier les headers de déploiement

Pour un durcissement complet en production, compléter la validation applicative par les headers du serveur ou de la plateforme :

- `Content-Security-Policy` ;
- `frame-src https://player.vimeo.com` ;
- `object-src 'none'` ;
- `base-uri 'self'` ;
- `frame-ancestors` selon le mode de déploiement ;
- `Referrer-Policy` ;
- `Permissions-Policy`.

GitHub Pages limite le contrôle direct de certains headers ; le déploiement final doit donc être vérifié avec la configuration réellement utilisée.

### Priorité 5 — Ne pas fusionner sur `main` avant validation vidéo

Conserver le commit vidéo sur `chore/p3-reconciliation` jusqu’à :

1. ajout des tests E2E vidéo ;
2. réception de l’URL Vimeo institutionnelle ;
3. vérification du domain-locking ;
4. nouvelle exécution complète des contrats et de Playwright ;
5. revue finale UX mobile.

---

## 12. Conclusion transmissible

Le projet DDA dispose maintenant d’un socle stable et cohérent : architecture publique séparée de l’application apprenant, identité visuelle fintech institutionnelle, parcours pédagogique séquentiel, progression locale persistante, sécurité Journal et BFF renforcée, limites Premium contrôlées côté serveur, et suite de non-régression entièrement verte.

Le dernier commit ajoute une intégration vidéo extensible et sécurisée au moteur de leçons. Elle prend en charge Vimeo de manière allow-listée, conserve le ratio responsive 16:9 et garantit qu’une vidéo absente ou défaillante ne bloque jamais la lecture, l’exercice ou le quiz.

L’état de validation actuel est :

```text
Branche : chore/p3-reconciliation
Commit : 5f46ef9
Playwright : 54 passed, 0 failed
Responsive : 360 / 390 / 1440 px validés
Contrats : validés
Routes / registre : cohérents
Main : non fusionnée
```

Le principal travail restant n’est pas une correction bloquante, mais l’ajout d’une couverture Playwright spécifique au composant vidéo et l’injection de la véritable ressource Vimeo institutionnelle après validation du domain-locking.
