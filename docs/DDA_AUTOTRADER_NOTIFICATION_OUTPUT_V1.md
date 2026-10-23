# DDA AutoTrader — rendu des notifications de trading v1

## Intention produit

La référence visuelle fournie décrit un fil de notifications compact, lisible sur mobile et orienté événements de position : ouverture, objectif atteint avec clôture partielle, volume restant, puis clôture avec résultat net et frais. Ce rendu est plus riche qu’une simple carte d’indicateurs; il exige un journal d’événements fiable et des données de position.

Ce document décrit l’expérience cible, pas une preuve de performance. Les valeurs du visuel d’exemple ne sont pas réutilisées ici. Aucun rendement ne doit être garanti ou extrapolé à partir d’une notification isolée.

## Événements à afficher

1. **Proposition / signal prêt** — direction et conditions, mais aucune position n’est déclarée ouverte. Afficher `PROPOSITION` ou `SIMULATION`; ne jamais dire « copiée » ou « exécutée » si aucune confirmation de fill n’existe.
2. **Entrée simulée** — instrument, sens, taille et prix d’entrée hypothétiques, stop, stratégie/version, horizon, heure et source des données. Étiquette obligatoire `SIMULÉ`.
3. **Objectif partiel atteint** — numéro d’objectif, quantité réellement fermée dans le scénario, quantité encore ouverte, prix de sortie simulé, P&L réalisé sur la fraction fermée et frais modélisés. Une cible touchée par un prix de chandelier ne prouve pas qu’un ordre limite aurait été rempli.
4. **Stop / invalidation** — règle déclenchée, prix et quantité simulés, impact hypothétique. Distinguer un niveau traversé d’un fill garanti, surtout en présence d’un gap ou d’un spread.
5. **Position clôturée** — quantité finale, heure et prix de sortie, P&L brut, commissions, swap/financement, autres coûts connus, P&L net, devise et statut de complétude. N’afficher « net » que si les postes de coûts requis sont connus; sinon écrire `NET NON CALCULABLE` et lister les postes manquants.

## Carte de notification

### En-tête

- État visible en premier : `PROPOSITION`, `SIMULATION`, `OBJECTIF PARTIEL`, `CLÔTURE SIMULÉE`, ou, dans une future intégration de lecture seule uniquement, `ÉVÉNEMENT BROKER CONFIRMÉ`.
- Type et sens : `Achat` ou `Vente`; ne pas réduire le sens à une couleur seule.
- Instrument canonique et, si disponible, symbole exact du flux/broker.
- Stratégie avec identifiant/version, par exemple la règle versionnée AutoTrader; le nom marketing ne remplace pas cet identifiant.

### Corps

- Taille et unité du contrat, quantité fermée et quantité restante. Un « lot » n’est affiché que si sa taille de contrat est connue pour le symbole et le compte concernés.
- Entrée, stop et objectif avec la précision réellement fournie par les spécifications de l’instrument. Ne pas ajouter de décimales artificielles.
- Timestamp avec fuseau explicite, heure d’observation du marché et état/fraîcheur des données.
- Pour les événements partiels : taille fermée, restant ouvert, niveau atteint, prix de fill simulé ou confirmé et méthode de détection.
- Pour le résultat : P&L brut, détail des coûts, P&L net, devise, convention de signe et statut complet/partiel.

### Métadonnées de traçabilité

Chaque notification doit être reconstruisible depuis un événement immuable : `event_id` non personnel, version de contrat, `position_ref` pseudonyme, `strategy_id`/version, `event_type`, `mode`, source de prix, timestamp source, timestamp de calcul, unité/multiplicateur, prix, tailles, frais et statut de calcul. Les identifiants personnels, numéros de compte, tokens de session et identifiants d’ordre réels ne sont pas requis dans le contenu visible ni dans les logs.

## Exemple de rendu — valeurs fictives

