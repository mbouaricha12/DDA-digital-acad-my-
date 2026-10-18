'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');
const docs = ['about','launch','terms','privacy','cookies','imprint','risks','accessibility','contact','faq'];
const source = fs.readFileSync(path.join(dist, 'public-docs.js'), 'utf8');
const runtime = fs.readFileSync(path.join(dist, 'public-document.js'), 'utf8');
const css = fs.readFileSync(path.join(dist, 'public-documents.css'), 'utf8');
assert.match(runtime, /DDA_PUBLIC_DOCUMENTS/);
assert.match(runtime, /data-document/);
assert.match(css, /@media print/);
for (const key of docs) {
  const file = path.join(dist, key, 'index.html');
  assert.ok(fs.existsSync(file), `missing standalone page: ${key}`);
  const html = fs.readFileSync(file, 'utf8');
  assert.match(html, new RegExp(`data-document="${key}"`));
  assert.match(html, /<main[^>]+aria-labelledby="document-title"/);
  assert.match(html, /data-document-content/);
  assert.match(html, /\.\.\/public-docs\.js/);
  assert.match(html, /\.\.\/public-document\.js/);
  assert.match(html, /\.\.\/index\.html/);
  assert.match(html, /lang="fr"/);
  assert.match(source, new RegExp(`${key}: \\{`), `shared source missing ${key}`);
}
const manifest = JSON.parse(fs.readFileSync(path.join(dist,'manus-routes.json'),'utf8'));
for (const key of docs) assert.ok(manifest.routes.some(route => route.path === `/${key}/`), `manifest missing ${key}`);
console.log('RESULT: standalone public pages contract passed');
