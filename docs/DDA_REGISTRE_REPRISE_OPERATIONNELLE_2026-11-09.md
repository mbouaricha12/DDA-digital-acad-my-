# DDA — Registre de reprise opérationnelle (9 novembre 2026)

Ce registre transforme le baseline global en séquence de travail. Il ne certifie pas les environnements externes.

## 1. État de départ vérifié
- Le baseline global est intégré à `main` via PR #237.
- Le dernier commit observé sur `main` est `c5be790` (merge #237).
- CodeQL sur ce commit : succès.
- DDA E2E regression sur ce commit : en cours au moment de la vérification (run 42588465840). Ne pas déclarer vert avant la conclusion du run.
- Le workflow E2E précédent sur `e86854e` : succès.
- Les branches historiques sont nombreuses et souvent très en retard/divergentes. Ne jamais les fusionner directement sans comparaison, tri des commits et tests.

## 2. Ordre d'exécution (sans décision produit préalable)

### Lot A — fiabilité Free (P0)
1. Vérifier la conclusion du workflow E2E courant.
2. Rejouer le parcours public : landing → Commencer gratuitement → inscription/connexion → première leçon → exercice/quiz → progression → reprise.
3. Refaire les contrôles responsive à 390 px et navigation retour/exit.
4. Corriger seulement les régressions reproductibles; ajouter un test de contrat ou E2E par bug.
5. Maintenir les mentions exactes : progression locale, synthétique, AI non configurée, Premium aperçu si checkout absent.

### Lot B — récupération des travaux externes
1. Pour chaque branche retenue : comparer à main, relever commits uniques et fichiers touchés.
2. Exclure branches obsolètes, duplicats, revert, prototypes contradictoires et modifications qui réclament un choix de produit.
3. Rebaser/reconstruire sur une branche fraîche depuis main (cherry-pick ciblé ou port manuel, jamais merge massif).
4. Exécuter CI et documenter les écarts.
5. Une PR par lot cohérent, description des preuves et limites.

### Lot C — services connectés (après Free)
- BFF : déploiement, env vars, CORS, rate-limit, observabilité et tests staging.
- Supabase : migrations, RLS, comptes/roles et tests de permissions.
- Market data : adapter read-only, contrat versionné, provenance/horodatage/fraîcheur, couverture et licence confirmées avant toute donnée réelle.
- Chariow : checkout/webhook signé, idempotence, activation/expiration/révocation Premium E2E.
- AI : provider server-side, contrôle coûts/quota, privacy, réponses pédagogiques; UI doit afficher l'état réel.

## 3. Garde-fous de livraison
- `main` n'est pas modifié directement.
- Pas de secret dans Git, issue, PR ou conversation.
- Aucun paiement, abonnement, flux live ou assistant IA présenté comme actif sans preuve de bout en bout.
- Pas de fallback de cotations réelles vers des données synthétiques silencieux.
- Pas d'ordre broker automatique.
- Aucun merge de branche historique entière.
- Toute PR doit être testée, ciblée et réversible.

## 4. Journal d'avancement
| Date | Action | Résultat |
|---|---|---|
| 09/11/2026 | Baseline global (#237) | intégré à main |
| 09/11/2026 | CodeQL sur c5be790 | succès |
| 09/11/2026 | DDA E2E sur c5be790 | en cours lors du relevé |
| 09/11/2026 | Branches historiques | inventaire initial; tri approfondi à poursuivre |

## 5. Critère de priorité
La prochaine livraison doit réduire un risque réel du lancement ou améliorer le parcours Free. Les extensions (Terminal live, BRVM live, Premium, Lab Pro) ne passent devant la fiabilité Free et la transparence qu'après validation de leurs dépendances.