```text
🟡 SIMULATION — Vente [SYMBOLE]
[STRATÉGIE] · [QUANTITÉ] [UNITÉ] · entrée simulée [PRIX]
Stop [NIVEAU] · objectif [NIVEAU] · données au [HORODATAGE + FUSEAU]
Aucun ordre n’a été envoyé.

🎯 OBJECTIF 1 SIMULÉ — [SYMBOLE]
[QUANTITÉ FERMÉE] fermée · [QUANTITÉ RESTANTE] encore ouverte
Sortie simulée [PRIX] · P&L net simulé [VALEUR/DEVISE ou non calculable]
Coûts inclus : [commissions, spread/slippage, financement/swap]

✅ POSITION CLÔTURÉE — SIMULATION
[SYMBOLE] · [QUANTITÉ TOTALE] · sortie [PRIX] à [HORODATAGE + FUSEAU]
Résultat net simulé [VALEUR/DEVISE] · brut [VALEUR] · coûts [DÉTAIL]
Calcul complet selon [RÉFÉRENCE DU MODÈLE DE COÛTS]. Aucun ordre réel envoyé.
```

L’emoji est facultatif pour l’accessibilité; le libellé textuel d’état reste obligatoire.

## Définition de la précision

La « précision » signifie traçabilité et calcul cohérent avec les données disponibles; elle ne signifie pas certitude sur les fills futurs, les gains ou le prix d’exécution. Pour calculer un P&L net réel, il faut les deals/fills confirmés, la taille et le multiplicateur du contrat, la devise, les commissions, le swap/financement et les corrections éventuelles. Un simple mouvement du prix ou l’atteinte d’un niveau ne suffit pas.

En mode simulation, les prix de fills, spreads, slippage, commissions et coûts de financement sont des hypothèses versionnées. Les événements doivent être nommés `simulés`, rester distincts des événements de compte réel et ne jamais être présentés comme des ordres copiés. Le prix d’un XAUUSD, le nombre de décimales et le sens des coûts peuvent varier selon le fournisseur et le courtier; aucun format de lot, stop ou gain ne doit être hardcodé à partir de l’image.

## État du projet et périmètre de la prochaine étape

Le dépôt possède déjà l’analyse descriptive, des métriques techniques, un contrôle du risque, une proposition non soumise et un moteur de backtest historique. Il ne possède pas encore un flux d’événements de position pour notifications, un connecteur MT5, une confirmation de fills, ni un transport de notifications. La première implémentation cohérente avec le périmètre actuel est un rendu de notifications **simulation/paper** à partir d’événements déterministes du simulateur, avec `Aucun ordre réel envoyé`.

Les mentions comme « vente copiée », la gestion d’ordres réels et les notifications de clôture réelle supposeraient une autre architecture d’exécution et une preuve de fills. Elles ne doivent pas être simulées par du texte ni être confondues avec l’analyse/backtest actuellement livré. Le BFF AutoTrader courant reste sans exécution.


## Extension v1 — alertes de risque et stop-loss dynamique

Cette extension ajoute des types d’événements au format existant sans transformer une notification en autorisation de trade ou en commande broker. Le module de risque v1 accepte uniquement des snapshots `simulation`; les messages ci-dessous sont donc `SIMULÉS` jusqu’à ce qu’une source de données autorisée et une stratégie dédiée aient été validées.

### Alertes de risque

Les notifications doivent distinguer ces états :

- **`RISK_LIMIT_EXCEEDED`** : un contrôle du résultat `limits_exceeded` a dépassé un plafond explicite. Afficher le nom de la métrique, le scope, l’observé, la limite, l’unité, la devise de base, l’heure du snapshot et `policy_id`. Les métriques possibles sont celles réellement produites par `dda.risk-evaluation.v1` : exposition brute, exposition nette absolue, concentration par instrument/classe d’actif, risque supposé par position, risque ouvert agrégé et perte quotidienne.
- **`RISK_DATA_STALE`** : l’âge du snapshot dépasse `max_snapshot_age_ms`. Afficher son âge et le seuil maximal; ne pas présenter les métriques comme actuelles.
- **`RISK_DATA_INVALID`** : snapshot incomplet, devise incompatible, valeur invalide ou politique absente. Afficher le motif contrôlé et indiquer que le contrôle n’a pas pu être calculé. Ne jamais afficher « aucun risque » ou « dans les limites » en cas d’échec.
- **`RISK_APPROACHING_LIMIT`** : émis uniquement si une politique explicite fournit un seuil d’avertissement inférieur ou égal au plafond. Aucun pourcentage d’approche par défaut n’est inventé. Tant qu’aucun seuil d’avertissement n’est configuré, n’émettre que les événements réellement dépassés ou les erreurs de données.

Un breach peut bloquer la génération d’une nouvelle proposition hypothétique par la garde de risque existante, mais le message doit dire « nouvelle proposition bloquée » — jamais « position clôturée » ou « perte limitée ». Le module v1 n’autorise pas un trade, ne calcule pas de marge et ne vérifie pas un compte broker. Ses `assumed_risk_amount` restent des hypothèses, pas une perte maximale garantie.

