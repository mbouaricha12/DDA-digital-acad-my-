#!/usr/bin/env node
'use strict';
/*
 * DDA — smoke test production (préparation uniquement, lecture/preuve, pas de
 * déploiement). Ce script N'A PAS été exécuté contre la production par Claude :
 * l'accès réseau sortant de cette session est bloqué par la politique de
 * l'environnement d'exécution (confirmé via check_production_availability.sh,
 * 403 côté proxy egress). Il doit être lancé par un humain, depuis un poste
 * ou un environnement CI avec accès réseau réel.
 *
 * Objet : vérifier, avec deux VRAIS comptes de test distincts, que la
 * production se comporte comme les tests automatisés locaux le prouvent déjà
 * en environnement mocké (tests/run.js) — sans jamais committer ni afficher
 * de cotation ou de résultat fabriqué.
 *
 * Ce script ne crée aucun compte : il se connecte avec des comptes déjà créés
 * par un humain (voir docs/DDA_PRODUCTION_SMOKE_TEST.md pour les prérequis).
 * Il n'écrit aucune donnée sensible en clair dans ses rapports (jamais de
 * mot de passe, jamais de token de session).
 *
 * Usage :
 *   DDA_SMOKE_TEST_CONFIRM=I_UNDERSTAND_THIS_HITS_PRODUCTION \
 *   DDA_SITE_URL=https://dariusdigitalacademy.com \
 *   DDA_TEST_ACCOUNT_A_EMAIL=... DDA_TEST_ACCOUNT_A_PASSWORD=... \
 *   DDA_TEST_ACCOUNT_B_EMAIL=... DDA_TEST_ACCOUNT_B_PASSWORD=... \
 *   [DDA_TEST_ACCOUNT_PREMIUM_EMAIL=... DDA_TEST_ACCOUNT_PREMIUM_PASSWORD=...] \
 *   [DDA_TEST_ACCOUNT_ADMIN_EMAIL=... DDA_TEST_ACCOUNT_ADMIN_PASSWORD=...] \
 *   node scripts/smoke_test_production.js
 *
 * Variables optionnelles (PREMIUM, ADMIN) : si absentes, les contrôles
 * correspondants sont annoncés SKIPPED plutôt que simulés ou supposés PASS.
 */

const path = require('node:path');
const fs = require('node:fs');
const { execSync } = require('node:child_process');

try { require.resolve('playwright'); }
catch { module.paths.push(execSync('npm root -g').toString().trim()); }
const { chromium } = require('playwright');

const SITE_URL = (process.env.DDA_SITE_URL || 'https://dariusdigitalacademy.com').replace(/\/+$/, '');
const BFF_URL = (process.env.DDA_BFF_URL || 'https://api.dariusdigitalacademy.com').replace(/\/+$/, '');

function requireEnv(name) {
  const value = process.env[name];
  if (!value) { console.error(`Refusing to run: ${name} is not set.`); process.exit(2); }
  return value;
}

if (process.env.DDA_SMOKE_TEST_CONFIRM !== 'I_UNDERSTAND_THIS_HITS_PRODUCTION') {
  console.error('Refusing to run: set DDA_SMOKE_TEST_CONFIRM=I_UNDERSTAND_THIS_HITS_PRODUCTION to confirm you intend to exercise a live environment (production or staging) with real accounts.');
  process.exit(2);
}
const accountA = { email: requireEnv('DDA_TEST_ACCOUNT_A_EMAIL'), password: requireEnv('DDA_TEST_ACCOUNT_A_PASSWORD') };
const accountB = { email: requireEnv('DDA_TEST_ACCOUNT_B_EMAIL'), password: requireEnv('DDA_TEST_ACCOUNT_B_PASSWORD') };
const accountPremium = process.env.DDA_TEST_ACCOUNT_PREMIUM_EMAIL
  ? { email: process.env.DDA_TEST_ACCOUNT_PREMIUM_EMAIL, password: requireEnv('DDA_TEST_ACCOUNT_PREMIUM_PASSWORD') }
  : null;
