# DDA — Matrice Freemium / Premium

**Statut :** brouillon à valider par le propriétaire — aucune modification de permission, quota ou paiement
**Branche de référence :** `launch/dda-controlled-20261128`
**Principe :** Free doit être autonome et utile ; Premium doit ajouter une profondeur réellement disponible ; le navigateur ne fait jamais autorité.

## 1. Matrice fonctionnelle

| Fonctionnalité existante | Classe proposée | Limite honnête / valeur de conversion |
|---|---|---|
| Landing, accès et parcours d’inscription | Free | Accès libre ; aucun paiement requis |
| M0 Fondations, leçons, exercices, quiz, feedback | Free | Socle pédagogique complet, sans limitation artificielle |
| Progression et prochaines actions | Free | Accessible en permanence ; synchronisation serveur à venir |
| Journal & Plan personnel | Free | Données personnelles toujours consultables et exportables à terme |
| Terminal pédagogique synthétique | Free | Données de démonstration ; aucune donnée marché live |
| Ressources Free | Free | Glossaire, checklists et supports fondamentaux |
| Market Intelligence démonstrative | Free | Démonstration non connectée ; pas de promesse de flux temps réel |
| P2 Risk & Discipline, leçons authored | Premium | Approfondissement structuré au-delà du socle Free |
| Risk Plan Lab | Premium | Travail guidé et validation de scénario |
| Controlled Decision Assessment | Premium | Évaluation et preuve pédagogique, sans promesse financière |
| Ressources Premium | Premium | Atelier et supports avancés lorsqu’ils sont effectivement disponibles |
| DDA AI / AI Coach | Future puis Premium à confirmer | Fonction potentiellement coûteuse ; activation seulement après mesure des coûts |
| Analyses sauvegardées synchronisées multi-appareils | Future puis Premium à confirmer | À activer avec stockage serveur, propriété de compte et quotas contrôlés |
| DDA Family, Weekly Review, Decision Replay, Trader DNA | Future | Ne pas vendre ni présenter comme inclus avant livraison réelle |
| Bourses, tarifs réduits, accès sponsorisés | Access / future | Non disponible sans financement, critères et validation serveur |

## 2. Quotas proposés à valider

Ces valeurs sont des propositions de départ, pas des règles actives.

| Ressource | Free proposé | Premium proposé | Règle de sécurité |
|---|---:|---:|---|
| DDA AI | 5 requêtes par jour | 30 requêtes par jour | Comptage côté BFF ; coût et abus surveillés |
| Analyses sauvegardées serveur | 10 analyses | 100 analyses | Le propriétaire garde l’accès à ses données ; suppression/export prévus |
| Exécutions de fonctions avancées | 3 par jour | 20 par jour | Refus serveur au quota ; jamais de quota fourni par le navigateur |
| Ressources Premium | Non accessible | Selon entitlement actif | Vérification serveur par ressource |
| Journal personnel | Non plafonné localement | Non plafonné dans le périmètre du compte | Les données personnelles ne sont jamais supprimées par atteinte d’un quota |

Les quotas devront être centralisés dans une configuration serveur versionnée, par exemple une table ou configuration BFF dédiée. Le client ne devra recevoir que l’état utile : `remaining`, `reset_at`, `limit_reached`.

## 3. Messages de conversion

### À l’approche de la limite

> Tu approches de ta limite gratuite pour cette fonction. Tes données restent disponibles. Tu peux continuer demain ou découvrir ce que Premium ajoute à cette étape.

### À la limite

> La limite gratuite est atteinte pour aujourd’hui. Aucun contenu personnel n’est supprimé. La limite se réinitialisera à la date indiquée.

### Pour une fonction Premium

> Cette étape approfondit le parcours avec Premium. Ton accès Free, ta progression et tes données personnelles restent disponibles.

### État paiement non confirmé

> Un retour de paiement ou un changement local ne confirme jamais un accès Premium. L’accès est accordé uniquement après confirmation serveur vérifiée.

## 4. Contrôles obligatoires

1. Le navigateur ne peut jamais écrire ou modifier `plan`, `status`, `quota`, `entitlement`, `starts_at` ou `ends_at`.
2. Le BFF détermine l’identité depuis la session serveur, jamais depuis un `user_id` envoyé par le navigateur.
3. Les routes Premium vérifient l’entitlement côté serveur et renvoient `403` si nécessaire.
4. Les webhooks Chariow sont signés, idempotents et persistés avant l’activation d’un entitlement.
5. Expiration, révocation, remboursement ou échec confirmé retirent l’accès côté serveur.
6. Les données personnelles restent consultables même lorsqu’un quota fonctionnel est atteint.
7. Le cache offline ne doit jamais prolonger un entitlement expiré.

## 5. Décisions du propriétaire requises avant implémentation

- Valider ou modifier les quotas proposés.
- Confirmer si DDA AI est Free limité, Premium uniquement ou reporté.
- Définir le nombre et le type d’analyses sauvegardées incluses dans Premium.
- Confirmer le prix et le statut commercial Chariow avant d’afficher un abonnement actif.
- Choisir une politique d’export et de suppression des données personnelles.
- Valider le périmètre exact de `Future` avant toute promesse marketing.

**Aucune permission, aucun quota et aucun flux de paiement ne doit être modifié avant cette validation.**
