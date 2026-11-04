# DDA — compte rendu de reprise du 4 novembre 2026

## Point de départ

Le dépôt a été recloné depuis `origin/main` après une réinitialisation de la sandbox. État de départ : commit `a19029a`, qui contient déjà les PR #185, #193 et #194 fusionnées.

## État des PR demandées

| PR | Sujet | État constaté |
|---|---|---|
| #185 | Vidéos réelles M0.2/M0.3 | Fusionnée le 3 novembre 2026 |
| #193 | Première passe UX langage positif | Fusionnée le 4 novembre 2026 |
| #194 | Backend DDA AI avec Anthropic | Fusionnée le 4 novembre 2026 |
| #186 | Leçon d’introduction BRVM | Ouverte mais `DIRTY`, donc non fusionnée |
| #195 | Reprise propre de la leçon BRVM | Nouvelle PR créée depuis le main actuel |

## Audit vidéo

Le registre `VIDEO_REGISTRY` contient huit entrées YouTube Shorts :

- indicateurs ;
- moyennes mobiles ;
- volatilité Forex ;
- cryptomonnaies ;
- types de traders ;
- supports et résistances ;
- bougies japonaises ;
- marché des devises.

Les huit URLs répondent à l’oEmbed YouTube avec HTTP 200 et renvoient un titre. Cependant, la vérification navigateur de la première vidéo (`VID-INDICATEURS`) affiche réellement **Video unavailable**. Une vérification HTML des huit pages contient également l’état indisponible. Le HTTP 200 de l’oEmbed ne constitue donc pas une preuve de lecture effective.

Décision : ne pas remplacer ou inventer des URLs. Les vidéos doivent être revérifiées depuis le compte propriétaire Darius Digital Academy, puis remplacées par des URLs réellement lisibles ou retirées du statut `publié`. La vidéo **Figures chartistes** reste absente du registre car son URL complète n’a pas été fournie.

Le lecteur DDA conserve un comportement sûr : miniature d’abord, iframe YouTube privacy-enhanced après clic, et fallback si le média échoue.

## Audit DDA AI

Le backend DDA AI est présent et fusionné :

- route serveur `POST /v1/ai/ask` ;
- clé Anthropic uniquement côté serveur ;
- mode `503 ai_not_configured` si `ANTHROPIC_API_KEY` est absente ;
- historique limité et messages bornés ;
- garde-fous contre signaux, prédictions, conseils personnalisés et promesses de rendement.

Limite actuelle : l’interface Academy `#intelligence` reste une page de préparation et n’est pas encore connectée à `askAI()`. La clé Anthropic n’est pas configurée dans cette sandbox. Il ne faut donc pas afficher l’assistant comme actif avant configuration du BFF et ajout de l’interface de chargement, d’erreur et d’historique.

## Livraison BRVM

La page `Marchés & BRVM` existante conserve sa mission d’information : provenance, date, états vide/chargement/erreur et registre de publications fail-closed. Aucun cours réel ou document non vérifié n’a été ajouté.

La nouvelle branche `feat/brvm-intro-current` récupère uniquement la fonctionnalité utile de la PR #186 :

- route `#lesson-mbrvm1` ;
- leçon indépendante `MBRVM.1` ;
- accès Free sans prérequis M0/M1 ni Premium ;
- notions BRVM/UEMOA, actions, obligations et capitalisation ;
- exercice, quiz, résultat et progression persistante ;
- CTA depuis la page BRVM ;
- séparation stricte entre leçon pédagogique et données de marché.

La PR #195 remplace la PR #186 devenue conflictuelle avec l’état courant de `main`.

## Validation

- syntaxe JavaScript : réussie ;
- contrats Node : réussis ;
- vérification route/registre : réussie ;
- Playwright : **90 scénarios réussis, 0 échec** ;
- test smoke : non exécuté localement faute de `jsdom` installé dans la sandbox ;
- `git diff --check` : réussi.

## Blocages restants

1. Vérifier et republier les huit vidéos depuis le compte propriétaire YouTube.
2. Fournir l’URL complète de « Figures chartistes » si elle doit être ajoutée.
3. Configurer le BFF HTTPS et `ANTHROPIC_API_KEY` dans l’environnement serveur avant d’activer l’interface DDA AI.
4. Faire relire puis fusionner la PR #195 après ses checks GitHub.
5. Ne pas activer de portefeuille virtuel BRVM ou d’assistant IA BRVM avant persistance serveur, droits de données et chaîne de provenance validés.
