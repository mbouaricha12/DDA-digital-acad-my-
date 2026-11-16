'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..', 'dist');
const port = 8751;

function waitForServer(child) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => resolve(), 500);
    child.once('error', reject);
    child.stderr?.on('data', chunk => {
      if (/address already in use/i.test(String(chunk))) reject(new Error(String(chunk)));
    });
  });
}

async function completeLocalEntry(page, width) {
  await page.goto(`http://127.0.0.1:${port}/academy.html#access`);
  await page.waitForSelector('#access.view.active');
  await page.fill('#first-name', 'Test');
  await page.fill('#email', `mobile-${width}-${Date.now()}@example.com`);
  await page.check('#consent');
  await page.locator('#signup-form button[type="submit"]').click();
  await page.waitForSelector('#onboarding-form:not([hidden])');
  await page.evaluate(() => {
    for (const [id, value] of [
      ['level', 'Débutant'],
      ['goal', 'Comprendre les marchés'],
      ['time', '10 minutes par jour']
    ]) {
      const field = document.getElementById(id);
      field.value = value;
      field.dispatchEvent(new Event('change', { bubbles: true }));
    }
    document.getElementById('onboarding-form').requestSubmit();
  });
  await page.waitForSelector('#lesson.view.active');
}

(async () => {
  const server = spawn('python3', ['-m', 'http.server', String(port), '--directory', root], {
    stdio: ['ignore', 'ignore', 'pipe']
  });
  try {
    await waitForServer(server);
    const browser = await chromium.launch({ headless: true });
    try {
      for (const width of [360, 390, 430]) {
        const context = await browser.newContext({
          viewport: { width, height: 844 },
          serviceWorkers: 'block'
        });
        const page = await context.newPage();
        await completeLocalEntry(page, width);

        const result = await page.evaluate(() => {
          const rect = element => {
            const value = element?.getBoundingClientRect();
            return value ? { top: value.top, bottom: value.bottom, left: value.left, right: value.right } : null;
          };
          const action = document.querySelector('#lesson .lesson-actions');
          const mobileNav = document.querySelector('.mobile-nav');
          const activeView = document.querySelector('.view.active');
          const fixedLargeBlocks = [...activeView.querySelectorAll('*')].filter(element => {
            const style = getComputedStyle(element);
            return ['fixed', 'absolute'].includes(style.position) && element.getBoundingClientRect().height > innerHeight * .9;
          });
          return {
            overflow: document.documentElement.scrollWidth - innerWidth,
            actionPosition: getComputedStyle(action).position,
            action: rect(action),
            mobileNav: rect(mobileNav),
            fixedLargeBlocks: fixedLargeBlocks.length
          };
        });

        assert.equal(result.overflow, 0, `${width}px: no horizontal overflow`);
        assert.equal(result.actionPosition, 'sticky', `${width}px: lesson actions remain in normal document flow`);
        assert.equal(result.fixedLargeBlocks, 0, `${width}px: lesson view has no fullscreen action overlay`);

        await page.locator('#lesson .lesson-actions').scrollIntoViewIfNeeded();
        const overlap = await page.evaluate(() => {
          const action = document.querySelector('#lesson .lesson-actions').getBoundingClientRect();
          const nav = document.querySelector('.mobile-nav').getBoundingClientRect();
          return { actionBottom: action.bottom, navTop: nav.top, overlaps: action.bottom > nav.top };
        });
        assert.equal(overlap.overlaps, false, `${width}px: lesson actions do not cover mobile navigation`);
        await context.close();
      }
    } finally {
      await browser.close();
    }
    console.log('RESULT: Free mobile lesson layout contract passed');
  } finally {
    server.kill('SIGTERM');
  }
})().catch(error => {
  console.error(error.stack || error);
  process.exit(1);
});
