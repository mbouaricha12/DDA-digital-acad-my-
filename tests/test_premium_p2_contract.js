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
const lazy = fs.readFileSync(path.join(root, 'dist/dda-lazy-modules.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'dist/alpha-polish.css'), 'utf8');
// Lot 2 (mandate §6 audit): the real P2.1/P2.2 lesson content moved off this
// public, statically-served file onto the authenticated BFF — see
// bff/src/premium-content.js and the new /v1/premium/content/:lessonId
// route (tests/test_bff_implementation.js, tests/test_premium_content_not_public.js).
const premiumContent = fs.readFileSync(path.join(root, 'bff/src/premium-content.js'), 'utf8');
const bffApp = fs.readFileSync(path.join(root, 'bff/src/app.js'), 'utf8');

assert(index.includes('<script src="dda-lazy-modules.js"></script>'), 'Academy must load the route-aware lazy module loader');
assert(lazy.includes("premium: ['p2-lessons.js']") && lazy.includes("'premium-track'"), 'P2 authored lesson script must be lazy-loaded for Premium routes');
assert(index.includes('id="premium-track"') && index.includes('id="premium-lab"') && index.includes('id="premium-assessment"'), 'P2 views must exist');
assert(index.includes('id="premium-proof-progress"') && index.includes('id="p2-journal-bridge"'), 'proof and Journal bridge hooks must exist');
assert(index.includes('id="p2-progress-strip"') && index.includes('data-p2-step="assessment"'), 'P2 must expose an accessible four-step progress strip');
// dist/p2-lessons.js is now a thin, content-free client loader (Lot 2): the
// real authored lessons live only on the BFF, never shipped to the browser.
assert(!lessons.includes("id: 'P2.1'") && !lessons.includes("id: 'P2.2'"), 'the real lesson ids must never be embedded in the public client file again');
assert(lessons.includes('window.DDAP2Lessons = null') && lessons.includes('fetchPremiumContent'), 'p2-lessons.js must fetch its content from the authenticated BFF, never embed it');
assert(lessons.includes("window.DDALazyContentReady['p2-lessons.js']"), 'the content fetch must be awaited by the lazy-loading pipeline before curriculum/DOM mounting runs');
assert(premiumContent.includes("id: 'P2.1'") && premiumContent.includes("id: 'P2.2'"), 'both P2 lessons must be authored, now on the BFF only');
assert(premiumContent.includes("type: 'decision_choice'") && premiumContent.includes("type: 'quiz'"), 'P2 must use reusable interactive lesson blocks');
assert(premiumContent.includes('idSuffix: \'p21\'') && premiumContent.includes('idSuffix: \'p22\''), 'result ids must be collision-safe');
assert(bffApp.includes('/v1/premium/content/') && bffApp.includes('FREE_PREVIEW_IDS'), 'the BFF must expose the authenticated content route with the free-preview exception for P2.1');
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
