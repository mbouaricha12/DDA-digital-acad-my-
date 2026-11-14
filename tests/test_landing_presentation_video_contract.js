'use strict';
/*
 * Landing presentation video — integration harness contract (CDCP-OS
 * addendum, issue #240; docs/DDA_LANDING_VIDEO_SCRIPT_STORYBOARD_2026-11-13.md).
 *
 * The harness (dist/public.js) is prepared but deliberately unconfigured:
 * LANDING_PRESENTATION_VIDEO.url is empty until a real, validated video is
 * provided. This locks in that the current, shipped state is fully honest —
 * the section stays hidden, nothing is fetched from YouTube, and the public
 * bundle never half-renders a broken or fabricated video block.
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
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webmanifest': 'application/manifest+json', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml' };
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

  await test('with no video configured, #landing-presentation-video stays hidden and empty — no placeholder, no broken block', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(`${BASE}/index.html`);
    await page.waitForSelector('#landing-title');
    const section = page.locator('#landing-presentation-video');
    assert.equal(await section.isVisible(), false, 'the section must stay hidden until a real video id is configured');
    assert.equal((await section.innerHTML()).trim(), '', 'the section must stay empty — never a placeholder that looks like a missing/broken video');
    await context.close();
  });

  await test('with no video configured, no request to YouTube (i.ytimg.com / youtube-nocookie.com) is ever made', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const youtubeRequests = [];
    page.on('request', request => { if (/ytimg\.com|youtube-nocookie\.com|youtube\.com/.test(request.url())) youtubeRequests.push(request.url()); });
    await page.goto(`${BASE}/index.html`);
    await page.waitForSelector('#landing-title');
    await page.waitForTimeout(500);
    assert.deepEqual(youtubeRequests, [], 'no YouTube request must ever fire while the harness is unconfigured');
    await context.close();
  });

  await test('the CSP already allows the YouTube thumbnail/frame hosts the harness needs once configured (no redeploy surprise)', async () => {
    const html = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');
    const csp = html.match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)">/)?.[1] || '';
    assert.match(csp, /img-src[^;]*https:\/\/i\.ytimg\.com/, 'img-src must already allow i.ytimg.com for the thumbnail');
    assert.match(csp, /frame-src https:\/\/www\.youtube-nocookie\.com/, 'frame-src must already allow youtube-nocookie.com for the click-to-play iframe');
  });

  await test('the harness reuses the exact same no-autoplay, click-to-load pattern as lesson videos (video-lite-play / video-lite-frame classes)', async () => {
    const publicJs = fs.readFileSync(path.join(DIST, 'public.js'), 'utf8');
    assert.match(publicJs, /video-lite-frame/, 'must reuse the existing .video-lite-frame CSS, not invent new styling');
    assert.match(publicJs, /video-lite-play/, 'must reuse the existing .video-lite-play click target');
    assert.doesNotMatch(publicJs, /youtube-nocookie\.com\/embed\/[^"'`]*autoplay/i, 'the embed URL itself must never carry an autoplay parameter');
  });

  await browser.close();
  await new Promise(resolve => server.close(resolve));

  console.log(`\n${passed} passed, ${failures.length} failed`);
  if (failures.length) { failures.forEach(f => console.log(`FAIL: ${f.name}\n${f.error.stack}`)); process.exit(1); }
  console.log('RESULT: landing presentation video integration harness contract passed');
})();
