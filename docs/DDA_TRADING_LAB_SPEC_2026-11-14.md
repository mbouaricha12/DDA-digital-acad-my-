# DDA — Spécification Trading Lab (simulateur de trading)

**Date :** 14 novembre 2026
**Nature :** document de cadrage uniquement. Aucun code n'est livré par ce document ; rien n'est présenté comme actif tant que ce n'est pas construit et testé.
**Décision fondatrice (session du 14 novembre 2026) :** le « DDA Lab » existant (parcours « Ce que l'IA sait faire » / fiabilité et usage de l'IA) et ce nouvel espace sont **deux espaces distincts**. Ce document ne touche pas à `dda-lab.js`, `LAB_REGISTRY` ni aux vues `#lesson-lab1`–`#lesson-lab-capstone`. Le nom provisoire retenu pour le nouvel espace est **Trading Lab**.

## 1. Ce que la maquette demande

La maquette « DDA Lab » du founder montre en réalité un espace de pratique du trading, avec :
- Un graphique en chandelier interactif (paire affichée : XAUUSD H4) avec outils de tracé (crosshair, ligne, zone S/R, texte, rectangle, Fibonacci).
- Un panneau de passage d'ordre : type (Achat/Vente), volume, Stop Loss, Take Profit, bouton « Placer l'ordre ».
- Un « Capital virtuel » affiché (10 000 $) avec bouton de réinitialisation.
- Un badge « Mode Démo » visible en permanence.
- 4 modules nommés LAB1–LAB4 (Lecture du marché, Plan de trading, Gestion du risque, Stratégies avancées) + un « Défi Lab (Capstone) ».
- Un suivi de progression « Ton parcours Lab : 3/4 Labs complétés » avec anneau %.

## 2. Périmètre proposé

### Dans le périmètre (V1, si validé)
- Une nouvelle vue Academy (`#trading-lab` ou équivalent), nouvel état local séparé (`dda-trading-lab-state-v1` ou clé équivalente sous le même schéma de compte que `dda-prototype-state-v4`), jamais mêlé à `LAB_REGISTRY`.
- Un graphique en chandelier **affiché à titre pédagogique uniquement**, sur une série de données pédagogiques/synthétiques (même traitement honnête que `market-intelligence.js` aujourd'hui : jamais présentée comme une cotation réelle, sauf si le Lot 8 — source de marché réelle — est validé et branché séparément).
- Un simulateur d'ordre **100% local, sans connexion à un courtier réel, sans argent réel, sans retrait possible** : placer un ordre virtuel, définir SL/TP, voir le résultat (gain/perte virtuel) une fois la position fermée, sur la série pédagogique affichée.
- Un capital virtuel réinitialisable, clairement étiqueté comme fictif partout où il apparaît.
- 4 à 5 modules pédagogiques réels de progression (texte + exercices, même moteur que le DDA Lab actuel — `DDALessonRenderer`), sur les sujets Lecture du marché / Plan de trading / Gestion du risque / Stratégies avancées — contenu à rédiger, jamais copié du DDA Lab IA existant.

### Hors périmètre (V1)
- Toute connexion à un vrai courtier, API d'exécution réelle ou compte de trading réel (hors mandat, jamais prévu).
- Toute donnée de marché présentée comme réelle tant que le Lot 8 n'a pas livré une source vérifiée et que ce Trading Lab n'a pas été explicitement rebranché dessus.
- Chat/IA de trading, alertes de prix, notifications push.

## 3. Garde-fous d'honnêteté (non négociables)

- Le mot « Démo »/« Simulation » doit apparaître sur chaque écran du Trading Lab, pas seulement un badge discret.
- Aucune formulation du type « gagnez », « rentable », « résultats garantis » — conforme à la règle de conformité marketing DDA déjà appliquée ailleurs (pas de promesse de gain).
- Le P&L virtuel ne doit jamais être présenté hors contexte (ex. capturé seul sur une image de partage) sans le mot « simulation ».
- Tant que les données de marché restent synthétiques, le même étiquetage que les cartes BRVM (« Exemple pédagogique — pas une cotation réelle ») s'applique au graphique et aux prix affichés.

## 4. Architecture technique proposée

```
Nouveau module trading-lab.js (contenu + moteur de simulation)
  - TRADING_LAB_REGISTRY : 4-5 modules, même format que LESSON_REGISTRY/LAB_REGISTRY
  - séries de prix pédagogiques (réutilise ou étend candlePatterns de market-intelligence.js)
  - moteur d'ordre pur-fonction : placeOrder(state, order) → nouvel état, jamais d'I/O réseau
        │
        ▼
app.js : rendu de la vue #trading-lab (nouvelle, distincte de #lab)
  - lecture/écriture d'un état localStorage séparé
  - jamais de mutation de prototypeState.lessons ni de LAB_REGISTRY
        │
        ▼
Sidebar/drawer : nouvelle entrée « Trading Lab » (position à définir avec le fondateur
  — probablement à côté de « DDA Lab », pas à sa place)
```

## 5. Sous-lots proposés (si ce cadrage est validé)

1. **Contenu pédagogique** (4-5 modules texte, même moteur que l'existant) — le plus sûr, aucune nouvelle mécanique.
2. **Graphique + outils de lecture** (affichage seul, pas d'ordre) — risque moyen (bibliothèque de rendu de chandelier à choisir ou construire).
3. **Moteur d'ordre virtuel** (placement, SL/TP, clôture, calcul P&L fictif) — le cœur du simulateur, risque le plus élevé (logique à spécifier précisément : slippage simulé ou non, exécution instantanée ou non, etc.).
4. **Intégration nav + progression** — reliure finale une fois 1-3 validés.

## 6. Ce que ce document ne tranche pas (besoin d'une décision du fondateur)

- Position exacte de « Trading Lab » dans la navigation (à côté de DDA Lab ? dans Academy ?).
- Faut-il un capstone/projet final comme pour le DDA Lab actuel ?
- Le contenu des 4-5 modules (qui l'écrit — moi à partir de sources existantes, ou le fondateur) ?
- Calendrier : ce chantier est-il prioritaire sur le Lot 6 (Ressources) et le Lot 8 (source de marché réelle) déjà en cours ?

**Aucune ligne de code Trading Lab n'est écrite tant que ce document n'est pas validé.**
