# DDA — Audit Master Specification 2.0

**Date :** 10 novembre 2026  
**Référentiel :** cahier des charges maître joint, Architecture DDA V2.1 corrigée, CDCP-OS 1.0 et état réel du dépôt GitHub.  
**Dépôt :** `mbouaricha12/DDA-digital-acad-my-`  
**Branche d’audit/correction :** `fix/p0-authenticated-identity`

## 1. Verdict exécutif

### DDA Free

**GO conditionnel pour pilote privé Free**, sous réserve de fusion de la correction P0 d’identité, d’un smoke test de production et d’une vérification manuelle avec deux vrais comptes.

Les preuves disponibles sont solides sur le prototype et les contrats : suite E2E locale **58/58**, contrats structurels, RLS, routes et sécurité verts. Le produit Free est toutefois principalement une expérience locale lorsque le BFF n’est pas configuré.

### DDA Premium

**NO-GO commercial immédiat.** Le dépôt présente explicitement Premium comme un aperçu local. Les paiements, le checkout, les entitlements serveur complets, le ledger, les remboursements et la réconciliation réelle ne sont pas activés et ne doivent pas être présentés comme disponibles.

### Production

**NO-GO pour une déclaration de lancement public complet** tant que :

1. la correction d’identité n’est pas fusionnée et vérifiée sur l’environnement publié ;
2. le smoke test de production avec deux comptes n’est pas exécuté ;
3. la PR de sécurité #121 n’est pas résolue côté GitHub (`mergeable: CONFLICTING`, `mergeStateStatus: DIRTY`) ;
4. les fonctionnalités locales et différées ne sont pas distinguées dans le plan de lancement public.

## 2. Architecture réellement observée

| Couche | État observé |
|---|---|
| Site public | `dist/index.html`, pages publiques autonomes et routes légales |
| Academy | `dist/academy.html`, shell SPA/hash routes, Dashboard, Parcours, leçons, Journal, Progression, Profil |
| État local | `dist/dda-core.js`, `localStorage` version 4, progression et preuves pédagogiques locales |
| Moteur pédagogique | `learning-engine.js`, registre de leçons, gates exercise/quiz, progression événementielle locale |
| BFF | `bff/src/app.js`, sessions opaques, CSRF, auth Supabase, profil `/v1/me`, comptes et export |
| Authentification | `bff/src/supabase-auth.js`, session serveur `__Host-dda_session`, refresh non stocké dans le navigateur |
| Billing | `bff/src/billing-store.js`, Chariow, idempotence, machine d’état et migration `0004` |
| BRVM | `bff/src/brvm-publication-store.js`, migration `0005`, publication fail-closed |
| Base de données | migrations Supabase 0001 à 0005, schéma BFF et RLS |
| CI/CD | Product Gate, E2E, CodeQL, RLS, registres de leçons, GitHub Pages |
| Publication | GitHub Pages sur `main`, domaine `dariusdigitalacademy.com`, HTTPS activé |

## 3. Fonctionnalités inventoriées

### Réelles et validées

- Landing, navigation publique et surfaces légales.
- Inscription/onboarding local et pont BFF optionnel.
- Dashboard cockpit et Mastery Thread.
- Curriculum M0 complet et M1.1 à M1.3 authored.
- Exercices, quiz, feedback, retry et gates de preuve.
- Progression basée sur événements pédagogiques locaux.
- Journal et Plan personnel locaux.
- Terminal de pratique pédagogique avec données synthétiques.
- BRVM en état vide/fail-closed avec contrats de gouvernance.
- Broker Hub informatif avec sélection tracée sans lien d’affiliation actif.
- BFF auth/session/profil lorsque `DDA_BFF_BASE_URL` est configuré.
- Rate limiting auth, révocation des sessions non actives et transition Billing monotone sur la branche corrective.
- Tests de sécurité XSS sur les preuves locales.

### Simulées ou locales

- Premium Track, Risk Plan Lab, Controlled Decision et certificats : aperçu pédagogique local.
- Membership Premium : aperçu local, sans achat actif.
- Market Intelligence : zones éditoriales/synthétiques, aucune source automatisée connectée.
- Terminal : série historique synthétique contrôlée, aucune cotation temps réel.
- Progression, Journal, préférences et preuves : localStorage lorsque le BFF métier n’est pas activé.
- Support, Communauté et Pratique avancée : surfaces d’aperçu ou préparation.

### Différées ou incomplètes

- Paiement Premium réellement commercialisable.
- Entitlements serveur complets branchés à l’expérience frontend de production.
- Ledger financier, remboursement et réconciliation opérationnels.
- Market Intelligence alimentée par une source autorisée et datée.
- AI Coach connecté ; l’interface doit rester honnête sur son état de préparation.
- Back-office complet administrateur : utilisateurs, contenu, paiements, support et logs métier.
- Synchronisation complète de la progression et du Journal sur plusieurs appareils.
- Smoke test live avec deux comptes réels sur le domaine public.
- Déconnexion visible dans l’interface Academy : le BFF expose `logout`, mais aucun contrôle visible n’a été trouvé dans `academy.html`.

