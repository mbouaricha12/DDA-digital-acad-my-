'use strict';
/*
 * One-off script (not part of the regression harness) producing the visual
 * evidence requested for the Acquisition V1 deliverable: #landing at mobile
 * 360/390 and desktop 1440, plus an overflow check at each width, matching
 * the project's own established verification method.
 */
const http = require('http');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
try { require.resolve('playwright'); } catch { module.paths.push(execSync('npm root -g').toString().trim()); }
const { chromium } = require('playwright');

const DIST = path.join(__dirname, '..', 'dist');
const OUT = process.argv[2] || path.join(__dirname, '..', '..', 'screenshots');
const PORT = 8745;
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };

function startServer() {
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
  return new Promise(resolve => server.listen(PORT, () => resolve(server)));
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const server = await startServer();
  const browser = await chromium.launch();
  const viewports = [
    { name: 'mobile-360', width: 360, height: 780 },
    { name: 'mobile-390', width: 390, height: 844 },
    { name: 'desktop-1440', width: 1440, height: 900 }
  ];

  for (const vp of viewports) {
    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const page = await context.newPage();
    await page.goto(`http://localhost:${PORT}/#landing`);
    await page.waitForTimeout(200);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    console.log(`${vp.name}: horizontal overflow = ${overflow}px`);
    await page.screenshot({ path: path.join(OUT, `landing-${vp.name}.png`), fullPage: true });
    await context.close();
  }

  // Also capture the extended Broker Hub (Deriv/HFM/XM/Weltrade) at desktop width,
  // signed in, since it's the other visible surface this tranche changed.
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  await page.goto(`http://localhost:${PORT}/#access`);
  await page.fill('#first-name', 'Ada');
  await page.fill('#email', 'ada@example.com');
  await page.check('#consent');
  await page.click('#signup-form button[type=submit]');
  await page.selectOption('#level', 'Débutant');
  await page.selectOption('#goal', 'Comprendre les marchés');
  await page.selectOption('#time', '10 minutes par jour');
  await page.click('#onboarding-form button[type=submit]');
  await page.waitForSelector('.view.active#lesson');
  await page.click('.nav-item[data-view="brokers"]');
  await page.waitForTimeout(200);
  await page.screenshot({ path: path.join(OUT, 'broker-hub-desktop-1440.png'), fullPage: true });
  await context.close();

  await browser.close();
  await new Promise(resolve => server.close(resolve));
  console.log(`Screenshots written to ${OUT}`);
})();
