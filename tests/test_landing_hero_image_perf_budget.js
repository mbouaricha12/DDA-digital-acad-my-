'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// Hero reconception (2026-11-21, founder-approved): the single flat hero
// photo was replaced by a real figure photo (background removed, no AI face
// change) layered over a reused/re-cropped globe background — both real
// files, not placeholders. This guards the combined above-the-fold image
// weight against silently regressing past what the prior LCP fix (R-08)
// earned: the two new assets together (~118 KiB) are lighter than the single
// photo they replace (~138 KiB).
const root = path.join(__dirname, '..', 'dist', 'images', 'photos');
const figurePath = path.join(root, 'landing-hero-woman.webp');
const globePath = path.join(root, 'landing-hero-globe-small.webp');
const figureBytes = fs.statSync(figurePath).size;
const globeBytes = fs.statSync(globePath).size;
const combinedMax = 200 * 1024;

assert.ok(figureBytes > 5 * 1024, 'landing-hero-woman.webp is suspiciously small — make sure it is still the real photo, not a stub');
assert.ok(globeBytes > 20 * 1024, 'landing-hero-globe-small.webp is suspiciously small — make sure it is still the real globe scene, not a stub');
assert.ok(figureBytes + globeBytes <= combinedMax, `hero figure + globe together are ${((figureBytes + globeBytes) / 1024).toFixed(0)} KiB, expected <= ${combinedMax / 1024} KiB (LCP budget)`);

console.log(`Landing hero image perf budget: PASS (figure ${(figureBytes / 1024).toFixed(0)} KiB + globe ${(globeBytes / 1024).toFixed(0)} KiB = ${((figureBytes + globeBytes) / 1024).toFixed(0)} KiB)`);
