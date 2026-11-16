'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { imageSize } = (() => {
  try { return require('image-size'); } catch { return {}; }
})();

const root = path.join(__dirname, '..');
const dist = path.join(root, 'dist');
const BASE = 'https://dariusdigitalacademy.com/';
const INDEXABLE_PAGES = [
  'about', 'launch', 'terms', 'privacy', 'cookies', 'imprint', 'risks',
  'accessibility', 'contact', 'faq'
];
// Hidden from navigation on the founder's explicit instruction and now also
// deindexed (noindex, still follow — their internal links stay crawlable):
// real pages, real code, kept in the repo, just not something Google should
// surface while they are "à venir" and not reachable from any public nav.
const COMING_SOON_PAGES = ['live', 'business', 'experts', 'community', 'ai'];
const publicPages = [...INDEXABLE_PAGES, ...COMING_SOON_PAGES];

const descriptions = new Set();
for (const slug of publicPages) {
  const file = path.join(dist, slug, 'index.html');
  const html = fs.readFileSync(file, 'utf8');
  const title = html.match(/<title>([^<]+)<\/title>/i)?.[1];
  const description = html.match(/<meta name="description" content="([^"]+)"/i)?.[1];
  assert.ok(title, `${slug}: title is required`);
  assert.ok(description, `${slug}: meta description is required`);
  assert.ok(description.length >= 50 && description.length <= 170, `${slug}: description should be useful and snippet-safe`);
  assert.ok(!descriptions.has(description), `${slug}: description must be unique among public pages`);
  descriptions.add(description);

  const canonical = `${BASE}${slug}/`;
  assert.match(html, new RegExp(`<link rel="canonical" href="${canonical.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}">`), `${slug}: canonical must be absolute and self-referencing`);
  if (COMING_SOON_PAGES.includes(slug)) {
    assert.match(html, /<meta name="robots" content="noindex, follow">/, `${slug}: "coming soon" page must be deindexed, never indexed while hidden from navigation`);
  } else {
    assert.match(html, /<meta name="robots" content="index, follow">/, `${slug}: public page must remain indexable`);
  }
  assert.match(html, new RegExp(`<meta property="og:url" content="${canonical.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}">`), `${slug}: og:url must be canonical`);
  assert.match(html, /<meta property="og:title" content="[^"]+">/);
  assert.match(html, /<meta property="og:description" content="[^"]+">/);
  assert.match(html, /<meta property="og:image" content="https:\/\/dariusdigitalacademy\.com\/images\/dda-og-image\.jpg">/);
  assert.match(html, /<meta property="og:image:width" content="1200">/);
  assert.match(html, /<meta property="og:image:height" content="630">/);
  assert.match(html, /<meta name="twitter:card" content="summary_large_image">/);
  assert.match(html, /<meta name="twitter:image" content="https:\/\/dariusdigitalacademy\.com\/images\/dda-og-image\.jpg">/);
  assert.match(html, /<link rel="icon" href="\.\.\/images\/favicon-32\.png"/);
  assert.match(html, /<html lang="fr-FR">/i);
}

const launch = fs.readFileSync(path.join(dist, 'launch', 'index.html'), 'utf8');
const launchDescription = 'DDA : six leçons au catalogue, trois fondations M0 accessibles en Free et trois leçons M1 soumises au droit avancé correspondant.';
assert.equal(launch.match(/<meta name="description" content="([^"]+)"/)?.[1], launchDescription);
assert.equal(launch.match(/<meta property="og:description" content="([^"]+)"/)?.[1], launchDescription);
assert.equal(launch.match(/<meta name="twitter:description" content="([^"]+)"/)?.[1], launchDescription);
assert.ok(launch.includes('Le catalogue comprend six leçons : trois fondations du module M0 sont accessibles en Free; trois leçons M1 supplémentaires nécessitent le droit avancé correspondant et ne font pas partie du périmètre Free actuel'));
assert.doesNotMatch(launch, /M0\.1|M1\.1|P2\.1|P2\.2/, 'unnecessary internal lesson IDs must not be exposed on /launch/');
assert.doesNotMatch(launch, /Le parcours Free disponible comprend six leçons/i, 'the authored six-lesson catalogue must not be described as six Free lessons');
const app = fs.readFileSync(path.join(dist, 'app.js'), 'utf8');
for (const id of ['M1.1', 'M1.2', 'M1.3']) {
  assert.match(app, new RegExp(`id: '${id}'[\\s\\S]{0,350}permission: 'advanced_modules'`), `${id}: public copy must follow its real advanced_modules entitlement`);
}
const landing = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
const landingDescription = landing.match(/<meta name="description" content="([^"]+)"/)?.[1];
assert.ok(landingDescription?.includes('DDA Free ouvre trois fondations M0'));
assert.ok(!descriptions.has(landingDescription), 'homepage description must be unique against other public pages');
assert.equal(landing.match(/<meta property="og:description" content="([^"]+)"/)?.[1], landingDescription);
assert.equal(landing.match(/<meta name="twitter:description" content="([^"]+)"/)?.[1], landingDescription);
assert.ok(landing.includes('DDA Free ouvre les 3 fondations du module M0'));
assert.ok(landing.includes('ne font pas partie du parcours Free'));
assert.match(landing, /<img class="photo-fill" src="images\/photos\/landing-hero-brand-banner\.jpg" alt="Bannière de Darius Digital Academy/);
const documentRuntime = fs.readFileSync(path.join(dist, 'public-document.js'), 'utf8');
assert.doesNotMatch(documentRuntime, /description\.setAttribute/, 'page runtime must preserve curated route-specific meta descriptions');
const academy = fs.readFileSync(path.join(dist, 'academy.html'), 'utf8');
assert.match(academy, /<meta name="robots" content="noindex, nofollow">/);

const sitemap = fs.readFileSync(path.join(dist, 'sitemap.xml'), 'utf8');
for (const slug of INDEXABLE_PAGES) assert.match(sitemap, new RegExp(`<loc>${BASE}${slug}\/</loc>`), `${slug}: public page must remain in sitemap`);
for (const slug of COMING_SOON_PAGES) assert.doesNotMatch(sitemap, new RegExp(`<loc>${BASE}${slug}\/</loc>`), `${slug}: deindexed "coming soon" page must not be in the sitemap`);
assert.doesNotMatch(sitemap, /academy\.html/, 'private Academy must not be in sitemap');

const ogPath = path.join(dist, 'images', 'dda-og-image.jpg');
assert.ok(fs.existsSync(ogPath), 'OG image must exist');
if (imageSize) {
  const dimensions = imageSize(ogPath);
  assert.equal(dimensions.width, 1200);
  assert.equal(dimensions.height, 630);
}

console.log(`Public SEO metadata contract: PASS (${publicPages.length} pages)`);
