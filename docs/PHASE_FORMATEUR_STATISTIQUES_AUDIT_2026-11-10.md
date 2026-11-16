# DDA — Audit de phase : parcours formateur et statistiques avancées

**Date :** 10 novembre 2026  
**Branche :** `feat/visual-maquette-compliance`  
**Statut :** audit de fondation terminé — aucune fonctionnalité formateur ou statistique de production activée

## 1. Décision de périmètre

Le cahier des charges classe les rôles `Content Author`, `Reviewer / pédagogie`, `Support Agent`, `Expert / Instructor` et `Analyst / Data Steward` dans l’écosystème futur. Ils ne doivent pas être présentés comme actifs avant la mise en place d’une authentification serveur, d’un modèle de rôles, d’un audit append-only, d’une séparation des données et de contrôles de confidentialité.

La phase est donc lancée par un audit de fondation et non par la création d’un faux tableau de bord formateur.

## 2. État réel constaté

### Parcours formateur

| Surface | État | Preuve |
|---|---|---|
| Rôle `instructor` ou `expert` | Absent | Aucun rôle, endpoint ou permission correspondant dans le BFF |
| Route formateur protégée | Absente | Aucune route `/v1/instructor`, `/v1/teacher` ou équivalente |
| Gestion de contenus | Lecture seule | Le back-office liste les routes publiques publiées |
| Workflow auteur → revue → publication | Absent | Aucun modèle de version, review ou approbation |
| Sessions DDA Live | Non ouvertes | Les pages publiques indiquent explicitement qu’aucune session active n’existe |
| Données de cohortes | Absentes | Aucun tenant, cohorte ou groupe dans le modèle actuel |
| Modération / support formateur | Absent | Aucun rôle ni workflow de traitement |

Conclusion : le produit ne doit pas afficher un espace formateur connecté tant que ces fondations ne sont pas disponibles.

### Statistiques et analytics

| Indicateur | État actuel | Source / limite |
|---|---|---|
| Progression individuelle | Disponible localement | `localStorage`, propre à l’appareil |
| XP, activité et preuves | Disponible localement | Contrats Dashboard et Progression validés |
| Funnel d’acquisition | Instrumenté en mode debug | File locale ; transport externe non activé sans configuration |
| Sessions actives | Disponible côté aperçu admin si le store le permet | Agrégation serveur `dda_sessions` |
| Abonnements par statut | Disponible côté aperçu admin si le billing store le permet | Agrégation serveur `dda_billing_memberships` |
| Total utilisateurs inscrits | Non calculé | L’API Auth Admin ne fournit pas un total fiable sans scan paginé |
| Taux de complétion par leçon | Absent | Aucun endpoint d’agrégation pédagogique |
| Cohortes et rétention | Absents | Aucun modèle de cohorte ni fenêtre de rétention |
| Performance formateur | Absente | Aucun contenu attribué à un formateur ni revue structurée |
| Score global apprenant | Interdit en l’état | Le cahier exige des dimensions explicables, pas un score arbitraire |

## 3. Contrôles de confidentialité

Les analytics actuelles appliquent une allowlist d’événements et de propriétés. Elles ne doivent pas recevoir :

- le texte libre du Journal ;
- les prompts complets de l’assistant IA ;
- des conclusions de rentabilité ou signaux de trading ;
- des données personnelles non nécessaires ;
- des tokens publics de credentials ;
- des données de marché réel présentées comme pédagogiques ;
- un identifiant local traité comme une identité serveur.

Toute statistique future devra être produite côté serveur à partir de données minimisées et agrégées. Le navigateur ne doit jamais décider du rôle formateur, d’un taux de complétion officiel ou d’un indicateur de rétention.

## 4. Fondations nécessaires avant implémentation

### A. Identité et permissions

Ajouter côté serveur, avec migrations et RLS :

- `content_author` ;
- `reviewer` ;
- `instructor` ;
- `support_agent` ;
- `data_steward`.

Chaque rôle doit être attribué côté serveur, limité par ressource et révocable. Aucun rôle ne doit être déduit du client, de `localStorage` ou d’un paramètre d’URL.

### B. Modèle pédagogique administrable

Prévoir au minimum :

- contenus versionnés ;
- auteur et dernier éditeur ;
- statut `draft`, `in_review`, `published`, `archived` ;
- reviewer et horodatage de revue ;
- historique des changements ;
- rattachement optionnel à un formateur ;
- tests de cohérence avec `LESSON_REGISTRY`.

### C. Cohortes et attribution

Avant toute statistique formateur :

- définir une cohorte et son propriétaire ;
- définir l’appartenance d’un apprenant avec date d’entrée et de sortie ;
- séparer les données entre cohortes ;
- ne permettre à un formateur de voir que les apprenants qui lui sont attribués ;
- journaliser les accès aux données apprenants.

### D. Pipeline statistique

Créer des agrégations serveur documentées plutôt que des calculs UI :

- apprenants actifs sur une fenêtre définie ;
- démarrage et complétion par leçon ;
- progression médiane par cohorte ;
- exercices tentés et validés ;
- taux de reprise après abandon ;
- activité par période ;
- erreurs de contenu ou de validation ;
- intervalle de fraîcheur et source de chaque métrique.

Les petits échantillons devront être masqués ou regroupés pour éviter la ré-identification.

## 5. Critères de sortie de la phase

La phase ne pourra être déclarée prête que lorsque les éléments suivants auront une preuve automatisée :

1. un rôle formateur serveur ne peut pas s’auto-attribuer ;
2. un formateur ne lit pas les apprenants d’une autre cohorte ;
3. les contenus brouillon restent invisibles aux apprenants ;
4. une publication est liée à une version et à un reviewer ;
5. chaque métrique possède une définition, une source et une fraîcheur ;
6. aucune métrique n’est calculée à partir du texte libre ou d’une conclusion financière ;
7. les petits groupes suivent une règle de confidentialité documentée ;
8. les erreurs de service apparaissent comme indisponibles, jamais comme zéro ;
9. les exports sont limités, journalisés et révocables ;
10. les écrans formateur mobile et desktop n’exposent aucune donnée hors périmètre.

## 6. Validation réalisée sur l’état actuel

Les contrats existants restent verts :

- suite Academy : `107 passed, 0 failed` ;
- back-office navigateur : `9 passed, 0 failed` ;
- analytics Chariow : `PASS` ;
- métriques Dashboard : `PASS` ;
- cockpit Dashboard : `PASS` ;
- cartes Progression : `PASS` ;
- pratique → Progression : `PASS` ;
- synchronisation progression : `PASS`.

Ces tests valident la fondation actuelle. Ils ne constituent pas une preuve qu’un parcours formateur ou des analytics de production existent déjà.

## 7. Prochaine tranche recommandée

La prochaine implémentation doit être une tranche backend isolée : modèle de rôles formateur + audit d’accès + première agrégation serveur de complétion, avec tests RLS et tests de non-ré-identification. L’interface ne sera ajoutée qu’après validation de ces contrats.
