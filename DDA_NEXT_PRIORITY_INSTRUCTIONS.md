# DDA — Instructions prioritaires pour la suite du projet

**Statut :** mandat d’exécution post-audit  
**Date :** 28 septembre 2026  
**Source de vérité :** `DDA_INFORMATION_ARCHITECTURE_AUDIT.md`  
**Autorité finale :** Richard Darius, CEO

---

## 0. Règle générale

Ne pas ajouter de page, de fonctionnalité ou de backend tant que les pages existantes n’ont pas une mission claire et une profondeur de contenu suffisante.

DDA doit respecter simultanément :

```text
ONE PAGE = ONE PRIMARY MISSION
ONE PAGE ≠ ONE CARD + ONE BUTTON
ONE PAGE = ENOUGH CONTEXT TO UNDERSTAND
ONE PAGE = ENOUGH CONTENT TO ACT
ONE PAGE = AN HONEST OUTPUT OR STATE
```

La prochaine tranche doit améliorer la **clarté et la valeur des surfaces existantes** avant d’étendre l’écosystème.

---

# PRIORITÉ P0 — À traiter en premier

## P0.1 — Réduire le Dashboard à sa mission principale

### Mission cible

> **Aujourd’hui / Dashboard = choisir et démarrer la prochaine action utile.**

### Instructions

1. Conserver la carte de prochaine action comme élément dominant.
2. Conserver la phrase expliquant pourquoi cette action est proposée.
3. Conserver un résumé court du Fil de maîtrise, sans reproduire la page Progression.
4. Transformer les blocs Terminal, Market Intelligence, Journal, Premium, Community, Broker, Ressources et Support en aperçus secondaires clairement étiquetés.
5. Ne pas afficher dans le Dashboard le contenu complet des autres pages.
6. Chaque aperçu doit répondre à :
   - qu’est-ce que c’est ?
   - quel est son statut réel ?
   - pourquoi l’ouvrir maintenant ?
7. Limiter le Dashboard à une seule action primaire et deux ou trois actions secondaires maximum au-dessus de la première séparation visuelle.
8. Conserver `DDALearning.nextActionable()` comme seule source de vérité de la prochaine leçon.

### Critères d’acceptation

- La prochaine leçon est identifiable en moins de cinq secondes.
- Une seule CTA est visuellement primaire.
- Aucun aperçu Dashboard ne recalcule ou ne contredit `nextActionable()`.
- Le Dashboard ne contient pas une seconde version complète de Progression, Journal ou Market Intelligence.
- Les fonctionnalités futures restent marquées comme futures.

---

## P0.2 — Remettre Access dans sa mission d’accès

### Mission cible

> **Access = créer, reprendre ou configurer une session locale.**

### Instructions

1. Retirer conceptuellement les liens secondaires vers Journal, Markets, Community, Premium, Brokers, Resources et Support.
2. Garder uniquement :
   - inscription ;
   - reprise de session ;
   - onboarding ;
   - explication de la conservation locale ;
   - lien discret vers la présentation publique de la méthode si nécessaire.
3. Ne pas transformer Access en menu de découverte.
4. Si une fonctionnalité doit être découverte avant inscription, elle appartient à Landing ou à une future page Public.
5. Conserver l’état honnête « aucune authentification serveur ».

### Critères d’acceptation

- Un visiteur comprend qu’il est ici pour commencer ou reprendre.
- Aucun CTA Access ne contourne l’onboarding vers une surface secondaire sans raison explicite.
- Le parcours Landing → Access → Onboarding → première leçon est le chemin dominant.

---

## P0.3 — Établir le contrat de content depth des leçons

### Mission cible

> **Une leçon doit permettre de comprendre, pratiquer, corriger, valider et savoir quoi faire ensuite.**

### Instructions

Pour chaque leçon authored M0/M1/M2, vérifier depuis les données réelles et non seulement depuis le shell HTML :

1. objectif pédagogique ;
2. contexte de départ ;
3. explication structurée ;
4. exemple concret ou représentation visuelle ;
5. pratique non notée ou observation guidée ;
6. feedback spécifique en cas d’erreur ;
7. exercice de validation ;
8. quiz verrouillé selon le prérequis réel ;
9. résultat qui nomme la compétence prouvée ;
10. prochaine étape réelle ou état honnête de fin ;
11. lien Journal secondaire, uniquement si la réflexion personnelle ajoute de la valeur ;
12. absence de signal, promesse de gain ou prédiction.

### Critères d’acceptation

- Chaque leçon montée possède les quatre étapes Comprendre → Exercice → Quiz → Résultat.
- Une erreur produit une explication et une possibilité de reprise.
- Le résultat ne transforme pas une réussite pédagogique en performance de trading.
- Aucun texte n’est inventé pour un module non authored.
- Les tests de registre et de runtime restent verts.

---

# PRIORITÉ P1 — Après validation des P0

## P1.1 — Séparer Parcours et Progression

### Parcours

Mission : **voir la carte du curriculum et comprendre l’ordre des chapitres.**

Doit contenir :

- introduction du curriculum ;
- chapitre actif ;
- objectif du chapitre ;
- nombre et durée des leçons authored ;
- prérequis ;
- statut réel ;
- horizon proche ;
- prochaine action.

Ne doit pas contenir :

