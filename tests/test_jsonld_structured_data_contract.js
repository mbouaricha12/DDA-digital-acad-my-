'use strict';

/*
 * DDA — JSON-LD structured data contract (Phase C / P2, technical item with
 * no blocking dependency).
 *
 * Every public page and the Academy shell must declare a WebPage JSON-LD
 * block whose `name`/`description` are copied verbatim from that page's own
 * real <title>/<meta name="description"> — never new invented copy — and
 * whose `url` is the page's real absolute address.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', 'dist');
const BASE = 'https://dariusdigitalacademy.com';

const PUBLIC_PAGES = [
  'about', 'faq', 'contact', 'terms', 'privacy', 'cookies', 'imprint',
  'risks', 'accessibility', 'launch', 'live', 'business', 'experts',
  'community', 'ai', 'commencer'
];

let pass = 0;
function check(condition, message) {
  assert.ok(condition, message);
  pass++;
}

function readJsonLd(html, label) {
  const match = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  assert.ok(match, `${label}: must declare a JSON-LD block`);
  let data;
  try { data = JSON.parse(match[1]); }
  catch (error) { throw new Error(`${label}: JSON-LD block is not valid JSON (${error.message})`); }
  return data;
}

for (const slug of PUBLIC_PAGES) {
  const html = fs.readFileSync(path.join(root, slug, 'index.html'), 'utf8');
  const titleMatch = html.match(/<title>([^<]*)<\/title>/);
  const descMatch = html.match(/<meta name="description" content="([^"]*)"/);
  assert.ok(titleMatch, `${slug}: missing <title>`);
  assert.ok(descMatch, `${slug}: missing meta description`);

  const data = readJsonLd(html, slug);
  check(data['@type'] === 'WebPage', `${slug}: JSON-LD @type must be WebPage`);
  check(data.url === `${BASE}/${slug}/`, `${slug}: JSON-LD url must be the page's real absolute address`);
  check(data.name === titleMatch[1], `${slug}: JSON-LD name must match the real <title>, never a second copy`);
  check(data.description === descMatch[1], `${slug}: JSON-LD description must match the real meta description, never a second copy`);
  check(data.isPartOf && data.isPartOf['@id'] === `${BASE}/#website`, `${slug}: JSON-LD must reference the site's own WebSite entity, never a fabricated one`);
}

const academyHtml = fs.readFileSync(path.join(root, 'academy.html'), 'utf8');
const academyTitle = academyHtml.match(/<title>([^<]*)<\/title>/);
const academyDesc = academyHtml.match(/<meta name="description" content="([^"]*)"/);
assert.ok(academyTitle && academyDesc, 'academy.html: missing title/description');
const academyData = readJsonLd(academyHtml, 'academy.html');
check(academyData['@type'] === 'WebPage', 'academy.html: JSON-LD @type must be WebPage');
check(academyData.url === `${BASE}/academy.html`, 'academy.html: JSON-LD url must be the real absolute address');
check(academyData.name === academyTitle[1], 'academy.html: JSON-LD name must match the real <title>');
check(academyData.description === academyDesc[1], 'academy.html: JSON-LD description must match the real meta description');

// index.html already had a hand-authored Organization + WebSite graph before
// this lot — untouched here, just confirmed still present and still the
// entity every other page's isPartOf points back at.
const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
assert.match(indexHtml, /"@id":\s*"https:\/\/dariusdigitalacademy\.com\/#website"/, 'index.html must still declare the #website entity every page references');
assert.match(indexHtml, /"@id":\s*"https:\/\/dariusdigitalacademy\.com\/#organization"/, 'index.html must still declare the #organization entity');
pass += 1;

console.log(`\nRESULT: ${pass} JSON-LD structured data checks passed`);
