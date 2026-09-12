# DDA — HANDOVER MAÎTRE + MISSION DE CONSTRUCTION (repris depuis session précédente)

Baseline `b0d0af612ca3af5ae9c52187e48ade40d28d20ba` déjà inspectée et validée dans une session antérieure. Le dépôt cible de cette session est `mbouaricha12/DDA-digital-acad-my-`. Le ZIP `DDA_Source_Deployed_b0d0af6.zip` est joint à ce message — décompresse-le et vérifie que le hash de commentaire git archive correspond bien à `b0d0af612ca3af5ae9c52187e48ade40d28d20ba` avant toute modification.

## 0. RÉSULTAT DE L'INSPECTION DÉJÀ EFFECTUÉE (à revalider rapidement, ne pas refaire depuis zéro)

**Structure source :**
```
.gitignore                       (.sites-runtime/, *.zip, DDA_Rapport_*.md ignorés)
.openai/hosting.json              → project_id + static.directory = "dist"
DDA_MASTER_BUILD_REGISTER.md      → registre d'état officiel du produit
dist/
 ├─ index.html         (266 lignes) — shell SPA complet, toutes les vues
 ├─ app.js             (347 lignes) — logique UI, navigation, formulaires, quiz
 ├─ dda-core.js        (114 lignes) — état, persistance localStorage, entitlements
 ├─ learning-engine.js (20 lignes)  — helpers d'état d'apprentissage
 ├─ styles.css         (minifié, ~30 Ko) — design system + responsive
 ├─ alpha-polish.css   (~2,3 Ko)    — couche de finition Private Alpha
 ├─ sw.js                          — service worker (cache-first offline shell)
 └─ manifest.webmanifest           — PWA (start_url #dashboard)
```
Pas de dossier `src/` : `dist/` est le build final servi tel quel (pas de pipeline de build détecté).

**Fonctionnalités existantes confirmées dans le code :**
- Navigation SPA par `data-view`, hash routing (`#id`), restauration au chargement.
- Entitlements par tiers (`visitor`/`free`/`premium`) dans `dda-core.js` via `DDA.can()`.
- Onboarding simulé (signup 2 étapes) → `DDA.createUser` → écran de chargement simulé → leçon.
- Leçon M0.1 avec bouton play simulé, exercice puis quiz progressifs (`bindQuestion()`), quiz verrouillé (`aria-disabled`) tant que l'exercice n'est pas réussi.
- Persistance localStorage versionnée (`dda-prototype-state-v3`), migration depuis clés legacy, sanitation basique des chaînes, plafond 50 événements trackés.
- Reprise de session sur l'appareil, reset complet du pilote.
- Terminal/dashboard : anneau de progression, XP, liste d'actions current/done.
- Premium simulé (`DDA.setPlan`) + gate modale, aucun paiement réel.
- Ressources (checklist/glossaire) injectées en JS statique.
- Market Intelligence / Broker Hub : contenu éditorial statique + filtres JS, aucune donnée réelle.
- Support : FAQ + formulaire local sans envoi réseau.
- Profil : édition infos, toggles préférences (low-data, rappels), reset.
- Mode économie de données (`low-data`) désactive animations/transitions.
- Indicateur réseau online/offline via `navigator.onLine`.
- Responsive : un seul breakpoint 860px, structurel (sidebar→mobile-nav, grilles empilées).
- PWA : `sw.js` cache `dda-shell-v10`, network-first avec fallback cache puis `index.html`; enregistré seulement si `location.protocol` commence par `http`.
- Déploiement statique via `.openai/hosting.json` → `dist/`.

**Master Build Register (état déclaré, cohérent avec le code) :** M0.1 seul module CONSTRUIT/actif ; reste du curriculum PARTIEL/FUTUR ; modèle utilisateur SIMULÉ (localStorage uniquement) ; Premium/paiement/affiliation/marchés temps réel tous SIMULÉ ou FUTUR ; aucun back-end réel. Le fichier complet `DDA_MASTER_BUILD_REGISTER.md` est dans le ZIP — le lire intégralement avant de commencer.

---

## 1. VISION PRODUIT

DDA n'est pas un simple site de formation. DDA doit devenir un **Trading & Financial Markets Learning Operating System**.
Promesse : **Learn Markets. Build Skills. Prove Progress.**
Produit construit depuis l'Afrique, conçu pour évoluer internationalement.

Boucle centrale :
**DISCOVER → JOIN → LEARN → PRACTICE → ANALYZE → MEASURE → IMPROVE → FOLLOW MARKETS → RETURN → PROVE PROGRESS → SHARE.**

L'utilisateur ne doit pas seulement regarder des vidéos. Il doit apprendre, pratiquer, être évalué, comprendre ses erreurs, mesurer ses compétences et avoir naturellement une raison de revenir.