- détail complet des preuves ;
- certification développée ;
- XP détaillé ;
- statistiques de jours actifs.

### Progression

Mission : **comprendre les compétences et preuves réellement acquises.**

Doit contenir :

- compétences acquises ;
- compétences en construction ;
- preuves de leçon et de pratique ;
- erreurs ou reprises utiles quand elles sont réellement enregistrées ;
- prochaine pratique recommandée ;
- progression du curriculum uniquement comme contexte court.

Ne doit pas contenir :

- une deuxième carte détaillée M0–M9 ;
- des statistiques personnelles qui appartiennent au Profil ;
- des previews Premium qui ne sont pas des preuves.

## P1.2 — Donner une vraie valeur à Bibliothèque / Resources

Avant toute nouvelle ressource, chaque fiche doit avoir :

- titre ;
- type ;
- niveau ;
- durée estimée ;
- compétence associée ;
- bénéfice utilisateur ;
- prérequis éventuel ;
- statut Free/Premium/futur ;
- date ou version si le contenu peut évoluer ;
- bouton d’ouverture avec destination claire.

Une ressource ne doit pas être une carte décorative qui renvoie immédiatement ailleurs sans expliquer son utilité.

## P1.3 — Rationaliser Journal & Plan

1. Garder Journal et Plan dans une même surface, mais avec deux missions secondaires explicites.
2. Commencer une nouvelle entrée par un contexte court et une question claire.
3. Ne pas exposer les 19 champs d’un coup si cela crée une page formulaire pauvre ou intimidante.
4. Conserver les champs avancés pour les étapes suivantes.
5. Afficher l’historique, les entrées vides et la provenance d’une preuve Terminal.
6. Le CTA depuis une leçon doit rester secondaire ; le résultat primaire reste la validation de la compétence.
7. Le CTA depuis Market Intelligence est pertinent lorsqu’il part d’une observation contextualisée.

## P1.4 — Clarifier les métriques

Choisir un propriétaire pour chaque information :

| Information | Propriétaire recommandé |
|---|---|
| Prochaine leçon | Dashboard, calculée par `nextActionable()` |
| Compétences / preuves | Progression |
| Curriculum / ordre | Parcours |
| XP et jours d’activité | Profil ou Progression, mais pas les deux au même niveau |
| Identité / niveau / objectif / rythme | Profil |
| Journal / Plan | Journal & Plan |
| Plan et droits | Premium |
| Données de démonstration BRVM | Market Intelligence |

Les autres pages ne doivent afficher qu’un résumé contextualisé.

---

# PRIORITÉ P2 — À différer jusqu’au prochain arbitrage

Ne pas développer maintenant :

- communauté réelle ;
- Weekly Review ;
- Decision Replay ;
- Skill Graph avancé ;
- Darius AI ;
- Marketplace ;
- Dashboard Expert ;
- paiements ;
- revenus experts ;
- données BRVM live ;
- recommandations de broker ;
- authentification serveur ;
- synchronisation multi-device.

Les pages `community`, `practice`, `intelligence`, `premium-track`, `premium-lab` et `premium-assessment` restent des **previews gouvernées**. Elles doivent expliquer la vision, le statut et les conditions d’activation sans simuler une capacité inexistante.

---

# Ordre d’exécution obligatoire

```text
1. Valider les décisions de mission Dashboard / Access / Parcours / Progression.
2. Écrire ou confirmer les contrats de contenu avant le code.
3. Vérifier les leçons authored dans les données et le renderer.
4. Réduire les duplications de contenu et de métriques.
5. Enrichir les surfaces minces : Parcours et Bibliothèque.
6. Tester les flux principaux et les états vides/verrouillés.
7. Faire une revue responsive et accessibilité.
8. Mettre à jour les cartes de routes et le registre.
9. Seulement ensuite envisager une nouvelle capacité.
```

---

# Interdictions pour le prochain agent

- Ne pas ajouter de route parce qu’une branche apparaît dans l’arborescence cible.
- Ne pas créer une page avec un seul titre, une carte et un bouton.
- Ne pas remplir une page avec des cartes décoratives sans sortie.
- Ne pas dupliquer BRVM, XP, Progression, Journal ou Premium sans rôle éditorial clair.
- Ne pas inventer de données, scores, utilisateurs, performances, membres ou sources.
- Ne pas modifier P2/P3 sans décision explicite.
- Ne pas brancher de backend, paiement, broker, IA ou feed réel.
- Ne pas remplacer la source de vérité `DDALearning.nextActionable()`.
- Ne pas supprimer une route existante sans analyse de migration et rollback.

---

# Livrables attendus de la prochaine tranche

1. Un document de décision confirmant les missions Dashboard, Access, Parcours et Progression.
2. Un contrat de content depth pour les leçons authored.
3. Une matrice de contenu pour les ressources.
4. Une cartographie mise à jour des sources de vérité.
5. Les tests de non-régression existants au vert.
6. Une note dans `DDA_MASTER_BUILD_REGISTER.md`.
7. Aucun changement P2/P3 ou backend sans arbitrage.

**Cette instruction est un ordre de travail produit et UX. Elle ne constitue pas à elle seule une autorisation d’activer des services externes, des paiements, une authentification serveur ou des données de marché réelles.**
