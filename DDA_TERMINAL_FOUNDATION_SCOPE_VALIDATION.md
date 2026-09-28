# DDA — Périmètre technique du Terminal Foundation

**Statut : CONFORME SOUS CONDITIONS**  
**Horizon proposé : V1 Foundation**  
**Nature : dossier de validation et cadrage — aucune nouvelle capacité connectée n’est construite**  
**Autorité de validation : Richard Darius, CEO**  
**Date : 25 septembre 2026**

---

## 1. Objet de la validation

Définir précisément ce que recouvre **Terminal Foundation** dans la V1, afin d’éviter deux dérives opposées :

- réduire le Terminal à un simple tableau de bord de progression ;
- présenter trop tôt un terminal de marché réel, un clone de TradingView ou un outil de décision financière.

Le Terminal Foundation doit être le **cockpit pédagogique quotidien** de DDA. Il orchestre des capacités existantes et explicitement autorisées ; il ne devient ni une base de données indépendante, ni un moteur de droits, ni un moteur de certification.

> **Décision demandée :** valider le périmètre ci-dessous comme cible V1 avant toute nouvelle construction dépendante.

---

## 2. Problème utilisateur et hypothèse

### Problème

Après une leçon, l’apprenant peut comprendre une notion sans savoir :

- quoi faire ensuite ;
- pourquoi cette action lui est proposée ;
- ce qu’il a réellement démontré ;
- comment revenir vers une pratique cohérente.

### Hypothèse produit

Un Terminal Foundation qui expose **une prochaine action réelle**, l’état de progression et les preuves déjà acquises réduira la perte de contexte entre deux sessions et augmentera la probabilité d’une boucle complète :

**apprendre → pratiquer/évaluer → feedback → preuve → prochaine action**.

Cette hypothèse devra être testée en pilote. Elle ne constitue pas encore un KPI contractuel.

---

## 3. Périmètre fonctionnel proposé

### 3.1 Capacités incluses en V1

| Capacité | Comportement attendu | Source de vérité |
|---|---|---|
| **Reprendre l’apprentissage** | Ouvre la prochaine leçon authored ou l’étape réellement incomplète | `DDALearning.nextActionable()` |
| **Prochaine action** | Affiche une seule action prioritaire et sa raison pédagogique | Learning Engine + état local |
| **Progression** | XP, modules amorcés, compétences et preuves déjà validées | événements et progrès de leçon |
| **Activité récente** | Montre des événements pédagogiques réellement enregistrés | journal d’événements local autorisé |
| **Journal & Plan** | Permet de documenter une observation ou un processus sans signal ni conseil | Journal local |
| **Ressources** | Accès aux ressources effectivement disponibles selon les droits | catalogue statique V1 |
| **Market Intelligence aperçu** | Contenu éditorial démonstratif clairement non connecté | contenu de démonstration validé |
| **Pratique guidée locale** | Mission pédagogique limitée, sans exécution réelle ni donnée live | scénarios versionnés locaux |
| **États honnêtes** | Vide, verrouillé, erreur, offline, bientôt disponible, complété | UI + entitlement réel |

### 3.2 Ordre d’affichage V1

1. **Reprendre l’apprentissage** ;
2. **Prochaine action** ;
3. **Progression / compétences** ;
4. **Activité récente** ;
5. **Journal & Plan / ressources** ;
6. **Aperçus explicitement différés**.

Cet ordre suit le CDCP-OS. Il ne doit pas devenir un mur de cartes ni un flux d’actualités.

---

## 4. Hors périmètre explicite

Les éléments suivants ne font pas partie de Terminal Foundation V1 :

- données de marché réelles ou temps réel ;
- cotations, chandeliers ou calendriers présentés comme live ;
- exécution d’ordres ou connexion broker ;
- signaux, prédictions ou recommandations d’achat/vente ;
- AI Coach réel ;
- Trader DNA ;
- Skill Graph avancé non fondé sur des preuves réelles ;
- Process Score avancé ou diagnostic de rentabilité ;
- replay historique nécessitant des droits de données ;
- trading réel, wallet, crypto ou seed phrase ;
- communauté native sans modération ;
- paiement réel et activation commerciale ;
- synchronisation serveur multi-appareils ;
- partage public de credentials ou Proof of Skill.

