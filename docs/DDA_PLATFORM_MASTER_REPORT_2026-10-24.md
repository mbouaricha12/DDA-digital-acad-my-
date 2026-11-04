# DDA Academy — Rapport maître A–Z de la plateforme

**Date de l’état : 24 octobre 2026**
**Dépôt :** `mbouaricha12/DDA-digital-acad-my-`
**Commit `main` publié :** `400a43982ed7be66b52dcbed085cf68c1cfface1`
**PR BRVM fusionnée :** [#123](https://github.com/mbouaricha12/DDA-digital-acad-my-/pull/123)
**Site actuellement vérifié :** https://mbouaricha12.github.io/DDA-digital-acad-my-/

## Résumé exécutif

DDA Academy dispose maintenant d’une base publique cohérente pour un lancement pilote Free : landing orientée conversion, accès et onboarding fonctionnels, curriculum authored avec exercices et quiz, progression, Journal, Terminal pédagogique, pages publiques autonomes, fondation Premium, fondation BFF/billing, et pôle BRVM visible.

Le pôle BRVM vient d’être renforcé pour servir d’espace d’information fiable. Les sociétés fictives du calendrier ont été supprimées. La page affiche désormais le contexte institutionnel, les sources officielles BRVM, le statut des données, la provenance et les limites de la version actuelle. Aucun cours, volume, dividende ou événement n’est inventé.

La plateforme est prête pour un **pilote Free public**. Elle n’est pas encore prête pour un **encaissement Premium réel** tant que les secrets de production, les vrais identifiants produit, la persistance serveur, les webhooks et la validation commerciale ne sont pas activés.

## A — Architecture et déploiement

- Frontend statique : HTML5, CSS3, JavaScript vanilla, SPA Academy.
- BFF Node.js : authentification, sécurité, billing et transitions d’entitlements préparés.
- Supabase : modèle d’authentification, données, RLS et persistance préparés.
- Chariow/Pulse : fondation billing et webhooks préparée, mais non activée avec des secrets commerciaux réels.
- Déploiement : GitHub Pages depuis `main`.
- Workflow Pages du commit `400a439` : réussi.
- CodeQL Advanced : réussi.
- Protection de `main` : active, avec review obligatoire et checks requis.

## B — Landing et acquisition

La landing comprend :

- proposition de valeur DDA ;
- CTA Free vers le vrai écran d’accès ;
- distinction claire entre apprendre, pratiquer et prouver sa progression ;
- démonstration du produit sans chiffres fabriqués ;
- architecture visuelle Deep Navy, ivoire, or et cyan ;
- motion design et surfaces éditoriales ;
- footer avec Telegram, WhatsApp, e-mail et pages légales ;
- capture UTM minimisée et pseudonymisée ;
- événements d’acquisition filtrés sans e-mail, nom ou téléphone.

Le tunnel vérifié est : Landing → Access → Signup → Onboarding → M0.1 → activation.

## C — Accès, inscription et onboarding

L’écran d’accès distingue :

- visiteur anonyme ;
- création d’un parcours Free ;
- connexion serveur lorsque le BFF est disponible ;
- aperçu local explicitement présenté comme local.

L’onboarding valide le niveau, l’objectif et le rythme. Les erreurs sont ciblées sur le champ concerné. Les contrôles natifs restent utilisables au clavier et sur mobile.

## D — Curriculum pédagogique

Le curriculum authored actuellement testé comprend notamment :

- M0.1 — fondations ;
- M0.2 — Support & Résistance ;
- M0.3 — Lire une tendance ;
- M1.1 — Pourquoi les prix évoluent ;
- M1.2 — Comment les ordres s’exécutent ;
- M1.3 — Comment les marchés s’organisent ;
- P2.1/P2.2 — parcours Premium local de démonstration.

Les leçons suivent le cycle : **Comprendre → Essayer → Vérifier → Continuer**. Les exercices déverrouillent les quiz, les résultats alimentent la progression et les prérequis sont appliqués dans le registre unique.

## E — Expérience mobile et accessibilité

Les contrats et la régression couvrent les dimensions 360 px, 390 px et desktop. Les contrôles vérifient :

- absence de débordement horizontal ;
- CTA accessibles ;
- navigation mobile ;
- focus et clavier ;
- live regions ;
- labels de formulaires ;
- fermeture des surfaces interactives ;
- respect de `prefers-reduced-motion` ;
- taille des contrôles tactiles du Terminal.

## F — Free et progression

Le parcours Free donne accès aux fondations, exercices, quiz, progression et Journal. La carte « prochaine action » est reliée au vrai état du curriculum. Les modules verrouillés signalent un prérequis au lieu de simuler du contenu disponible.

La progression est actuellement persistée localement dans le prototype. Pour un lancement commercial, elle devra être synchronisée côté serveur avec compte, session, sauvegarde et restauration.

## G — Journal et boucle de preuve

Le Journal permet de conserver une observation, son contexte et sa décision pédagogique. Le Terminal peut transmettre une trace au Journal. Les contrats vérifient :

- succès ;
- retry ;
- preuve de pratique ;
- métadonnées de source ;
- retour vers Progression ;
- absence de confusion entre simulation et exécution réelle.

## H — Market Intelligence et BRVM

Le pôle `Marchés & BRVM` est désormais une surface visible et cohérente avec l’Academy :

- présentation de la BRVM comme bourse régionale commune aux huit pays de l’UEMOA ;
- indices `BRVM Composite` et `BRVM 30` affichés comme pédagogiques, jamais comme cotations ;
- centre d’information contrôlée ;
- provenance, référence et statut de récupération ;
- liens vers les cours officiels, résumé du marché, sociétés cotées, rapports et règles d’investissement ;
- suppression des entrées fictives `Société A/B/C` ;
- roadmap BRVM visible : vue marché, formation, actions, obligations, publications, favoris, portefeuille virtuel et assistant IA ;
- publications vérifiées conservées dans un état vide honnête tant qu’aucune source autorisée n’est validée.

Sources officielles utilisées dans l’interface :

- https://www.brvm.org/fr/cours-actions/0
- https://www.brvm.org/fr/resume
- https://www.brvm.org/fr/emetteurs/societes-cotees
- https://www.brvm.org/fr/rapports-societes-cotees
- https://www.brvm.org/fr/comment-investir-la-brvm

## I — Premium

La valeur Premium comprend notamment :

- Risk Plan Lab ;
- Controlled Decision ;
- preuve locale de compétence ;
- passerelle Journal ;
- Weekly Review ;
- ressources et aperçu de certification ;
- structure de parcours supérieure au Free.

L’interface indique honnêtement `Premium Demo local` ou aperçu local. Elle ne simule pas un paiement réel et ne doit pas être présentée comme un abonnement actif tant que l’entitlement serveur n’est pas validé.

## J — BFF, sécurité et billing

La fondation serveur comprend les garde-fous suivants :

- cookies et session ;
- CSRF ;
- contrôles d’idempotence ;
- health checks ;
- transitions de billing ;
- séparation frontend/BFF ;
- validation des webhooks ;
- modèle d’entitlements ;
- RLS et audit serveur préparés.

À configurer avant commercialisation :

1. URL et secrets Supabase de production ;
2. secret de signature Chariow/Pulse ;
3. vrais identifiants de produit et prix ;
4. URL BFF de production ;
5. domaine autorisé et CORS ;
6. logs, alertes et sauvegardes ;
7. tests de souscription, renouvellement, échec, annulation et révocation.

## K — Pages publiques et confiance

Les routes publiques principales sont disponibles :

- accueil ;
- Academy ;
- À propos ;
- FAQ ;
- Contact ;
- pilote et préparation ;
- mentions légales ;
- confidentialité ;
- cookies ;
- risques ;
- accessibilité ;
- conditions générales.

Les liens Telegram, WhatsApp, e-mail et documents légaux ont été vérifiés dans les surfaces principales. Les routes déclarées dans le manifeste répondent en HTTP 200 sur le site GitHub Pages.

## L — Tests exécutés

### Tests locaux finaux

- contrat BRVM information : réussi ;
- syntaxe `dist/app.js` : réussie ;
- syntaxe `dist/market-intelligence.js` : réussie ;
- contrats Elite UI, Journal/Market boundary, Free/Premium et accessibilité : réussis ;
- `node tests/run.js` : **58 réussis, 0 échec**.

### CI de la PR BRVM #123

- CodeQL : réussi ;
- Analyze : réussi ;
- régression navigateur : réussie ;
- Product Gate : réussi ;
- Lesson Registry Check : réussi ;
- M1.2 Order Execution Check : réussi ;
- déploiement Pages : réussi ;
- total : **8 checks réussis, 1 étape ignorée, 0 échec**.

### Smoke test de production

Le commit `400a439` a été vérifié sur le site public :

- titre BRVM visible ;
- panneau Information contrôlée visible ;
- desk des sources visible ;
- provenance visible ;
- roadmap BRVM visible ;
- URL officielle des cours présente dans `market-intelligence.js` servi ;
- URL officielle des rapports présente ;
- sociétés fictives absentes ;
- renderer des sources présent dans `app.js` servi.

## M — État du domaine

GitHub Pages est actif avec HTTPS forcé. L’API Pages indique encore `cname: null`, ce qui signifie que `dariusdigitalacademy.com` n’est pas confirmé comme domaine personnalisé actif côté GitHub, même si le fichier `CNAME` est présent dans le dépôt déployé.

Le site garanti actuellement est :

https://mbouaricha12.github.io/DDA-digital-acad-my-/

À finaliser manuellement :

- déclarer `dariusdigitalacademy.com` dans Settings → Pages → Custom domain ;
- vérifier les quatre enregistrements A ;
- vérifier le CNAME `www` vers `mbouaricha12.github.io` ;
- attendre l’émission du certificat ;
- activer Enforce HTTPS si nécessaire ;
- tester le domaine racine et `www`.

## N — Limites commerciales restantes

Le lancement Free est techniquement défendable comme pilote. Les limites à ne pas masquer sont :

- les vidéos et contenus futurs ne doivent pas être annoncés comme publiés avant production ;
- le Premium n’est pas encore un abonnement réel ;
- le portefeuille virtuel BRVM n’est pas activé ;
- l’assistant IA BRVM n’est pas activé ;
- aucune donnée de marché live n’est connectée ;
- la progression prototype est locale jusqu’à synchronisation serveur ;
- les secrets Supabase/Chariow de production manquent ;
- le domaine personnalisé reste à confirmer dans GitHub Pages.

## O — Priorités pour Claude Code

### Priorité 1 — Domaine et exploitation

1. Confirmer DNS et Custom domain GitHub Pages.
2. Ajouter un smoke test automatisé du domaine personnalisé.
3. Surveiller les warnings GitHub Actions liés à Node.js 20 et préparer la migration contrôlée vers les versions d’actions compatibles.

### Priorité 2 — Pilote utilisateur

1. Recruter un petit groupe Free.
2. Mesurer compréhension du CTA, onboarding, première leçon et prochaine action.
3. Recueillir blocages, temps de première valeur et abandon avant M0.1.
4. Ne pas confondre tests techniques et validation d’usage.

### Priorité 3 — BRVM données vérifiées

1. Choisir une source officielle autorisée.
2. Définir import manuel daté avant toute API.
3. Conserver source, symbole, date de référence, heure de récupération, type et statut.
4. Publier d’abord un bulletin officiel vérifié.
5. Ajouter ensuite les fiches émetteurs et études historiques.

### Priorité 4 — Persistance et Premium réel

1. Déployer BFF et Supabase.
2. Configurer Chariow avec vrais produits et secrets.
3. Tester webhook signé, idempotence, renouvellement, échec et révocation.
4. Refuser côté serveur tout accès Premium non entitlisé.
5. Migrer progressivement le local vers le serveur sans perdre les données utilisateur.

### Priorité 5 — Portefeuille et assistant BRVM

Ne pas commencer avant les priorités précédentes. Le portefeuille doit rester sans argent réel, avec hypothèses de frais/dividendes explicites. L’assistant doit citer sources et dates, distinguer faits/calculs/hypothèses, signaler les données périmées et rester côté serveur avec limites d’usage et surveillance des coûts.

## P — Fichiers de référence principaux

- `dist/index.html` — landing ;
- `dist/academy.html` — SPA Academy et pôle BRVM ;
- `dist/app.js` — runtime principal ;
- `dist/market-intelligence.js` — sources et données pédagogiques BRVM ;
- `bff/src/app.js` — BFF ;
- `tests/run.js` — régression principale ;
- `tests/test_brvm_information_contract.js` — contrat BRVM ajouté dans cette phase ;
- `docs/DDA_BRVM_PHASE1_AUDIT_2026-10-24.md` — rapport BRVM de phase ;
- `docs/DDA_SERVER_FOUNDATION_AUDIT_2026-10-15.md` — audit serveur ;
- `docs/DDA_PREMIUM_ACTIVATION_CHECKLIST_2026-10-16.md` — activation commerciale ;
- `docs/DDA_FREE_PILOT_CHECKLIST_2026-10-16.md` — pilote Free ;
- `docs/DDA_PHASE2_UX_CORRECTION_SPECS_2026-10-17.md` — UX Phase 2.

## Conclusion

DDA Academy possède une base professionnelle, humaine et cohérente pour lancer un pilote Free. Le pôle BRVM est maintenant visible, informatif et gouverné par la traçabilité plutôt que par de fausses données. La prochaine étape n’est pas d’ajouter indistinctement des écrans : elle consiste à valider l’usage avec des apprenants, activer le domaine, connecter proprement les services serveur, puis seulement commercialiser Premium et enrichir les données BRVM.
