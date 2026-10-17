# DDA Premium — Checklist d’activation technique et commerciale

**Version :** 1.0 — 16 octobre 2026  
**Statut actuel :** préparation uniquement — aucun paiement réel ni entitlement serveur n’est activé par ce document.  
**Règle :** une case ne peut être cochée qu’avec une preuve vérifiable dans l’environnement concerné.

## 1. Décision de lancement

- [ ] Décider si l’offre Premium est mensuelle, annuelle, ponctuelle ou autre.
- [ ] Valider le nom public du produit et sa promesse exacte.
- [ ] Définir ce qui est inclus : P2, Labs, revues, ressources, support et éventuelles limites.
- [ ] Décider ce qui reste local, ce qui est synchronisé et ce qui est supprimable par l’utilisateur.
- [ ] Refuser toute promesse de rendement, de signal, de certification officielle ou de résultat financier.
- [ ] Maintenir l’aperçu local tant que les étapes ci-dessous ne sont pas validées.

## 2. Informations légales et commerciales — intervention du propriétaire requise

À fournir et faire vérifier par le responsable DDA avant toute vente :

- [ ] identité légale complète de l’éditeur ;
- [ ] forme juridique et numéro d’immatriculation si applicable ;
- [ ] adresse professionnelle officielle ;
- [ ] e-mail de contact et canal de réclamation ;
- [ ] conditions générales de vente ;
- [ ] politique de confidentialité et base légale ;
- [ ] politique cookies / traceurs réellement utilisés ;
- [ ] politique de remboursement, résiliation et accès après résiliation ;
- [ ] statut fiscal / TVA et devise affichée ;
- [ ] description claire de la nature éducative et des limites financières ;
- [ ] revue juridique et validation de la juridiction cible.

**Aucune de ces informations ne doit être inventée ou déduite automatiquement.** L’adresse e-mail DDA actuellement publiée ne remplace pas l’identité juridique complète.

## 3. Chariow — configuration attendue

Le compte marchand et les valeurs réelles doivent être fournis par le propriétaire dans un canal sécurisé, jamais dans le dépôt :

- [ ] compte Chariow vérifié et autorisé à encaisser ;
- [ ] produit Premium créé dans Chariow ;
- [ ] identifiant réel du produit confirmé ;
- [ ] prix, devise, fréquence et taxes confirmés ;
- [ ] politique de remboursement saisie et testée ;
- [ ] URL de checkout de test vérifiée ;
- [ ] URL de retour autorisée et correspondant au domaine DDA ;
- [ ] `CHARIOW_API_KEY` configurée uniquement côté serveur ;
- [ ] `CHARIOW_PREMIUM_PRODUCT_IDS` renseignée avec les IDs réels ;
- [ ] `CHARIOW_CHECKOUT_REDIRECT_URL` renseignée côté serveur ;
- [ ] aucun bouton de vente public activé avant test sandbox complet.

## 4. BFF et domaine public

- [ ] URL HTTPS publique du BFF fournie ;
- [ ] certificat et domaine vérifiés ;
- [ ] `DDA_BFF_BASE_URL` configurée dans le front de production ;
- [ ] `ALLOWED_ORIGINS` limité à l’origine DDA exacte ;
- [ ] `BFF_COOKIE_SECURE=true` en production ;
- [ ] cookies `__Host-` vérifiés sur le domaine réel ;
- [ ] `/healthz` disponible sans exposer de secret ni détail interne ;
- [ ] logs sans e-mail, token, clé secrète ou contenu de paiement ;
- [ ] limitation de débit distribuée choisie et testée ;
- [ ] plan de reprise et d’alerte défini.

## 5. Secrets Supabase — serveur uniquement

- [ ] projet Supabase de staging créé et identifié ;
- [ ] migrations `0001` à `0004` relues et appliquées dans un environnement isolé ;
- [ ] `SUPABASE_URL` vérifiée comme URL HTTPS racine ;
- [ ] `SUPABASE_PUBLISHABLE_KEY` configurée côté serveur / client selon le design retenu ;
- [ ] `SUPABASE_SERVICE_ROLE_KEY` uniquement dans le gestionnaire de secrets du BFF ;
- [ ] `SESSION_ENCRYPTION_KEY` générée aléatoirement et stockée hors dépôt ;
- [ ] `EMAIL_REDIRECT_TO` vérifiée sur le domaine autorisé ;
- [ ] rotation et révocation des secrets documentées ;
- [ ] aucune valeur réelle committée, affichée dans un log ou transmise au navigateur.

## 6. Authentification et comptes

- [ ] création de compte testée ;
- [ ] connexion et déconnexion testées ;
- [ ] vérification e-mail testée ;
- [ ] récupération de compte testée ;
- [ ] expiration de session testée ;
- [ ] cookie CSRF et vérification Origin testés ;
- [ ] un utilisateur ne peut lire ou modifier que ses propres données ;
- [ ] absence d’énumération de comptes vérifiée ;
- [ ] suppression de compte et suppression des données documentées ;
- [ ] export des données testé avant ouverture commerciale.

