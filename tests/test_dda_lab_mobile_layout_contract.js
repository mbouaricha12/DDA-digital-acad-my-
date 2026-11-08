'use strict';

/*
 * DDA Lab mobile layout contract (founder visual bug report, 2026-11).
 *
 * Two real mobile bugs on #lab / #lesson-lab1..4/#lesson-lab-capstone:
 *
 * 1) "Ce que l'IA sait faire" 5-step progress strip (#lab-progress-strip,
 *    class .premium-progress-strip): at 390px the step labels ("Formuler
 *    une demande claire"…) wrapped one or two letters per line.
 *    Root cause: styles.css already has a correct, scoped mobile fix for
 *    this exact component — `@media(max-width:760px){#lab
 *    .premium-progress-strip{grid-template-columns:1fr}}` (its "DDA UX
 *    pass 02 — Lab catalog" block). But dist/alpha-polish.css's own dark-
 *    theme override for the same selector set
 *    `grid-template-columns:repeat(5,minmax(0,1fr))` *unconditionally*
 *    (no media query). Because alpha-polish.css loads after styles.css in
 *    academy.html's <head> and both selectors share the same specificity
 *    (#lab .premium-progress-strip), the unconditional rule always won —
 *    at every width, mobile included — forcing 5 columns of ~24px at
 *    390px and splitting every label into one or two letters per line.
 *
 * 2) .lesson-loop step tracker ("Essayer" / "Vérifier" / "Continuer"…):
 *    on narrow phones it rendered as an oversized rounded blob whose
 *    curved left/right edges visually overlapped the step bullets and the
 *    start of each label.
 *    Root cause: styles.css already replaces the single-row pill rail
 *    with a readable vertical sequence below 600px (its "DDA UX pass 01"
 *    block: display:grid, border-radius:14px, a border and padding sized
 *    for a tall, multi-row block). But alpha-polish.css's own
 *    `.lesson-main .lesson-loop` rule set `border-radius:999px` (a pill)
 *    *unconditionally*, with a higher selector specificity (two classes
 *    vs styles.css's one) — so it always won, including on a tall,
 *    multi-row list it was never designed for, turning it into a giant
 *    stadium/blob shape.
 *
 * Fix (dist/alpha-polish.css): both unconditional declarations are now
 * scoped to the exact width range they were designed for — ≥761px and
 * ≥601px respectively, the precise complements of styles.css's own
 * ≤760px / ≤600px breakpoints for these same two components — so
 * styles.css's existing, correct mobile layouts are no longer overridden.
 *
 * This file checks both the CSS source (fast, no browser, catches any
 * regression that re-widens either override) and, when Playwright is
 * available, the live computed layout at the exact widths the founder
 * reported (360/390/430px), plus a desktop check that the original
 * ≥761px/≥601px behaviour this fix must not change is unchanged.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const alphaPolish = fs.readFileSync(path.join(__dirname, '..', 'dist', 'alpha-polish.css'), 'utf8');
const styles = fs.readFileSync(path.join(__dirname, '..', 'dist', 'styles.css'), 'utf8');

let passed = 0;
function test(name, fn) {
  fn();
  passed++;
  console.log('PASS -', name);
}

// --- Bug 1: #lab-progress-strip (.premium-progress-strip) 5-column grid ---

test('styles.css still owns the #lab .premium-progress-strip mobile stacking fix (≤760px → 1 column)', () => {
  assert.match(
    styles,
    /@media\(max-width:760px\)\{\s*#lab \.premium-progress-strip\{grid-template-columns:1fr/,
    'styles.css must still stack the 5-step strip to a single column at ≤760px'
  );
});

test('alpha-polish.css no longer forces 5 columns unconditionally — it is scoped to ≥761px (desktop only)', () => {
  assert.match(
    alphaPolish,
    /@media\(min-width:761px\)\{\s*#lab \.premium-progress-strip\{grid-template-columns:repeat\(5,minmax\(0,1fr\)\)\}\s*\}/,
    'the 5-column override must be wrapped in a ≥761px media query, matching styles.css\'s ≤760px breakpoint exactly (no gap, no overlap)'
  );
  // Guard against a future edit that re-adds an unconditional copy elsewhere
  // in the same file (e.g. a second, unscoped "#lab .premium-progress-strip"
  // rule carrying grid-template-columns).
  const withoutMediaBlocks = alphaPolish.replace(/@media\([^)]*\)\{[\s\S]*?\n\}/g, '');
  assert.doesNotMatch(
    withoutMediaBlocks,
    /#lab \.premium-progress-strip\{[^}]*grid-template-columns/,
    'no unconditional (non-media-scoped) grid-template-columns override must remain for #lab .premium-progress-strip'
  );
});

// --- Bug 2: .lesson-loop pill shape vs. the mobile vertical sequence ---

test('styles.css still owns the .lesson-loop mobile vertical-sequence fix (≤600px → grid, 14px radius)', () => {
  assert.match(
    styles,
    /@media \(max-width: 600px\) \{\s*\.lesson-loop \{\s*display: grid;/,
    'styles.css must still replace the pill rail with a vertical sequence at ≤600px'
  );
  assert.match(
    styles,
    /@media \(max-width: 600px\) \{[\s\S]*?border-radius: 14px;/,
    'the ≤600px vertical sequence must use its own small, non-pill border-radius'
  );
});

test('alpha-polish.css no longer forces the 999px pill shape unconditionally — it is scoped to ≥601px', () => {
  assert.match(
    alphaPolish,
    /@media\(min-width:601px\)\{\s*\.lesson-main \.lesson-loop\{margin-top:30px;padding:11px 14px;border:1px solid rgba\(255,255,255,\.1\);border-radius:999px;background:rgba\(255,255,255,\.035\)\}\s*\}/,
    'the pill-shaped .lesson-main .lesson-loop rule must be wrapped in a ≥601px media query, matching styles.css\'s ≤600px breakpoint exactly'
  );
  const withoutMediaBlocks = alphaPolish.replace(/@media\([^)]*\)\{[\s\S]*?\n\}/g, '');
  assert.doesNotMatch(
    withoutMediaBlocks,
    /\.lesson-main \.lesson-loop\{[^}]*border-radius:999px/,
    'no unconditional (non-media-scoped) 999px pill radius must remain for .lesson-main .lesson-loop'
  );
});

console.log(`RESULT: ${passed} DDA Lab mobile layout (static CSS) contract checks passed`);

// --- Live computed-layout checks (Playwright), mirroring the project's own
// e2e test convention (tests/run.js, screenshots.js): real browser, real
// computed styles, at the exact widths from the founder's report. ---
(async () => {
  let chromium;
  try {
    try { chromium = require('playwright').chromium; }
    catch {
      const { execSync } = require('child_process');
      module.paths.push(execSync('npm root -g').toString().trim());
      chromium = require('playwright').chromium;
    }
  } catch {
    console.log('SKIP: Playwright not available — static CSS checks above already cover this contract.');
    return;
  }

  const http = require('http');
  const DIST = path.join(__dirname, '..', 'dist');
  const PORT = 8769; // not used by any other tests/*.js file (checked: 8743,8744,8745,8751,8761-8764)
  const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };

  const server = http.createServer((req, res) => {
    let filePath = decodeURIComponent(req.url.split('?')[0].split('#')[0]);
    if (filePath === '/') filePath = '/index.html';
    const full = path.join(DIST, filePath);
    fs.readFile(full, (err, data) => {
      if (err) { res.writeHead(404); res.end('not found'); return; }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(full)] || 'application/octet-stream' });
      res.end(data);
    });
  });
  await new Promise(resolve => server.listen(PORT, resolve));

  const SEED_STATE = {
    schemaVersion: 4,
    user: { id: 'local-pilot', name: 'Ada', email: 'ada@example.com', mode: 'device-demo' },
    membership: { plan: 'free', status: 'demo' },
    onboarding: { level: 'Débutant', goal: 'Comprendre les marchés', time: '10 minutes par jour', complete: true },
    lessons: {}
  };

  const browser = await chromium.launch();
  let livePassed = 0;
  try {
    for (const width of [360, 390, 430]) {
      const context = await browser.newContext({ viewport: { width, height: 900 } });
      const page = await context.newPage();
      await page.addInitScript(state => {
        try { localStorage.setItem('dda-prototype-state-v4', JSON.stringify(state)); } catch (e) {}
      }, SEED_STATE);

      // Bug 1 — progress strip must be a single column with readable labels.
      await page.goto(`http://localhost:${PORT}/academy.html#lab`);
      await page.waitForSelector('#lab-progress-strip li strong');
      const strip = await page.evaluate(() => {
        const el = document.querySelector('#lab-progress-strip');
        const stripWidth = el.getBoundingClientRect().width;
        const cols = getComputedStyle(el).gridTemplateColumns.trim().split(/\s+/);
        // Each row's own width (not the label text's wrapped-line width, which
        // legitimately varies with how much of it wraps) — this is what the
        // 5-equal-column regression collapsed to ~1/5th of the strip.
        const rowWidths = Array.from(el.querySelectorAll('li')).map(li => li.getBoundingClientRect().width);
        return { stripWidth, columnCount: cols.length, rowWidths };
      });
      assert.strictEqual(strip.columnCount, 1, `[${width}px] #lab-progress-strip must render as a single column, got ${strip.columnCount}`);
      strip.rowWidths.forEach((w, i) => {
        // 0.75 rather than closer to 1: the strip itself carries horizontal
        // padding a single-column row sits inside, so a row is always a bit
        // narrower than the strip's own border-box width. A 5-equal-column
        // regression shrinks it to ~1/5th (~0.2) instead, so 0.75 safely
        // separates "single column" from "collapsed into 5 columns" without
        // being tripped up by that padding.
        assert.ok(
          w > strip.stripWidth * 0.75,
          `[${width}px] step row #${i + 1} must span (close to) the strip's full width (${strip.stripWidth.toFixed(1)}px), got ${w.toFixed(1)}px — the 5-column regression shrank rows to ~1/5th of that`
        );
      });
      await context.close();
      livePassed++;
      console.log(`PASS - [live, ${width}px] #lab-progress-strip stacks to one readable column`);

      // Bug 2 — .lesson-loop must not be a pill/blob on a tall, multi-row list.
      const context2 = await browser.newContext({ viewport: { width, height: 900 } });
      const page2 = await context2.newPage();
      await page2.addInitScript(state => {
        try { localStorage.setItem('dda-prototype-state-v4', JSON.stringify(state)); } catch (e) {}
      }, SEED_STATE);
      await page2.goto(`http://localhost:${PORT}/academy.html#lesson-lab1`);
      await page2.waitForSelector('#lesson-lab1 .lesson-loop');
      const loop = await page2.evaluate(() => {
        const el = document.querySelector('#lesson-lab1 .lesson-loop');
        const cs = getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        return { borderRadius: cs.borderRadius, display: cs.display, width: rect.width, height: rect.height };
      });
      assert.ok(
        !loop.borderRadius.includes('999px'),
        `[${width}px] .lesson-loop must not keep the desktop 999px pill radius on a tall stacked list, got ${loop.borderRadius}`
      );
      // A pill shape forced onto a tall block computes a huge radius ≈ half
      // its (large, multi-row) height; the real mobile fix uses a small,
      // fixed 14px radius regardless of how tall the list grows.
      const maxRadiusPx = Math.max(...loop.borderRadius.split(/\s+/).map(v => parseFloat(v) || 0));
      assert.ok(maxRadiusPx <= 20, `[${width}px] .lesson-loop border-radius must be small/fixed (≤20px), got ${loop.borderRadius} on a ${loop.height.toFixed(0)}px-tall block`);
      await context2.close();
      livePassed++;
      console.log(`PASS - [live, ${width}px] .lesson-loop stays a flat card, no pill/blob overlap`);
    }

    // Desktop guard: the ≥761px / ≥601px behaviour these fixes must *not*
    // change stays exactly as it was (5 columns; pill radius).
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();
    await page.addInitScript(state => {
      try { localStorage.setItem('dda-prototype-state-v4', JSON.stringify(state)); } catch (e) {}
    }, SEED_STATE);
    await page.goto(`http://localhost:${PORT}/academy.html#lab`);
    await page.waitForSelector('#lab-progress-strip li strong');
    const desktopCols = await page.evaluate(() => getComputedStyle(document.querySelector('#lab-progress-strip')).gridTemplateColumns.trim().split(/\s+/).length);
    assert.strictEqual(desktopCols, 5, `[1280px desktop] #lab-progress-strip must keep its 5-column layout, got ${desktopCols}`);
    await page.goto(`http://localhost:${PORT}/academy.html#lesson-lab1`);
    await page.waitForSelector('#lesson-lab1 .lesson-loop');
    const desktopRadius = await page.evaluate(() => getComputedStyle(document.querySelector('#lesson-lab1 .lesson-loop')).borderRadius);
    assert.ok(desktopRadius.includes('999px'), `[1280px desktop] .lesson-loop must keep its pill shape, got ${desktopRadius}`);
    await context.close();
    livePassed++;
    console.log('PASS - [live, 1280px desktop] both components keep their original, unchanged desktop layout');

    console.log(`RESULT: ${livePassed} live DDA Lab mobile layout checks passed`);
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => {
  console.error('FAIL - live DDA Lab mobile layout check:', error.message);
  process.exitCode = 1;
});