## 2. IDENTITÉ DDA

DDA ne doit **jamais** ressembler à : un groupe de signaux ; un casino/crypto dashboard ; un clone TradingView ; Telegram/YouTube ; un catalogue de vidéos ; une vitrine agressive de brokers ; un template SaaS générique généré par IA.

**Aucune** promesse de gains. **Aucun** faux témoignage. **Aucun** faux résultat. **Aucun** faux prix. **Aucune** donnée marché inventée. **Aucun** faux compteur. **Aucun** signal autonome.

## 3. CONSTAT CEO SUR LE DESIGN ACTUEL

Le design de la baseline est fonctionnel mais **très loin** du niveau final attendu. Ne jamais considérer `styles.css` ou `alpha-polish.css` comme une direction visuelle suffisamment aboutie simplement parce qu'ils existent.

Problèmes actuels : expérience trop statique ; grands aplats sombres ; trop de texte ; peu de narration visuelle ; manque de photographie/illustration pertinente ; faible profondeur éditoriale ; composants génériques ; micro-interactions insuffisantes ; responsive essentiellement structurel ; sensation de prototype technique habillé ; manque d'émotion, de désir et d'identité propriétaire.

Il faut une véritable montée en gamme.

## 4. DIRECTION ARTISTIQUE

Deux univers cohérents :
- **PUBLIC / LEARNING** : plus lumineux, humain, pédagogique, éditorial, institutionnel, premium.
- **TERMINAL / TOOLS** : plus sombre, technologique, précis, immersif, fintech premium.

Palette : navy profond, bleu technologique, cyan maîtrisé, or discret, ivoire. L'or = accent premium, jamais un produit de luxe artificiel.

Introduire lorsque pertinent : photographie authentique ; visuels pédagogiques ; graphiques explicatifs ; illustrations ; iconographie cohérente ; progressions visuelles ; micro-interactions ; animations sobres ; feedback immédiat ; états loading/empty/error/offline/success/locked/completed.

Les médias doivent rester compatibles smartphones modestes et faible connexion.

## 5. MOBILE-FIRST RÉEL

Le responsive ne doit plus être simplement desktop → breakpoint 860px → empilement. Penser véritablement l'expérience smartphone : hiérarchie, densité, navigation, zones tactiles, longueur des titres, formulaires, clavier, scroll, cartes, lecteurs, exercices, quiz, états, feedback, orientation, faible connexion. Puis adapter tablette et desktop.

## 6. LEARNING ENGINE

Parcours historique M0–M9. Architecture : **MODULE → LEÇONS → PRATIQUE/EXERCICE → ÉVALUATION → FEEDBACK → PROGRESSION → COMPÉTENCE/PREUVE.**
M0.1 reste le pilote réellement construit. Ne pas fabriquer artificiellement le contenu M0.2–M9 s'il n'existe pas encore. Construire progressivement un système réutilisable permettant d'ajouter les prochains modules sans reconstruire l'application.

## 7. DARIUS TERMINAL

Doit devenir progressivement le cockpit personnel de l'apprenant : prochaine action ; reprendre l'apprentissage ; progression ; compétences ; activité récente ; ressources ; Market Intelligence ; futurs Journal & Plan ; espaces disponibles selon formule. Doit donner une raison naturelle de revenir.

## 8. ÉCOSYSTÈME À CONSERVER DANS L'ARCHITECTURE

Le Master Build Register reste le registre vivant. Écosystème progressif : DDA Learn/Darius Free ; Premium ; Progression & Credentials ; certification interne ; ressources/glossaire ; Market Intelligence ; BRVM ; Broker Hub ; Journal & Plan ; statistiques personnelles ; Guided Weekly Review ; Decision Replay ; analyse assistée ; Darius AI ; Trading Lab/backtesting pédagogique ; Trader DNA/Skill Graph ; communauté ; support ; administration.

Ne pas construire maintenant toutes les fonctions futures. Ne créer aucune architecture qui les rendrait difficiles à ajouter.

## 9. DARIUS AI — RÈGLE PERMANENTE

Futur copilote pédagogique d'analyse et de processus : peut aider à raisonner, expliquer, comparer des scénarios, poser des questions, journaliser et améliorer le processus. **Ne devra jamais** devenir un système autonome disant à l'utilisateur quelle position financière prendre.

## 10. TROIS MOTEURS BUSINESS DISTINCTS

- **SUBSCRIPTION ENGINE** : Free → Trial → Standard/Pro → retention.
- **AFFILIATE REVENUE ENGINE** : besoin utilisateur → Broker Hub → disclosure → partenaire pertinent → attribution.
- **REFERRAL/AMBASSADOR ENGINE** : utilisateur DDA → recommandation → nouvel utilisateur → attribution/récompense éventuelle.