const accountAdmin = process.env.DDA_TEST_ACCOUNT_ADMIN_EMAIL
  ? { email: process.env.DDA_TEST_ACCOUNT_ADMIN_EMAIL, password: requireEnv('DDA_TEST_ACCOUNT_ADMIN_PASSWORD') }
  : null;

const results = [];
function record(name, status, detail = '') {
  results.push({ name, status, detail });
  const marker = status === 'PASS' ? 'PASS' : status === 'SKIPPED' ? 'SKIP' : 'FAIL';
  console.log(`${marker} — ${name}${detail ? ` (${detail})` : ''}`);
}

async function loginAs(page, account) {
  await page.goto(`${SITE_URL}/academy.html#access`);
  await page.click('#bff-mode-login');
  await page.fill('#email', account.email);
  await page.fill('#access-password', account.password);
  await page.click('#signup-form button[type=submit]');
  await page.waitForSelector('#onboarding-form:not([hidden]), .view.active#dashboard, .view.active#lesson', { timeout: 15000 });
}

async function meStatus(page) {
  return page.evaluate(async base => {
    try { const res = await fetch(`${base}/v1/me`, { credentials: 'include' }); return { status: res.status, body: res.ok ? await res.json() : null }; }
    catch (error) { return { status: 0, error: String(error) }; }
  }, BFF_URL);
}

