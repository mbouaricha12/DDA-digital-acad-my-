# DDA — fondation serveur Premium

## Ce qui a été intégré

La branche d’intégration reprend les garde-fous BFF de préparation au déploiement et la persistance BillingStore Supabase/Chariow :

- endpoint `/healthz` sans effet secondaire pour Render/Railway ;
- validation stricte de la configuration serveur ;
- cookies `__Host-` et chiffrement de session contrôlés ;
- origines exactes, HTTPS obligatoire hors localhost de développement ;
- validation des JSON et des `Content-Type` avec réponses 400/415 propres ;
- logs d’erreur sans contenu libre du Journal ni message d’exception brut ;
- idempotence des mutations profil ;
- persistance idempotente des Pulses Chariow dans `dda_billing_memberships` ;
- mapping contrôlé des transitions `pending`, `active`, `expired`, `revoked` ;
- entitlements Premium lus côté serveur ;
- migration Supabase et politiques RLS sans écriture navigateur ;
- suppression des memberships lors de la suppression d’un compte.

## Tests passés

- syntaxe de tous les runtimes `dist`, `bff/src` et `tests` ;
- BFF implementation contract : PASS ;
- P4 Chariow billing contract : PASS ;
- BillingStore Supabase contract : PASS ;
- P3 migration inventory : PASS ;
- RLS policy audit : PASS ;
- Free/Premium/Access contract : PASS ;
- Premium P2 contract : PASS ;
- Premium value contract : PASS ;
- site completion surfaces contract : PASS ;
- suite navigateur complète : **54 passed, 0 failed** ;
- `git diff --check` : PASS.

## Limites volontairement conservées

Cette tranche prépare l’architecture, elle ne simule pas un paiement réel et n’active pas le BFF sur le site public. Avant production commerciale, il faut encore fournir dans un environnement contrôlé : les secrets Supabase/Chariow, le produit et les prix définitifs, le webhook signé, l’URL de domaine autorisée, les tests de restauration/export/suppression, la limitation de débit distribuée, la revue DPA/région et la validation juridique finale.

Le mode DDA Free reste autonome et fonctionnel si `DDA_BFF_BASE_URL` est vide. L’activation Premium ne doit venir que d’un entitlement serveur valide ; un état local, une preuve pédagogique ou une redirection navigateur ne suffit pas.
