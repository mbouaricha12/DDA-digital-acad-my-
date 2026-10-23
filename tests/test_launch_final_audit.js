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

function safeDistPath(requestTarget) {
  let requestPath;
  try { requestPath = decodeURIComponent(requestTarget.split('?')[0].split('#')[0]); } catch { return null; }
  if (requestPath.includes('\0')) return null;
  const root = path.resolve(DIST);
  const relative = requestPath === '/' ? 'index.html' : requestPath.replace(/^\/+/, '');
  const target = path.resolve(root, relative);
  return target === root || target.startsWith(`${root}${path.sep}`) ? target : null;
}

function startServer() {
  const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' };
  const server = http.createServer((req, res) => {
    const file = safeDistPath(req.url);
    if (!file) { res.writeHead(404, { 'X-Content-Type-Options': 'nosniff' }); return res.end('not found'); }
    fs.readFile(file, (error, data) => {
      if (error) { res.writeHead(404, { 'X-Content-Type-Options': 'nosniff' }); return res.end('not found'); }
      res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-store' });
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
    const traversalResponse = await new Promise((resolve, reject) => {
      const request = http.request({ hostname: '127.0.0.1', port: PORT, path: '/%2e%2e/bff/.env.example' }, res => {
        let body = '';
        res.setEncoding('utf8');
        res.on('data', chunk => { body += chunk; });
        res.on('end', () => resolve({ status: res.statusCode, body }));
      });
      request.on('error', reject);
      request.end();
    });
    assert.equal(traversalResponse.status, 404);
    assert.equal(traversalResponse.body.includes('SUPABASE_SERVICE_ROLE_KEY'), false);

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

    await page.goto(`${ACADEMY}#intelligence`);
    assert.equal(await page.locator('.autotrader-signal-preview').isVisible(), true, 'the AutoTrader preview is visible');
    assert.match(await page.locator('.autotrader-signal-preview').innerText(), /Aucun signal calculé/);
    assert.match(await page.locator('#autotrader-access-status').innerText(), /service serveur n’est pas configuré/);
    assert.equal(await page.locator('#autotrader-server-detail').isVisible(), false, 'local Premium state never unlocks AutoTrader');

    await context.addInitScript(() => { window.DDA_BFF_BASE_URL = `${location.origin}/mock-bff`; });
    let serverEntitlements = ['premium_track'];
    await page.route('**/mock-bff/v1/me', route => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ user_id: 'server-audit-user', email: 'audit@example.com', email_verified: true, display_name: 'Audit', status: 'active', entitlements: serverEntitlements })
    }));
    let receivedSeries = null;
    await page.route('**/mock-bff/v1/security/csrf', route => route.fulfill({ status: 204 }));
    await page.route('**/mock-bff/v1/autotrader/analyze', async route => {
      const requestBody = route.request().postDataJSON();
      receivedSeries = requestBody.series;
      const metric = (value, unit) => ({ value, unit, status: 'computed' });
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          contract_version: 'dda.autotrader.analysis-response.v1',
          analyzed_at: '2026-10-18T19:00:00.000Z',
          analysis: {
            status: 'analysis_complete', interpretation: 'descriptive_only', data_mode: 'historical',
            source: requestBody.series.source, instrument: requestBody.series.instrument,
            timeframe: requestBody.series.timeframe, data_as_of: requestBody.series.bars.at(-1).timestamp,
            execution_enabled: false, order_recommendation: null,
            metrics: {
              last_close: metric(125, 'USD'), latest_period_return: metric(0.01, 'fraction'),
              sma_20: metric(120, 'USD'), close_vs_sma_20: metric(0.04, 'fraction'),
              observed_range_over_last_close: metric(0.12, 'fraction')
            },
            context: { close_relative_to_sma_20: 'above_sma_20' }
          }
        })
      });
    });
    await page.goto(`${ACADEMY}?mock-bff=1#intelligence`);
    assert.equal(await page.evaluate(() => window.DDABFF.baseUrl), `${BASE}/mock-bff`, 'BFF mock is configured before client initialization');
    await page.waitForFunction(() => document.querySelector('#autotrader-entitlement-status')?.textContent === 'Absent du compte serveur');
    assert.equal(await page.locator('#autotrader-server-detail').isVisible(), false, 'generic Premium entitlement does not unlock AutoTrader');
    assert.equal(await page.locator('#autotrader-history-form').isVisible(), false, 'generic Premium cannot reveal the historical import form');

    serverEntitlements = ['premium_track', 'autotrader.analysis'];
    await page.goto(`${ACADEMY}?mock-bff=2#intelligence`);
    await page.waitForFunction(() => document.querySelector('#autotrader-entitlement-status')?.textContent === 'Confirmé par le serveur');
    assert.equal(await page.locator('#autotrader-server-detail').isVisible(), true, 'server-specific analysis entitlement reveals only the non-live detail');
    assert.equal(await page.locator('#autotrader-history-form').isVisible(), true, 'historical import form is revealed only after server entitlement confirmation');
    const rows = ['timestamp,open,high,low,close,volume'];
    for (let i = 0; i < 20; i += 1) {
      const close = 100 + i;
      rows.push(`${new Date(Date.parse('2026-09-20T00:00:00.000Z') + i * 86_400_000).toISOString()},${close - 0.5},${close + 1},${close - 1},${close},${1000 + i}`);
    }
    await page.locator('#autotrader-history-file').setInputFiles({ name: 'historique.csv', mimeType: 'text/csv', buffer: Buffer.from(rows.join('\n')) });
    for (const [id, value] of [['autotrader-symbol', 'TEST'], ['autotrader-venue', 'IMPORT'], ['autotrader-asset-class', 'equity'], ['autotrader-currency', 'USD']]) await page.fill(`#${id}`, value);
    await page.locator('#autotrader-timeframe').selectOption('1d');
    await page.locator('#autotrader-history-attestation').check();
    await page.click('#autotrader-history-submit');
    await page.waitForFunction(() => document.querySelector('#autotrader-history-status')?.textContent.includes('Analyse descriptive terminée'));
    assert.equal(receivedSeries?.data_mode, 'historical');
    assert.equal(receivedSeries?.source?.kind, 'historical_import');
    assert.equal(receivedSeries?.bars?.length, 20);
    assert.match(await page.locator('#autotrader-result-last-close').innerText(), /125\s*USD/);
    assert.match(await page.locator('#autotrader-history-context').innerText(), /au-dessus de la SMA 20/);
    assert.match(await page.locator('#autotrader-history-status').innerText(), /Aucun signal/);
    await page.goto(`${ACADEMY}#membership`);
    assert.match(await page.locator('#membership .autotrader-membership-note').innerText(), /AutoTrader Premium — non commercialisé/);
    console.log('RESULT: launch final audit passed — responsive views, P2 flow, server entitlement boundary, historical descriptive import, no-signal honesty and video honesty');
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error.stack || error); process.exitCode = 1; });
