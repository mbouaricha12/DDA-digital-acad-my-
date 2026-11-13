#!/usr/bin/env node
'use strict';

/**
 * DDA post-merge performance smoke test.
 *
 * Usage:
 *   node scripts/verify-performance.js
 *   node scripts/verify-performance.js --base-url https://dariusdigitalacademy.com
 *   node scripts/verify-performance.js --base-url http://127.0.0.1:8898 --json /tmp/dda-perf.json
 *   node scripts/verify-performance.js --require-pr 248
 *
 * Requirements:
 *   npm install --save-dev playwright
 *   npx playwright install chromium
 *
 * The script never grants Premium/admin access. The learner routes use only the
 * existing Free onboarding state to make the shell measurable without bypassing
 * server permissions.
 */

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { chromium } = require('playwright');

const DEFAULT_BASE_URL = 'https://dariusdigitalacademy.com';
const DEFAULT_JSON = path.resolve(process.cwd(), 'performance-report.json');
const MOBILE = { name: 'mobile', width: 390, height: 844, deviceScaleFactor: 1 };
const DESKTOP = { name: 'desktop', width: 1440, height: 900, deviceScaleFactor: 1 };
const FREE_STATE = JSON.stringify({
  schemaVersion: 4,
  user: {
    id: 'local-performance-audit',
    name: 'Apprenant Performance',
    email: 'performance-audit@example.invalid',
    mode: 'device-demo',
  },
  membership: { plan: 'free', status: 'demo' },
  onboarding: {
    level: 'Débutant',
    goal: 'Comprendre les marchés',
    time: '10 minutes par jour',
    complete: true,
  },
  lessons: {},
});

const ROUTES = [
  { name: 'landing', path: '/index.html#landing', public: true },
  { name: 'commencer', path: '/commencer/', public: true },
  { name: 'academy-access', path: '/academy.html#access' },
  { name: 'academy-dashboard', path: '/academy.html#dashboard', seeded: true },
  { name: 'academy-journal', path: '/academy.html#journal', seeded: true },
  { name: 'academy-markets', path: '/academy.html#markets', seeded: true },
];

const LIMITS = {
  cls: 0.1,
  fcpMobile: 1800,
  lcpMobile: 2500,
  fcpDesktop: 1000,
  lcpDesktop: 1600,
  transferBytes: 1_500_000,
  maxConsoleErrors: 0,
  maxFailedRequests: 0,
};

function parseArgs(argv) {
  const args = {
    baseUrl: process.env.DDA_BASE_URL || DEFAULT_BASE_URL,
    jsonPath: process.env.DDA_PERF_JSON || DEFAULT_JSON,
    requirePr: process.env.DDA_REQUIRE_PR || '',
    timeout: Number(process.env.DDA_PERF_TIMEOUT || 30000),
    headed: false,
  };
  for (let i = 2; i < argv.length; i += 1) {
    const value = argv[i + 1];
    if (argv[i] === '--base-url') args.baseUrl = value;
    else if (argv[i] === '--json') args.jsonPath = path.resolve(value);
    else if (argv[i] === '--require-pr') args.requirePr = value;
    else if (argv[i] === '--timeout') args.timeout = Number(value);
    else if (argv[i] === '--headed') args.headed = true;
    else if (argv[i] === '--help' || argv[i] === '-h') {
      console.log('Usage: node scripts/verify-performance.js [--base-url URL] [--require-pr NUMBER] [--json FILE] [--timeout MS] [--headed]');
      process.exit(0);
    }
  }
  if (!Number.isFinite(args.timeout) || args.timeout < 1000) throw new Error('--timeout must be at least 1000 ms');
  return args;
}

