'use strict';
/*
 * Landing presentation video — integration contract (CDCP-OS addendum,
 * issue #240; founder-provided deliverable, 2026-11-14).
 *
 * The harness is no longer unconfigured: a real, founder-approved 60s
 * institutional video (self-hosted, subtitles burned into the picture,
 * no voiceover) now ships in dist/videos/ with its poster in
 * dist/images/photos/. This locks in the honest, accessible shape of that
 * integration — real files on disk, no autoplay, nothing fetched before
 * a real click, no third-party request — rather than the previous
 * "stays hidden until configured" state.
 *
 * Run with: node tests/test_landing_presentation_video_contract.js
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');

try { require.resolve('playwright'); }
catch { module.paths.push(execSync('npm root -g').toString().trim()); }
const { chromium } = require('playwright');
const http = require('node:http');

const DIST = path.join(__dirname, '..', 'dist');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webmanifest': 'application/manifest+json', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.mp4': 'video/mp4' };
const PORT = 8847;

function startServer() {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    let file = path.join(DIST, decodeURIComponent(url.pathname));
    if (url.pathname === '/') file = path.join(DIST, 'index.html');
    fs.readFile(file, (err, data) => {
      if (err) { res.writeHead(404); res.end(); return; }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
      res.end(data);
    });
  });
  return new Promise(resolve => server.listen(PORT, () => resolve(server)));
}

let passed = 0;
const failures = [];
async function test(name, fn) {
  try { await fn(); passed++; console.log(`  ok — ${name}`); }
  catch (error) { failures.push({ name, error }); console.log(`  FAIL — ${name}`); }
}

(async () => {
  const server = await startServer();
  const browser = await chromium.launch();
  const BASE = `http://127.0.0.1:${PORT}`;

  await test('the real video and poster files actually exist in dist/ (never a reference to a missing asset)', async () => {
    assert.ok(fs.existsSync(path.join(DIST, 'videos', 'landing-presentation-60s.mp4')), 'dist/videos/landing-presentation-60s.mp4 must exist');
    assert.ok(fs.existsSync(path.join(DIST, 'images', 'photos', 'landing-presentation-poster.webp')), 'dist/images/photos/landing-presentation-poster.webp must exist');
    const stat = fs.statSync(path.join(DIST, 'videos', 'landing-presentation-60s.mp4'));
    assert.ok(stat.size > 100000, 'the video file must be a real, non-trivial video, not a stub/placeholder');
  });

  await test('#landing-presentation-video renders a real, visible <video> element with the real local sources', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(`${BASE}/index.html`);
    await page.waitForSelector('#landing-title');
    const section = page.locator('#landing-presentation-video');
    assert.equal(await section.isVisible(), true, 'the section must be visible now that a real video is configured');
    const video = section.locator('video');
    await assert.doesNotReject(video.waitFor({ state: 'attached', timeout: 2000 }));
    assert.equal(await video.getAttribute('poster'), 'images/photos/landing-presentation-poster.webp');
    const source = video.locator('source');
    assert.equal(await source.getAttribute('src'), 'videos/landing-presentation-60s.mp4');
    assert.equal(await source.getAttribute('type'), 'video/mp4');
    await context.close();
  });

  await test('the video never autoplays and exposes native controls, playsinline and a real accessible label', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(`${BASE}/index.html`);
    await page.waitForSelector('#landing-title');
    const video = page.locator('#landing-presentation-video video');
    assert.equal(await video.getAttribute('autoplay'), null, 'the video must never carry autoplay');
    assert.notEqual(await video.getAttribute('controls'), null, 'native controls must be present so the learner decides when to play');
    assert.notEqual(await video.getAttribute('playsinline'), null, 'playsinline must be present for mobile Safari');
    const label = await video.getAttribute('aria-label');
    assert.ok(label && label.trim().length > 5, 'the video must carry a real, non-empty accessible label');
    await context.close();
  });

  await test('preload="none" is honoured: the browser never downloads the real video bytes before a real play click', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const videoByteRequests = [];
    page.on('request', request => { if (/landing-presentation-60s\.mp4/.test(request.url())) videoByteRequests.push(request.url()); });
    await page.goto(`${BASE}/index.html`);
    await page.waitForSelector('#landing-title');
    await page.waitForTimeout(500);
    assert.deepEqual(videoByteRequests, [], 'the video file must not be fetched at all before the learner clicks play — preload="none" must be real, not cosmetic');
    assert.equal(await page.locator('#landing-presentation-video video').getAttribute('preload'), 'none');
    await context.close();
  });

  await test('the video is same-origin, so the existing CSP needs no third-party media/frame allowance for it', async () => {
    const html = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');
    const csp = html.match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)">/)?.[1] || '';
    assert.match(csp, /default-src 'self'/, 'default-src must stay self — same-origin media needs no extra directive');
  });

  await browser.close();
  await new Promise(resolve => server.close(resolve));

  console.log(`\n${passed} passed, ${failures.length} failed`);
  if (failures.length) { failures.forEach(f => console.log(`FAIL: ${f.name}\n${f.error.stack}`)); process.exit(1); }
  console.log('RESULT: landing presentation video integration contract passed');
})();
