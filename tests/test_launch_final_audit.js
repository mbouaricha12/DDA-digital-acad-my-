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
  const browser = await chromium.launch();
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

    const videoInventory = await page.evaluate(() => window.DDA.curriculum.modules.flatMap(module => module.lessons.map(lesson => ({ id: lesson.id, video: lesson.video || null }))));
    assert.equal(videoInventory.every(item => !item.video || !item.video.videoUrl && !item.video.embedUrl && !item.video.vimeoId), true, 'no unpublished video is presented as published');
    console.log('RESULT: launch final audit passed — widths, Free registry, six Premium doors, handoffs and video honesty');
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error.stack || error); process.exitCode = 1; });
