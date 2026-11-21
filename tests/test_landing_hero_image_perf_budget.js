'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// R-08 (docs/RISK_REGISTER.md): the homepage LCP element was this hero photo,
// shipped oversized (1448x1086, ~294 KiB) for its actual rendered size
// (.landing-aperture is at most a few hundred CSS px wide). Re-encoded
// 2026-11-21 to 1200x900 at JPEG quality 80 (~137 KiB) — a real file, not a
// placeholder, still the same photo. This guards against it silently
// regressing back to an oversized export.
const imagePath = path.join(__dirname, '..', 'dist', 'images', 'photos', 'landing-hero-scene.jpg');
const sizeBytes = fs.statSync(imagePath).size;
const maxBytes = 200 * 1024;

assert.ok(sizeBytes <= maxBytes, `landing-hero-scene.jpg is ${(sizeBytes / 1024).toFixed(0)} KiB, expected <= ${maxBytes / 1024} KiB (LCP budget, R-08)`);
assert.ok(sizeBytes > 20 * 1024, 'landing-hero-scene.jpg is suspiciously small — make sure it is still the real photo, not a stub');

console.log(`Landing hero image perf budget: PASS (${(sizeBytes / 1024).toFixed(0)} KiB)`);
