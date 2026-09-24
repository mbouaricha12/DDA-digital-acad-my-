'use strict';
/*
 * Browser proof for the M0 → M1.1 transition.
 *
 * Run with: npm run test:m1:e2e
 * Requires the Playwright Chromium browser: npx playwright install --with-deps chromium
 */

const assert = require('assert/strict');
const fs = require('fs');
const http = require('http');
const path = require('path');
const { chromium } = require('playwright');

const DIST = path.join(__dirname, '..', 'dist');
const PORT = 8746;
const BASE = `http://127.0.0.1:${PORT}`;
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8'
};

function startServer() {
  const server = http.createServer((req, res) => {
    const pathname = decodeURIComponent(new URL(req.url, BASE).pathname);
    const requested = pathname === '/' ? '/index.html' : pathname;
    const fullPath = path.resolve(DIST, `.${requested}`);
    if (!fullPath.startsWith(`${DIST}${path.sep}`) && fullPath !== path.join(DIST, 'index.html')) {
      res.writeHead(403);
      res.end('forbidden');
      return;
    }
    fs.readFile(fullPath, (error, data) => {
      if (error) {
        res.writeHead(404);
        res.end('not found');
        return;
      }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(fullPath)] || 'application/octet-stream' });
      res.end(data);
    });
  });
  return new Promise(resolve => server.listen(PORT, '127.0.0.1', () => resolve(server)));
}

function seededState({ completeM0 = false } = {}) {
  const complete = { lessonViewed: true, exerciseComplete: true, quizComplete: true };
  return {
    schemaVersion: 4,
    user: { id: 'local-ada', name: 'Ada', email: 'ada@example.com', mode: 'device-demo' },
    membership: { plan: 'free', status: 'demo' },
    onboarding: { level: 'Débutant', goal: 'Comprendre les marchés', time: '10 minutes par jour', complete: true },
    lessons: completeM0 ? { 'M0.1': complete, 'M0.2': complete, 'M0.3': complete } : {},
    journal: { entries: [], plan: {} },
    preferences: { lowData: false, reminders: false },
    events: [],
    acquisition: { visitorId: 'm1-e2e-local', source: null, medium: null, campaign: null, referrer: null, landingPath: null, firstSeenAt: null },
    updatedAt: null
  };
}

// Seed after the origin exists, then make a real navigation. This avoids relying
// on addInitScript execution against about:blank, where localStorage is opaque
// in some Chromium builds.
async function newSeededPage(browser, options, target, viewport = { width: 390, height: 844 }) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  await page.goto(`${BASE}/#access`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(state => localStorage.setItem('dda-prototype-state-v4', JSON.stringify(state)), seededState(options));
  // Changing only a hash is a same-document navigation and this SPA intentionally
  // has no hashchange listener. A harmless query makes this a real reload, so
  // boot-time routing reads the seeded state and the requested hash together.
  await page.goto(`${BASE}/?m1-e2e=1${target}`, { waitUntil: 'domcontentloaded' });
  return { context, page };
}

async function activeView(page) {
  return page.locator('.view.active').evaluate(element => element.id);
}

let passed = 0;
const failures = [];
async function test(name, fn) {
  try {
    await fn();
    passed += 1;
    console.log(`PASS - ${name}`);
  } catch (error) {
    failures.push({ name, error });
    console.log(`FAIL - ${name} -> ${error.message}`);
  }
}

