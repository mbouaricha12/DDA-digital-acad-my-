# DDA — Tranche BRVM : Publications financières vérifiées

**Date :** 18 octobre 2026  
**Périmètre :** première fonctionnalité BRVM après l’audit et la roadmap de Phase 1/2  
**Route conservée :** `#markets` / Market Intelligence  
**Principe :** Premium First, Accessible by Design — aucune donnée financière n’est affichée sans provenance contrôlée.

## Décision de livraison

La première brique livrée est une page éditoriale de **Publications financières BRVM** intégrée à la vue `#markets`, sans nouvelle route et sans reconstruction du Terminal, du Journal ou de la leçon M1.3.

Le registre est volontairement vide tant qu’une source autorisée, ses droits de redistribution, sa fréquence de mise à jour et son processus de vérification ne sont pas validés. L’interface expose néanmoins le modèle de provenance attendu et distingue clairement l’absence de document vérifié d’une publication disponible.

## Matrice KEEP / MODIFY / ADD / DEFER

| Décision | Élément | Traitement | Justification |
|---|---|---|---|
| KEEP | Route `#markets` | Conservée | Surface protégée existante, cohérente avec Market Intelligence et déjà testée. |
| KEEP | Terminal, Journal, M1.3 | Inchangés | Fonctionnalités opérationnelles et pédagogiques à préserver. |
| MODIFY | Vue BRVM | Ajout d’une section Publications | Première destination réellement livrée sans mélanger documents et séries synthétiques. |
| ADD | Registre de publications | `BRVM_PUBLICATIONS`, actuellement vide | Évite de présenter un document fictif comme officiel et prépare l’import contrôlé. |
| ADD | Provenance visible | Source/URL, date de référence, récupération, vérification, fraîcheur et droits | Métadonnées obligatoires avant toute valeur ou publication exploitable. |
| ADD | États vides accessibles | `role=status`, message explicite, état « aucun document validé » | Les données en attente ne sont pas confondues avec des données disponibles. |
| ADD | Contrat de régression | `tests/test_brvm_publications_contract.js` | Garantit le fail-closed et la composition responsive. |
| DEFER | Import automatisé | Non activé | Source, autorisation, droits, fréquence et gestion des erreurs non validés. |
| DEFER | Actions, indices, obligations, fiches entreprises | Roadmap uniquement | Ne pas multiplier les surfaces avant d’avoir un pipeline documentaire fiable. |
| DEFER | Watchlist, portefeuille virtuel, assistant IA | Non activés | Nécessitent persistance serveur, moteur documenté, backend sécurisé, citations, quotas et coûts. |

## Fichiers modifiés

- `dist/academy.html` — section Publications dans la vue `#markets`.
- `dist/app.js` — registre vide fail-closed et rendu de l’état vide/prêt pour les publications vérifiées.
- `dist/styles.css` — composition éditoriale desktop et responsive 360/390 px.
- `tests/test_brvm_publications_contract.js` — contrat structurel et anti-fausse donnée.
- `docs/DDA_BRVM_PHASE3_PUBLICATIONS_2026-10-18.md` — documentation de la tranche.

## Validation exécutée

- Syntaxe : `node --check dist/app.js` et `node --check dist/dda-core.js` — OK.
- Contrats unitaires/structure : tous les `tests/test_*.js` — OK.
- Contrat BRVM Phase 1 — OK.
- Contrat BRVM Publications — OK.
- Cohérence routes/registre — OK, 18 routes et 38 lignes de registre.
- E2E navigateur `node tests/run.js` — **54 scénarios réussis, 0 échec**.
- Gouttières responsive et protections de surfaces — OK.
- `git diff --check` — OK.

## Limites restantes

Aucune publication réelle, aucun lien officiel, aucun chiffre de marché et aucune date de document ne sont encore affichés. Le rendu actuel prouve le comportement d’état vide et la structure de provenance ; il ne constitue pas encore un pipeline de collecte ni un catalogue documentaire.

La page reste accessible uniquement à travers la permission existante de Market Intelligence. Le stockage local ne peut pas activer Premium ni autoriser l’import ; la future gouvernance devra rester côté serveur.

## Dépendances et coûts prévisibles