Tout élément hors périmètre doit être invisible par défaut ou marqué **bientôt disponible / aperçu non connecté**. Il ne doit jamais être présenté comme actif.

---

## 5. Architecture technique

### 5.1 Position dans l’architecture

Le Terminal Foundation est une **couche d’orchestration UI** qui consomme des capacités indépendantes :

```text
Identité / consentements
          ↓
Entitlements + état local versionné
          ↓
Learning Engine ── Practice Engine local ── Journal local
          ↓                 ↓                    ↓
              Terminal Foundation Orchestrator
          ↓
Dashboard / prochaine action / progression / activité / états
```

Le Terminal ne porte pas :

- le calcul final des droits ;
- une règle financière critique ;
- une décision de certification ;
- une source de vérité parallèle de curriculum ;
- une base de données séparée.

### 5.2 Contrat d’un module Terminal

Chaque module doit déclarer au minimum :

```js
{
  id: 'continue_learning',
  status: 'ready',
  permission: 'dashboard',
  source: 'learning_engine',
  priority: 1,
  title: 'Reprendre l’apprentissage',
  action: { type: 'route', view: 'lesson', lessonId: 'M0.1' },
  evidence: ['lesson_progress'],
  fallback: 'empty'
}
```

Les valeurs possibles de `status` sont :

- `unavailable` ;
- `not_eligible` ;
- `ready` ;
- `loading` ;
- `empty` ;
- `error` ;
- `stale` ;
- `completed`.

Aucune carte ne doit déduire un statut à partir d’un texte ou d’un pourcentage présenté en dur.

### 5.3 Source de vérité

- **Prochaine leçon :** `DDALearning.nextActionable(curriculum, state)` ;
- **Droits :** `DDA.can(permission)` ;
- **Progression :** progrès de leçon et événements vérifiables ;
- **Journal & Plan :** état Journal versionné local ;
- **Données marché :** aucune en V1 Foundation ; les aperçus existants sont explicitement démonstratifs ;
- **Identifiants métier :** indépendants du stockage local et migrables vers une architecture serveur ultérieure.

---

## 6. Permissions et plans

La V1 conserve les identifiants techniques **Découverte / Standard / Pro** tant qu’aucune nomenclature n’est arbitrée.

| Zone | Découverte / Free actuel | Standard | Pro |
|---|---:|---:|---:|
| Terminal Foundation | Oui, dans les limites V1 | Oui | Oui |
| M0 authored | Oui | Oui | Oui |
| M1–M6 | Non sans arbitrage V2.1 | Selon matrice validée | Oui selon matrice |
| M7–M9 | Non sans arbitrage V2.1 | Non | Oui selon matrice |
| Données marché réelles | Non | Non | Non |
| AI Coach réel | Non | Non | Non |

Le tableau est une **proposition technique à confirmer**, pas une décision commerciale. Aucun changement d’accès ne doit être déduit du simple affichage « DDA Free » ou « Premium ».

---

## 7. Données, confidentialité et analytics

### Données utilisées en V1 Foundation

- identité locale minimale ;
- préférence de niveau, objectif et durée d’étude ;
- progrès de leçons ;
- tentatives d’exercices et quiz ;
- événements pédagogiques autorisés ;
- entrées Journal locales ;
- état low-data et rappels locaux.

### Non collecté

- identifiants financiers ;
- clé privée ou seed phrase ;
- données broker ;
- données marché personnelles ou connectées ;
- diagnostic psychologique ;
- données comportementales nouvelles non validées.

### Analytics

Les événements existants restent en mode local/debug tant qu’un dictionnaire technique unique n’est pas validé. Avant toute instrumentation supplémentaire, définir pour chaque événement : propriétaire, schéma, consentement, rétention, accès, destination, tests et procédure de suppression.

Aucun nouvel événement n’est proposé comme décision définitive dans ce dossier.

---

## 8. États UI et accessibilité

Chaque module Terminal doit couvrir :

