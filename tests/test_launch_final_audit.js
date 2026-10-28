'use strict';
const assert = require('assert/strict');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
try { require.resolve('playwright'); } catch { module.paths.push(execSync('npm root -g').toString().trim()); }
const { chromium } = require('playwright');

const DIST = path.join(__dirname, '..', 'dist');
const PORT = 8751;
const BASE = `http://127.0.0.1:${PORT}`;
const ACADEMY = `${BASE}/academy.html`;

function startServer() {
  const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' };
  const server = http.createServer((req, res) => {
    const requested = decodeURIComponent(req.url.split('?')[0].split('#')[0]);
    const file = path.join(DIST, requested === '/' ? 'index.html' : requested);
    fs.readFile(file, (error, data) => {
      if (error) { res.writeHead(404); return res.end('not found'); }
      res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream' });
      res.end(data);
    });
  });
  return new Promise(resolve => server.listen(PORT, '127.0.0.1', () => resolve(server)));
}

function state(plan = 'premium') {
  const lessonIds = ['M0.1', 'M0.2', 'M0.3', 'M1.1', 'M1.2', 'M1.3', 'P2.1', 'P2.2'];
  return {
    schemaVersion: 4,
    user: { id: 'launch-audit', name: 'Audit', email: 'audit@example.com', mode: 'device-demo' },
    membership: { plan, status: 'demo' },
    onboarding: { level: 'Débutant', goal: 'Comprendre les marchés', time: '10 minutes par jour', complete: true },
    lessons: Object.fromEntries(lessonIds.map(id => [id, { lessonViewed: true, exerciseComplete: id === 'P2.1' || id === 'P2.2', quizComplete: id === 'P2.1' || id === 'P2.2' }])),
    journal: { entries: [{ id: 'audit-entry', createdAt: new Date().toISOString(), market: 'Synthétique', context: 'Observation pédagogique', scenario: 'Scénario de test', process: 'Checklist', decision: 'Observer', outcome: 'Relecture', whatWorked: 'Cadre', toImprove: 'Répétition', note: 'Audit' }], plan: {} },
    premium: { trackId: 'P2-risk-discipline', modules: {}, labs: {}, assessments: {}, proofs: {}, reviews: {} },
    preferences: {}, events: [], acquisition: {}, updatedAt: null
  };
}