Ne jamais mélanger leurs métriques. Aucun paiement réel, broker réel ou lien affilié réel maintenant.

## 11. PREMIUM VALUE STACK

Architecture évolutive : Journal & Plan → Market Intelligence → statistiques personnelles → Weekly Review → analyse assistée → Decision Replay → Darius AI → Trading Lab → Trader DNA. Journal & Plan à évaluer relativement tôt (fort potentiel de valeur récurrente).

## 12. MARKET INTELLIGENCE

Jamais un flux de signaux. Modèle pédagogique : **FAIT → POURQUOI C'EST IMPORTANT → NOTION À COMPRENDRE → CONTENU DDA ASSOCIÉ.** Pas de fausses données temps réel.

## 13. BROKER HUB

Orientation et comparaison factuelles. Jamais de classement selon la commission versée à DDA. Disponibilité géographique, conditions et informations à vérifier avant activation réelle. Disclosure affiliation obligatoire avant action commerciale.

## 14. CERTIFICATION

Certification interne de parcours/compétences possible, mais jamais présentée comme diplôme officiel ou certification gouvernementale/accréditée si ce n'est pas réellement le cas.

## 15. INFRASTRUCTURE FUTURE

La baseline utilise localStorage. L'architecture devra pouvoir accueillir ultérieurement : authentification serveur ; récupération de compte ; base distante ; synchronisation multi-appareils ; rôles/permissions ; back-office ; analytics responsables ; support réel ; notifications transactionnelles ; abonnement/paiement ; sauvegardes ; sécurité. Ne jamais simuler ces services comme s'ils étaient réellement connectés.

## 16. MASTER BUILD REGISTER

`DDA_MASTER_BUILD_REGISTER.md` = registre obligatoire. Chaque élément classé : CONSTRUIT / PARTIEL / SIMULÉ / ABSENT / FUTUR. Mettre à jour quand une tranche modifie réellement l'état d'un élément. Une fonctionnalité ne passe jamais à CONSTRUIT simplement parce qu'un écran existe.

## 17. MISSION IMMÉDIATE CLAUDE CODE

Tu es autorisé à **MODIFIER LE CODE**.

**Première mission :** élever radicalement la qualité UI/UX du produit existant sans casser son fonctionnement.

Travailler prioritairement sur les écrans réellement utilisables : Darius Terminal/Accueil ; Parcours ; Leçon M0.1 ; Exercice ; Quiz/résultat ; Progression ; Ressources ; Profil.

Construire également les composants visuels réutilisables nécessaires à l'extension future du Learning Engine.

Important : ne pas se contenter de changer couleurs/border-radius/shadows/espacements. Véritable amélioration de : composition ; hiérarchie ; narration ; identité ; interaction ; responsive ; perception de qualité ; expérience pédagogique.

**Préserver impérativement :** navigation ; M0.1 ; exercice ; quiz ; progression ; persistance locale ; entitlements ; Premium simulé ; low-data ; offline/PWA ; Market/BRVM ; Broker Hub ; support ; profil.

## 18. MÉTHODE D'EXÉCUTION

Inspect → sauvegarde baseline → modifie → teste → compare → corrige → documente.

Tester au minimum : syntaxe JS ; navigation ; signup/onboarding ; M0.1 ; exercice ; verrouillage quiz ; réussite quiz ; progression ; reprise après reload ; Premium gates ; ressources ; profil ; low-data ; offline lorsque testable ; mobile ; desktop.

Ne détruire aucune fonction existante pour obtenir un meilleur design.

## 19. RÈGLE D'AUTONOMIE

Ne pas interrompre pour chaque micro-décision de CSS, composant, responsive ou refactoring réversible. Décisions techniques ordinaires autorisées sans confirmation. S'arrêter uniquement devant une décision réellement structurante ou irréversible : suppression importante ; changement de vision ; service externe ; dépense ; paiement ; publication publique ; broker ; données réelles ; architecture compromettant fortement la reprise future.

## 20. LIVRABLE ATTENDU EN FIN DE TRANCHE

```
TRANCHE EXÉCUTÉE :
FICHIERS MODIFIÉS :
ÉCRANS AMÉLIORÉS :
COMPOSANTS CRÉÉS/REFACTORÉS :
TESTS EXÉCUTÉS :
RÉGRESSIONS :
MASTER BUILD REGISTER MIS À JOUR : OUI/NON
LIMITES RESTANTES :
PROCHAINE TRANCHE RECOMMANDÉE :
```
Et fournir les moyens disponibles dans l'environnement pour que le CEO (Richard Darius) puisse voir réellement le résultat sur smartphone (ex. artifact/preview déployable, ou instructions claires).

**Commence l'exécution directement — pas de nouveau plan théorique.**
