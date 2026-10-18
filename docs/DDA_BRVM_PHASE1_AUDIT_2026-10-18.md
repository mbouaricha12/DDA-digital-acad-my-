# DDA — Audit BRVM et tranche de structure

**Date :** 18 octobre 2026  
**Branche :** `main`  
**Commit de départ :** `655ce65`  
**Périmètre livré :** Phase 1 audit + Phase 2 structure visible du pôle BRVM

## 1. Décision de périmètre

DDA possède déjà une surface `#markets` nommée **Market Intelligence**, un Terminal d’observation pédagogique, un Journal local et une leçon M1.3 consacrée à l’organisation des marchés et à la BRVM. Cette tranche ne remplace pas ces fonctionnalités et ne prétend pas transformer le prototype en fournisseur de données de marché.

La BRVM est intégrée comme **pôle pédagogique régional**, avec une architecture de destination lisible et des limites explicites. Les données live, les comptes serveur, le portefeuille persistant et l’assistant IA restent différés jusqu’à validation des sources, de la sécurité, des droits et du budget.

## 2. État des lieux

| Domaine | Statut | Preuve / limite actuelle |
|---|---|---|
| Vue d’ensemble BRVM | PARTIEL / VISIBLE | Vue `#markets`, cartes BRVM Composite et BRVM 30, contenu éditorial. |
| Données de marché | SYNTHÉTIQUES | Séries locales normalisées dans le Terminal ; aucune cotation live. |
| Provenance | À PRÉPARER | La nouvelle fiche visible définit les métadonnées requises, mais aucune source automatisée n’est connectée. |
| Formation BRVM | PARTIEL / ACTIVE | M0 et M1.3 apprennent les fondations, les acteurs, le primaire et le secondaire. |
| Actions cotées | MANQUANT | Aucune liste de titres ni fiche entreprise réelle publiée. |
| Indices vérifiés | MANQUANT | Les libellés existent à titre pédagogique ; ils ne portent pas de valeur réelle. |
| Obligations | MANQUANT | Aucun instrument ni document émetteur intégré. |
| Documents financiers | MANQUANT | Pas de pipeline de collecte, stockage et droits d’utilisation. |
| Favoris / watchlist | MANQUANT | Pas de persistance serveur ni de modèle de titres vérifiés. |
| Portefeuille virtuel | MANQUANT | Aucun calcul de performance ou de frais activé. |
| Assistant IA BRVM | BLOQUÉ / DIFFÉRÉ | Aucun service serveur, secret, citation de source ou budget validé. |
| Permissions | PARTIEL | Permissions UI et prototype local présentes ; les futurs droits BRVM devront être serveur. |
| Control Center | FONDATION SERVEUR | À relier aux données, journaux et validations avant exploitation administrative. |

## 3. Matrice KEEP / MODIFY / ADD / DEFER

| Décision | Élément | Motif |
|---|---|---|
| KEEP | Route `#markets` et Market Intelligence | Route stable, utile pour le contexte et déjà testée. |
| KEEP | Terminal pédagogique et Journal | Réutilisables pour observer et documenter sans signal ni exécution. |
| KEEP | Leçon M1.3 | Première brique pédagogique BRVM déjà authored et validée. |
| MODIFY | Vue BRVM | Ajout d’un registre de provenance et d’une roadmap de pôle, sans fausses données. |
| MODIFY | Documentation produit | Cet audit devient la source de vérité de la phase BRVM. |
| ADD | Statuts de données visibles | Source, date, identifiant, récupération, type et vérification seront obligatoires pour toute future donnée. |
| ADD | Architecture de pages future | Les destinations overview, actions, indices, obligations, fiches, documents, formation, portefeuille, assistant et favoris sont exposées comme roadmap — pas comme fonctionnalités actives. |
| DEFER | Import automatisé BRVM | Nécessite source autorisée, fréquence, droits de redistribution et gestion d’erreur. |
| DEFER | Portefeuille virtuel | Nécessite hypothèses documentées, moteur de simulation, frais/dividendes et persistance serveur. |
| DEFER | Assistant IA | Nécessite backend, secrets, citations, quotas, observabilité, droits Premium et garde-fous. |
| DEFER | Vente Premium BRVM | Aucun paiement ou entitlement local ne doit être présenté comme commercial. |

## 4. Architecture de données cible

Toute donnée de marché future devrait être stockée avec au minimum :

- `source_name` et `source_url` ;
- `instrument_symbol` ou identifiant officiel ;
- `reference_date` et `retrieved_at` ;
- `data_type` ;
- `verification_status` ;
- `license_status` et droit de redistribution ;
- une version du transformateur d’import ;
- un journal d’erreur et un état de fraîcheur.

En l’absence de source autorisée et opérationnelle, l’interface doit afficher un état vide ou un jeu historique explicitement daté, jamais une valeur synthétique avec l’apparence d’un cours réel.

## 5. Coûts et dépendances

| Tranche | Coût principal | Précondition |
|---|---|---|
| Sources BRVM | Analyse contractuelle, import, cache et monitoring | Source officielle ou licence explicite. |
| Fiches entreprises | Modèle documentaire et contrôle éditorial | Documents publiés et droits de redistribution. |
| Formation | Auteur, exercices, évaluations, progression | Référentiel BRVM vérifié et validation pédagogique. |
| Portefeuille virtuel | Moteur de simulation, frais, dividendes, tests | Données historiques et règles d’hypothèses. |
| Assistant IA | Backend, secrets, citations, quotas, coûts modèle | Données propres + contrôle serveur + budget. |
| Premium | Entitlements, webhooks, audit et support | BFF/Supabase déployés et fournisseur validé. |

## 6. Tranche livrée le 18 octobre

- Ajout d’un registre visible de qualité et provenance dans `dist/academy.html`.
- Ajout d’une roadmap visible du pôle BRVM dans la vue `#markets`.
- Ajout de statuts distincts : actif, planifié, bloqué/différé.
- Ajout d’un traitement responsive sans modifier les routes ni la logique métier.
- Documentation de l’inventaire et des limites dans ce fichier.

## 7. Validation et limites restantes

À exécuter avant publication : syntaxe JavaScript, contrats Node, smoke Academy, E2E navigateur, contrôle responsive `390px` et `1440px`, puis vérification que la vue BRVM reste inaccessible aux visiteurs anonymes comme les autres surfaces protégées.

La prochaine étape recommandée est de choisir et documenter une source BRVM autorisée avant d’implémenter une première page de **publications vérifiées**. Il ne faut pas commencer simultanément les dix espaces, le portefeuille et l’assistant IA.
