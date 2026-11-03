'use strict';
// Every public page must carry the same canonical/OG/Twitter meta template
// index.html and commencer/ already had — derived from each page's own real
// <title>/<meta description>, never a second, invented copy.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..', 'dist');
const SITE = 'https://dariusdigitalacademy.com';
const pages = ['about', 'faq', 'contact', 'terms', 'privacy', 'cookies', 'imprint', 'risks', 'accessibility', 'launch', 'live', 'business', 'experts', 'community', 'ai', 'commencer'];

for (const slug of pages) {
  const html = fs.readFileSync(path.join(root, slug, 'index.html'), 'utf8');
  const titleMatch = html.match(/<title>([^<]*)<\/title>/);
  const descMatch = html.match(/<meta name="description" content="([^"]*)">/);
  assert.ok(titleMatch && descMatch, `${slug}: title and description must exist`);
  const title = titleMatch[1];
  const desc = descMatch[1];
  const url = `${SITE}/${slug}/`;
  assert.match(html, new RegExp(`<link rel="canonical" href="${url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}">`), `${slug}: canonical must point to its own real URL`);
  assert.match(html, /<meta property="og:type" content="website">/, `${slug}: og:type missing`);
  assert.ok(html.includes(`<meta property="og:title" content="${title}">`), `${slug}: og:title must match the real <title>, never invented copy`);
  assert.ok(html.includes(`<meta property="og:description" content="${desc}">`), `${slug}: og:description must match the real meta description`);
  assert.match(html, /<meta property="og:image" content="https:\/\/dariusdigitalacademy\.com\/images\/dda-og-image\.jpg">/, `${slug}: og:image must be an absolute URL (subpages are one level deep — a relative path would resolve wrong)`);
  assert.match(html, /<meta name="twitter:card" content="summary_large_image">/, `${slug}: twitter:card missing`);
}
console.log(`SEO meta templates contract: PASS (${pages.length} pages)`);
