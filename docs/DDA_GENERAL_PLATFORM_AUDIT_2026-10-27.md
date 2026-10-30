# DDA Academy — Audit général production

**Date : 27 octobre 2026**
**Domaine audité :** https://dariusdigitalacademy.com
**Dépôt :** `mbouaricha12/DDA-digital-acad-my-`
**Commit main audité :** `6ed8fcb`
**Domaine GitHub Pages configuré :** `dariusdigitalacademy.com`

## Conclusion générale

Le domaine officiel est correctement raccordé à GitHub Pages et le site est accessible en HTTPS. Les pages critiques répondent, les 35 routes déclarées dans `manus-routes.json` sont disponibles, les liens internes détectés dans les pages auditées ne présentent aucun chemin cassé, et les liens Telegram, WhatsApp et e-mail sont présents sur les surfaces attendues.

Le produit est techniquement cohérent pour un **pilote Free**. Le parcours Landing → Access → Signup → Onboarding → M0.1 → activation reste fonctionnel. Les tests du `main` publié donnent **68 scénarios de régression réussis** et **70 contrats statiques, sécurité, BFF, BRVM, Premium et accessibilité réussis**.

Le lancement commercial complet n’est pas encore recommandé sans traiter d’abord les sujets suivants : HTTPS forcé au niveau GitHub Pages, en-têtes HTTP de sécurité du frontend, validation utilisateur du pilote Free, et activation contrôlée des secrets/entitlements Premium.

## 1. Audit du domaine et du certificat

### Résultats positifs

- `https://dariusdigitalacademy.com/` répond en HTTP 200.
- `https://www.dariusdigitalacademy.com/` redirige vers le domaine racine en HTTPS.
- Le certificat TLS est émis par Let’s Encrypt.
- Le certificat couvre `dariusdigitalacademy.com` et `www.dariusdigitalacademy.com`.
- Validité observée : du 25 octobre 2026 au 23 janvier 2027.
- GitHub Pages retourne `cname: dariusdigitalacademy.com`.
- Le site sert bien le contenu du dépôt depuis `main`.

### Faille P0/P1 — HTTPS forcé désactivé

L’API GitHub Pages indique actuellement :

```json
{
  "cname": "dariusdigitalacademy.com",
  "https_enforced": false
}
```

Le domaine répond déjà en HTTPS, mais l’enforcement n’est pas activé dans la configuration Pages. De plus, l’URL GitHub Pages de secours redirige encore vers `http://dariusdigitalacademy.com/` au lieu de produire directement une redirection HTTPS.

Cette situation ne signifie pas que le certificat est invalide. Elle signifie que la politique de redirection HTTPS n’est pas suffisamment verrouillée pour un lancement commercial.

### Action corrective

Dans GitHub :

1. ouvrir **Settings → Pages** ;
2. vérifier `Custom domain: dariusdigitalacademy.com` ;
3. activer **Enforce HTTPS** ;
4. attendre la régénération du certificat si GitHub le demande ;
5. vérifier les trois URLs : domaine racine HTTPS, `www` HTTPS et URL GitHub Pages.

L’API utilisée depuis l’environnement d’audit a retourné `403 Resource not accessible by integration` lors de la tentative d’activation automatique. Cette correction doit donc être effectuée par un compte GitHub disposant du droit Pages administrateur.

## 2. Routes et navigation

Les 35 routes déclarées dans `manus-routes.json` ont répondu avec succès :

- `/index.html` ;
- `/academy.html` ;
- `/about/` ;
- `/faq/` ;
- `/launch/` ;
- `/contact/` ;
- `/terms/` ;
- `/privacy/` ;
- `/cookies/` ;
- `/imprint/` ;
- `/risks/` ;
- `/accessibility/` ;
- les vues Academy et leurs fragments ;
- les assets JavaScript, CSS, images et manifeste.

### Résultat

Aucun échec sur les routes déclarées. Les pages renvoient du HTML exploitable et non une page SPA vide ou une erreur serveur.

### Écart de cohérence à faible priorité

Les alias suivants renvoient 404 :

- `/mentions-legales/` ;
- `/politique-de-confidentialite/` ;
- `/legal/` ;
- `/privacy-policy/` ;
- `/faq.html` ;
- `/about.html`.

Ils ne sont pas utilisés par les liens internes audités, qui pointent vers `/imprint/`, `/privacy/`, `/faq/` et `/about/`. Il s’agit donc d’un problème de compatibilité de liens anciens ou de partage externe, pas d’une panne du parcours actuel.

### Action recommandée

Créer des redirections ou des pages alias pour les anciennes URLs, surtout `/mentions-legales/` et `/politique-de-confidentialite/`, afin d’éviter les erreurs lorsqu’un ancien lien est partagé dans une campagne, un message Telegram ou une publication externe.

## 3. Liens internes et footer

L’audit a extrait les chemins internes des pages Landing, Academy, À propos, FAQ, Launch, Contact et documents publics.

Résultat :

