# DDA — Rapport de faisabilité MT5 (Chantier B)

**Date :** 14 novembre 2026
**Nature :** recherche uniquement — aucune dépense engagée, aucune licence demandée, aucun engagement pris auprès d'un fournisseur. Les chiffres cités viennent de recherches web (sites fournisseurs, articles sectoriels 2025-2026) et ne sont pas vérifiés de première main — à confirmer directement auprès de MetaQuotes avant toute décision commerciale.

## 1. Question posée

DDA veut permettre à ses étudiants de "pratiquer et, si possible, accéder à MT5 depuis DDA" — sans confondre simulation pédagogique et véritable trading, sans dépense, sans engagement.

## 2. Ce qui existe réellement côté MetaQuotes/MT5

Il y a deux façons radicalement différentes d'avoir "du MT5" sur un site, avec des implications très différentes :

### A. Devenir un opérateur MT5 (licence broker)
- MetaQuotes vend une **licence de plateforme** aux brokers (tiers Entry/Standard/Enterprise selon le nombre de comptes réels), **distincte** de la licence réglementaire pour opérer comme broker dans un pays.
- **Coûts réels rapportés par plusieurs sources sectorielles (2025-2026, non confirmés directement par MetaQuotes)** : support mensuel moyen autour de **10 000 $/mois** pour un seul produit MetaTrader, jusqu'à **50 000 $/mois+** pour un pack MT4+MT5 complet après la dernière hausse tarifaire (+20-25 %). Un lancement en marque blanche (white-label) démarre autour de **25 000 $/an**, et peut monter à **120 000-200 000 $+** avec conformité multi-région. L'hébergement seul démarre à 15 $/mois (chiffre officiel), mais c'est la part la plus petite du coût total.
- S'ajoutent obligatoirement : un fournisseur de liquidité, un CRM/back-office, une plateforme de gestion d'affiliés — chacun avec son propre coût.
- **Conclusion : hors de portée pour DDA aujourd'hui, et hors sujet** — DDA n'a pas vocation à devenir un broker réglementé.

### B. Intégrer le Web Terminal d'un broker existant (ce qui concerne réellement DDA)
- Chaque broker dispose de son propre **Web Terminal MT5**, une application HTML5 qui tourne sur **son** serveur d'accès — il ne peut afficher que **les comptes de ce broker précis**, jamais un terminal "DDA" générique.
- MetaQuotes a publié (2017, article jamais retiré) une méthode pour **intégrer ce Web Terminal via une simple balise `<iframe>`** sur un site tiers, **sans frais annoncé par MetaQuotes** pour cet usage d'embed.
- Les comptes démo ouverts via cet embed sont automatiquement associés au domaine du site qui héberge l'iframe (paramètres "Comment"/"Lead Source" visibles par le broker) — c'est un mécanisme déjà pensé pour des sites partenaires/affiliés, pas pour un opérateur de plateforme.
- **C'est exactement le modèle qu'utilisent déjà les comparateurs/sites d'affiliation de brokers** — le même principe que le Broker Hub déjà construit dans DDA (`BROKER_REGISTRY`, aujourd'hui `not_configured` en attendant une disclosure confirmée).

## 3. Différence stricte entre les 3 niveaux (ne jamais confondre)

| Niveau | Ce que c'est | Statut dans DDA aujourd'hui |
|---|---|---|
| **Simulation pédagogique** | Le Practice Terminal actuel : données synthétiques, zones S/R, jamais un vrai prix de marché | **Déjà réel et fonctionnel** |
| **Visualisation de marché réelle** | Des cotations vraies mais en lecture seule (Chantier C) | En cours — `not_configured` tant qu'aucune clé n'est posée |
| **Trading réel (même en démo)** | Un vrai compte MT5, même démo, chez un vrai broker, via leur Web Terminal | **Jamais construit par DDA elle-même** — nécessiterait le Web Terminal d'un broker partenaire (option B), jamais un terminal "maison" |

Le Practice Terminal DDA ne doit **jamais** être présenté comme une étape vers MT5 — ce sont deux systèmes séparés, et un apprenant doit comprendre la différence avant de passer au second.

## 4. Recommandation

1. **Ne pas construire ou acheter de licence MT5 pour DDA elle-même** — coût disproportionné (dizaines de milliers de dollars/mois) pour un besoin pédagogique.
2. **Option réaliste et gratuite si vous la souhaitez** : demander à un broker déjà dans le `BROKER_REGISTRY` (Deriv, HFM, XM, Weltrade) s'il autorise l'intégration de son Web Terminal MT5 en iframe sur une page DDA dédiée, pour un **compte démo uniquement**, avec une mention très visible "Vous quittez l'environnement pédagogique DDA — ceci est le compte démo du broker [X], pas un outil DDA." C'est une négociation avec le broker partenaire, pas une dépense — mais ce n'est pas automatique : chaque broker décide s'il l'autorise et sous quelles conditions (marque, disclosure, attribution).
3. **Ne rien promettre tant que cet accord n'est pas obtenu.** Jusque-là, la page Broker Hub reste honnête : liens d'affiliation vers les plateformes des brokers, jamais un embed non confirmé.
4. **Continuer d'investir dans le Practice Terminal pédagogique** (Chantier A) plutôt que dans MT5 — c'est le seul terrain d'apprentissage que DDA contrôle entièrement, sans dépendance ni coût externe.

## 5. Ce que ce rapport ne tranche pas

- Si et quand demander cette intégration à un broker partenaire précis — décision commerciale du fondateur.
- Les conditions exactes (marque, disclosure, part des comptes ouverts) qu'un broker poserait — à négocier cas par cas, jamais supposées.

## Sources (recherche web, à reconfirmer avant toute décision)

- [Web API for MetaTrader: How Does it Work?](https://b2broker.com/news/web-api-for-metatrader-how-does-it-work/)
- [Integrate the MetaTrader 5 Web platform into your mobile applications and websites](https://www.mql5.com/en/welcome/en-integrate-mt5-web-into-your-app)
- [New Web Terminal — fast, modern and secure (MetaQuotes)](https://metatrader5.com/en/news/2253)
- [MT5 white label cost (B2Broker)](https://b2broker.com/news/mt5-white-label-cost/)
- [MT5 Broker Buyer Comparison 2026 (track360.io)](https://track360.io/blog/mt5-broker-operator-buyer-comparison-2026)
- [MetaQuotes new pricing and compliance policy (match-trade.com)](https://match-trade.com/?p=9883)
- [Discussion: Embed MetaTrader 4/5 WebTerminal on your website for free (MQL5 forum)](https://www.mql5.com/en/forum/170187)
- [How do I Connect My Broker's Demo Account to the Web Terminal Session? (MQL5 forum)](https://www.mql5.com/en/forum/435455)
