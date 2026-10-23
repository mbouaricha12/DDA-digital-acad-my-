# DDA AutoTrader — révocation immédiate et nettoyage des sessions v1

**Statut : procédure définie et partiellement mise en œuvre dans le BFF.** Les événements actuellement reconnus sont `license.revoked` (retrait immédiat) et `license.expired` (fin effective). Les événements Chariow de résiliation programmée/renouvellement désactivé ne sont pas encore mappés : leur nom, leur signature et la date d’effet doivent être confirmés dans la documentation ou par un payload signé avant de les activer.

## Décision de portée des sessions

Les lignes `dda_sessions` représentent l’authentification générale DDA. Elles ne contiennent pas les droits AutoTrader et ne stockent aucun jeton MT5. **Une expiration ou une résiliation AutoTrader ne révoque pas ces sessions de compte**, car cela déconnecterait sans nécessité l’utilisateur de l’Académie et de ses autres achats.

La session DDA reste valide pour les fonctions autorisées. En revanche, aucun accès AutoTrader ne peut être déduit du cookie seul : chaque requête protégée relit les memberships côté serveur. Il n’existe aujourd’hui ni session AutoTrader persistante, ni connexion MT5, ni secret de courtier à nettoyer. Le « nettoyage de session AutoTrader » actuel consiste donc à ne conserver aucun droit dans la session globale; la révocation de droits et la revalidation sont les contrôles actifs.

Avant de créer des sessions de fonctionnalité ou des connexions courtier, créer un stockage séparé et révocable (p. ex. `dda_autotrader_sessions`) relié à l’utilisateur et à l’abonnement source. Ce stockage ne doit contenir que des références/empreintes de jetons révocables, jamais un mot de passe de courtier. À la perte du dernier entitlement actif `autotrader.analysis`, révoquer les baux/tokens AutoTrader de cet utilisateur, purger le cache de fonctionnalité et déconnecter toute connexion courtier selon son API. Ne jamais remplacer ce nettoyage ciblé par `sessions.revokeAll()`.

## Procédure de révocation immédiate

1. **Recevoir et authentifier le Pulse.** Vérifier le HMAC sur les octets bruts, exiger l’identifiant de livraison et appliquer l’allowlist serveur du produit. Le navigateur et les valeurs Premium côté client ne participent jamais à la décision.
2. **Persister la transition avant l’accusé de réception.** Pour `license.revoked`, écrire le membership source avec `status='revoked'` et `entitlement_snapshot=[]`. Pour `license.expired`, écrire `status='expired'` et `entitlement_snapshot=[]`, avec la date d’effet connue. Le BFF n’annonce le Pulse comme `processed` qu’après la persistance.
3. **Ne pas révoquer un achat distinct.** Le BFF agrège les memberships actifs. Si le compte a un autre membership actif qui accorde `autotrader.analysis`, le droit reste actif. La révocation porte sur la ligne/licence source concernée; elle ne supprime pas les autres achats.
4. **Refuser la requête suivante.** `POST /v1/autotrader/analyze` relit les droits serveur avant réservation de quota et avant calcul; la session DDA seule ne suffit pas. Après le calcul, le BFF relit les droits une seconde fois. Si la révocation a été enregistrée pendant une analyse en vol, il jette le résultat et répond `403 entitlement_required` au lieu de renvoyer les métriques.
5. **Nettoyer seulement les sessions de fonctionnalité.** Lorsque le stockage dédié existera, révoquer ses sessions associées à la licence révoquée; ne révoquer toutes les sessions AutoTrader de l’utilisateur que s’il ne lui reste aucun entitlement AutoTrader actif. La session DDA globale est conservée.
6. **En cas d’échec, ne pas confirmer.** Une erreur de store laisse le webhook non traité et le BFF répond 5xx pour demander un nouvel essai. Le claim d’idempotence distingue maintenant les livraisons `processed` (doublons définitifs) des livraisons restées `accepted` ou `failed` (à rejouer). Réappliquer une transition est sans effet supplémentaire sur son membership source.
7. **Auditer sans données sensibles.** Journaliser l’identifiant de requête/livraison et l’événement, pas le payload client, l’adresse email, le token de session ou les identifiants de courtier.

## Expiration, annulation et résiliation

- **Expiration effective :** `license.expired` vide les entitlements et retire le droit dès que le webhook est persisté. Le filtre temporel de `BillingStore.getForUser` refuse également un membership dont `ends_at` est atteint, même si l’événement n’a pas encore été reçu.
- **Révocation immédiate :** `license.revoked` est un statut terminal de retrait immédiat dans l’application; l’instant d’effet est celui fourni par la transition persistée.
- **Annulation à échéance :** ne pas confondre « renouvellement désactivé » et « droit déjà expiré ». Conserver l’accès jusqu’à l’échéance contractuelle validée (`ends_at`), puis le refuser à cette date. L’événement Chariow de planification de fin de période n’est pas encore activé dans le mapping actuel.
- **Paiement échoué :** `failed.sale` ne confère pas de droit, mais ne doit pas révoquer un autre membership déjà payé. Toute règle de grâce ou de suspension liée au renouvellement nécessite le contrat d’événement Chariow vérifié.

## Idempotence et ordre des événements

Le `delivery_id` protège des répétitions exactes. Une livraison persistée mais restée `accepted`/`failed` doit être rejouée; une livraison `processed` est ignorée. Les transitions de membership sont des upserts sur la source externe et les snapshots inactifs ne portent aucun entitlement.

**Point restant avant production :** vérifier l’ordre/horodatage des Pulses Chariow et empêcher qu’un événement d’activation ancien, livré après une révocation, ne réactive le même droit. Les événements distincts peuvent décrire des achats/licences distincts; ne pas les fusionner uniquement sur l’utilisateur ou le produit sans connaître la sémantique fournisseur. Tant que la règle d’ordre et les événements de résiliation ne sont pas vérifiés, surveiller les réactivations inattendues et garder toute exécution de trading désactivée.

## Tests et état de livraison

La suite HTTP couvre le refus avant calcul, l’expiration et la révocation concurrente pendant l’analyse. Les tests BillingStore couvrent le retry d’une livraison non terminée et l’ignorance d’une livraison achevée. Ces tests ne remplacent ni un essai de webhook signé dans l’environnement Chariow, ni l’application des migrations Supabase.