- 52 chemins internes uniques détectés ;
- 52 chemins répondent avec succès ;
- aucun asset local manquant ;
- aucun lien interne cassé détecté.

Les liens suivants sont présents sur les surfaces principales :

- Telegram : `https://t.me/+Wny_VS9f-blmOWFk` ;
- WhatsApp : `https://whatsapp.com/channel/0029VbCISPsI1rcb3sbxiI0A` ;
- e-mail : `dariusdigitalacademy@gmail.com`.

Les liens externes ont répondu correctement pendant l’audit : Telegram en HTTP 200 et WhatsApp en redirection valide vers son domaine `www`.

## 4. Audit responsive et navigateur réel

Un smoke test Playwright a chargé le domaine officiel aux largeurs 360 px, 390 px et 1440 px pour la Landing et Academy.

Résultats :

- aucun débordement horizontal détecté ;
- Landing : aucun échec réseau ;
- Academy : aucun asset local en échec ;
- titres et documents chargés correctement ;
- surface mobile compatible avec iPhone SE et petits écrans.

Le navigateur signale un statut HTTP 401 sur `https://api.dariusdigitalacademy.com/v1/me` lorsqu’un visiteur anonyme ouvre Academy. Ce comportement est attendu côté sécurité : `/v1/me` exige une session. Le frontend traite correctement ce résultat comme une absence de session et conserve le parcours local.

Amélioration recommandée : réduire le bruit de diagnostic du navigateur ou documenter explicitement ce 401 attendu dans le monitoring, afin de ne pas le confondre avec une panne BFF.

## 5. BFF et API de production

### Résultats positifs

- `/healthz` répond HTTP 200 avec `{"status":"ok"}`.
- `/v1/publications/brvm` répond HTTP 200 avec un registre vide honnête : `{"items":[]}`.
- `/v1/me` répond HTTP 401 sans session, comme prévu.
- `/v1/premium/preview` répond HTTP 401 sans session, comme prévu.
- Le BFF est servi par Vercel avec HSTS côté API.
- Les contrats BFF, CSRF, idempotence, billing, RLS et entitlements passent localement.

### Limite commerciale

Le BFF est techniquement accessible, mais l’activation commerciale Premium doit encore être validée avec :

- les vrais secrets Supabase ;
- les vrais identifiants Chariow/Pulse ;
- le secret de signature webhook ;
- les prix et produits réels ;
- les tests de renouvellement, échec, annulation et révocation ;
- une vérification serveur systématique des entitlements.

Le Premium ne doit pas être présenté comme un abonnement encaissé tant que ces éléments ne sont pas validés en production.

## 6. Faille P1 — En-têtes de sécurité frontend insuffisants

La réponse GitHub Pages du frontend contient notamment `content-type`, `cache-control` et les en-têtes GitHub de cache, mais ne contient pas les en-têtes applicatifs suivants :

- `Strict-Transport-Security` ;
- `Content-Security-Policy` ;
- `X-Content-Type-Options` ;
- `X-Frame-Options` ;
- `Permissions-Policy` ;
- `Referrer-Policy` en en-tête HTTP.

Le projet possède des contrats de sécurité et une balise HTML `referrer`, mais cela ne remplace pas tous les en-têtes envoyés par le serveur.

### Action corrective

Comme GitHub Pages ne permet pas de contrôler librement les headers de réponse, deux options sont possibles :

1. placer le domaine derrière Cloudflare ou un reverse proxy configuré pour ajouter les headers ;
2. migrer le frontend vers un hébergeur permettant des headers personnalisés tout en conservant le pipeline de déploiement.

Politique minimale recommandée :

- HSTS avec `includeSubDomains` après validation complète du HTTPS ;
- `X-Content-Type-Options: nosniff` ;
- `Referrer-Policy: strict-origin-when-cross-origin` ;
- `Permissions-Policy` restrictive ;
- CSP progressive compatible avec les scripts actuels ;
- protection iframe adaptée aux besoins réels du site.

La CSP doit être construite progressivement, car le produit utilise plusieurs scripts JavaScript et des ressources externes.

## 7. Landing et acquisition

Le tunnel public fonctionne et les contrats vérifient :

- CTA Landing vers Access ;
- UTM filtrées ;
- absence de PII dans l’acquisition ;
- visitor ID pseudonymisé ;
- première visite et activation ;
- absence de chiffres marketing fabriqués ;
- responsive et sticky CTA mobile ;
- distinction claire entre Free et Premium.

Amélioration prioritaire non technique : organiser un pilote avec de vrais apprenants. Les tests automatisés démontrent la cohérence du produit, mais pas la compréhension immédiate de la proposition de valeur par une personne qui découvre DDA.

## 8. Academy, Free et progression

Le parcours Free est fonctionnel avec :

- accès ;
- onboarding ;
- M0.1 ;
- exercices ;
- quiz ;
- progression ;
- Journal ;
- Terminal pédagogique ;
- passerelle vers les prochaines actions.

