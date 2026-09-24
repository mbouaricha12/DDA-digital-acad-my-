# CDCP-OS 1.0 — Alignement avec le prototype V1 construit

_Date : 24 septembre 2026 — agent Arena (branche `arena/01a0d252-dda-digital-acad-my`, PR #72)_
_Objet : classement du livrable « DDA_Cahier_des_Charges_Produit_OS_V1.md » tel qu'exigé par sa propre règle finale (« chaque livrable reçu doit être classé : conforme, conforme sous conditions, à corriger, refusé — avec preuves, écarts, décision requise et action suivante ») et confrontation point par point au prototype V1 existant (`dist/`)._

## 1. Classement du livrable

**CONFORME SOUS CONDITIONS** — document de gouvernance produit valide, adopté comme référentiel d'évolution (hiérarchie §0, niveau 4). Conditions : (a) plusieurs portions sont **tronquées dans le collage transmis** (titres §6.4/§8.3/§10, points 2–3 de l'unité éditoriale, têtes des tableaux roadmap/événements/couverture) — le fichier archivé les marque ⚠️ sans rien reconstituer, les versions complètes restent à confirmer ; (b) deux points de fond exigent une **décision direction** (§3 ci-dessous) — la règle §0 interdit de les résoudre silencieusement.

## 2. Alignement du prototype V1 existant — point par point

| § CDCP-OS | Exigence | État du prototype | Verdict / preuve |
|---|---|---|---|
| §0.2 | Aucune connexion paiement/broker/données/IA/domaine, aucune publication | Prototype 100 % local (localStorage), aucun backend, aucune donnée réelle | ✅ CONFORME (architecture même du projet) |
| §0.2 | Aucune promesse publique de fonctionnalité/capacité/calendrier | M3–M9 affichés honnêtement « À venir » (`dda-core.js`), Premium = « Aperçu local — aucun achat » (`index.html`), certification = « aperçu de ce que DDA délivrera » | ✅ CONFORME |
| §1 / §12 | Lancement concentré sur la fondation V1 | Le travail livré = fondation : M0 (3 leçons), M1 (3 leçons), Terminal/Parcours/Progression réels | ✅ CONFORME |
| §2.1 | Jamais signal, rentabilité, catalogue vidéo, comparateur guidé par commission | Tests le prouvent pour chaque leçon (`test_m0/m1/m1_2/m1_3` : termes interdits absents) | ✅ CONFORME, testé |
| §4.5 | Terminal Foundation = continuité/progression/prochaines actions ; aucun faux module vide « disponible » | Premier bloc Terminal = reprise de leçon via `nextActionable()` ; Market Room/AI Coach/Community = non présents ou aperçus marqués | ✅ CONFORME |
| §5.3 | États de modules : indisponible/non éligible/prêt/chargement/vide/erreur/obsolète/complété | Existants : `coming_soon`, `completed`, prêt (`nextActionable`), vide (journal vide honnête), erreur de feedback quiz. **Écart mineur** : « chargement/erreur module/obsolète » non formalisés comme états de carte | 🟡 SOUS CONDITIONS — écart documenté, aucun état simulé |
| §5.3 | Ordre candidat V1 (reprendre → prochaine action → progression → activité récente → échéances) | Terminal = lead leçon (reprendre) en tête ✅ ; progression (skillmap) présente ✅ ; **écart** : pas encore de carte « activité récente » dédiée (le compteur d'événements vit dans Profil/Progression) | 🟡 SOUS CONDITIONS — candidate naturelle de tranche V1 |
| §6.1 | Complétion jamais fondée sur la seule ouverture d'une page ; objectif observable par leçon | Convention deux verrous (exercice → quiz verrouillé) sur les 6 leçons authored, preuve `state.lessons` durable, competency annoncée en tête de chaque leçon | ✅ CONFORME, testé |
| §6.4 | Unité éditoriale (fait/interprétation/apprentissage, aucune alerte-signal) | Carte Marché actuelle : « Que s'est-il passé ? / Pourquoi est-ce important ? / Que faut-il apprendre ? » — même structure ; contenu statique honnête, aucun signal. **Écart** : source/date/fraîcheur pas encore affichées (contenu de démo) | 🟡 SOUS CONDITIONS — cohérent en V1, à durcir si contenu éditorial réel (V1.5) |
| §6.5 | Broker Hub : affiliation divulguée, classement non achetable | Hub actuel pédagogique, sélection enregistrée (`broker_selected`), aucun lien affilié réel activé | ✅ CONFORME (rien de connecté) |
| §6.6 / §3 | Certificat interne, jamais diplôme | Certificat = prévisualisation immuable, jamais « délivré », wording « certification » prudent | ✅ CONFORME |
| §7 | Crypto = V2 ; aucun token recommandé | Aucun contenu crypto dans l'app ; aucun module crypto promis (« À venir » générique) | ✅ CONFORME |
| §9 | Gamification responsable (constance/maîtrise ; interdit : volume, dépôt, streak artificielle) | XP réels issus des validations, badges affichés « verrouillés », aucune streak, aucune mesure de volume/dépôt | ✅ CONFORME |
| §9.3 P0 | V1 = choix utilisateur + règles simples ; « recommandé parce que… » | `nextActionable()` unique, règles déterministes ; justification « why » affichée sur Parcours/Terminal | ✅ CONFORME |
| §11.3 | Pas d'autoplay ; cache contrôlé ; offline sans bypass de droits ni contenu premium ni données sensibles | SW `dda-shell-v13` ne cache QUE le shell public gratuit (HTML/CSS/JS/lessons authored) ; aucune donnée premium (le prototype n'en contient pas) ; l'état apprenant est en localStorage (jamais dans le cache SW) | 🟡 SOUS CONDITIONS — conforme aujourd'hui ; **règle gelée : rien de premium/sensible n'entrera jamais dans CORE sans analyse sécurité/stockage validée**. L'analyse formalisée reste à rédiger avant tout contenu payant |
| §12 (taxonomie) | Événements par horizon ; interdits analytics explicites | Aucun événement V1.5+ du tableau n'existe dans le code ; l'existant = set V1 validé par les tranches précédentes (view_opened, signup/qualification, exercise/quiz, activation_v1, funnel landing) | ✅ CONFORME + **règle gelée : tout nouvel événement suit désormais le tableau du §12 (horizon + interdits)** |