1. Identifier une source officielle BRVM/UEMOA ou un fournisseur sous licence.
2. Vérifier contractuellement la redistribution, l’archivage, les traductions éventuelles et la fréquence d’actualisation.
3. Définir un import manuel ou automatisé avec journal d’erreur, état de fraîcheur, version de transformateur et revue éditoriale.
4. Prévoir stockage persistant, contrôle d’accès et observabilité avant d’exposer une bibliothèque multi-utilisateur.
5. Tester les droits Premium côté serveur uniquement si certaines publications ou analyses deviennent payantes.

## Prochaines étapes prioritaires

1. **P0 — Gouvernance source :** valider une source et ses droits avant d’ajouter le premier document réel.
2. **P1 — Pipeline manuel contrôlé :** importer un document vérifié avec toutes les métadonnées, puis ajouter des tests de fraîcheur et de statut.
3. **P1 — Publication UX :** afficher les documents vérifiés et les éléments en attente dans deux états distincts, avec lien d’origine et date.
4. **P2 — Actions/indices :** uniquement après validation documentaire et sans afficher de cotation live par défaut.
5. **P3 — Portefeuille virtuel et assistant IA :** rester différés jusqu’à satisfaction des prérequis techniques et commerciaux.

## Addendum — contrôle fail-closed renforcé

L’audit de la branche a confirmé que le registre `BRVM_PUBLICATIONS` reste vide et qu’aucun import réel, lien officiel, chiffre ou date de marché n’est livré.

Un filtre explicite a été ajouté avant rendu : une entrée future doit fournir un identifiant, un titre, une source, une URL HTTP(S), une date de référence, une date de récupération, un statut `verified`, un statut de fraîcheur `current` et des droits `authorized`. Les entrées mal formées, non vérifiées, obsolètes, sans droits ou avec une URL invalide sont ignorées sans exception bloquante.

Aucune permission Premium, administrateur ou éditeur n’est déduite du stockage local. La vue `#markets` conserve sa permission existante `market_room` et les états futurs restent soumis à une gouvernance serveur non implémentée.

### Validation complémentaire

- `tests/test_brvm_publications_safety_contract.js` : erreurs d’entrée, fraîcheur, droits, URL, absence de stockage local et responsive CSS.
- E2E navigateur sur `#markets` à 360 px et 1440 px : visiteur redirigé vers Access ; état Free autorisé ; registre vide visible ; aucun document rendu ; aucun débordement ; aucune erreur console.
- Suite complète : **24 smoke checks**, **54 scénarios E2E**, **0 échec**.

### KEEP / MODIFY / ADD / DEFER actualisé

| Décision | Élément | État après audit |
|---|---|---|
| KEEP | Terminal, Journal, M1.3, 18 routes | Préservés ; suite E2E au vert |
| KEEP | Registre `BRVM_PUBLICATIONS` vide | Maintenu volontairement |
| MODIFY | Projection de rendu | Seules les entrées complètes, vérifiées, fraîches et autorisées sont rendues |
| ADD | Contrat de sécurité BRVM | Ajouté dans `tests/test_brvm_publications_safety_contract.js` |
| DEFER | Import réel et publication de documents | Toujours différés jusqu’à validation source/droits/processus |
| DEFER | Actions, indices, portefeuille, assistant IA | Toujours différés selon les prérequis P2/P3 |

## Tranche suivante — gouvernance P0

La spécification préparatoire du registre de sources et du workflow d’import manuel contrôlé est documentée dans `docs/DDA_BRVM_SOURCE_GOVERNANCE_2026-10-18.md`. Elle ne connecte aucune source et n’active aucun import. Son contrat de non-régression est `tests/test_brvm_source_governance_contract.js`.


## Addendum — préparation serveur fail-closed (18 octobre 2026)

La galerie `#markets` reste vide sans BFF configuré. Lorsqu’il est configuré, elle demande `GET /v1/publications/brvm`, annonce le chargement, distingue le registre vide d’une erreur de service et n’affiche que les entrées complètes renvoyées par la projection SQL et revalidées côté navigateur. Le endpoint est en lecture seule et échoue en `503` si le magasin n’est pas disponible.

La migration `0005_brvm_publications.sql` prépare les métadonnées, transitions, rôles distincts de revue, journalisation et vue SQL des seules publications publiées, fraîches et autorisées. Elle n’est pas appliquée à la base distante. Aucun import réel, source connectée, document, lien officiel ou valeur de marché n’a été ajouté. La revue humaine de la source, de la licence et de la fraîcheur reste préalable à toute publication.

Le rapport associé est `docs/DDA_BRVM_AUDIT_AND_SERVER_MODEL_2026-10-18.md`.
