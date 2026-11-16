# DDA — Audit des bugs résiduels sur `main`

**Date :** 16 novembre 2026  
**Commit audité :** `fb94027` — fusion de la PR #287  
**Périmètre :** régression fonctionnelle, SEO/a11y/BRVM, performance locale, couverture BFF/Academy et recherche statique de risques.

## Synthèse exécutive

La branche `main` est fonctionnellement stable sur le périmètre couvert : la suite E2E complète termine avec **128 tests passés et 0 échec**. Les contrats SEO publics, accessibilité, BRVM et BFF passent également.

Deux anomalies de performance restent confirmées et reproductibles :

1. **P1 — CLS desktop sur `academy.html#access` : 0,1806**, au-dessus du seuil de 0,10.
2. **P1 — transfert de `academy.html#dashboard` : 1 592 766 octets**, au-dessus de la limite de 1 500 000 octets.

Aucun bug fonctionnel, aucun contournement Premium/admin via `localStorage` et aucun lien HTTP public non sécurisé n’ont été confirmés pendant cet audit.

## Résultats des validations

| Contrôle | Résultat |
|---|---|
| Suite E2E `node tests/run.js` | **128 passed, 0 failed** |
| Contrat SEO public | **PASS — 15 pages** |
| Contrat accessibilité | **PASS** |
| Contrat publications BRVM | **PASS** |
| Contrat d’implémentation BFF | **PASS** |
| Couverture BFF c8 | **86,35 % statements/lines, 76,04 % branches, 84,81 % functions** |
| Couverture Academy V8 | **29,48 % de 5 179 plages, 15 scripts, 8 routes** |
| Détection de contournement Premium/admin par localStorage | **Aucun cas confirmé** |
| Références HTTP non sécurisées dans `dist`, `bff`, `docs` | **Aucune trouvée** |

Le premier lancement E2E avait échoué uniquement parce que le binaire Chromium Playwright n’était pas installé dans l’environnement. Après installation de Chromium, la suite complète a passé les 128 scénarios.

## Bug P1 — CLS desktop de la vue d’accès

### Preuve

Mesure locale avec `scripts/verify-performance.js` sur Chromium desktop 1440×900 :

```text
FAIL desktop academy-access CLS=0.18055555555555555
```

La capture détaillée du `PerformanceObserver` montre un déplacement unique de `#main-content` :

```text
Avant : x=260, width=1180
Après : x=0,   width=1440
```

### Cause probable confirmée par le code

Le shell initial est rendu avec la colonne sidebar. Après le boot JavaScript, `app.js` applique `body.access-mode` pour la vue d’accès. La feuille `alpha-polish.css` applique alors :

```css
@media (min-width: 860px) {
  body.access-mode .app-shell { grid-template-columns: 1fr; }
}
```

Le passage tardif d’une grille `260px 1fr` à `1fr` déplace toute la surface principale après le premier rendu, ce qui explique exactement le CLS observé.

### Sévérité et recommandation

**Sévérité : P1 performance desktop.** La vue reste utilisable, mais le déplacement est visible et dépasse le budget CLS.

Correction recommandée, sans refonte : pré-rendre l’état `access-mode` avant le premier paint, par exemple avec une classe déterminée depuis le hash dans un script inline de boot ou une règle CSS initiale équivalente. Il faut éviter de corriger le problème uniquement par une animation ou par `opacity`, car cela masquerait le déplacement sans supprimer le changement de géométrie.

La version mobile est déjà conforme sur cette route (`CLS=0,0021`).

## Bug P1 — transfert excessif sur le dashboard Academy

### Preuve

Mesure locale :

```text
mobile academy-dashboard  transfer=1592766B > 1500000B
 desktop academy-dashboard transfer=1592766B > 1500000B
```

Le dépassement est d’environ **92,8 KB** au-dessus du budget configuré.

### Principales ressources observées

| Ressource | Taille transférée approximative |
|---|---:|
| `app.js` | 318 KB |
| `lab-ai-collaboration.jpg` | 282 KB |
| `alpha-polish.min.css` | 217 KB |
| `styles.min.css` | 191 KB |
| `dda-core.js` | 68 KB |
| `access-two-women-market.jpg` | 66 KB |

### Cause probable

`academy.html` charge un bundle et des feuilles de style communes à l’ensemble des vues, alors que le dashboard n’utilise pas nécessairement toutes les surfaces Premium, Lab, marché et institutionnelles. La présence d’assets image lourds dans le chargement commun augmente le transfert initial.

### Sévérité et recommandation

**Sévérité : P1 performance réseau.** Aucun défaut fonctionnel n’est observé, mais le dépassement réduit la marge sur mobile et ralentit les connexions limitées.

Ordre de correction recommandé :

1. vérifier que `lab-ai-collaboration.jpg` et les images de vues non actives ne sont pas chargées par le chemin dashboard ;
2. différer les modules et images spécifiques aux vues non actives ;
3. réduire ou convertir les images lourdes en WebP/AVIF avec dimensions explicites ;
4. envisager un découpage prudent de `app.js` uniquement si le lazy-loading ne suffit pas ;
5. conserver le budget de 1,5 MB comme garde-fou CI.

## Risques non confirmés

### Permissions et stockage local

La recherche statique ne trouve pas de clé `localStorage` utilisée pour autoriser Premium, admin, éditeur ou entitlements. Les scénarios E2E confirment qu’en mode BFF un plan Premium forcé localement ne donne pas accès au contenu réel sans confirmation serveur.

Une file `dda-analytics-debug-v1` est conservée en `localStorage`. Elle correspond à des événements de debug bornés, pas à une permission ou une identité d’autorisation. Elle mérite néanmoins une politique de purge claire avant la production si les événements peuvent contenir des données sensibles.

### Données BRVM

Le contrat BRVM passe. Les publications non vérifiées restent bloquées par le registre et les métadonnées de provenance ; aucun faux cours ou document n’a été observé.

### SEO et accessibilité

Les contrats ciblés passent : métadonnées uniques et canoniques absolues sur 15 pages, contrôles WCAG de clavier/live-region/contraste, et absence de régression contractuelle BRVM.

## Couverture et limites

La couverture BFF est élevée mais ne constitue pas une preuve de sécurité RLS ou d’intégration Supabase réelle. Les zones encore partiellement couvertes comprennent notamment des branches de `app.js`, `security.js`, `billing-store.js`, `supabase-auth.js` et `rate-limiter.js`.

La collecte Academy mesure des plages runtime V8, pas une couverture de lignes source. Elle ne remplace pas une mesure Lighthouse réelle sur une connexion 4G/CPU ralenti ni une vérification multi-navigateurs.

## Priorités proposées

1. **P1 immédiat :** corriger le CLS desktop de `academy#access` par pré-rendu du shell sans sidebar.
2. **P1 immédiat :** ramener le dashboard sous 1,5 MB par différé des assets et modules non nécessaires.
3. **P2 :** ajouter au script de performance la collecte des sources de layout shift et le détail des ressources lourdes en cas d’échec.
4. **P2 :** compléter les scénarios d’erreur ciblés de `app.js` et des stores sans chercher artificiellement 100 % de couverture.

Aucune correction fonctionnelle n’a été appliquée pendant cet audit ; les deux anomalies P1 sont prêtes pour une branche de correction séparée.
