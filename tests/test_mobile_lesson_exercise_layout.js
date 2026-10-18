'use strict';

const assert = require('node:assert/strict');
const http = require('node:http');
const path = require('node:path');
const fs = require('node:fs');
const { execSync } = require('node:child_process');

try { require.resolve('playwright'); } catch { module.paths.push(execSync('npm root -g').toString().trim()); }
const { chromium } = require('playwright');

const DIST = path.join(__dirname, '..', 'dist');
const PORT = 8746;
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' };

function startServer() {
  const server = http.createServer((req, res) => {
    let filePath = decodeURIComponent(req.url.split('?')[0].split('#')[0]);
    if (filePath === '/') filePath = '/academy.html';
    const fullPath = path.join(DIST, filePath);
    fs.readFile(fullPath, (error, data) => {
      if (error) { res.writeHead(404); res.end('not found'); return; }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(fullPath)] || 'application/octet-stream' });
      res.end(data);
    });
  });
  return new Promise(resolve => server.listen(PORT, '127.0.0.1', () => resolve(server)));
}

async function seedLearner(context) {
  await context.addInitScript(() => {
    localStorage.setItem('dda-prototype-state-v4', JSON.stringify({
      schemaVersion: 4,
      user: { id: 'mobile-layout-test', name: 'Ada', email: 'ada@example.com', mode: 'device-demo' },
      membership: { plan: 'free', status: 'demo' },
      onboarding: { level: 'Débutant', goal: 'Comprendre les marchés', time: '10 minutes par jour', complete: true },
      lessons: Object.fromEntries(['M0.1', 'M0.2', 'M0.3', 'M1.1', 'M1.2', 'M1.3'].map(id => [id, { lessonViewed: false, exerciseComplete: false, quizComplete: false }])),
      journal: { entries: [], plan: {} }, preferences: { lowData: false, reminders: false }, terminal: {}, events: [], acquisition: {}, updatedAt: null
    }));
  });
}

(async () => {
  const server = await startServer();
  const browser = await chromium.launch();
  try {
    for (const width of [360, 390, 430]) {
      const context = await browser.newContext({ viewport: { width, height: 780 } });
      await seedLearner(context);
      const page = await context.newPage();
      await page.goto(`http://127.0.0.1:${PORT}/academy.html#lesson`, { waitUntil: 'networkidle' });
      await page.waitForSelector('#lesson.view.active .lesson-main');
      const metrics = await page.locator('#lesson.view.active').evaluate(view => {
        const actions = view.querySelector('.lesson-actions');
        const primary = actions?.querySelector('.primary-action');
        const rect = actions?.getBoundingClientRect();
        const primaryRect = primary?.getBoundingClientRect();
        const style = actions ? getComputedStyle(actions) : null;
        return {
          position: style?.position,
          overflow: style?.overflow,
          width: rect?.width,
          height: rect?.height,
          viewportWidth: innerWidth,
          viewportHeight: innerHeight,
          primaryBottom: primaryRect?.bottom,
          pageHeight: document.documentElement.scrollHeight,
          visible: Boolean(rect && rect.width > 0 && rect.height > 0)
        };
      });
      assert.equal(metrics.position, 'static', `${width}px: lesson actions must not be sticky/fixed`);
      assert.equal(metrics.visible, true, `${width}px: lesson actions must remain visible`);
      assert.ok(metrics.width <= metrics.viewportWidth, `${width}px: actions overflow viewport`);
      assert.ok(metrics.height < metrics.viewportHeight, `${width}px: actions must not become a viewport-height panel`);
      assert.ok(metrics.pageHeight > metrics.viewportHeight, `${width}px: lesson must remain naturally scrollable`);
      assert.ok(metrics.primaryBottom <= metrics.pageHeight, `${width}px: primary action must stay inside document flow`);
      await context.close();
      console.log(`Mobile lesson layout ${width}px: PASS`);
    }
  } finally {
    await browser.close();
    server.close();
  }
})();
