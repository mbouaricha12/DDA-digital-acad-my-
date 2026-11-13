const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..', 'dist');
const academy = fs.readFileSync(path.join(root, 'academy.html'), 'utf8');
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');

const knownRoutesMatch = academy.match(/knownRoutes = new Set\(\[([^\]]+)\]/);
assert.ok(knownRoutesMatch, 'academy must declare the canonical route inventory');
const knownRoutes = new Set([...knownRoutesMatch[1].matchAll(/'([^']+)'/g)].map(match => match[1]));

const ids = new Set([...academy.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]));
const symbolIds = new Set([...academy.matchAll(/<symbol\b[^>]*\bid="([^"]+)"/g)].map(match => match[1]));
const hashLinks = [...academy.matchAll(/href="#([^\"]+)"/g)].map(match => match[1]);
for (const target of hashLinks) {
  assert.ok(knownRoutes.has(target) || ids.has(target) || symbolIds.has(target), `hash link #${target} must resolve to a route, a real DOM anchor or an SVG symbol`);
}

const dataViews = [...academy.matchAll(/data-view="([^"]+)"/g)].map(match => match[1]);
for (const view of dataViews) {
  assert.ok(view === 'back' || knownRoutes.has(view), `data-view=${view} must resolve to a canonical route or the history back action`);
}

for (const file of fs.readdirSync(root, { withFileTypes: true })) {
  if (!file.isFile() || !file.name.endsWith('.html')) continue;
  const html = fs.readFileSync(path.join(root, file.name), 'utf8');
  for (const match of html.matchAll(/href="(?!https?:|mailto:|tel:|javascript:|#)([^"?\s]+)(?:\?[^"\s]*)?"/g)) {
    const target = path.resolve(root, match[1].split('#')[0]);
    assert.ok(fs.existsSync(target), `${file.name} local link ${match[1]} must resolve inside dist/`);
  }
}

assert.match(app, /function showView\(/, 'app must keep one central route transition function');
console.log(`Internal route contract: PASS (${knownRoutes.size} routes, ${ids.size} DOM anchors, ${dataViews.length} navigation actions)`);
