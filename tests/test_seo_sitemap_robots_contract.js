'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const dist = path.join(root, 'dist');
const BASE = 'https://mbouaricha12.github.io/DDA-digital-acad-my-/';

const sitemap = fs.readFileSync(path.join(dist, 'sitemap.xml'), 'utf8');
const robots = fs.readFileSync(path.join(dist, 'robots.txt'), 'utf8');

assert.match(sitemap, /^<\?xml version="1\.0" encoding="UTF-8"\?>/, 'sitemap must be valid XML');
assert.match(sitemap, /<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/);

const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
assert.ok(locs.length >= 12, `sitemap must list every real public document (got ${locs.length})`);
for (const loc of locs) {
  assert.ok(loc.startsWith(BASE), `${loc} must be an absolute URL under the real GitHub Pages origin`);
  assert.ok(!loc.includes('#'), `${loc} must not be a hash fragment — a fragment is not a distinct crawlable document`);
  const relative = loc.slice(BASE.length);
  const file = relative === '' ? 'index.html' : relative.endsWith('/') ? path.join(relative, 'index.html') : relative;
  assert.ok(fs.existsSync(path.join(dist, file)), `${loc} has no matching file in dist/ (${file})`);
}

// Every standalone public/legal page from the shared registry must be reachable from the sitemap.
const docsSource = fs.readFileSync(path.join(dist, 'public-docs.js'), 'utf8');
for (const key of ['launch', 'about', 'terms', 'privacy', 'cookies', 'imprint', 'risks', 'accessibility', 'contact', 'faq']) {
  assert.match(docsSource, new RegExp(`${key}: \\{`), `${key} exists in the shared document registry`);
  assert.ok(locs.includes(`${BASE}${key}/`), `${key}/ is missing from the sitemap`);
}
assert.ok(locs.includes(BASE), 'the landing page itself must be in the sitemap');
assert.ok(locs.includes(`${BASE}academy.html`), 'the Academy entry point must be in the sitemap');

// robots.txt: honest about what it can and cannot do for a GitHub Pages
// PROJECT site (served under a subpath, not the host root).
assert.match(robots, /User-agent:\s*\*/i);
assert.match(robots, new RegExp(`Sitemap:\\s*${BASE}sitemap\\.xml`));
assert.match(robots, /host root/i, 'robots.txt must document that it is not served from the real host root');
assert.match(robots, /robots-txt-spec|not honored/i, 'robots.txt must reference why a project-path robots.txt is not authoritative for crawlers');

console.log('SEO sitemap/robots contract: PASS');
