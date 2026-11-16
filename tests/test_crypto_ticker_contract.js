'use strict';

/*
 * Maquette chantier (2026-11-14) — contract for the public landing crypto
 * ticker (dist/market-ticker.js + dist/index.html markup). Covers: it never
 * loads bff-client.js (the public shell stays session/CSRF-free, same
 * contract as landing-ticker.js); it only ever shows the 5 requested
 * cryptos (BTC/ETH/SOL/BNB/XRP); it only renders a quote whose backend
 * status is 'ok' with a finite price — never a fabricated or stale value;
 * and it hides itself entirely when nothing qualifies, rather than showing
 * a placeholder.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

(async () => {
  let passed = 0;
  function test(name, fn) {
    try { fn(); passed++; console.log(`  ok — ${name}`); }
    catch (error) { console.log(`  FAIL — ${name}\n    ${error.stack}`); process.exitCode = 1; }
  }

  const tickerSrc = fs.readFileSync(path.join(__dirname, '..', 'dist', 'market-ticker.js'), 'utf8');
  const indexSrc = fs.readFileSync(path.join(__dirname, '..', 'dist', 'index.html'), 'utf8');
  const cssSrc = fs.readFileSync(path.join(__dirname, '..', 'dist', 'alpha-polish.css'), 'utf8');

  test('market-ticker.js never loads or calls into bff-client.js (public shell stays session/CSRF-free)', () => {
    assert.ok(!/getMarketQuotes|window\.DDA\.(request|client)|script[^>]*bff-client/.test(tickerSrc));
    assert.ok(tickerSrc.includes('fetch(`${base}/v1/market/quotes`'));
  });

  test('market-ticker.js fetches the real public /v1/market/quotes route', () => {
    assert.ok(tickerSrc.includes('/v1/market/quotes'));
  });

  test('market-ticker.js only requests the 5 cryptos the founder named (BTC/ETH/SOL/BNB/XRP)', () => {
    assert.ok(tickerSrc.includes("['BTCUSD', 'ETHUSD', 'SOLUSD', 'BNBUSD', 'XRPUSD']"));
  });

  test('market-ticker.js only accepts a quote with status "ok" and a finite price — never a fabricated value', () => {
    assert.ok(tickerSrc.includes("quote.status === 'ok'"));
    assert.ok(tickerSrc.includes('Number.isFinite(quote.price)'));
  });

  test('market-ticker.js hides the ticker entirely when no quote qualifies, rather than a placeholder', () => {
    assert.ok(tickerSrc.includes('root.hidden = true'));
    assert.ok(tickerSrc.includes('root.hidden = false'));
  });

  test('index.html mounts the crypto ticker container and loads the script', () => {
    assert.ok(indexSrc.includes('id="crypto-ticker"'));
    assert.ok(indexSrc.includes('id="crypto-ticker-track"'));
    assert.ok(indexSrc.includes('<script src="market-ticker.js"></script>'));
  });

  test('index.html crypto ticker container starts hidden (no flash before the real check resolves)', () => {
    assert.match(indexSrc, /<div class="crypto-ticker" id="crypto-ticker"[^>]*hidden>/);
  });

  test('alpha-polish.css defines the 5 brand-colored icon classes and reuses the shared marquee keyframe', () => {
    for (const cls of ['crypto-icon-btc', 'crypto-icon-eth', 'crypto-icon-sol', 'crypto-icon-bnb', 'crypto-icon-xrp']) {
      assert.ok(cssSrc.includes(`.${cls}`), `${cls} must be defined`);
    }
    assert.ok(cssSrc.includes('.crypto-ticker.crypto-ticker-animated .crypto-ticker-track{animation:dda-ticker-scroll'));
  });

  test('alpha-polish.css disables the ticker animation under prefers-reduced-motion', () => {
    assert.match(cssSrc, /@media\(prefers-reduced-motion:reduce\)\{\s*\.crypto-ticker\.crypto-ticker-animated \.crypto-ticker-track\{animation:none\}/);
  });

  console.log(`\n${passed}/9 crypto ticker contract checks passed`);
  if (passed !== 9) process.exit(1);
})();
