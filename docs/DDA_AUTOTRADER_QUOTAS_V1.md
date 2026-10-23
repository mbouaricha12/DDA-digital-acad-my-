# DDA AutoTrader — quotas d’usage v1

**Statut : politique et compteurs définis localement; migration Supabase non appliquée à distance.** Les valeurs ci-dessous sont des plafonds initiaux de staging, pas les limites d’un fournisseur, pas un budget monétaire et pas une promesse de capacité de production.

## Politique initiale

### Par utilisateur DDA

Une requête valide à `POST /v1/autotrader/analyze` consomme une unité après authentification et contrôle du droit `autotrader.analysis`, avant le calcul. Les compteurs sont par UUID de compte DDA, partagés entre les instances du BFF et alignés sur des fenêtres calendaires UTC.

| Fenêtre UTC | Plafond initial |
|---|---:|
| Minute | 10 analyses |
| Heure | 50 analyses |
| Jour | 200 analyses |

Si un des plafonds est atteint, l’API répond `429 quota_exceeded` avec `Retry-After` lorsque le prochain reset est connu. Une série invalide mais de forme de requête valide consomme tout de même une réservation, car elle atteint le calcul et son coût CPU; les requêtes rejetées avant authentification, contrôle d’accès ou forme minimale ne consomment pas de quota.

### Global par compte fournisseur de données

Tous les utilisateurs partagent les mêmes compteurs pour un identifiant fournisseur configuré. La requête fournisseur devra réserver les trois fenêtres **avant** chaque appel réseau sortant.

| Fenêtre UTC | Plafond initial |
|---|---:|
| Minute | 10 appels |
| Jour | 200 appels |
| Mois | 5 000 unités fournisseur |

L’unité fournisseur doit être calculée par l’adaptateur selon le barème documenté du fournisseur retenu (crédits, points d’usage, ou unité interne équivalente). **Elle n’est pas assimilable à une devise tant qu’un tarif officiel n’est pas mappé.** Le plafond mensuel est une barrière interne provisoire et doit être fixé en dessous du plan réellement souscrit après vérification des prix, fenêtres, quotas inclus et règles de dépassement.

Aucun fournisseur de marché n’est branché à ce stade. `DDA_AUTOTRADER_PROVIDER_ID` est donc non configuré par défaut, et `reserveProviderUsage()` refuse l’appel tant que cet identifiant n’est pas défini. La route d’analyse actuelle reçoit une série en entrée : elle consomme le quota utilisateur mais **aucune** unité fournisseur.

## Configuration BFF

Les variables suivantes sont lues au démarrage; elles doivent être des entiers positifs. En leur absence, les valeurs de staging ci-dessus sont appliquées. Une valeur invalide empêche la création de la politique.

```dotenv
DDA_AUTOTRADER_USER_ANALYSES_PER_MINUTE=10
DDA_AUTOTRADER_USER_ANALYSES_PER_HOUR=50
DDA_AUTOTRADER_USER_ANALYSES_PER_DAY=200
DDA_AUTOTRADER_PROVIDER_ID=
DDA_AUTOTRADER_PROVIDER_REQUESTS_PER_MINUTE=10
DDA_AUTOTRADER_PROVIDER_REQUESTS_PER_DAY=200
DDA_AUTOTRADER_PROVIDER_UNITS_PER_MONTH=5000
```

Quand un fournisseur est choisi, son identifiant stable (p. ex. `twelvedata`, uniquement après sélection réelle) et la conversion documentée « requête → unités » doivent être configurés côté serveur, jamais depuis la requête client. Les limites devront être baissées si le contrat fournisseur ou le plafond de dépense interne l’exige.

## Persistance et atomicité

`PostgrestQuotaStore` appelle uniquement des fonctions RPC Supabase côté serveur avec la clé `service_role`. Le compteur n’est pas dans `localStorage` ni dans un store mémoire local.

`reserve_dda_autotrader_quota(jsonb)` réserve en une transaction l’ensemble des fenêtres d’une opération (minute/heure/jour ou minute/jour/mois). Des verrous consultatifs ordonnés et le verrouillage des lignes protègent les incréments concurrents; si une fenêtre dépasse, la sous-transaction annule toutes les réservations partielles du bundle. La table est RLS-active et sans accès navigateur. Le BFF répond `503 quota_unavailable` et n’analyse pas si la réservation n’est pas joignable ou retourne une forme invalide : aucun contournement mémoire n’est permis.

La migration [`0007_autotrader_quota_buckets.sql`](../supabase/migrations/0007_autotrader_quota_buckets.sql) crée table, RPC de réservation et RPC de purge. Elle doit être relue puis appliquée en staging séparément, après la migration d’entitlement 0006. Le BFF n’exécute jamais les migrations à son démarrage. `cleanupExpired()` permet de supprimer les fenêtres closes depuis plus de 90 jours; aucun cron de purge n’est configuré dans ce livrable.

## Fichiers et intégration

- `contracts/autotrader/quota-policy-v1.json` — politique machine-readable.
- `bff/src/quota-policy.js` — valeurs initiales, surcharge d’environnement et calcul des fenêtres UTC.
- `bff/src/quota-store.js` — réservations utilisateur et fournisseur via Supabase RPC.
- `bff/src/app.js` — quota utilisateur sur la route AutoTrader après la garde entitlement.
- `bff/src/server.js` — injection du store côté serveur.
- `supabase/migrations/0007_autotrader_quota_buckets.sql` — table/RPC protégées.

Le futur adaptateur marché devra appeler `quotaStore.reserveProviderUsage({ providerId, units, asOf, policy })` **immédiatement avant** la requête distante. Ne pas appeler ce helper après la réponse fournisseur, car cela permettrait de dépasser le plafond en cas de requêtes simultanées.

## Contrôles encore nécessaires avant production

1. Choisir le fournisseur, confirmer son unité de facturation, les limites par seconde/minute/jour et le mode de comptage des appels.
2. Mapper une limite monétaire interne au barème fournisseur; le compteur en unités n’est pas un hard cap financier sans cette conversion.
3. Appliquer 0007 en staging, tester des appels concurrents et vérifier l’annulation atomique de tous les buckets en cas de dépassement.
4. Ajouter l’adaptateur réel, un timeout réseau et un plafond de concurrence distribué si le fournisseur le demande.
5. Configurer une purge récurrente des compteurs expirés et des alertes avant épuisement du budget.
6. Ajuster les valeurs de staging à l’offre AutoTrader, aux coûts et au plan réellement acheté avant activation commerciale.
