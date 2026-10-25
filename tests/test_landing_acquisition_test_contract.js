'use strict';
/*
 * Contract for dist/go/index.html — the standalone acquisition-test landing
 * page from DDA_Directive_Landing_Test_350USD_V1.md. This is a separate
 * pre-funnel page, not a modification of dist/index.html: single pole
 * (Trading & Marchés), single objective (signup_completed), no pricing or
 * payment surface. Real browser checks, mobile viewport first (§3/§7 of the
 * directive), run against the three utm_content title variants plus the
 * unknown/absent fallback.
 */
const assert = require('assert/strict');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
try { require.resolve('playwright'); } catch { module.paths.push(execSync('npm root -g').toString().trim()); }
const { chromium } = require('playwright');

const DIST = path.join(__dirname, '..', 'dist');
const PORT = 8761;
const BASE = `http://127.0.0.1:${PORT}`;

function startServer() {
  const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
  const server = http.createServer((req, res) => {
    const requested = decodeURIComponent(req.url.split('?')[0].split('#')[0]);
    const file = path.join(DIST, requested === '/' ? 'go/index.html' : requested);
    fs.readFile(file, (error, data) => {
      if (error) { res.writeHead(404); return res.end('not found'); }
      res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream' });
      res.end(data);
    });
  });
  return new Promise(resolve => server.listen(PORT, '127.0.0.1', () => resolve(server)));
}

const FORBIDDEN_PATTERNS = [
  /vivre du trading/i, /liberté financière/i, /témoignage/i,
  /\d+%\s*de\s*réussite/i, /capture[^.]{0,20}profit/i,
  /places? restantes?/i, /offre expire/i, /prix barré/i
];

