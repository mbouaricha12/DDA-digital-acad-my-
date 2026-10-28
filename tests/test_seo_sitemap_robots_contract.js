'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const dist = path.join(root, 'dist');
const BASE = 'https://dariusdigitalacademy.com/';

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
assert.ok(locs.includes(`${BASE}commencer/`), '/commencer/ must be explicitly included in the public sitemap');
assert.ok(!locs.includes(`${BASE}academy.html`), 'the private Academy entry point must not be in the public sitemap');

const commencer = fs.readFileSync(path.join(dist, 'commencer', 'index.html'), 'utf8');
assert.match(commencer, /<title>Commencer avec DDA Free — Darius Digital Academy<\/title>/);
assert.match(commencer, /<meta name="description" content="Commencer avec DDA Free : découvrir une leçon, pratiquer avec méthode et suivre une progression locale honnête\.\">/);
assert.match(commencer, /<link rel="canonical" href="https:\/\/dariusdigitalacademy\.com\/commencer\/">/);
assert.match(commencer, /<meta property="og:type" content="website">/);
assert.match(commencer, /<meta property="og:site_name" content="Darius Digital Academy">/);
assert.match(commencer, /<meta property="og:title" content="Commencer avec DDA Free — Darius Digital Academy">/);
assert.match(commencer, /<meta property="og:description" content="Commencer avec DDA Free : découvrir une leçon, pratiquer avec méthode et suivre une progression locale honnête\.\">/);
assert.match(commencer, /<meta property="og:url" content="https:\/\/dariusdigitalacademy\.com\/commencer\/">/);
assert.match(commencer, /<meta property="og:image" content="https:\/\/dariusdigitalacademy\.com\/images\/dda-og-image\.jpg">/);
assert.match(commencer, /<meta name="twitter:card" content="summary_large_image">/);
assert.match(commencer, /<meta name="twitter:title" content="Commencer avec DDA Free — Darius Digital Academy">/);
assert.match(commencer, /<meta name="twitter:description" content="Commencer avec DDA Free : découvrir une leçon, pratiquer avec méthode et suivre une progression locale honnête\.\">/);
assert.match(commencer, /<meta name="twitter:image" content="https:\/\/dariusdigitalacademy\.com\/images\/dda-og-image\.jpg">/);

const landing = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
assert.match(landing, /<link rel="canonical" href="https:\/\/dariusdigitalacademy\.com\/">/);
assert.match(landing, /<meta property="og:url" content="https:\/\/dariusdigitalacademy\.com\/">/);
assert.match(landing, /<script type="application\/ld\+json">/);
assert.match(landing, /"@type": "Organization"/);
assert.match(landing, /"@type": "WebSite"/);

const academy = fs.readFileSync(path.join(dist, 'academy.html'), 'utf8');
assert.match(academy, /<meta name="robots" content="noindex, nofollow">/);

// robots.txt: DDA is served on its own custom domain (dist/CNAME), so this
// file is delivered from the real host root and is authoritative for crawlers.
assert.match(robots, /User-agent:\s*\*/i);
assert.match(robots, new RegExp(String.raw`Sitemap:\s*${BASE}sitemap\.xml`));
assert.match(robots, /Disallow:\s*\/academy\.html/);
assert.match(robots, /Disallow:\s*\/go\//);
assert.doesNotMatch(robots, /Disallow:\s*\/commencer\//i, '/commencer/ must remain crawlable');
assert.match(robots, /host root/i, 'robots.txt must document that it is served from the real host root');
assert.match(robots, /robots-txt-spec/i, 'robots.txt must reference the spec establishing it is authoritative from the host root');

// The custom domain must actually be configured (dist/CNAME), otherwise this
// robots.txt's "served from the host root" claim would be false.
const cname = fs.readFileSync(path.join(dist, 'CNAME'), 'utf8').trim();
assert.equal(cname, 'dariusdigitalacademy.com', 'dist/CNAME must match the domain robots.txt and sitemap.xml claim to be served from');

console.log('SEO sitemap/robots contract: PASS');