function assertPrMerged(number) {
  const raw = execFileSync('gh', ['pr', 'view', String(number), '--json', 'state,mergedAt,headRefOid,url'], { encoding: 'utf8' });
  const clean = raw.replace(/[\u001B\u009B][[\]()#;?]*(?:(?:(?:[a-zA-Z\d]*(?:;[-a-zA-Z\d/#&.:=?%@~_]+)*)?\u0007)|(?:(?:\d{1,4}(?:;\d{0,4})*)?[\dA-PR-TZcf-nq-uy=><~]))/g, '');
  const pr = JSON.parse(clean);
  if (pr.state !== 'MERGED' || !pr.mergedAt) {
    throw new Error(`PR #${number} is not merged: state=${pr.state}, mergedAt=${pr.mergedAt || 'null'}`);
  }
  console.log(`PR #${number} merged at ${pr.mergedAt} (${pr.headRefOid})`);
  return pr;
}

function round(value) {
  return Number.isFinite(value) ? Math.round(value * 100) / 100 : null;
}

function evaluateResult(result, viewport) {
  const failures = [];
  const fcpLimit = viewport.name === 'mobile' ? LIMITS.fcpMobile : LIMITS.fcpDesktop;
  const lcpLimit = viewport.name === 'mobile' ? LIMITS.lcpMobile : LIMITS.lcpDesktop;
  if (result.cls > LIMITS.cls) failures.push(`CLS ${result.cls} > ${LIMITS.cls}`);
  if (result.fcp !== null && result.fcp > fcpLimit) failures.push(`FCP ${result.fcp}ms > ${fcpLimit}ms`);
  if (result.lcp !== null && result.lcp > lcpLimit) failures.push(`LCP ${result.lcp}ms > ${lcpLimit}ms`);
  if (result.transferBytes > LIMITS.transferBytes) failures.push(`transfer ${result.transferBytes}B > ${LIMITS.transferBytes}B`);
  if (result.consoleErrors.length > LIMITS.maxConsoleErrors) failures.push(`${result.consoleErrors.length} console error(s)`);
  if (result.failedRequests.length > LIMITS.maxFailedRequests) failures.push(`${result.failedRequests.length} failed request(s)`);
  if (result.overflow) failures.push('horizontal overflow detected');
  return failures;
}

async function measure(page, url, route, viewport, timeout) {
  const consoleErrors = [];
  const failedRequests = [];
  await page.addInitScript(({ seeded, freeState }) => {
    window.__ddaLayoutShifts = [];
    window.__ddaFcp = null;
    window.__ddaLcp = null;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) window.__ddaLayoutShifts.push(entry.value);
      }
    }).observe({ type: 'layout-shift', buffered: true });
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) window.__ddaFcp = entry.startTime;
    }).observe({ type: 'paint', buffered: true });
    try {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) window.__ddaLcp = entry.startTime;
      }).observe({ type: 'largest-contentful-paint', buffered: true });
    } catch (_) {
      // LCP is optional in some Chromium/headless configurations.
    }
    if (seeded) localStorage.setItem('dda-prototype-state-v4', freeState);
  }, { seeded: Boolean(route.seeded), freeState: FREE_STATE });
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(`PAGEERROR ${error.message}`));
  page.on('requestfailed', (request) => {
    failedRequests.push(`${request.url()} — ${request.failure()?.errorText || 'unknown'}`);
  });

  const startedAt = Date.now();
  await page.goto(url, { waitUntil: 'load', timeout });
  await page.waitForTimeout(1200);
  const measured = await page.evaluate(() => {
    const navigation = performance.getEntriesByType('navigation')[0];
    const resources = performance.getEntriesByType('resource');
    const footer = document.querySelector('.academy-footer')?.getBoundingClientRect();
    return {
      finalUrl: location.href,
      activeViews: [...document.querySelectorAll('.view.active')].map((node) => node.id),
      domContentLoaded: navigation?.domContentLoadedEventEnd ?? null,
      load: navigation?.loadEventEnd ?? null,
      fcp: window.__ddaFcp,
      lcp: window.__ddaLcp,
      cls: window.__ddaLayoutShifts.reduce((sum, value) => sum + value, 0),
      shiftCount: window.__ddaLayoutShifts.length,
      resourceCount: resources.length,
      transferBytes: resources.reduce((sum, resource) => sum + (resource.transferSize || 0), 0),
      encodedBytes: resources.reduce((sum, resource) => sum + (resource.encodedBodySize || 0), 0),
      longTasks: performance.getEntriesByType('longtask').length,
      bodyHeight: document.body.scrollHeight,
      overflow: document.documentElement.scrollWidth > innerWidth,
      footer: footer ? { x: footer.x, y: footer.y, width: footer.width, height: footer.height } : null,
    };
  });
  return {
    ...measured,
    route: route.name,
    viewport: viewport.name,
    elapsed: Date.now() - startedAt,
    consoleErrors,
    failedRequests,
  };
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.requirePr) assertPrMerged(args.requirePr);
  const baseUrl = args.baseUrl.replace(/\/+$/, '');
  const browser = await chromium.launch({ headless: !args.headed });
  const results = [];
  try {
    for (const viewport of [MOBILE, DESKTOP]) {
      for (const route of ROUTES) {
        const page = await browser.newPage({ viewport, deviceScaleFactor: viewport.deviceScaleFactor });
        const url = `${baseUrl}${route.path}`;
        try {
          const result = await measure(page, url, route, viewport, args.timeout);
          result.failures = evaluateResult(result, viewport);
          results.push(result);
          const status = result.failures.length ? 'FAIL' : 'PASS';
          console.log(`${status} ${viewport.name.padEnd(7)} ${route.name.padEnd(18)} CLS=${round(result.cls)} FCP=${round(result.fcp)}ms transfer=${Math.round(result.transferBytes / 1024)}KB${result.failures.length ? ` :: ${result.failures.join('; ')}` : ''}`);
        } catch (error) {
          const result = { route: route.name, viewport: viewport.name, url, failures: [error.message], consoleErrors: [], failedRequests: [] };
          results.push(result);
          console.log(`FAIL ${viewport.name.padEnd(7)} ${route.name.padEnd(18)} :: ${error.message}`);
        } finally {
          await page.close();
        }
      }
    }
  } finally {
    await browser.close();
  }

  const report = {
    generatedAt: new Date().toISOString(),
    baseUrl,
    commit: process.env.GITHUB_SHA || null,
    pr: args.requirePr || null,
    limits: LIMITS,
    results,
    passed: results.every((result) => result.failures?.length === 0),
  };
  fs.mkdirSync(path.dirname(args.jsonPath), { recursive: true });
  fs.writeFileSync(args.jsonPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`JSON report: ${args.jsonPath}`);
  if (!report.passed) process.exitCode = 1;
}

main().catch((error) => {
  console.error(`Performance audit aborted: ${error.stack || error.message}`);
  process.exitCode = 1;
});