(async () => {
  const server = await startServer();
  const browser = await chromium.launch();
  const htmlSource = fs.readFileSync(path.join(DIST, 'go', 'index.html'), 'utf8');
  let passed = 0;
  const failures = [];
  async function test(name, fn) {
    try { await fn(); passed++; console.log(`  ok — ${name}`); }
    catch (error) { failures.push({ name, error }); console.log(`  FAIL — ${name}\n    ${error.message}`); }
  }

  try {
    await test('page exists, is noindex, and carries the CSP meta used site-wide', () => {
      assert.match(htmlSource, /<meta name="robots" content="noindex, nofollow">/);
      assert.match(htmlSource, /Content-Security-Policy/);
    });

    await test('no autoplay video and no forbidden marketing claims anywhere in the source', () => {
      assert.doesNotMatch(htmlSource, /<video[^>]*autoplay/i);
      FORBIDDEN_PATTERNS.forEach(pattern => assert.doesNotMatch(htmlSource, pattern, `forbidden pattern matched: ${pattern}`));
    });

    await test('disclaimer appears near the hero CTA and again in the footer', () => {
      const discl = "Aucun gain n'est garanti. Formation éducative uniquement.";
      const footerDiscl = 'DDA ne garantit aucun gain ni performance financière';
      assert.ok(htmlSource.includes(discl), 'hero disclaimer missing');
      assert.ok(htmlSource.includes(footerDiscl), 'footer disclaimer missing');
    });

    await test('offers section shows Découverte free and hides Standard/Pro pricing', () => {
      assert.match(htmlSource, /Découverte — gratuite/);
      assert.match(htmlSource, /Offres payantes bientôt disponibles/);
      assert.doesNotMatch(htmlSource, /[0-9]+\s*(FCFA|EUR|USD|€|\$)/i);
    });

    await test('all five required FAQ answers are present verbatim', () => {
      [
        "Oui. L'offre Découverte est gratuite.",
        'Non. DDA est une formation, pas un service de signaux.',
        "DDA ne promet aucun gain. Nous t'aidons à comprendre les marchés et le risque.",
        "Non. Tu peux commencer l'apprentissage sans engager de capital.",
        "Oui. Il existe un risque de perte, c'est pourquoi le risque est enseigné dès le début."
      ].forEach(answer => assert.ok(htmlSource.includes(answer), `missing FAQ answer: ${answer}`));
    });

    const context = await browser.newContext({ viewport: { width: 360, height: 740 } });
    const page = await context.newPage();

    await test('default (no utm_content) renders the "echange" variant and a single repeated CTA', async () => {
      await page.goto(`${BASE}/`);
      await page.waitForLoadState('networkidle');
      const title = await page.textContent('#lp-title');
      assert.equal(title.trim(), 'Comprends les marchés comme un échange, pas à pas.');
      const ctas = await page.locator('a:has-text("Commencer gratuitement")').count();
      assert.equal(ctas, 3, 'expected exactly 3 instances of the single CTA (hero, offer, final)');
    });

    await test('unknown utm_content falls back to "echange" (never breaks, never shows blank)', async () => {
      await page.goto(`${BASE}/?utm_content=unknown-garbage`);
      await page.waitForLoadState('networkidle');
      const title = await page.textContent('#lp-title');
      assert.equal(title.trim(), 'Comprends les marchés comme un échange, pas à pas.');
    });

    await test('utm_content=risque renders the risk-framed variant, rest of page unchanged', async () => {
      await page.goto(`${BASE}/?utm_content=risque`);
      await page.waitForLoadState('networkidle');
      const title = await page.textContent('#lp-title');
      assert.equal(title.trim(), 'Avant de trader, apprends à gérer le risque.');
      assert.match(await page.content(), /Découverte — gratuite/);
    });

    await test('utm_content=progression renders the progression-framed variant', async () => {
      await page.goto(`${BASE}/?utm_content=progression`);
      await page.waitForLoadState('networkidle');
      const title = await page.textContent('#lp-title');
      assert.equal(title.trim(), 'Apprends les marchés. Vois ta progression.');
    });

    await test('CTA forwards utm_source/medium/campaign/content into academy.html#access', async () => {
      await page.goto(`${BASE}/?utm_source=facebook&utm_medium=paid-social&utm_campaign=landing-test-2026-10&utm_content=risque`);
      await page.waitForLoadState('networkidle');
      const href = await page.getAttribute('[data-cta]', 'href');
      const url = new URL(href, BASE);
      assert.equal(url.hash, '#access');
      assert.equal(url.pathname.endsWith('/academy.html'), true);
      assert.equal(url.searchParams.get('utm_source'), 'facebook');
      assert.equal(url.searchParams.get('utm_medium'), 'paid-social');
      assert.equal(url.searchParams.get('utm_campaign'), 'landing-test-2026-10');
      assert.equal(url.searchParams.get('utm_content'), 'risque');
    });

    await test('an unsafe/unknown source or campaign is dropped, never forwarded raw', async () => {
      await page.goto(`${BASE}/?utm_source=<script>&utm_campaign=not-a-real-campaign&utm_content=echange`);
      await page.waitForLoadState('networkidle');
      const href = await page.getAttribute('[data-cta]', 'href');
      const url = new URL(href, BASE);
      assert.equal(url.searchParams.get('utm_source'), null);
      assert.equal(url.searchParams.get('utm_campaign'), null);
    });

    await test('landing_viewed fires through DDAAnalytics with the resolved variant', async () => {
      const freshContext = await browser.newContext({ viewport: { width: 360, height: 740 } });
      const freshPage = await freshContext.newPage();
      await freshPage.goto(`${BASE}/?utm_source=facebook&utm_medium=paid-social&utm_content=progression`);
      await freshPage.waitForLoadState('networkidle');
      const queue = await freshPage.evaluate(() => window.DDAAnalytics.getDebugQueue());
      const entry = queue.slice().reverse().find(item => item.localName === 'landing_viewed');
      assert.ok(entry, 'landing_viewed was never queued');
      assert.equal(entry.props.content, 'progression');
      assert.equal(entry.props.source, 'facebook');
      assert.equal(entry.props.medium, 'paid-social');
      await freshContext.close();
    });

    await test('no horizontal overflow at 360px width', async () => {
      await page.goto(`${BASE}/`);
      await page.waitForLoadState('networkidle');
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      assert.ok(overflow <= 1, `horizontal overflow at 360px: ${overflow}px`);
    });

    await context.close();
  } finally {
    await browser.close();
    server.close();
  }

  console.log(`\n${passed} passed, ${failures.length} failed`);
  if (failures.length) {
    failures.forEach(({ name, error }) => console.error(`FAILED: ${name}\n${error.stack}`));
    process.exit(1);
  }
  console.log('RESULT: acquisition test landing page contract passed');
})();
