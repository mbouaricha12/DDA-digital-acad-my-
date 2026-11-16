# Audit performance — page d’accueil DDA

Date de mesure : 10 novembre 2026.

## Périmètre

L’audit couvre la page d’accueil publique `dist/index.html`, sans modifier l’architecture vanilla JS, les parcours de conversion, le BFF ou les contenus pédagogiques. Les mesures ont été réalisées avec Chromium sur un profil mobile 390 × 844, en local et sur `https://dariusdigitalacademy.com/`.

## Baseline production

La version en production avant cette optimisation chargeait deux feuilles CSS non minifiées :

- `styles.css` : environ 46,9 Ko compressés ;
- `alpha-polish.css` : environ 48,5 Ko compressés ;
- image héroïque : environ 57 Ko ;
- LCP observé sur la mesure Chromium : environ 2,65 s ;
- CLS observé : 0 ;
- aucune erreur JavaScript de page détectée.

Une exécution Lighthouse mobile a donné un résultat plus sévère et variable selon la congestion réseau simulée : FCP 8,0 s, LCP 8,6 s, CLS 0. Les audits d’opportunité signalaient principalement la minification CSS et la réduction du CSS inutilisé.

## Optimisations appliquées

1. Génération de `styles.min.css` et `alpha-polish.min.css` avec une minification conservatrice de niveau 1. Les feuilles sources lisibles restent conservées pour la maintenance.
2. Remplacement des références CSS par les versions minifiées dans les pages publiques et Academy.
3. Ajout d’un preload explicite de l’image héroïque de la landing avec `fetchpriority="high"`.

## Gain mesuré sur les feuilles CSS

| Ressource | Source | Minifiée | Gzip source | Gzip minifiée |
|---|---:|---:|---:|---:|
| `styles.css` | 208 375 octets | 178 170 octets | 46 958 octets | 33 840 octets |
| `alpha-polish.css` | 229 311 octets | 202 336 octets | 48 549 octets | 36 205 octets |
| **Total** | **437 686 octets** | **380 506 octets** | **95 507 octets** | **70 045 octets** |

Économie estimée sur le transfert CSS compressé : **25 462 octets**, soit environ **26,7 %**.

## Validation

- 121 scénarios E2E passés, 0 échec ;
- contrats landing, accessibilité et information publique passés ;
- syntaxe JavaScript validée ;
- références locales d’assets validées ;
- absence d’erreur JavaScript pendant le parcours navigateur local ;
- `git diff --check` passé.

La mesure production finale doit être rejouée après déploiement de cette tranche, car la production actuelle sert encore les anciennes feuilles CSS. Aucun changement de contenu, de routage, de persistance, de sécurité ou de logique métier n’est inclus.
