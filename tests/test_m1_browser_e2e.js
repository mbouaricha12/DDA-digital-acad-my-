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

async function activeView(page) {
  return page.locator('.view.active').evaluate(element => element.id);
}

async function createLearner(page) {
  await page.goto(`${BASE}/#access`, { waitUntil: 'domcontentloaded' });
  await page.fill('#first-name', 'Ada');
  await page.fill('#email', 'ada@example.com');
  await page.check('#consent');
  await page.click('#signup-form button[type="submit"]');
  await page.selectOption('#level', 'Débutant');
  await page.selectOption('#goal', 'Comprendre les marchés');
  await page.selectOption('#time', '10 minutes par jour');
  await page.click('#onboarding-form button[type="submit"]');
  await page.waitForSelector('.view.active#lesson');
}

async function chooseCorrect(page, questionName) {
  const button = page.locator(`[data-question="${questionName}"] button[data-correct="true"]`).first();
  await button.scrollIntoViewIfNeeded();
  await button.click();
}

async function completeM0(page) {
  await chooseCorrect(page, 'exercise');
  await chooseCorrect(page, 'quiz');
  await page.waitForSelector('#result-card:not([hidden])');
  await page.locator('#result-card [data-view="lesson-m02"]').click();
  await page.waitForSelector('.view.active#lesson-m02');

  await chooseCorrect(page, 'm2-challenge-zone');
  await chooseCorrect(page, 'm2-quiz');
  await page.waitForSelector('#result-card-m2:not([hidden])');
  await page.locator('#result-card-m2 [data-view="lesson-m03"]').click();
  await page.waitForSelector('.view.active#lesson-m03');

  await chooseCorrect(page, 'm3-challenge');
  await chooseCorrect(page, 'm3-quiz');
  await page.waitForSelector('#result-card-m3:not([hidden])');
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
      const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
      const page = await context.newPage();
      await createLearner(page);

      // A fresh document models a real bookmarked/deep-linked route. It shares
      // the learner's local state but must not expose M1.1 prematurely.
      const directPage = await context.newPage();
      await directPage.goto(`${BASE}/?m1-lock-check=1#lesson-m11`, { waitUntil: 'domcontentloaded' });
      await directPage.waitForSelector('.view.active#path');
      assert.equal(await activeView(directPage), 'path');
      assert.match(await directPage.locator('#toast').textContent(), /Valide d’abord le module précédent/);
      assert.equal(await directPage.locator('body').evaluate(body => body.classList.contains('lesson-focus')), false);
      await context.close();
    });

    await test('a real learner completes M0, then progresses through M1.1 with feedback, persistence and coherent surfaces', async () => {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
      const page = await context.newPage();
      await createLearner(page);
      await completeM0(page);

      await page.locator('.mobile-nav button[data-view="dashboard"]').click();
      await page.waitForSelector('.view.active#dashboard');
      assert.match(await page.locator('#terminal-lead-title').textContent(), /Pourquoi les prix évoluent/);
      // Reset the document scroll after leaving M0.3. The app scrolls the
      // Terminal smoothly; stabilising it here prevents Playwright's own
      // auto-scroll from racing that transition before the CTA is clicked.
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.locator('#lesson-primary-action').click();
      await page.waitForSelector('.view.active#lesson-m11');
      assert.equal(await page.locator('body').evaluate(body => body.classList.contains('lesson-focus')), true);
      assert.equal(await page.locator('#m1-quiz-block').getAttribute('aria-disabled'), 'true');

      // The M1 reader remains usable at every target mobile width.
      for (const width of [320, 375, 390, 428]) {
        await page.setViewportSize({ width, height: 844 });
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
      }

      // M1 progress is durable before any graded gate is passed.
      await page.locator('#mark-understood-m11').click();
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(100);
      const afterReload = await page.evaluate(() => ({
        progress: window.DDA.load().lessons['M1.1'],
        active: document.querySelector('.view.active')?.id,
        hash: window.location.hash,
        primaryLessonId: window.DDA.primaryLessonId
      }));
      assert.equal(afterReload.active, 'lesson-m11', `M1 reload route did not persist: ${JSON.stringify(afterReload)}`);
      assert.equal(afterReload.progress.lessonViewed, true);
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
      await page.locator('.mobile-nav button[data-view="dashboard"]').click();
      await page.waitForSelector('.view.active#dashboard');
      assert.match(await page.locator('#terminal-lead-title').textContent(), /Toutes les leçons disponibles sont validées/);
      await page.locator('.mobile-nav button[data-view="path"]').click();
      await page.waitForSelector('.view.active#path');
      assert.match(await page.locator('.journey-current-tag').textContent(), /Comprendre les marchés financiers/);
      assert.equal((await page.locator('.journey-current .path-number').textContent()).trim(), '02');
      await context.close();
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
