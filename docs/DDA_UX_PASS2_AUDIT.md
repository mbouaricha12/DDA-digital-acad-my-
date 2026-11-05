# DDA — Audit UX passe 2

## Périmètre

Audit ciblé de **Market Intelligence / BRVM**, du **Fil de maîtrise** dans Progression et du **Practice Terminal**. L’audit a porté sur la mission de chaque surface, les redondances, la lisibilité des prochaines actions, les états vides, l’accessibilité et le responsive.

## Constats observés

### Market Intelligence / BRVM

La page est honnête et riche en provenance, mais elle devient très longue sur mobile : environ 7 157 px de hauteur à 390 px dans l’état audité, dont environ 3 800 px pour la zone BRVM. Les informations utiles — repères, contexte, sources et publications — étaient donc difficiles à rejoindre directement. Le contenu répétait aussi plusieurs fois l’absence de flux live, sans problème de véracité mais avec une charge cognitive élevée.

### Fil de maîtrise

La logique de preuve est solide et cohérente avec le moteur de progression. En revanche, un nouvel utilisateur doit comprendre seul la différence entre les jalons, le niveau de compétence et l’action proposée. Le panneau mélangeait ainsi explication et lecture opérationnelle, alors que la page doit d’abord répondre à : « qu’ai-je démontré et que faire ensuite ? ».

### Practice Terminal

Le Terminal réel est actif dans Dashboard et propose observation, annotation, validation et Journal. En revanche, la page « Pratique avancée » le présentait principalement comme une brique future. Cela créait une rupture entre la capacité disponible et le langage de la page, avec un risque de croire que toute la pratique était encore indisponible.

## Corrections appliquées

- Ajout d’un rail de navigation local à Market Intelligence : **Repères**, **Contexte**, **Sources BRVM**, **Publications**.
- Ajout d’ancres accessibles et de `scroll-margin-top` pour éviter que les sections soient masquées par le chrome de l’application.
- Ajout d’un guide de lecture du Fil de maîtrise : **Preuve**, **Niveau**, **Suite**.
- Repositionnement éditorial de la page Pratique : le Practice Terminal est présenté comme actif aujourd’hui, tandis que le replay et le feedback restent explicitement futurs.
- Ajout d’un handoff visible vers la mission réelle `#analysis-terminal`.
- Conservation des garde-fous : données synthétiques locales, aucune cotation temps réel, aucune recommandation et aucune mesure fictive.
- Ajout d’un contrat statique dédié : `tests/test_ux_pass2_contract.js`.

## Limites restantes

Le prochain chantier UX utile sera de réduire la densité verticale de la zone BRVM par des panneaux repliables ou une séparation plus nette entre « lecture rapide » et « registre de provenance », sans masquer par défaut les informations de sécurité. Il faudra aussi tester le handoff Practice Terminal avec une capture visuelle dans les scénarios E2E de la branche de livraison.
