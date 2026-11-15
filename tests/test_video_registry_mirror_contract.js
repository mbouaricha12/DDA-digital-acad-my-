'use strict';

// dist/video-registry.json mirrors dist/app.js's VIDEO_REGISTRY (the
// authoritative source used for real lesson/video rattachement) so the
// back-office's read-only Ressources view (admin.js) can fetch real video
// metadata as a same-origin static file, exactly like admin.js already does
// for lesson/module routes via manus-routes.json — never a second,
// hand-maintained copy that can silently drift from what learners actually
// see.

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const appJs = fs.readFileSync(path.join(root, 'dist', 'app.js'), 'utf8');
const mirror = JSON.parse(fs.readFileSync(path.join(root, 'dist', 'video-registry.json'), 'utf8'));

const match = appJs.match(/const VIDEO_REGISTRY = Object\.freeze\((\[[\s\S]*?\])\);/);
assert.ok(match, 'dist/app.js must still define VIDEO_REGISTRY as a frozen array literal');

// The source is a JS object literal (unquoted keys) rather than strict JSON —
// evaluate it in isolation, not with eval() against the live app.js scope.
// eslint-disable-next-line no-new-func
const authoritative = new Function(`return ${match[1]};`)();

assert.deepEqual(mirror, authoritative, 'dist/video-registry.json has drifted from dist/app.js VIDEO_REGISTRY — update the mirror whenever the registry changes');
assert.ok(mirror.length >= 8, 'the mirror must carry every real video, not a partial list');

console.log(`RESULT: video registry mirror contract passed (${mirror.length} videos)`);
