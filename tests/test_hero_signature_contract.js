'use strict';

/*
 * DDA — Hero signature contract (2026-11-16).
 *
 * Locks the visible outcome of this tranche without pretending a live
 * economic-news feed exists: the market/economic ticker is honest — real
 * BFF paths only, explicit empty/offline states, no fabricated headline or
 * fake "live" claim.
 *
 * The 3D orbit scene now runs as a live WebGL layer around the existing
 * human-led hero photo. It is verified by test_landing_3d_contract.js and
 * the real-browser regression in tests/run.js.
 */

const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'dist', 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'dist', 'alpha-polish.css'), 'utf8');
const ticker = fs.readFileSync(path.join(root, 'dist', 'market-news-ticker.js'), 'utf8');

assert.match(html, /id="dda-news-ticker"/, 'The landing must expose the market/economic ticker container');
assert.match(html, /id="dda-news-ticker-track"/, 'The ticker must expose its scrolling track');
assert.match(html, /src="market-news-ticker\.js"/, 'The ticker script must be loaded by the landing');

assert.match(css, /\.dda-news-ticker\[data-state="ready"\] \.dda-news-ticker-track\{animation:dda-news-scroll/, 'The ticker must animate only when real items are present');
assert.match(css, /\.dda-news-ticker\[data-state="empty"\]/, 'The ticker must have an explicit empty state');

assert.match(ticker, /\/v1\/publications\/brvm/, 'The ticker must use the verified BRVM publication endpoint');
assert.match(ticker, /\/v1\/market\/quotes/, 'The ticker must use the configured market-quotes endpoint');
assert.match(ticker, /source vérifiée en attente/, 'The empty state must say the source is pending, never invent a headline');
assert.match(ticker, /sources vérifiées/, 'The ready state must label its freshness as verified sources');
assert.doesNotMatch(ticker, /https?:\/\/(?!127\.0\.0\.1)/, 'The ticker must not call an unapproved external news API');

console.log('RESULT: Hero signature contract passed');