## 7. Webhooks Chariow / Pulse

- [ ] URL publique du webhook fournie à Chariow ;
- [ ] `CHARIOW_PULSE_SECRET` configuré côté serveur ;
- [ ] signature HMAC vérifiée sur les octets bruts non transformés ;
- [ ] signature absente ou invalide rejetée ;
- [ ] type d’événement inconnu rejeté ou ignoré sans attribution de droit ;
- [ ] produit inconnu rejeté sans attribution de droit ;
- [ ] événement sans utilisateur DDA lié rejeté sans attribution de droit ;
- [ ] identifiant de livraison conservé comme clé d’idempotence ;
- [ ] doublon exact renvoie un résultat idempotent ;
- [ ] événement rejoué après modification ne réactive pas un droit indu ;
- [ ] transition active, suspendue, annulée et expirée testées ;
- [ ] ordre d’arrivée différent testé ;
- [ ] réponse webhook et logs ne divulguent aucun secret.

## 8. Entitlements Premium côté serveur

- [ ] l’identité utilisateur vient de la session serveur, jamais d’un champ libre du navigateur ;
- [ ] l’activation dépend d’un produit Chariow autorisé et d’un événement signé ;
- [ ] la date de début, d’expiration et le statut sont persistés ;
- [ ] la révocation est effective côté serveur ;
- [ ] l’expiration retire l’accès sans attendre un rafraîchissement local arbitraire ;
- [ ] un champ `localStorage` Premium ne suffit jamais à déverrouiller une ressource protégée ;
- [ ] une réponse API sans entitlement bloque l’accès ;
- [ ] le cache ne conserve pas un droit expiré ;
- [ ] un utilisateur Free ne peut pas appeler directement une route Premium ;
- [ ] la ressource Premium ne repose pas uniquement sur une dissimulation CSS ou HTML.

## 9. Tests de paiement en sandbox

- [ ] achat réussi avec produit autorisé ;
- [ ] paiement refusé ;
- [ ] abandon du checkout ;
- [ ] remboursement ;
- [ ] annulation / expiration ;
- [ ] double webhook ;
- [ ] webhook hors ordre ;
- [ ] produit incorrect ;
- [ ] utilisateur absent ou identifiant invalide ;
- [ ] rejeu avec signature valide mais delivery ID déjà traité ;
- [ ] vérification que le compte Free n’obtient jamais Premium par simple retour navigateur ;
- [ ] vérification que le navigateur ne reçoit aucune clé serveur.

## 10. Synchronisation des données

- [ ] progression Free d’un appareil apparaît sur un second appareil après authentification ;
- [ ] Journal et Plan sont associés au bon utilisateur ;
- [ ] conflit entre deux modifications détecté et résolu selon une règle documentée ;
- [ ] déconnexion efface les données de session mais pas les données destinées à rester au compte ;
- [ ] suppression du compte supprime ou anonymise les données selon la politique publiée ;
- [ ] export lisible fourni à l’utilisateur ;
- [ ] panne BFF ne transforme pas silencieusement un échec distant en succès Premium ;
- [ ] retour au mode local reste explicitement signalé si la synchronisation n’est pas disponible.

## 11. Critères de go / no-go

### Go uniquement si

- toutes les cases P0 sont prouvées en staging ;
- l’identité juridique et les conditions commerciales sont validées ;
- au moins un cycle complet checkout → webhook → entitlement → accès → révocation est réussi ;
- les événements invalides et rejoués sont rejetés sans élévation de privilèges ;
- les données d’un compte test ne sont jamais visibles par un autre compte ;
- le plan de support et de remboursement est opérationnel ;
- le front ne présente plus un prototype local comme un abonnement réel ;
- une revue humaine finale valide le texte public et le prix.

### No-go si

- une clé réelle est manquante ou exposée ;
- l’URL BFF n’est pas HTTPS et publique ;
- Chariow ne fournit pas les événements signés attendus ;
- l’entitlement vient seulement de `localStorage` ou de l’URL de retour ;
- la révocation n’est pas testée ;
- les mentions légales commerciales sont incomplètes ;
- un test de synchronisation ou de suppression reste inconnu ;
- le prix ou le produit réel n’est pas confirmé ;
- les vidéos sont annoncées comme publiées sans fichier et URL vérifiés.

## 12. Informations à fournir pour la prochaine activation

Le propriétaire DDA devra fournir, dans un canal approprié :

1. identité juridique et juridiction de vente ;
2. produit, prix, devise et fréquence Premium ;
3. URL publique du BFF et domaine frontal définitif ;
4. accès / secrets Chariow et Supabase via le gestionnaire sécurisé ;
5. URL et secret de webhook ;
6. politique de remboursement et résiliation ;
7. décision sur la synchronisation et la conservation des données ;
8. validation de la date de staging et des personnes autorisées à tester.

Tant que ces informations ne sont pas disponibles, DDA reste en **pilote Free** et **aperçu Premium local**, sans encaissement.
