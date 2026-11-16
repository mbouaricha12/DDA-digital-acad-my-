# DDA — Correction du budget de transfert du Dashboard Academy

**Date :** 16 novembre 2026  
**Branche :** `fix/dashboard-transfer-budget-20261116`  
**Base :** `main` — `576b665`  
**Référence :** `docs/DDA_MAIN_REMAINING_BUGS_AUDIT_2026-11-16.md` (audit P1, transfert `1 592 766` octets > budget `1 500 000`)

## Constat

L'audit des bugs résiduels du 16 novembre mesurait `academy.html#dashboard` à
**1 592 766 octets** transférés, soit environ **92,8 KB** au-dessus du budget de
1,5 MB.

Deux causes ont été confirmées en local avec `scripts/verify-performance.js` :

1. **Trois photos JPEG lourdes étaient chargées comme fonds des cartes
   « Parcours » du Dashboard** dès le premier rendu, via `alpha-polish.css` :
   - `m1-terminal-analysis.jpg` — 177,6 KB ;
   - `lab-ai-collaboration.jpg` — 274,8 KB ;
   - `family-three-colleagues.jpg` — 48,7 KB.
   Ces fonds sont chargés par le CSS même lorsque les cartes sont sous la ligne
   de flottaison.
2. **Le visuel de la vue Intelligence était chargé en priorité haute**
   (`loading="eager" fetchpriority="high"`) alors que la vue est masquée sur le
   Dashboard. Ce visuel de 274,8 KB était téléchargé inutilement sur toutes les
   routes de l'Academy.

## Correction appliquée

- Création de deux dérivés WebP légers, utilisés uniquement comme fonds des
  cartes du Dashboard, à partir des photos existantes (aucune nouvelle photo
  n'a été ajoutée) :
  - `dashboard-path.webp` — 29,3 KB ;
  - `dashboard-lab.webp` — 40,1 KB.
- La carte Produits Digitaux conserve son dégradé de marque : la PR #281 a
  supprimé la photo réutilisée, jugée incohérente, et aucune image dédiée
  n'existe encore. Aucun fond `dashboard-produits.webp` n'est réintroduit.
- Mise à jour des règles `#dashboard .dashboard-parcours-card` dans
  `dist/alpha-polish.css` et `dist/alpha-polish.min.css`.
- Passage du visuel Intelligence en `loading="lazy" decoding="async"`.
- Ajout du contrat `tests/test_dashboard_transfer_budget_contract.js` : il
  vérifie les fonds WebP, leur existence, leur taille unitaire (≤ 60 KB), leur
  total (≤ 80 KB), l'absence de retour aux JPEG lourds, l'absence de fond photo
  sur Produits Digitaux et le chargement différé du visuel Intelligence.

Les images originales restent dans le dépôt et sont conservées pour les autres
surfaces (leçons, parcours, Lab, Premium).

## Mesures

Mesure locale, Chromium Playwright, `node scripts/verify-performance.js
--base-url http://127.0.0.1:8898` :

| Route | Avant | Après | Budget |
|---|---:|---:|---:|
| `academy-dashboard` mobile 390×844 | 1 555 KB | **1 124 KB** | 1 465 KB |
| `academy-dashboard` desktop 1440×900 | 1 388 KB | **1 124 KB** | 1 465 KB |

La mesure mobile maximale sur cinq chargements successifs est de
**1 151 019 octets (1 124 KB)**, soit **441 747 octets économisés** par rapport
au relevé de l'audit et une marge d'environ **341 KB** sous le budget.

Les autres routes mesurées par le script restent inchangées sur ce périmètre.
Le CLS du Dashboard reste à **0,0001–0,0004** ; la correction du CLS desktop de
`academy#access` reste hors périmètre de cette branche (PR #288).

## Validation

```bash
node tests/test_dashboard_transfer_budget_contract.js
node tests/test_dashboard_cockpit_contract.js
node scripts/verify-performance.js --base-url http://127.0.0.1:8898
```

Résultats :

- contrat de budget de transfert : **PASS** ;
- contrat cockpit Dashboard : **PASS** ;
- `academy-dashboard` mobile et desktop : **PASS** sous le budget de 1,5 MB.

## Limites

- La mesure de transfert est locale et dépend du cache et du débit de la
  machine ; le contrat statique ajouté protège les deux régressions précises
  sans figer des seuils de timing instables en CI.
- Aucun découpage de `app.js` n'a été réalisé : les 311 KB du bundle restent le
  premier poste de transfert et feront l'objet d'une tranche séparée si le
  budget redevient contraint.
- Aucun changement de route, de contenu pédagogique, de permission ou de
  backend.
