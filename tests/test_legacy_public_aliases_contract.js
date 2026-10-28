'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');
const aliases = [
  ['mentions-legales/index.html', '../imprint/', '/mentions-legales/'],
  ['politique-de-confidentialite/index.html', '../privacy/', '/politique-de-confidentialite/'],
  ['legal/index.html', '../imprint/', '/legal/'],
  ['privacy-policy/index.html', '../privacy/', '/privacy-policy/'],
  ['faq.html', './faq/', '/faq.html'],
  ['about.html', './about/', '/about.html']
];

for (const [file, target, route] of aliases) {
  const html = fs.readFileSync(path.join(dist, file), 'utf8');
  const escaped = target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  assert.match(html, new RegExp(`url=${escaped}`), `${route}: missing meta redirect`);
  assert.match(html, new RegExp(`href=["']${escaped}`), `${route}: missing fallback link`);
  assert.match(html, /window\.location\.replace/, `${route}: missing JavaScript fallback`);
}

const manifest = JSON.parse(fs.readFileSync(path.join(dist, 'manus-routes.json'), 'utf8'));
for (const [, , route] of aliases) {
  assert.ok(manifest.routes.some(item => item.path === route), `manifest missing ${route}`);
}

console.log('RESULT: legacy public aliases contract passed');