## 4. Finding P0 — identité utilisateur

### Cause reproduite

`dist/app.js` utilisait :

```js
user.display_name || localUser.name || 'Apprenant'
```

Lorsqu’un compte B se connectait après un compte A conservé localement et que le profil serveur de B ne contenait pas encore de `display_name`, le nom local de A pouvait être réutilisé. Deux autres rendus utilisaient encore `Richard` comme fallback et le HTML initial affichait `Richard` avant l’hydratation.

### Correction appliquée sur cette branche

- ajout de `normalizeDisplayName()` avec fallback neutre `Apprenant` ;
- identité distante prioritaire lors de `hydrateRemoteSession()` ;
- suppression de la réutilisation de `localUser.name` pour une session distante ;
- correction du parcours d’onboarding distant ;
- correction du certificat, du Dashboard et du Profil ;
- remplacement des identités initiales visibles `Richard` par `Apprenant` ;
- initiales neutres `AP` dans le shell HTML.

### Test automatisé

`tests/test_authenticated_identity_switch.js` couvre :

1. compte A connecté : nom et e-mail A ;
2. déconnexion A ;
3. connexion B ;
4. actualisation du navigateur ;
5. vérification nom/e-mail B sur le profil et le Dashboard ;
6. vérification de l’absence du nom A dans le document.

Résultat : **PASS**.

## 5. Tests et preuves

| Validation | Résultat |
|---|---:|
| Contrats Node complets | PASS |
| Suite E2E Playwright | 58/58 PASS |
| Test identité A/B | PASS |
| Contrats RLS | PASS |
| Inventaire migrations | PASS |
| Cohérence routes/registre | PASS |
| CodeQL/Product Gate sur la révision précédente | PASS |
| Syntaxe JS et `git diff --check` | PASS |
| Smoke test production après correction P0 | À faire après fusion/déploiement |

## 6. Sécurité et dette priorisée

### P0

- Corriger et fusionner l’identité utilisateur : fait sur `fix/p0-authenticated-identity`, non encore publié.
- Vérifier le parcours A/B sur le domaine de production après fusion.
- Résoudre le conflit GitHub de la PR #121 avant de considérer les corrections sécurité comme intégrées à `main`.

### P1 — Free launch

- Ajouter un contrôle visible de déconnexion dans l’Academy.
- Clarifier à l’écran le statut « compte connecté » versus « progression synchronisée ».
- Documenter et tester les erreurs de BFF indisponible avec conservation locale honnête.
- Vérifier les routes protégées et les rôles administrateur réels avant d’exposer un back-office.

### P2 — Premium

- Appliquer la migration Supabase sur staging puis production contrôlée.
- Tester Chariow avec de vrais webhooks signés, événements dupliqués, hors séquence et remboursements.
- Brancher les entitlements serveur au frontend sans dépendance au localStorage.
- Finaliser prix, devises, périodicités, conditions commerciales, support et réconciliation.

### P3 — Extensions

- AI Coach distant.
- Skill Graph.
- Market Intelligence avancée.
- Communauté et automatisations.
- Credentials au-delà du certificat interne.

## 7. État GitHub et déploiement observé

- `main` pointe sur le merge `c93042f` issu de l’audit opérationnel #238.
- GitHub Pages est configuré sur `main`, domaine `dariusdigitalacademy.com`, HTTPS forcé et certificat approuvé.
- La PR #121 est ouverte sur la branche de sécurité, mais GitHub la signale encore `CONFLICTING` / `DIRTY` ; elle ne peut pas être considérée comme fusionnée.
- Plusieurs PR récentes sont ouvertes et doivent être évaluées contre l’autorité de `main` avant lancement.
- La correction P0 du présent rapport est sur une branche dédiée et n’a pas été fusionnée automatiquement.

## 8. Plan d’exécution recommandé

1. Rebaser la branche P0 sur `main` actualisé.
2. Exécuter les contrats et E2E sur la branche rebasée.
3. Ouvrir une PR dédiée à la correction d’identité avec ce rapport et la preuve A/B.
4. Faire relire et fusionner la PR selon la protection de `main`.
5. Attendre le déploiement GitHub Pages.
6. Exécuter le smoke test live sur mobile et desktop.
7. Tester deux comptes distincts sur le domaine public.
8. Autoriser seulement le pilote Free privé si les contrôles P0/P1 sont verts.
9. Maintenir Premium en aperçu jusqu’à validation serveur complète.

## 9. Conclusion

DDA dispose d’une base Free pédagogique cohérente et fortement testée, mais son état réel est celui d’un prototype avancé avec BFF optionnel et plusieurs surfaces locales ou différées. Le cahier des charges impose donc un lancement Free-first honnête, pas un lancement Premium complet.

Le bug d’identité « Richard » était un risque P0 de confidentialité et de confiance. Il est corrigé sur cette branche et couvert par un test A/B automatisé. La prochaine preuve indispensable est sa validation après fusion et déploiement sur le domaine public.
