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
const publicPages = [
  'about', 'launch', 'terms', 'privacy', 'cookies', 'imprint', 'risks',
  'accessibility', 'contact', 'faq', 'live', 'business', 'experts',
  'community', 'ai'
];

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
  assert.match(html, /<meta name="robots" content="index, follow">/, `${slug}: public page must remain indexable`);
  assert.match(html, new RegExp(`<meta property="og:url" content="${canonical.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}">`), `${slug}: og:url must be canonical`);
  assert.match(html, /<meta property="og:title" content="[^"]+">/);
  assert.match(html, /<meta property="og:description" content="[^"]+">/);
  assert.match(html, /<meta property="og:image" content="https:\/\/dariusdigitalacademy\.com\/images\/dda-og-image\.jpg">/);
  assert.match(html, /<meta property="og:image:width" content="1200">/);
  assert.match(html, /<meta property="og:image:height" content="630">/);
  assert.match(html, /<meta name="twitter:card" content="summary_large_image">/);
  assert.match(html, /<meta name="twitter:image" content="https:\/\/dariusdigitalacademy\.com\/images\/dda-og-image\.jpg">/);
  assert.match(html, /<link rel="icon" href="\.\.\/images\/favicon-32\.png"/);
  assert.match(html, /<html lang="fr">/i);
}

const launch = fs.readFileSync(path.join(dist, 'launch', 'index.html'), 'utf8');
assert.match(launch, /M0 rassemble trois fondations \(M0\.1 à M0\.3\) et M1 ajoute trois leçons \(M1\.1 à M1\.3\)/);
const landing = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
assert.match(landing, /M0 comprend 3 fondations\. M1 ajoute 3 leçons supplémentaires/);
const academy = fs.readFileSync(path.join(dist, 'academy.html'), 'utf8');
assert.match(academy, /<meta name="robots" content="noindex, nofollow">/);

const sitemap = fs.readFileSync(path.join(dist, 'sitemap.xml'), 'utf8');
for (const slug of publicPages) assert.match(sitemap, new RegExp(`<loc>${BASE}${slug}\/</loc>`), `${slug}: public page must remain in sitemap`);
assert.doesNotMatch(sitemap, /academy\.html/, 'private Academy must not be in sitemap');

const ogPath = path.join(dist, 'images', 'dda-og-image.jpg');
assert.ok(fs.existsSync(ogPath), 'OG image must exist');
if (imageSize) {
  const dimensions = imageSize(ogPath);
  assert.equal(dimensions.width, 1200);
  assert.equal(dimensions.height, 630);
}

console.log(`Public SEO metadata contract: PASS (${publicPages.length} pages)`);
