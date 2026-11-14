'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'dist', 'academy.html'), 'utf8');
const app = fs.readFileSync(path.join(root, 'dist', 'app.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'dist', 'styles.css'), 'utf8');
const plan = fs.readFileSync(path.join(root, 'docs', 'DDA_TRANCHE0_NETTOYAGE_CONFIANCE_ORIENTATION_2026-11-12.md'), 'utf8');

assert.match(html, /id="trust-orientation-title"/);
assert.match(html, /<strong>Free<\/strong>[\s\S]*progression locale/);
// Commercial positioning correction (2026-11-14): "Démonstration locale" was
// retired from this public step indicator — Premium is a real, priced offer
// now, not a demo. The honest payment-readiness note still appears here.
assert.match(html, /<strong>Premium<\/strong>[\s\S]*Paiement en cours d’activation/);
assert.match(html, /<strong>Access<\/strong>[\s\S]*à préparer/);
assert.match(app, /Premium · démonstration locale/);
assert.match(app, /aucun droit serveur/);
assert.match(app, /aucun abonnement actif/);
assert.match(css, /\.trust-orientation-panel/);
assert.match(plan, /Matrice de périmètre/);
assert.doesNotMatch(app, /showToast\('Accès Premium débloqué/);

console.log('Tranche 0 trust/orientation contract: PASS');
