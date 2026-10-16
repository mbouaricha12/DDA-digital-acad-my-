'use strict';
const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const files = {
  pilot: path.join(root, 'docs/DDA_FREE_PILOT_CHECKLIST_2026-10-16.md'),
  videos: path.join(root, 'docs/DDA_VIDEO_SCRIPTS_V1_2026-10-16.md'),
  premium: path.join(root, 'docs/DDA_PREMIUM_ACTIVATION_CHECKLIST_2026-10-16.md')
};
for (const [name, file] of Object.entries(files)) {
  assert.ok(fs.existsSync(file), `${name} preparation document exists`);
  assert.ok(fs.statSync(file).size > 1000, `${name} preparation document is substantial`);
}

const pilot = fs.readFileSync(files.pilot, 'utf8');
for (const marker of ['M0.1', 'M0.2', 'M0.3', 'M1.1', 'M1.2', 'M1.3', 'Journal', 'mobile', 'modules non développés']) {
  assert.match(pilot, new RegExp(marker.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&'), 'i'), `pilot covers ${marker}`);
}
assert.match(pilot, /5 à 8 apprenants/i);
assert.match(pilot, /certification officielle/i);

const videos = fs.readFileSync(files.videos, 'utf8');
for (const id of ['M0.1', 'M0.2', 'M0.3', 'M1.1', 'M1.2', 'M1.3', 'P2.1', 'P2.2']) {
  assert.match(videos, new RegExp(`## .*${id.replace('.', '\\.')}`, 'i'), `video script exists for ${id}`);
}
for (const marker of ['Objectif pédagogique', 'Plan', 'Explications', 'Exemple concret', 'Erreurs à éviter', 'Conclusion']) {
  assert.match(videos, new RegExp(marker, 'i'), `video scripts include ${marker}`);
}
assert.match(videos, /aucune vidéo n’est publiée/i);

const premium = fs.readFileSync(files.premium, 'utf8');
for (const marker of ['Chariow', 'SUPABASE_SERVICE_ROLE_KEY', 'webhook', 'idempotence', 'révocation', 'synchronisation', 'sandbox', 'No-go']) {
  assert.match(premium, new RegExp(marker, 'i'), `Premium checklist covers ${marker}`);
}
assert.match(premium, /Tant que ces informations ne sont pas disponibles[\s\S]*sans encaissement/i, 'Premium remains blocked without external inputs');
console.log('RESULT: launch preparation documents contract passed');
