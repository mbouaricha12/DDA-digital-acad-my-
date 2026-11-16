# DDA — Comparatif de sources de données de marché (Lot 8 : Marchés)

**Date :** 14 novembre 2026
**Nature :** document de recherche et de recommandation. Aucune clé d'API n'est configurée, aucun flux n'est branché par ce document. Les chiffres ci-dessous viennent de recherches web (pages fournisseurs et comparatifs tiers de 2026) et **ne sont pas vérifiés de première main** — à confirmer sur la page tarifaire officielle de chaque fournisseur avant tout engagement ou intégration.

## 1. Besoin

La maquette « Marchés » demande des cotations pour : **XAUUSD** (or), **EURUSD**, **GBPUSD**, **USDJPY** (forex), **US30** (indice), **BTCUSD** (crypto) — six instruments de familles différentes (métal, change, indice, crypto), rafraîchies à une fréquence proche du temps réel.

## 2. Contrainte déjà en place (non négociable)

DDA applique déjà, pour la BRVM (`docs/DDA_BRVM_INTEGRATION_ARCHITECTURE_2026-11-13.md`), une doctrine stricte : **aucune cotation n'est affichée comme réelle sans source vérifiée et droits de redistribution confirmés**. Le même principe s'applique ici : avant que ces six instruments affichent un vrai prix, il faut une source dont la licence autorise explicitement la redistribution publique sur un site pédagogique, pas seulement un usage interne/personnel.

## 3. Options identifiées (à vérifier avant engagement)

| Fournisseur | Couverture | Palier gratuit (annoncé) | Palier payant (annoncé) | Points d'attention |
|---|---|---|---|---|
| **Twelve Data** | Forex, indices, crypto, actions | ~800 appels/jour, données différées sur le palier gratuit | À partir de ~29 $/mois pour du temps réel | Bonne couverture multi-actifs en un seul fournisseur — candidat le plus simple pour EURUSD/GBPUSD/USDJPY/US30 |
| **Finnhub** | Forex, crypto, actions (US surtout) | Limite par minute plus généreuse, mais cotations temps réel limitées | Variable selon les flux | Couverture crypto plus faible (quelques échanges majeurs seulement) |
| **Alpha Vantage** | Forex, crypto, actions | Palier le plus restrictif (~25 requêtes/jour, 5/min) | À partir de ~50 $/mois | Trop limité pour un usage en production même pilote |
| **CoinGecko** | Crypto uniquement (BTCUSD) | ~100 appels/min, 10 000/mois, clé « Demo » gratuite requise | À partir de ~35 $/mois | Bon candidat dédié pour BTCUSD seul ; ne couvre pas le forex/l'or/les indices |
| **Metals-API / fournisseurs spécialisés or** | XAUUSD / métaux précieux | Offres gratuites rares et souvent limitées (REST différé) ; flux temps réel généralement payant (~15 $/mois et plus) | Variable | L'or (XAUUSD) est le moins bien couvert par les paliers gratuits généralistes — probablement le seul instrument nécessitant un fournisseur dédié |

**Aucun fournisseur unique couvrant honnêtement les 6 instruments en temps réel sur un palier gratuit n'a été identifié.** Un pilote réaliste combinerait probablement 2-3 fournisseurs (ex. Twelve Data pour forex+indice, un fournisseur dédié pour l'or, CoinGecko pour le crypto), chacun avec sa propre clé et ses propres limites.

## 4. Recommandation (pilote à faible risque)

1. **Ne pas souscrire plusieurs abonnements payants d'un coup.** Commencer par les paliers gratuits/démo pour valider le flux technique (latence, format, fiabilité) sur 1-2 instruments seulement — par exemple EURUSD (Twelve Data) et BTCUSD (CoinGecko) — avant d'élargir.
2. **Vérifier la licence de redistribution avant tout affichage public**, pas seulement les limites de débit. Beaucoup de paliers gratuits autorisent un usage interne/personnel mais interdisent explicitement l'affichage public sur un site — ce point est souvent dans les conditions d'utilisation, pas sur la page tarifaire.
3. **Réutiliser l'architecture de gouvernance déjà conçue pour la BRVM** (source → vérification → publication, jamais d'affichage direct d'un appel API non revu) plutôt que d'inventer un second mécanisme.
4. **Tant qu'aucune source n'est validée**, les six instruments restent affichés en mode pédagogique/synthétique explicitement étiqueté (même traitement que les cartes BRVM actuelles) — jamais une cotation non vérifiée présentée comme réelle.

## 5. Ce que ce document ne tranche pas

- Budget mensuel acceptable pour ce chantier.
- Qui détient et fait tourner les clés API (back-office DDA, variable d'environnement BFF).
- Fréquence de rafraîchissement cible (chaque seconde ? chaque minute ? différé de 15 minutes, ce qui est honnête mais ne correspond pas à « Marchés » en temps réel) ?
- Validation juridique de la redistribution dans le contexte de publication francophone/Afrique de l'Ouest — à ne pas confondre avec la gouvernance BRVM déjà en place, qui est spécifique à la BRVM.

**Prochaine étape si ce document est validé :** choisir un instrument pilote unique (ex. BTCUSD via CoinGecko, le plus simple et le moins coûteux) et construire le pipeline source → vérification → affichage pour cet instrument seul, avant d'étendre.