## 3. Décisions requises (jamais résolues silencieusement)

### D1 — §4.2 : matrice des droits vs accès M1 dans le prototype

V2.1 autorise **M0 seul en Découverte** (M0–M6 Standard, M0–M9 Pro). Le prototype ouvre actuellement M0 **et M1** à tout inscrit « Free » (permission `lesson_m01` dérivée du registre sur toutes les vues de leçons), tandis que la carte Membership affiche déjà « DDA Free : Parcours M0 et ses leçons » — incohérence visible entre le libellé commercial et le comportement du prototype.

- **Option A** — conserver M1 ouvert dans le prototype, documenté explicitement comme choix de démonstration locale non commerciale (rien n'est publié ni vendu) : la démo CEO montre la vraie chaîne M0→M1 déjà construite.
- **Option B** — simuler dès maintenant le verrou Standard sur M1+ (honest lock « réservé à Standard — aperçu ») : alignement strict avec la matrice, au prix d'une démo moins riche des leçons M1 authored.

**Statut : EN ATTENTE DE DÉCISION DIRECTION.** En attendant : statu quo (Option A de fait), aucune modification silencieuse.

### D2 — Portées tronquées du document

Les versions complètes des passages marqués ⚠️ dans l'archive (§6.4 points 2–3, §8.2 suite, §8.3, §10, têtes des tableaux §12) restent à transmettre si une décision en dépend — aucune reconstitution n'a été tentée.

## 4. Ce que CDCP-OS ne change PAS au mandat en cours

- La hiérarchie §0 place les **décisions explicites de la direction** au niveau 1 : le mandat répété « poursuis le site / tu as tout le contrôle » autorise la poursuite de la fondation V1 (le CDCP-OS lui-même exige que « le lancement reste concentré sur la fondation » et que « aucun pilier futur ne retarde une V1 fiable »).
- Les piliers V1.5/V2/V3 (Practice Engine, Skill Graph, AI Coach, Missions, Crypto, Community, B2B, Credentials avancés) restent **gelés** — déjà conformes à l'existant : aucun code, aucun faux module, aucun événement analytics les concernant.
- `learning-engine.js` reste non modifié ; les événements d'apprentissage existants sont la brique « Learning Engine → Événements d'apprentissage » du §5.1.

## 5. Action suivante recommandée (cadre V1)

1. **Tranche recommandée : M2.1 — première leçon du module M2 « Risque et discipline »** (seul module post-M1 au titre officiellement validé dans la roadmap du handover) — même contrat authored que les Golden Lessons, contenu centré lecture du risque/discipline, jamais de sizing prescriptif ni de promesse. Design préparé sur demande.
2. En parallèle, arbitrage **D1** attendu de la direction (simple réponse A ou B).
3. Tranche de consolidation V1 possible sans aucune décision préalable : carte **« activité récente »** au Terminal (§5.3 écart identifié, données 100 % existantes dans le journal d'événements local).
