'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');
const docs = ['about','launch','terms','privacy','cookies','imprint','risks','accessibility','contact','faq'];
const source = fs.readFileSync(path.join(dist, 'public-docs.js'), 'utf8');
const runtime = fs.readFileSync(path.join(dist, 'public-document.js'), 'utf8');
const css = fs.readFileSync(path.join(dist, 'public-documents.css'), 'utf8');
assert.match(runtime, /DDA_PUBLIC_DOCUMENTS/);
assert.match(runtime, /data-document/);
assert.match(css, /@media print/);

// Audit finding (2026-10-24): <article data-document-content></article> was
// shipped empty in the raw HTML on every one of these pages — the real body
// only ever appeared after public-document.js ran. A crawler or a reader
// without JavaScript received a title and no legal text at all. This check
// fails the moment any page regresses back to an empty article, by requiring
// the exact same content string the runtime would otherwise have injected.
const docCtx = { window: {} };
vm.runInNewContext(source, docCtx);
const registry = docCtx.window.DDA_PUBLIC_DOCUMENTS;

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

  const doc = registry.public[key] || registry.legal[key];
  assert.ok(doc, `${key} missing from the shared document registry`);
  const articleMatch = html.match(/<article class="public-doc-content" data-document-content aria-live="polite">([\s\S]*?)<\/article>/);
  assert.ok(articleMatch, `${key}: could not find the article's raw HTML content`);
  assert.equal(articleMatch[1], doc.content, `${key}: the raw HTML article must contain the full document body, not rely on JavaScript to fill it in — a no-JS visitor or crawler must receive the real text`);
  assert.ok(articleMatch[1].length > 200, `${key}: pre-rendered content looks too short to be the real document body`);
}
const manifest = JSON.parse(fs.readFileSync(path.join(dist,'manus-routes.json'),'utf8'));
for (const key of docs) assert.ok(manifest.routes.some(route => route.path === `/${key}/`), `manifest missing ${key}`);
console.log('RESULT: standalone public pages contract passed');
