'use strict';

/* DDA Premium P2 vertical-slice contract: authored lessons, local proof and safe demo boundaries. */
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const index = fs.readFileSync(path.join(root, 'dist/academy.html'), 'utf8');
const app = fs.readFileSync(path.join(root, 'dist/app.js'), 'utf8');
const core = fs.readFileSync(path.join(root, 'dist/dda-core.js'), 'utf8');
const lessons = fs.readFileSync(path.join(root, 'dist/p2-lessons.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'dist/alpha-polish.css'), 'utf8');

assert(index.includes('<script src="p2-lessons.js"></script>'), 'P2 authored lesson script must load before core');
assert(index.includes('id="premium-track"') && index.includes('id="premium-lab"') && index.includes('id="premium-assessment"'), 'P2 views must exist');
assert(index.includes('id="premium-proof-progress"') && index.includes('id="p2-journal-bridge"'), 'proof and Journal bridge hooks must exist');
assert(index.includes('id="p2-progress-strip"') && index.includes('data-p2-step="assessment"'), 'P2 must expose an accessible four-step progress strip');
assert(lessons.includes("id: 'P2.1'") && lessons.includes("id: 'P2.2'"), 'both P2 lessons must be authored');
assert(lessons.includes("type: 'decision_choice'") && lessons.includes("type: 'quiz'"), 'P2 must use reusable interactive lesson blocks');
assert(lessons.includes('idSuffix: \'p21\'') && lessons.includes('idSuffix: \'p22\''), 'result ids must be collision-safe');
assert(app.includes("permission: 'premium_track'") && app.includes("'premium-track': 'premium_track'"), 'P2 routes must be premium gated');
assert(app.includes('premium_lab_validated') && app.includes('premium_proof_created'), 'P2 lifecycle events must be explicit');
assert(app.includes('DDA.updatePremium') && app.includes('sourceLesson: \'P2.2\''), 'P2 persistence must use the v4 premium namespace and source metadata');
assert(core.includes('function sanitizePremium') && core.includes('premium: sanitizePremium(raw.premium)'), 'premium state must be sanitized at the core boundary');
assert(core.includes("premiumOnly: true"), 'P2 module must be marked premium-only in the curriculum');
assert(css.includes('.premium-track-status') && css.includes('.premium-proof-row') && css.includes('.premium-progress-strip'), 'P2 must have a dedicated responsive visual layer');
assert(app.includes('syncStep') && app.includes('data-p2-step'), 'P2 progress strip must derive visual states from local progress');
assert(index.includes('id="weekly-review-panel"') && index.includes('id="weekly-review-form"'), 'Weekly Review UI must be present in Journal');
assert(app.includes("weeklyReviewWindow") && app.includes("premium_weekly_review_completed"), 'Weekly Review must derive a local window and record completion');
assert(core.includes("'premium_weekly_review_completed'") && core.includes("windowStart"), 'Weekly Review lifecycle and window fields must be sanitized');
console.log('Premium P2 contract: PASS');