- premier accès / état vide ;
- action prête ;
- chargement simulé uniquement si un traitement local existe ;
- succès ;
- verrouillage par permission ;
- offline ;
- erreur récupérable ;
- fonctionnalité différée ;
- reprise après rechargement.

Exigences minimales :

- navigation clavier et `focus-visible` ;
- zones tactiles d’au moins 44 px ;
- contraste conforme au design system validé ;
- pas de dépendance à une animation ;
- mode low-data sans mouvement non essentiel ;
- lecture correcte sur smartphone modeste ;
- aucun contenu critique transmis uniquement par couleur.

---

## 9. Critères d’acceptation V1

Le périmètre sera considéré techniquement accepté uniquement si :

1. un apprenant comprend la prochaine action en moins d’une minute ;
2. la prochaine action correspond exactement à l’état du Learning Engine ;
3. un parcours terminé ne revient pas artificiellement à M0.1 ;
4. aucun module différé n’est présenté comme disponible ;
5. un visiteur anonyme n’accède pas à un Terminal authentifié ;
6. les droits restent calculés par le moteur d’entitlements ;
7. l’état reste cohérent après rechargement local ;
8. les écrans fonctionnent en mode offline/local prévu ;
9. les écrans mobile 320–390 px ne débordent pas horizontalement ;
10. aucun flux ne permet une transaction, un signal ou une recommandation financière ;
11. les preuves affichées sont traçables à des événements ou progrès réels ;
12. un rollback vers le Terminal actuel est possible sans migration destructive.

---

## 10. Dépendances et risques

### Dépendances

- arbitrage des six décisions bloquantes ;
- registre curriculum unique ;
- contrat d’entitlements ;
- dictionnaire d’événements futur ;
- contenu authored disponible ;
- tests mobile et accessibilité ;
- procédure de rollback documentée.

### Risques

| Risque | Garde-fou |
|---|---|
| Le Terminal devient un dashboard de trading | aucune donnée live, aucun signal, scope verrouillé |
| Les cartes divergent du Learning Engine | source de vérité unique et tests de contrat |
| Les aperçus sont pris pour du réel | badge et wording explicites, états différés |
| M1–M9 deviennent gratuits par effet d’interface | droits séparés des labels marketing |
| Analytics sur-collectés | dictionnaire + consentement avant tout nouvel événement |
| Blocage mobile / low-data | budget de performance et tests sur petits écrans |
| Refactoring difficile à migrer | identifiants métier et orchestrateur indépendants du stockage |

---

## 11. Proposition de séquence après validation

La construction, si Richard l’autorise par écrit, suivra :

**Observe → Propose → Test → Measure → Approve → Execute**

1. observer trois parcours pilotes ;
2. produire une maquette des états Terminal ;
3. tester la compréhension de la prochaine action ;
4. mesurer réussite, retour et erreurs sans nouvelle collecte non validée ;
5. obtenir l’approbation écrite du périmètre et des six décisions dépendantes ;
6. implémenter par tranche réversible ;
7. exécuter les tests de contrat, mobile, accessibilité et rollback ;
8. mettre à jour le Master Build Register.

---

## 12. Décision à prendre

### Option A — Valider le périmètre complet proposé

Autoriser une tranche Terminal Foundation V1 limitée au périmètre inclus ci-dessus, sans connexion externe et sans construction des éléments hors périmètre.

### Option B — Valider un sous-périmètre Learning Terminal

Limiter la prochaine tranche à : prochaine action, reprise de leçon, progression, activité récente et états mobile/offline.

### Option C — Ne pas autoriser de construction

Conserver ce document comme dossier de cadrage et attendre l’arbitrage des six décisions bloquantes.

**Recommandation technique : Option B**, car elle maximise la preuve utilisateur tout en minimisant les dépendances et les risques de dérive vers un terminal analytique prématuré.

---

## Statut final

**CONFORME SOUS CONDITIONS** : le périmètre est cohérent avec le CDCP-OS, le Blueprint V2 et l’Instruction Finale Agent Unique. Il ne doit pas être considéré comme une autorisation de développement tant que Richard n’a pas validé l’option retenue et les décisions bloquantes qui la conditionnent.