(async () => {
  let server;
  let browser;
  try {
    server = await startServer();
    browser = await chromium.launch();

    await test('M1.1 direct route stays locked until M0 is complete', async () => {
      const { context, page } = await newSeededPage(browser, { completeM0: false }, '#lesson-m11');
      await page.waitForSelector('.view.active#path');
      assert.equal(await activeView(page), 'path');
      assert.match(await page.locator('#toast').textContent(), /Valide d’abord le module précédent/);
      assert.equal(await page.locator('body').evaluate(body => body.classList.contains('lesson-focus')), false);
      await context.close();
    });

    await test('M0 completion promotes M1.1 through Terminal, Parcours, Focus Mode and M1 feedback gates', async () => {
      const { context, page } = await newSeededPage(browser, { completeM0: true }, '#dashboard');
      await page.waitForSelector('.view.active#dashboard');

      assert.match(await page.locator('#terminal-lead-title').textContent(), /Pourquoi les prix évoluent/);
      await page.locator('#lesson-primary-action').click();
      await page.waitForSelector('.view.active#lesson-m11');
      assert.equal(await page.locator('body').evaluate(body => body.classList.contains('lesson-focus')), true);
      assert.equal(await page.locator('#m1-quiz-block').getAttribute('aria-disabled'), 'true');

      // M1 progress is durable before any graded gate is passed.
      await page.locator('#mark-understood-m11').click();
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForSelector('.view.active#lesson-m11');
      const afterReload = await page.evaluate(() => window.DDA.load().lessons['M1.1']);
      assert.equal(afterReload.lessonViewed, true);
      assert.equal(afterReload.exerciseComplete, false);

      // Wrong -> feedback -> retry is a real interaction, not an authored string only.
      const exercise = page.locator('[data-question="m1-exercise"]');
      await exercise.locator('button[data-correct="false"]').first().click();
      assert.match(await page.locator('#m1-exercise-feedback').textContent(), /équilibre parfait|présence de vendeurs/i);
      await exercise.locator('button[data-correct="true"]').click();
      assert.equal(await page.locator('#m1-quiz-block').getAttribute('aria-disabled'), 'false');

      const quiz = page.locator('[data-question="m1-quiz"]');
      await quiz.locator('button[data-correct="false"]').first().click();
      assert.match(await page.locator('#m1-quiz-feedback').textContent(), /simpliste|direction prédéterminée/i);
      await quiz.locator('button[data-correct="true"]').click();
      await page.waitForSelector('#result-card-m11:not([hidden])');

      const completed = await page.evaluate(() => window.DDA.load().lessons['M1.1']);
      assert.equal(completed.exerciseComplete, true);
      assert.equal(completed.quizComplete, true);
      assert.match(await page.locator('#result-card-m11').textContent(), /formation du prix/i);

      // After validation, every connected surface agrees that M1 is the latest authored chapter.
      await page.locator('#result-card-m11 [data-view="dashboard"]').click();
      await page.waitForSelector('.view.active#dashboard');
      assert.match(await page.locator('#terminal-lead-title').textContent(), /Toutes les leçons disponibles sont validées/);
      await page.locator('.nav-item[data-view="path"]').click();
      await page.waitForSelector('.view.active#path');
      assert.match(await page.locator('.journey-current-tag').textContent(), /Comprendre les marchés financiers/);
      assert.equal((await page.locator('.journey-current .path-number').textContent()).trim(), '02');
      await context.close();
    });

    await test('M1.1 stays within the viewport and keeps a 44px primary control on mobile widths', async () => {
      for (const width of [320, 375, 390, 428]) {
        const { context, page } = await newSeededPage(browser, { completeM0: true }, '#lesson-m11', { width, height: 844 });
        await page.waitForSelector('.view.active#lesson-m11');
        const metrics = await page.evaluate(() => {
          const button = document.getElementById('mark-understood-m11').getBoundingClientRect();
          return {
            overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
            width: button.width,
            height: button.height
          };
        });
        assert.ok(metrics.overflow <= 1, `${width}px has ${metrics.overflow}px horizontal overflow`);
        assert.ok(metrics.width >= 44 && metrics.height >= 44, `${width}px primary control is smaller than 44px`);
        await context.close();
      }
    });
  } catch (error) {
    failures.push({ name: 'browser bootstrap', error });
    console.log(`FAIL - browser bootstrap -> ${error.message}`);
  } finally {
    if (browser) await browser.close();
    if (server) await new Promise(resolve => server.close(resolve));
  }

  const failureDetails = failures.map(({ name, error }) => `- ${name}: ${error.stack || error.message}`);
  const report = [`RESULT: ${passed} passed, ${failures.length} failed`, ...failureDetails].join('\n');
  fs.mkdirSync(path.join(__dirname, '..', 'test-results'), { recursive: true });
  fs.writeFileSync(path.join(__dirname, '..', 'test-results', 'm1-browser-e2e.log'), `${report}\n`);
  console.log(`\n${report}`);
  if (failures.length) process.exit(1);
})();
