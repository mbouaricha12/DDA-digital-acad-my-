# DDA — Audit global de référence (9 novembre 2026)

> Commit audité : `e86854e6fb929702f423276600547388fd9d54a2` (`main`). Audit documentaire/GitHub; ce document ne remplace pas les tests locaux, staging ou la revue exhaustive du runtime.

## Verdict exécutif

DDA possède une base pédagogique réelle et une architecture technique structurée. **Academy Free local est le périmètre le plus avancé. La plateforme connectée et commercialisable n'est pas encore certifiée.**

- **Academy Free :** M0/M1, leçons, exercices, quiz, feedback et progression locale présents; parcours navigateur couvert par tests.
- **Progression :** essentiellement locale au navigateur/appareil; perte possible au changement d'appareil ou effacement.
- **BFF/Supabase :** routes d'authentification et compte codées; projet distant, secrets, migrations et domaine API non configurés/validés par le dépôt.
- **Trading :** Terminal pédagogique et séries synthétiques; pas de cotations live ni d'exécution broker confirmées.
- **BRVM :** surface éditoriale et introduction; pas de flux de cours réel publié confirmé.
- **IA :** pédagogie et interface chat présentes; assistant réel dépend du fournisseur et de la configuration serveur.
- **Premium :** contenu et gardes démonstratives; checkout, activation et cycle commercial en production non validés.
- **Lab Pro :** produit opérationnel (workflows, agents, quotas, entitlement, paiement) non démontré.
- **Back-office :** administration des comptes, pas un CMS éditorial complet.
- **Twelve Data :** le travail récent n'est pas visible sur `main` au commit audité; retrouver la branche Manus et ses commits avant de conclure qu'il n'existe pas.

## Preuves GitHub
- `main` : `e86854e`, merge PR #235 (9 nov. 2026).
- PR #235 corrige le faux bandeau « progression déjà existante » à l'étape 2 de l'inscription; nouveaux comptes et véritables reprises testés.
- Workflow « DDA E2E regression » sur `e86854e` : **success**, régression navigateur terminée.
- PR #236 (Phase 0 pédagogie) intégrée avant #235.
- Recherche GitHub au moment de l'audit : aucune PR ouverte remontée; nombreuses branches de travail subsistent.

## Matrice maturité

| Domaine | État | Établi | À confirmer / faire |
|---|---|---|---|
| Landing / acquisition | Partiel | pages et CTA | parcours public, statuts, analytics |
| Academy Free | Fonctionnel dans périmètre testé | M0/M1, exercices, quiz | contenu exhaustif, appareils réels |
| Progression | Local | état navigateur | sync cloud, migration, récupération |
| Terminal Trading | Démo | scénarios synthétiques | flux licencié, BFF, intégration |
| BRVM | Partiel/éditorial | page et introduction | sources/licence, calendrier, cotations |
| IA pédagogique | Partiel | LAB/interface | provider, confidentialité, limites |
| Premium | Démo | contenus/guards | checkout, webhook, entitlements, lifecycle |
| Lab Pro | Non démontré | vision | workflows exécutables, quotas, paiement |
| BFF/Auth | Code implémenté | sessions, CSRF, CORS | Supabase distant, secrets, rate-limit, observabilité |
| Back-office | Limité | comptes, abonnements, export | CMS et permissions de production |
| PWA/offline | Prototype présent | low-data/offline | tests appareil/réseau |
| Production | Non certifiée | CI | DNS/HTTPS, BFF, migrations, monitoring, E2E staging |

## Garde-fous
1. Pas de fonction annoncée active sans parcours utilisateur opérationnel et test.
2. Distinguer synthétique, réel, retardé et démonstration.
3. Ne pas vendre Premium/Lab Pro avant checkout et droits serveur validés.
4. DDA AI reste pédagogique, jamais prédicteur ni promesse de rendement.
5. Aucune donnée de marché ne déclenche d'ordre automatique.
6. Secrets exclusivement côté serveur.
7. Pas de fallback synthétique silencieux en cas d'erreur de données réelles.
8. Préserver Academy et lancer progressivement; éviter les fonctionnalités non prioritaires.

## Plan de reprise

### P0 — Lancement
- [ ] Vérifier domaine, DNS/HTTPS, pages publiques et CTA Free.
- [ ] Rejouer inscription, onboarding, leçon, exercice, quiz, progression et reprise sur mobile.
- [ ] Harmoniser les statuts AI/BRVM/Premium/Lab Pro partout.
- [ ] Contrôler migrations Supabase, secrets et Owner sans exposer de clé.
- [ ] Inventorier branches/PR récentes, travail non fusionné, conflits et doublons.

### P1 — Marché/connecté
- [ ] Récupérer la branche Manus Twelve Data; auditer contrat `dda-market-data-v2`, adapter et mocks.
- [ ] Vérifier couverture fournisseur et licence de redistribution séparément.
- [ ] Route BFF après validation allowlist, cache, quotas, fraîcheur et schéma.
- [ ] Terminal avec provenance/horodatage/status; aucun fallback silencieux.
- [ ] Backtest avec coûts et limites documentés.

### P2 — Commercial
- [ ] Chariow checkout, webhook signé/idempotent et memberships Supabase.
- [ ] Cycle Premium : activation, expiration, renouvellement, révocation et E2E.
- [ ] Décider Lab Pro (produit réel ou offre future).
- [ ] CGU, confidentialité, risques, support et disclosures affiliation.

## Références inspectées
- `README.md` : SPA statique, progression locale, Terminal/Market Intelligence de démonstration; aucun paiement, broker, live market ou IA activé par défaut.
- `bff/README.md` : auth/session, variables serveur, Supabase distant non configuré, tests mocks.
- `DDA_LAUNCH_CLARITY_AND_COMMERCIAL_SCOPE.md` : statut Free/Premium/AI/market et priorités.
- `DDA_TERMINAL_FOUNDATION_SCOPE_VALIDATION.md` : périmètre Terminal.
- PR #235 et workflow du 9 nov. : onboarding et CI navigateur verts.

## Conclusion
**DDA est un produit pédagogique avancé en mode prototype local, pas encore une plateforme entièrement connectée et commercialisable.** Consolider Free, valider les environnements réels et intégrer progressivement les services externes. Le code préparé, les mocks et les tests locaux ne sont pas une preuve de production.

Ce baseline sera complété après inspection des branches/commits Manus, tests runtime/staging et vérification des services externes.
