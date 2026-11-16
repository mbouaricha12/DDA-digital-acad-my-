'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');
const aliases = [
  ['mentions-legales/index.html', '../imprint/', '/mentions-legales/', 'https://dariusdigitalacademy.com/imprint/'],
  ['politique-de-confidentialite/index.html', '../privacy/', '/politique-de-confidentialite/', 'https://dariusdigitalacademy.com/privacy/'],
  ['legal/index.html', '../imprint/', '/legal/', 'https://dariusdigitalacademy.com/imprint/'],
  ['privacy-policy/index.html', '../privacy/', '/privacy-policy/', 'https://dariusdigitalacademy.com/privacy/'],
  ['faq.html', './faq/', '/faq.html', 'https://dariusdigitalacademy.com/faq/'],
  ['about.html', './about/', '/about.html', 'https://dariusdigitalacademy.com/about/']
];

for (const [file, target, route, absoluteCanonical] of aliases) {
  const html = fs.readFileSync(path.join(dist, file), 'utf8');
  const escaped = target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  assert.match(html, new RegExp(`url=${escaped}`), `${route}: missing meta redirect`);
  assert.match(html, new RegExp(`href=["']${escaped}`), `${route}: missing fallback link`);
  assert.match(html, /window\.location\.replace/, `${route}: missing JavaScript fallback`);
  if (absoluteCanonical) {
    // SEO audit (2026-11-13): canonical must be absolute, never a relative
    // "../..." path — a relative canonical can be misread by crawlers
    // depending on how the base URL resolves, unlike every other public page.
    assert.match(html, new RegExp(`<link rel="canonical" href="${absoluteCanonical.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}">`), `${route}: canonical must be absolute (https://...), not a relative path`);
  }
}

const manifest = JSON.parse(fs.readFileSync(path.join(dist, 'manus-routes.json'), 'utf8'));
for (const [, , route] of aliases) {
  assert.ok(manifest.routes.some(item => item.path === route), `manifest missing ${route}`);
}

console.log('RESULT: legacy public aliases contract passed');
