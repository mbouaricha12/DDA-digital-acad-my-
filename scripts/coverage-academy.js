'use strict';

const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium } = require('playwright');

const DIST = path.join(__dirname, '..', 'dist');
const PORT = 8791;
const BASE = `http://127.0.0.1:${PORT}`;
const OUT = path.join(__dirname, '..', 'coverage');
const SYSTEM_CHROMIUM = process.env.PLAYWRIGHT_EXECUTABLE_PATH || ['/usr/bin/chromium', '/usr/bin/chromium-browser'].find(file => fs.existsSync(file));
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml'
};

function startServer() {
  const server = http.createServer((req, res) => {
    const requestPath = decodeURIComponent((req.url || '/').split('?')[0].split('#')[0]);
    const relative = requestPath === '/' ? '/index.html' : requestPath;
    const filePath = path.join(DIST, relative);
    if (!filePath.startsWith(DIST)) {
      res.writeHead(400); res.end('bad path'); return;
    }
    fs.readFile(filePath, (error, data) => {
      if (error) { res.writeHead(404); res.end('not found'); return; }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath)] || 'application/octet-stream' });
      res.end(data);
    });
  });
  return new Promise(resolve => server.listen(PORT, '127.0.0.1', () => resolve(server)));
}

const learnerState = JSON.stringify({
  schemaVersion: 4,
  user: { id: 'coverage-learner', name: 'Coverage', email: 'coverage@example.com', mode: 'device-demo' },
  membership: { plan: 'free', status: 'demo' },
  onboarding: { level: 'Débutant', goal: 'Comprendre les marchés', time: '10 minutes par jour', complete: true },
  lessons: {}, journal: { entries: [], plan: {} }, preferences: {}, terminal: {}, events: [], acquisition: {}, updatedAt: null
});

async function collectRoute(browser, route, { learner = false } = {}) {
  const context = await browser.newContext();
  if (learner) {
    await context.addInitScript(state => {
      localStorage.setItem('dda-prototype-state-v4', state);
      localStorage.setItem('dda-prototype-state-v4:guest', state);
      localStorage.setItem('dda-prototype-state-v4:user:coverage-learner', state);
    }, learnerState);
  }
  const page = await context.newPage();
  const session = await context.newCDPSession(page);
  await session.send('Profiler.enable');
  await session.send('Profiler.startPreciseCoverage', { callCount: false, detailed: true });
  await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(150);
  if (route.includes('academy.html#access')) {
    await page.locator('#bff-mode-signup').waitFor({ state: 'visible' }).catch(() => {});
  }
  if (route.includes('academy.html#dashboard')) {
    await page.locator('#dashboard.view.active').waitFor().catch(() => {});
    await page.locator('.mobile-nav button[data-view="path"]').click().catch(() => {});
    await page.locator('#path.view.active').waitFor().catch(() => {});
    await page.locator('.mobile-nav button[data-view="progress"]').click().catch(() => {});
    await page.locator('#progress.view.active').waitFor().catch(() => {});
  }
  const result = await session.send('Profiler.takePreciseCoverage');
  await session.send('Profiler.stopPreciseCoverage');
  await session.detach();
  await context.close();
  return { route, scripts: result.result.filter(item => item.url && item.url.startsWith(BASE)) };
}

function summarize(sessions) {
  const byUrl = new Map();
  for (const session of sessions) {
    for (const script of session.scripts) {
      const previous = byUrl.get(script.url) || { url: script.url, functions: [] };
      previous.functions.push(...script.functions);
      byUrl.set(script.url, previous);
    }
  }
  let ranges = 0;
  let coveredRanges = 0;
  for (const script of byUrl.values()) {
    for (const fn of script.functions) {
      for (const range of fn.ranges) {
        ranges += 1;
        if (range.count > 0) coveredRanges += 1;
      }
    }
  }
  return {
    generatedAt: new Date().toISOString(),
    routeCount: sessions.length,
    scriptCount: byUrl.size,
    rangeCount: ranges,
    coveredRangeCount: coveredRanges,
    rangeCoveragePercent: ranges ? Number((coveredRanges / ranges * 100).toFixed(2)) : 0,
    routes: sessions.map(session => session.route),
    scripts: [...byUrl.values()].map(script => script.url.replace(BASE, ''))
  };
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const server = await startServer();
  let browser;
  try {
    browser = await chromium.launch({
      ...(SYSTEM_CHROMIUM ? { executablePath: SYSTEM_CHROMIUM } : {}),
      headless: true
    });
    const routes = [
      '/',
      '/commencer/',
      '/launch/',
      '/about/',
      '/academy.html#access',
      '/academy.html#dashboard',
      '/academy.html#markets',
      '/academy.html#intelligence'
    ];
    const sessions = [];
    for (const route of routes) {
      sessions.push(await collectRoute(browser, route, { learner: route.includes('academy.html#') && !route.includes('#access') }));
    }
    const raw = { type: 'v8-precise-coverage', base: BASE, sessions };
    const summary = summarize(sessions);
    fs.writeFileSync(path.join(OUT, 'academy-v8.json'), JSON.stringify(raw, null, 2));
    fs.writeFileSync(path.join(OUT, 'academy-summary.json'), JSON.stringify(summary, null, 2));
    console.log(`Academy V8 coverage: ${summary.rangeCoveragePercent}% of ${summary.rangeCount} runtime ranges across ${summary.scriptCount} scripts and ${summary.routeCount} routes`);
    console.log(`Reports: ${path.join(OUT, 'academy-v8.json')} and ${path.join(OUT, 'academy-summary.json')}`);
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error.stack || error); process.exitCode = 1; });
