# DDA — Trading & Financial Markets Learning OS

**Promesse :** Learn Markets. Build Skills. Prove Progress.

## État vérifié — 18 novembre 2026

Le dépôt contient une SPA servie depuis `dist/`. La branche `main` auditée est `01165ab9c893249e69cd09fc627d7bb93b6ddc72`; le site officiel répond sur `https://dariusdigitalacademy.com`. Le workflow GitHub Pages est le mécanisme de vérification et de publication du frontend.

Le code du BFF Node.js se trouve dans `bff/` et s’appuie sur Supabase pour l’authentification, les données métier et les memberships. `bff/vercel.json` contient un adaptateur Vercel et `render.yaml` une configuration Render; pendant l’audit, les réponses de l’API publique ont identifié Vercel. La présence de ces manifests ou du code ne prouve pas à elle seule qu’une intégration externe est activée ou validée en production.

### Produit construit et limites d’accès

- **DDA Free :** M0, trois leçons de fondation (M0.1–M0.3), exercices, quiz, feedback et reprise du parcours.
- **M1 :** trois leçons authored (M1.1–M1.3), indiquées hors périmètre Free sur `/launch/`. Le contrôle `advanced_modules` est actuellement un gate d’interface locale, pas une protection serveur : les trois fichiers JavaScript M1 répondent anonymement en HTTP 200 depuis le domaine. Ne pas présenter ce gate comme une protection d’accès robuste ni activer une vente avant correction.
- **DDA Lab :** activités pédagogiques; LAB4/Capstone utilisent le gate `premium_track`.
- **Dashboard, Journal & Plan, Progression et Ressources :** interfaces intégrées; le mode invité conserve des données localement. La synchronisation cloud et le parcours multi-appareils n’ont pas été validés de bout en bout dans un environnement de production pendant l’audit.
- **Terminal et graphiques :** usage pédagogique; ne pas les décrire comme une plateforme d’exécution ni comme des cotations live. L’API de marché indiquait `not_configured` au moment des vérifications.

Les noms commerciaux visibles à conserver sont **DDA Free** et **DDA Premium**. `advanced_modules` est un nom d’entitlement interne; sa correspondance commerciale finale avec Premium doit être confirmée avant toute modification de droits. `Standard/Pro` apparaît dans des traces historiques/commentaires, mais n’est pas une offre tarifaire à annoncer. Premium reste une démonstration tant que checkout, paiement, webhooks et droits serveur réels ne sont pas testés ensemble.

### Intégrations : code présent ≠ service opérationnel

Le BFF contient des routes d’authentification, de progression, d’administration, d’IA, de marché et un adaptateur Chariow. Aucun paiement Premium ne doit être présenté comme actif : aucun produit marchand, secret Chariow ni cycle checkout → webhook signé → entitlement → révocation n’a été validé de bout en bout pendant l’audit. Les configurations et migrations Supabase de production/staging doivent être vérifiées par le propriétaire avant de promettre une synchronisation ou une persistance serveur.

## Lancer le frontend en local

```bash
python3 -m http.server 4173 --bind 0.0.0.0 --directory dist
```

Puis ouvrir `http://127.0.0.1:4173/`.

## Tests et validation

- Les workflows `.github/workflows/` constituent la référence CI; la suite Playwright est `node tests/run.js` avec Playwright/Chromium installés.
- Les contrats Node sont les fichiers `tests/test_*.js`; certains tests de boot utilisent `jsdom` lorsqu’il est disponible.
- Le BFF expose son script de test par `npm --prefix bff test`.

Avant d’annoncer qu’un changement est disponible, vérifier le commit réellement déployé, le domaine officiel, le parcours utilisateur concerné et les captures de preuve. Une validation locale ou la seule présence du code ne vaut pas déploiement.

## Gouvernance

Le rapport de préparation au lancement et les registres d’exécution datés font foi pour l’état opérationnel le plus récent. Les documents historiques et les branches/PR non fusionnées doivent être lus comme tels; ils ne remplacent pas la vérification de `main` et du domaine officiel.
