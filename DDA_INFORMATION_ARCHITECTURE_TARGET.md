# DDA — Architecture d’information cible réajustée

**Statut : cadrage cible — aucune route existante modifiée**  
**Date : 26 septembre 2026**  
**Autorité finale : Richard Darius, CEO**

## Principe

Cette structure réorganise le produit par **domaines d’expérience** sans changer le prototype actuel. Elle sert de carte de convergence pour les prochaines tranches ; elle ne transforme pas une capacité absente ou simulée en capacité construite.

> Les routes SPA, les permissions, les entitlements et les sources de vérité restent ceux documentés dans `DDA_ROUTE_MAP.md`.

---

## Arborescence cible

```text
DDA
├── PUBLIC
│   ├── Accueil
│   ├── Apprendre
│   ├── Formations
│   ├── Ressources
│   ├── Market Intelligence
│   ├── Experts
│   ├── Communauté
│   └── À propos
│
├── AUTHENTIFICATION
│   ├── Inscription
│   ├── Connexion
│   └── Onboarding
│
├── APP APPRENANT
│   ├── Dashboard
│   ├── Parcours
│   ├── Modules M0–M9
│   ├── Leçons
│   ├── Exercices
│   ├── Quiz
│   ├── Progression
│   ├── Journal
│   ├── Bibliothèque
│   ├── Market Intelligence
│   ├── Communauté
│   └── Profil
│
├── PREMIUM
│   ├── Premium
│   ├── Ressources avancées
│   ├── Formations premium
│   ├── Outils avancés
│   └── IA
│
└── FUTUR ÉCOSYSTÈME EXPERT
    ├── Devenir Expert
    ├── Dashboard Expert
    ├── Création de formations
    ├── Gestion des étudiants
    ├── Revenus
    ├── Paiements
    ├── Analytics
    └── Marketplace
```

---

## Matrice de correspondance avec le prototype actuel

### 1. PUBLIC

| Élément cible | Correspondance actuelle | Statut | Réajustement proposé |
|---|---|---|---|
| Accueil | `#landing` | PARTIEL / réel | Conserver comme point d’entrée public |
| Apprendre | sections éditoriales de `landing` + `#path` | PARTIEL | Regrouper les contenus d’apprentissage public sans créer une nouvelle route prématurée |
| Formations | `#path`, `#lesson` côté apprenant | PARTIEL | Ne pas exposer M1–M9 publiquement avant arbitrage des droits |
| Ressources | `#resources` | CONSTRUIT côté app | Ajouter plus tard une entrée publique séparée si le contenu le justifie |
| Market Intelligence | `#markets` | SIMULÉ / démonstration | Conserver le badge non connecté et la séparation fait / pédagogie |
| Experts | aucune route dédiée | FUTUR | Ne pas créer de page active |
| Communauté | aucune capacité native active | FUTUR | Ne pas afficher comme disponible |
| À propos | aucune route dédiée | FUTUR / contenu public à cadrer | Peut être documenté avant construction, sans effet sur le Terminal |

### 2. AUTHENTIFICATION

| Élément cible | Correspondance actuelle | Statut | Limite |
|---|---|---|---|
| Inscription | `#access` formulaire local | SIMULÉ | localStorage uniquement |
| Connexion | `#access` même surface | SIMULÉ | pas d’authentification serveur |
| Onboarding | onboarding local | SIMULÉ | deux étapes, identité de démonstration |

### 3. APP APPRENANT

| Élément cible | Correspondance actuelle | Statut | Limite |
|---|---|---|---|
| Dashboard | `#dashboard` / Darius Terminal | CONSTRUIT | cockpit pédagogique, pas terminal de marché |
| Parcours | `#path` | CONSTRUIT / PARTIEL | M0 et premiers M1 authored ; M3–M9 honnêtement à venir |
| Modules M0–M9 | curriculum + registre de leçons | PARTIEL | aucun contenu inventé au-delà de l’authored |
| Leçons | `#lesson`, `#lesson-m02`, `#lesson-m03`, `#lesson-m11…` | CONSTRUIT | moteur générique sur les leçons authored |
| Exercices | blocs de pratique lesson | CONSTRUIT | pédagogique, sans exécution réelle |
| Quiz | gates de leçon | CONSTRUIT | validation locale et progression réelle |
| Progression | `#progress` | CONSTRUIT | preuves locales, pas de Skill Graph avancé |
| Journal | `#journal` | CONSTRUIT / local | sa place dans la roadmap différenciée reste à arbitrer |
| Bibliothèque | `#resources` | CONSTRUIT / local | ressources disponibles selon entitlements locaux |
| Market Intelligence | `#markets` | SIMULÉ | données de démonstration, aucune donnée live |
| Communauté | aucun écran fonctionnel | FUTUR | modération et gouvernance nécessaires avant activation |
| Profil | `#profile` | CONSTRUIT / local | pas de compte serveur ni synchronisation multi-device |

### 4. PREMIUM

| Élément cible | Correspondance actuelle | Statut | Règle de gouvernance |
|---|---|---|---|
| Premium | `#membership` | SIMULÉ / aperçu local | aucune activation commerciale |
| Ressources avancées | entitlements locaux et aperçu | PARTIEL / SIMULÉ | ne pas inventer catalogue ni prix définitifs |
| Formations premium | permissions `advanced_modules` | PARTIEL | droits M0/M1–M6/M1–M9 à confirmer par Richard |
| Outils avancés | Broker Hub / practice avancée selon état | FUTUR / aperçu | ne pas les présenter comme connectés |
| IA | aucune IA active | FUTUR V2 | aucun AI Coach réel, signal ou conseil personnalisé |

### 5. FUTUR ÉCOSYSTÈME EXPERT

Tous les éléments de cette branche sont **FUTUR / non construits** :

- Devenir Expert ;
- Dashboard Expert ;
- création de formations ;
- gestion des étudiants ;
- revenus ;
- paiements ;
- analytics experts ;
- marketplace.

Ils nécessiteront au minimum une décision produit dédiée, un modèle de permissions multi-rôles, une gouvernance des contenus, des règles de paiements et un dossier de conformité. Aucun bouton actif ne doit laisser croire que ces capacités existent déjà.

---

## Règles de réajustement

1. **Ne pas renommer les routes existantes dans cette tranche.** Les domaines sont une couche de navigation et de documentation cible.
2. **Ne pas créer de page vide pour matérialiser l’arbre.** Une zone absente reste documentée comme future.
3. **Séparer public et app apprenant.** Une formation peut être présentée publiquement sans que ses leçons ou droits soient ouverts.
4. **Séparer Premium et capacités réelles.** Un aperçu Premium local ne vaut pas activation commerciale.
5. **Conserver Terminal Foundation dans l’App Apprenant.** Il reste le cockpit quotidien de progression, pas une branche Marché ou Broker.
6. **Garder la branche Expert hors V1 Foundation.** Elle devient une piste d’écosystème ultérieure, non un backlog immédiat.
7. **Toute future route doit avoir :** propriétaire, permission, état vide, état verrouillé, source de vérité, données utilisées, analytics, rollback et validation humaine.

## Prochaine étape recommandée

Utiliser cette architecture comme **structure de menu et de roadmap documentaire**, puis faire valider séparément :

- la nomenclature publique des zones ;
- les droits Découverte / Standard / Pro ;
- le périmètre exact de Terminal Foundation ;
- la place du Journal dans V1 ou V1.5 ;
- les conditions d’ouverture des zones Communauté, Premium et Expert.

**Aucune modification du code ou des routes n’est engagée par ce document.**