Les tests montrent que les prérequis, les permissions et les transitions Free/Premium sont respectés. La principale limite reste la persistance locale du prototype. Une version commerciale doit synchroniser compte, progression, Journal et preuves côté serveur.

## 9. Premium

Premium apporte une valeur distincte avec Risk Plan Lab, Controlled Decision, preuves, Weekly Review, ressources et aperçu de certification.

L’interface est honnête en indiquant l’aperçu local. Cette décision doit être conservée jusqu’à ce que le paiement, les droits d’accès et la persistance serveur soient réellement actifs.

La priorité n’est pas d’ajouter davantage de cartes Premium. La priorité est de rendre fiable la chaîne : paiement → webhook → entitlement → accès serveur → révocation.

## 10. BRVM

Le pôle BRVM est dans un état sain pour une première version informative :

- sources officielles visibles ;
- provenance affichée ;
- sociétés fictives supprimées ;
- indices présentés comme pédagogiques ;
- publications vides tant qu’aucune source vérifiée n’est publiée ;
- ticker masqué si le BFF ne fournit pas de publication valide ;
- contrats BRVM et sécurité des publications réussis.

La prochaine étape doit être un import officiel daté, manuel dans un premier temps. Il faut conserver source, identifiant, date, récupération, droits et statut de fraîcheur.

Le portefeuille virtuel et l’assistant IA BRVM doivent rester désactivés jusqu’à validation de la chaîne de données et de la persistance.

## 11. Résultats de tests sur le main publié

### Régression navigateur et produit

- **68 réussis, 0 échec** via `node tests/run.js`.
- couverture du funnel ;
- permissions visiteur/Free/Premium ;
- onboarding ;
- M0.1 ;
- acquisition ;
- analytics minimisées ;
- Broker Hub ;
- Landing ;
- BRVM ;
- responsive ;
- Terminal ;
- Journal ;
- DDA Lab.

### Contrats statiques et sécurité

- **70 réussis, 0 échec**.
- BFF et intégration frontend ;
- billing store ;
- CSRF et idempotence ;
- RLS ;
- Chariow ;
- sécurité des publications BRVM ;
- accessibilité ;
- SEO, sitemap et robots ;
- routes publiques ;
- Premium ;
- contenu ;
- service worker ;
- sécurité des surfaces.

Ces résultats valident le code et les parcours simulés. Ils ne remplacent pas les tests utilisateurs ni les tests de paiement réel.

## 12. Priorités de correction

### Priorité immédiate

1. Activer **Enforce HTTPS** dans GitHub Pages.
2. Vérifier que la redirection de l’URL GitHub Pages ne passe plus par `http://`.
3. Ajouter des alias pour `/mentions-legales/` et `/politique-de-confidentialite/`.
4. Mettre en place un smoke test du domaine officiel qui vérifie HTTPS, certificat, routes et redirections.

### Priorité avant lancement Free élargi

1. Faire tester le parcours par un petit groupe d’apprenants.
2. Mesurer abandon avant M0.1, compréhension du CTA et temps jusqu’à la première valeur.
3. Corriger uniquement les blocages observés, sans ajouter de fonctionnalités décoratives.
4. Ajouter un suivi des erreurs BFF anonymes et distinguer les 401 attendus des erreurs réelles.

### Priorité avant Premium payant

1. Configurer secrets Supabase et Chariow.
2. Déployer la persistance serveur.
3. Tester tous les états d’abonnement.
4. Vérifier les entitlements uniquement côté serveur.
5. Ajouter logs, alertes, sauvegardes et procédure de rollback.

### Priorité sécurité frontend

1. Ajouter un reverse proxy ou une couche CDN capable de fournir des headers contrôlés.
2. Déployer HSTS après confirmation HTTPS.
3. Ajouter `nosniff`, Referrer-Policy, Permissions-Policy et CSP progressive.
4. Vérifier que la CSP n’empêche pas Academy, les scripts lazy et les connexions BFF.

## Verdict

DDA Academy est solide pour un pilote Free et le domaine officiel est fonctionnel. Le risque immédiat n’est pas une page cassée : il se situe dans la configuration HTTPS forcée, l’absence de headers de sécurité frontend contrôlés et l’écart entre les fondations techniques Premium et un véritable encaissement commercial.

La plateforme ne nécessite pas une refonte générale. Elle nécessite maintenant une phase de durcissement : sécurité HTTP, compatibilité des anciennes URLs, observation d’utilisateurs réels, puis activation progressive du serveur Premium.

## Références

[1]: https://dariusdigitalacademy.com/ "DDA Academy — domaine officiel"
[2]: https://dariusdigitalacademy.com/manus-routes.json "Manifeste des routes publiques"
[3]: https://dariusdigitalacademy.com/academy.html "DDA Academy — application"
[4]: https://api.dariusdigitalacademy.com/healthz "Health check BFF"
[5]: https://api.dariusdigitalacademy.com/v1/publications/brvm "Registre public des publications BRVM"
[6]: https://github.com/mbouaricha12/DDA-digital-acad-my- "Dépôt GitHub DDA Academy"