(async () => {
  const browser = await chromium.launch();
  try {
    // 1. Availability (never assumed — the BFF/site must actually answer).
    try {
      const probe = await (await chromium.launch()).newContext();
      const page0 = await probe.newPage();
      const resp = await page0.goto(`${SITE_URL}/academy.html`, { timeout: 15000 });
      record('site is reachable and returns 200', resp && resp.status() === 200 ? 'PASS' : 'FAIL', resp ? `HTTP ${resp.status()}` : 'no response');
      await probe.close();
    } catch (error) { record('site is reachable and returns 200', 'FAIL', String(error)); }

    // 2. Account A logs in and sees its own real identity — never a stale/fabricated one.
    const contextA = await browser.newContext();
    const pageA = await contextA.newPage();
    try {
      await loginAs(pageA, accountA);
      const me = await meStatus(pageA);
      const ok = me.status === 200 && me.body && typeof me.body.email === 'string' && me.body.email.toLowerCase() === accountA.email.toLowerCase();
      record('account A logs in and /v1/me returns account A\'s own real identity', ok ? 'PASS' : 'FAIL', `status=${me.status} email_match=${ok}`);
    } catch (error) { record('account A logs in and /v1/me returns account A\'s own real identity', 'FAIL', String(error)); }

    // 3. Admin route is denied for a non-admin account (fail-closed, server-derived role).
    try {
      const adminCheck = await pageA.evaluate(async base => {
        try { const res = await fetch(`${base}/v1/admin/overview`, { credentials: 'include' }); return res.status; }
        catch { return 0; }
      }, BFF_URL);
      record('a non-admin account is denied /v1/admin/overview (expects 403, never 200)', adminCheck === 403 ? 'PASS' : 'FAIL', `status=${adminCheck}`);
    } catch (error) { record('a non-admin account is denied /v1/admin/overview', 'FAIL', String(error)); }

    // 4. Free account cannot reach real Premium content (honest gate, no leak).
    try {
      await pageA.goto(`${SITE_URL}/academy.html#lesson-p22`);
      await pageA.waitForTimeout(1500);
      const html = await pageA.locator('#lesson-p22-main').innerHTML().catch(() => '');
      const leaked = /definis le risque|anatomie d.un trade/i.test(html) && !/indisponible/i.test(html);
      record('a Free account never sees the real P2.2 Premium content body', !leaked ? 'PASS' : 'FAIL', leaked ? 'possible leak — investigate before any launch claim' : 'gate held or content legitimately absent');
    } catch (error) { record('a Free account never sees the real P2.2 Premium content body', 'FAIL', String(error)); }

    await contextA.close();

    // 5. Account B logs in — must see ITS OWN identity, never account A's name/email
    //    (the exact P0 "Richard" identity-bleed class of bug fixed by PR #245).
    const contextB = await browser.newContext();
    const pageB = await contextB.newPage();
    try {
      await loginAs(pageB, accountB);
      const me = await meStatus(pageB);
      const isOwnIdentity = me.status === 200 && me.body && typeof me.body.email === 'string' && me.body.email.toLowerCase() === accountB.email.toLowerCase();
      const bodyText = await pageB.locator('body').innerText().catch(() => '');
      const leaksAEmail = bodyText.toLowerCase().includes(accountA.email.toLowerCase());
      record('account B logs in and sees its own identity, never account A\'s', isOwnIdentity && !leaksAEmail ? 'PASS' : 'FAIL', `own_identity=${isOwnIdentity} leaks_a_email=${leaksAEmail}`);
    } catch (error) { record('account B logs in and sees its own identity, never account A\'s', 'FAIL', String(error)); }
    await contextB.close();

    // 6. Premium account (optional) actually unlocks real Premium content.
    if (accountPremium) {
      const contextP = await browser.newContext();
      const pageP = await contextP.newPage();
      try {
        await loginAs(pageP, accountPremium);
        await pageP.goto(`${SITE_URL}/academy.html#lesson-p21`);
        await pageP.waitForTimeout(1500);
        const html = await pageP.locator('#lesson-p21-main').innerHTML().catch(() => '');
        record('a real Premium-entitled account unlocks the real P2.1 content', !/indisponible/i.test(html) && html.length > 200 ? 'PASS' : 'FAIL', 'inspect manually if FAIL — entitlement may be stale, not necessarily a code defect');
      } catch (error) { record('a real Premium-entitled account unlocks the real P2.1 content', 'FAIL', String(error)); }
      await contextP.close();
    } else {
      record('a real Premium-entitled account unlocks the real P2.1 content', 'SKIPPED', 'DDA_TEST_ACCOUNT_PREMIUM_EMAIL not provided');
    }

    // 7. Admin account (optional) actually reaches the back-office; a real role is shown, not a guess.
    if (accountAdmin) {
      const contextAd = await browser.newContext();
      const pageAd = await contextAd.newPage();
      try {
        await loginAs(pageAd, accountAdmin);
        const resp = await pageAd.goto(`${SITE_URL}/admin.html`);
        await pageAd.waitForSelector('#admin-topbar-role', { timeout: 10000 });
        const role = await pageAd.textContent('#admin-topbar-role');
        record('a real admin/owner account reaches admin.html with a real server-derived role', resp && resp.status() === 200 && /owner|admin/i.test(role || '') ? 'PASS' : 'FAIL', `role=${role}`);
      } catch (error) { record('a real admin/owner account reaches admin.html with a real server-derived role', 'FAIL', String(error)); }
      await contextAd.close();
    } else {
      record('a real admin/owner account reaches admin.html with a real server-derived role', 'SKIPPED', 'DDA_TEST_ACCOUNT_ADMIN_EMAIL not provided');
    }

    // 8. BFF-unavailable honest fallback — only meaningfully testable where DDA_BFF_BASE_URL
    // can be overridden (staging), never by taking production's real BFF offline.
    record('honest local fallback when the BFF is unreachable', 'SKIPPED', 'not safely testable against a live BFF — see tests/run.js (BFF-unavailable scenarios) for the automated, continuously-run proof of this behavior');
  } finally {
    await browser.close();
  }

  const reportDir = path.join(__dirname, '..', 'reports');
  fs.mkdirSync(reportDir, { recursive: true });
  const reportPath = path.join(reportDir, `smoke-test-production-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  fs.writeFileSync(reportPath, JSON.stringify({ siteUrl: SITE_URL, bffUrl: BFF_URL, ranAt: new Date().toISOString(), results }, null, 2));
  console.log(`\nReport written to ${reportPath} (no credentials or session tokens are recorded in it).`);

  const failed = results.filter(r => r.status === 'FAIL');
  console.log(`\n${results.length - failed.length - results.filter(r => r.status === 'SKIPPED').length} passed, ${failed.length} failed, ${results.filter(r => r.status === 'SKIPPED').length} skipped.`);
  if (failed.length) process.exit(1);
})();
