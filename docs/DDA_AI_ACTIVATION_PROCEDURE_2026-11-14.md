# DDA AI — Procédure d'activation (`ANTHROPIC_API_KEY`)

**Date :** 14 novembre 2026
**Statut :** procédure uniquement — **aucune clé n'est posée, aucune dépense engagée**. Rien ici ne modifie le code ; le code est déjà prêt et attend cette seule variable.

## 1. Ce qui est déjà construit (vérifié dans le code, pas supposé)

- `bff/src/ai-assistant.js` : adaptateur serveur, modèle `claude-haiku-5-5` (configurable via `ANTHROPIC_MODEL`), `max_tokens: 700` par réponse, historique limité aux 6 derniers échanges, message limité à 2000 caractères.
- Garde-fous produit dans le prompt système : jamais de signal de trading, jamais de prédiction de marché, jamais de cotation inventée, toujours en français, toujours recentré sur la pédagogie.
- `POST /v1/ai/ask` (`bff/src/app.js`) : authentification + CSRF obligatoires, **limite de 20 questions/heure/utilisateur** déjà en place (`rateLimiter`), échec honnête `503 ai_not_configured` si la clé est absente — c'est l'état réel de production aujourd'hui.
- `dist/app.js` (chat Academy) : jamais de fausse réponse si le serveur est hors ligne ou en limite — message honnête affiché à l'apprenant.

## 2. Configuration côté serveur (où poser la clé)

1. Créer une clé API dédiée sur la console Anthropic (console.anthropic.com), **jamais** la clé personnelle de compte — une clé nommée explicitement (ex. "DDA-production") pour pouvoir la révoquer isolément.
2. Ajouter dans Vercel → Projet `dda-digital-acad-my` → Environment Variables → **Production uniquement** (jamais Preview, pour ne pas exposer la clé sur des déploiements de PR) :
   - `ANTHROPIC_API_KEY` = la clé créée à l'étape 1.
   - `ANTHROPIC_MODEL` (optionnel) = `claude-haiku-5-5` si tu veux l'expliciter, sinon le code utilise déjà cette valeur par défaut.
3. La clé n'est **jamais** envoyée au navigateur — elle reste côté serveur (`bff/src/ai-assistant.js`), confirmé par lecture directe du code.
4. Un redéploiement (ou le prochain déploiement Vercel) est nécessaire pour que la fonction serverless charge la nouvelle variable.

## 3. Estimation des coûts — méthode, pas un chiffre inventé

Je n'ai pas de tarif officiel vérifié de première main à citer ici pour `claude-haiku-5-5` au moment de cette procédure — **à confirmer sur la page de tarification Anthropic avant d'ajouter la clé**, pas une estimation de ma part qui pourrait être fausse ou périmée.

Ce qui est vérifiable dans le code et permet de borner l'exposition, une fois le tarif réel en main :
- **Plafond de sortie par réponse** : 700 tokens maximum (`max_tokens: 700`).
- **Plafond d'entrée par requête** : message ≤ 2000 caractères + historique ≤ 6 échanges ≤ 2000 caractères chacun → une requête ne peut jamais dépasser environ 14 000 caractères d'historique + 2000 du message + le prompt système (~900 caractères) = un plafond d'entrée calculable et fixe.
- **Plafond par utilisateur** : 20 questions/heure maximum — donc coût maximal théorique par utilisateur actif = 20 × (coût d'une requête au tarif réel).
- **Pas de plafond global tous utilisateurs confondus actuellement dans le code** — avec peu d'apprenants au lancement, le risque est limité, mais si tu veux un plafond de dépense mensuel dur, dis-le-moi : j'ajouterai une limite globale (ex. "stop automatique à N requêtes IA/jour toutes utilisateurs confondus") avant l'activation, pas après.

**Recommandation concrète** : une fois le tarif confirmé sur le site d'Anthropic, calcule (20 requêtes × coût par requête au tarif réel) pour avoir ton pire cas par utilisateur actif sur une heure, et multiplie par le nombre d'apprenants actifs attendus au lancement pilote pour ton budget mensuel prévisionnel.

## 4. Désactivation immédiate — déjà possible, sans nouveau code

- **Retirer `ANTHROPIC_API_KEY`** des variables d'environnement Vercel (Production) → au prochain déploiement, `/v1/ai/ask` repasse honnêtement à `503 ai_not_configured`, exactement l'état actuel. Aucune réponse n'est jamais fabriquée dans cet état.
- Alternative plus rapide sans attendre un déploiement : **révoquer la clé directement sur la console Anthropic** — la clé devient invalide immédiatement, chaque appel échoue et `/v1/ai/ask` répond `502 ai_provider_failed` (message honnête à l'apprenant, pas de fausse réponse).
- Aucune des deux méthodes ne nécessite une intervention de ma part dans l'instant — ce sont des actions que tu peux faire toi-même, à tout moment, depuis Vercel ou la console Anthropic.

## 5. Vérification du fonctionnement réel, une fois la clé posée

Une fois `ANTHROPIC_API_KEY` ajoutée et le déploiement effectué, je peux vérifier que DDA AI répond réellement en production :
1. Confirmer côté code que la variable est bien lue (déjà fait, ligne `ai-assistant.js:79`).
2. Te demander de confirmer que `academy.html#intelligence` affiche une vraie réponse à une question test (je n'ai pas d'accès réseau sortant vers `dariusdigitalacademy.com` depuis cette session pour le vérifier moi-même — tu devras confirmer visuellement, ou je peux écrire un test automatisé qui appelle `/v1/ai/ask` directement si tu me donnes un moyen d'y accéder).
3. Vérifier dans les logs Vercel qu'aucune erreur `ai_provider_failed` répétée n'apparaît.

## 6. Décision qui t'appartient

Aucune étape ci-dessus n'a été exécutée. Dis-moi quand tu as :
- créé la clé Anthropic dédiée,
- confirmé le tarif réel et ton budget acceptable,
- décidé si tu veux un plafond global en plus du plafond par utilisateur déjà en place,

et je t'accompagne pour l'ajout de la variable et la vérification post-déploiement.