(async () => {
  const server = await startServer();
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox', '--disable-gpu'] });
  try {
    const widths = [{ width: 280, height: 653 }, { width: 375, height: 667 }, { width: 717, height: 512 }, { width: 1440, height: 900 }];
    const context = await browser.newContext({ viewport: widths[0] });
    await context.addInitScript(value => localStorage.setItem('dda-prototype-state-v4', JSON.stringify(value)), state());
    const page = await context.newPage();

    for (const viewport of widths) {
      await page.setViewportSize(viewport);
      await page.goto(`${ACADEMY}#premium-track`);
      assert.equal(await page.locator('#premium-track').isVisible(), true, `Premium Track visible at ${viewport.width}x${viewport.height}`);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `no horizontal overflow at ${viewport.width}x${viewport.height}`);
    }

    const curriculum = await page.evaluate(() => window.DDA.curriculum.modules.flatMap(module => module.lessons.map(lesson => ({ module: module.id, id: lesson.id, title: lesson.title }))));
    assert.deepEqual(curriculum.filter(item => item.module !== 'M2').map(item => item.id), ['M0.1', 'M0.2', 'M0.3', 'M1.1', 'M1.2', 'M1.3']);
    assert.deepEqual(curriculum.filter(item => item.module === 'M2').map(item => item.id), ['P2.1', 'P2.2']);

    await page.goto(`${ACADEMY}#premium-track`);
    await page.getByRole('button', { name: 'Ouvrir le Lab', exact: true }).click();
    await page.locator('#p2-direction').selectOption({ label: 'Long' });
    await page.fill('#p2-setup', 'Structure observée et contexte cohérent.');
    await page.fill('#p2-entry', 'Confirmation définie avant toute entrée.');
    await page.fill('#p2-invalidation', 'Le scénario est invalide sous cette zone précise.');
    await page.fill('#p2-risk', '50');
    await page.fill('#p2-target', 'Objectif pédagogique cohérent.');
    await page.fill('#p2-no-trade', 'Je refuse si la confirmation ou la limite disparaît.');
    await page.click('#premium-lab-form button[type="submit"]');
    assert.match(await page.locator('#premium-lab-feedback').innerText(), /measurable risk boundary|validated/i);

    await page.goto(`${ACADEMY}#premium-track`);
    await page.getByRole('button', { name: 'Ouvrir l’assessment', exact: true }).click();
    for (const [name, value] of [['p2-q1', 'wait'], ['p2-q2', 'respect'], ['p2-q3', 'c'], ['p2-q4', 'b']]) await page.locator(`input[name="${name}"][value="${value}"]`).check();
    await page.click('#premium-assessment-form button[type="submit"]');
    assert.match(await page.locator('#premium-assessment-feedback').innerText(), /validée|Validated/i);
    assert.equal(await page.locator('#premium-proof-receipt').isVisible(), true);

    await page.click('#p2-journal-bridge');
    assert.equal(await page.locator('#journal').isVisible(), true, 'Controlled Decision must hand off to Journal');
    await page.click('#journal-step-next');
    await page.click('#journal-step-next');
    await page.click('#journal-step-save');
    await page.goto(`${ACADEMY}#journal`);
    await page.click('#weekly-review-open');
    assert.equal(await page.locator('#weekly-review-panel').isVisible(), true, 'Weekly Review must open from Journal');
    for (const [id, value] of [['weekly-review-strength', 'Cadre respecté'], ['weekly-review-pattern', 'Revoir la patience'], ['weekly-review-focus', 'Observer une prochaine séquence'], ['weekly-review-next-action', 'Garder la checklist visible']]) await page.fill(`#${id}`, value);
    await page.click('#weekly-review-save');
    assert.match(await page.locator('#weekly-review-status').innerText(), /Enregistrée/);

    const videoInventory = await page.evaluate(() => window.DDA.curriculum.modules.flatMap(module => module.lessons.flatMap(lesson => (lesson.videos || (lesson.video ? [lesson.video] : [])).map(video => ({ lesson: lesson.id, video })) )));
    assert.equal(videoInventory.length, 10, 'all ten official Shorts must be present in the curriculum');
    assert.equal(videoInventory.every(item => /^[A-Za-z0-9_-]{6,20}$/.test(item.video.youtubeId) && item.video.orientation === 'portrait' && item.video.format === 'shorts'), true, 'every official Short has safe vertical metadata');
    assert.deepEqual(videoInventory.filter(item => item.lesson.startsWith('M0.')).map(item => item.video.youtubeId), ['HwlEuA39HpM', 'bUHsQnIAFuc', 'bVJ9n-Etcpc', 'pRFqhk55bL4', 'WDifN6ZKnjY'], 'Free exposes exactly five foundational Shorts');
    assert.deepEqual(videoInventory.filter(item => item.lesson.startsWith('P2.')).map(item => item.video.youtubeId), ['BTipx88k_U8', 'rVd4dF6JaZ4', 'HaP-Onie9Lc', 'yBNc_eQbiow', 'VLdAqeJCllE'], 'Premium exposes exactly five advanced Shorts');
    assert.equal(videoInventory.filter(item => item.lesson.startsWith('M1.')).length, 0, 'advanced Shorts must not leak into the Standard M1 curriculum');
    await page.goto(`${ACADEMY}#lesson`);
    const shortFrame = page.locator('iframe[data-video-frame]').first();
    assert.equal(await shortFrame.getAttribute('src'), 'https://www.youtube-nocookie.com/embed/HwlEuA39HpM?rel=0&modestbranding=1&playsinline=1', 'Shorts are normalized to the privacy-enhanced embed host');
    assert.equal(await page.locator('.video-frame-portrait').count() > 0, true, 'Shorts use the vertical responsive frame');
    await page.goto(`${ACADEMY}#lesson-p21`);
    assert.equal(await page.locator('#lesson-p21 iframe[data-video-frame]').count(), 3, 'Premium P2.1 renders its three advanced Shorts');
    assert.equal(await page.locator('#lesson-p21 iframe[data-video-frame]').first().getAttribute('src'), 'https://www.youtube-nocookie.com/embed/BTipx88k_U8?rel=0&modestbranding=1&playsinline=1');
    const freeContext = await browser.newContext({ viewport: { width: 375, height: 667 } });
    await freeContext.addInitScript(value => localStorage.setItem('dda-prototype-state-v4', JSON.stringify(value)), state('free'));
    const freePage = await freeContext.newPage();
    await freePage.goto(`${ACADEMY}#lesson-p21`);
    assert.equal(await freePage.locator('#lesson-p21 iframe[data-video-frame]').count(), 0, 'Free cannot mount Premium Shorts behind the entitlement gate');
    await freeContext.close();
    console.log('RESULT: launch final audit passed — widths, Free registry, six Premium doors, handoffs and ten official Shorts');
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error.stack || error); process.exitCode = 1; });