Les plafonds du contrat de risque sont des fractions de l’equity (`fraction_of_equity`), sauf l’âge du snapshot. Afficher la fraction observée et la limite dans la même unité; si les montants sont aussi affichés, les dériver explicitement de l’equity en devise de base (montant limite = fraction limite × equity). Ne jamais comparer ni juxtaposer une fraction à un montant sans les libellés/unités.

### Stop-loss dynamique

Trois événements sont séparés afin de ne pas confondre calcul et exécution :

- **`DYNAMIC_STOP_PROPOSED`** : nouveau niveau calculé dans une simulation, sans modifier le stop d’une position réelle.
- **`DYNAMIC_STOP_UPDATED_SIMULATED`** : le moteur paper a appliqué la règle à son état simulé. Le niveau précédent et le nouveau niveau doivent être visibles.
- **`DYNAMIC_STOP_TRIGGERED_SIMULATED`** : les données de simulation ont franchi le niveau selon une convention de fill explicitement déclarée. Le franchissement du niveau ne garantit pas un fill au prix du stop; gaps, spread et slippage doivent être signalés.

Champs minimaux : `position_ref` pseudonyme, instrument, sens, `stop_rule_id` et version, ancien stop, nouveau stop proposé/appliqué, prix d’observation, source et timestamp des données, motif du déplacement (p. ex. break-even ou trailing si la règle le définit), unité/tick size, mode et statut. Inclure l’exposition/risque avant-après uniquement si le calcul est effectivement disponible avec quantité, spécification de contrat, multiplicateur et devise; sinon afficher `non calculé` plutôt que d’inférer une réduction du risque.

La politique v1 de notification n’émet que des déplacements qui **resserrent** le stop : pour une position longue, le nouveau stop ne peut pas être inférieur à l’ancien; pour une position courte, il ne peut pas être supérieur. Une égalité ne produit pas un faux événement de mise à jour. Une absence d’ancien stop, une règle invalide ou des données périmées bloque le calcul. Cette règle de présentation n’implique pas que le module de risque v1 ait déjà calculé ou validé le stop : son code actuel ne calcule pas le risque à partir d’un stop.

Aucun événement `DYNAMIC_STOP_UPDATED_REAL` n’est émis dans ce périmètre. Le BFF n’envoie pas de modification de stop à MT5 ou à un broker. Si l’utilisateur gère un ordre hors du bot, le message reste une proposition non soumise et ne doit pas prétendre que le stop plateforme a changé.

### Rendus compacts

```text
🔴 ALERTE RISQUE — SIMULATION
Perte quotidienne : [OBSERVÉ]% de l’equity ([MONTANT] [DEVISE]) / limite [PLAFOND]% ([MONTANT] [DEVISE])
Snapshot [HEURE + FUSEAU] · politique [POLICY_ID]
Nouvelle proposition bloquée. Aucune position n’a été clôturée.

🟡 STOP DYNAMIQUE PROPOSÉ — SIMULATION
[INSTRUMENT] · [SENS] · règle [RULE_ID@VERSION]
Stop précédent [ANCIEN] → nouveau stop proposé [NOUVEAU]
Motif [BREAK-EVEN/TRAILING] · données [HEURE + SOURCE]
Aucun changement envoyé à une plateforme.

⚠️ DONNÉES DE RISQUE PÉRIMÉES
Snapshot [ÂGE] · limite configurée [MAX_AGE]
Calcul suspendu; aucune conclusion de risque actuel.
```

Les montants et niveaux absents restent affichés comme `non calculé`/`indisponible`; ils ne sont jamais remplacés par zéro. Tout résultat simulé garde la mention `SIMULATION`, et tout message de risque garde la portée `configured_limits_only` et `is_trade_approval=false`.

### Pré-requis avant émission automatique

Le futur générateur devra définir et versionner les règles exactes de trailing/break-even, les unités de prix, le tick size, les fenêtres ATR éventuelles, les horaires, le traitement des gaps, ainsi que les seuils utilisateur. Il devra consommer un snapshot complet et frais. À ce jour, les règles de stop dynamique ne sont pas implémentées et le contrat de risque n’inclut aucun champ stop; cette section définit le format de notification cible, pas une capacité déjà disponible.
