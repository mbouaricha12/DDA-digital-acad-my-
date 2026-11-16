'use strict';

/*
 * DDA — Dashboard transfer budget guard.
 *
 * L'audit du 16 novembre 2026 a mesuré academy.html#dashboard à 1 592 766 octets
 * transférés, au-dessus du budget de 1,5 MB. La cause principale était le
 * chargement immédiat de photos lourdes utilisées comme fonds des cartes
 * Parcours du Dashboard, plus une image d'intelligence en loading="eager"
 * pour une vue masquée.
 *
 * Depuis la PR #281, la carte Produits Digitaux n'a plus de photo (aucune image
 * dédiée n'existe et celle réutilisée était incohérente) : elle conserve son
 * dégradé de marque. Seules les cartes Parcours et DDA Lab portent un dérivé
 * WebP léger.
 *
 * Ce contrat empêche le retour des deux régressions sans dépendre d'un
 * navigateur ni d'un budget de timing instable en CI :
 *  - les cartes Parcours du Dashboard doivent pointer vers des dérivés WebP
 *    légers, présents et bornés en taille ;
 *  - le visuel de la vue Intelligence ne doit plus être chargé en priorité
 *    haute depuis le shell initial.
 */

const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const photosDir = path.join(root, 'dist', 'images', 'photos');
const html = fs.readFileSync(path.join(root, 'dist', 'academy.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'dist', 'alpha-polish.css'), 'utf8');
const cssMin = fs.readFileSync(path.join(root, 'dist', 'alpha-polish.min.css'), 'utf8');

const CARD_LIMIT_BYTES = 60 * 1024;
const TOTAL_LIMIT_BYTES = 80 * 1024;
const cards = [
  ['path', 'dashboard-path.webp'],
  ['lab', 'dashboard-lab.webp'],
];

let totalBytes = 0;
for (const [view, file] of cards) {
  const relative = `images/photos/${file}`;
  const escaped = relative.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const rule = new RegExp(
    `#dashboard \\.dashboard-parcours-card\\[data-view="${view}"\\]\\{background-image:url\\("${escaped}"\\)\\}`,
  );

  assert.match(css, rule, `Dashboard card "${view}" must use ${relative} in alpha-polish.css`);
  assert.ok(cssMin.includes(`url("${relative}")`), `Dashboard card "${view}" must use ${relative} in alpha-polish.min.css`);

  const absolute = path.join(photosDir, file);
  assert.ok(fs.existsSync(absolute), `Missing dashboard asset: ${relative}`);
  const bytes = fs.statSync(absolute).size;
  totalBytes += bytes;
  assert.ok(bytes <= CARD_LIMIT_BYTES, `${relative} is ${Math.round(bytes / 1024)} KB, above ${CARD_LIMIT_BYTES / 1024} KB`);
}

assert.ok(totalBytes <= TOTAL_LIMIT_BYTES, `Dashboard card backgrounds total ${Math.round(totalBytes / 1024)} KB, above ${TOTAL_LIMIT_BYTES / 1024} KB`);

assert.ok(
  !/#dashboard \.dashboard-parcours-card\[data-view="produits-digitaux"\]\{background-image:/.test(css),
  'Produits Digitaux must keep its plain brand gradient: PR #281 removed the mismatched photo and no dedicated image exists yet',
);
assert.ok(
  !cssMin.includes('dashboard-produits.webp'),
  'The minified CSS must not reference a Produits Digitaux background image',
);

for (const heavy of ['m1-terminal-analysis.jpg', 'lab-ai-collaboration.jpg', 'family-three-colleagues.jpg']) {
  const heavyRule = new RegExp(
    `#dashboard \\.dashboard-parcours-card\\[data-view="[^"]+"\\]\\{background-image:url\\("images/photos/${heavy.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"\\)\\}`,
  );
  assert.ok(!heavyRule.test(css), `Dashboard cards must not load the heavy original ${heavy} again`);
}

assert.ok(
  !/src="images\/photos\/lab-ai-collaboration\.jpg"[^>]*loading="eager"[^>]*fetchpriority="high"/.test(html),
  'The Intelligence hero image must not be eager/high-priority from the initial Academy shell',
);
assert.ok(
  html.includes('src="images/photos/lab-ai-collaboration.jpg" alt="" loading="lazy" decoding="async"'),
  'The Intelligence hero image must be lazy-loaded with async decoding',
);

console.log('RESULT: Dashboard transfer budget contract passed');
