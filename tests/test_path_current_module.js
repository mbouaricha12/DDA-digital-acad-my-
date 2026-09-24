const assert = require('assert');
const fs = require('fs');

const app = fs.readFileSync(require('path').join(__dirname, '../dist/app.js'), 'utf8');

// Parcours must follow the real continueTarget (Navigation Integrity V1 fix —
// kept verbatim). Structure update (Lesson Registry tranche): LESSON_VIEW_ID
// is now DERIVED from LESSON_REGISTRY instead of a hand-maintained literal, so
// these assertions check the registry derivation rather than the old map text.
assert.ok(app.includes('const continueTarget = resolveContinueTarget();'), 'Parcours resolves the real next action');
assert.ok(app.includes('const currentModule = currentLessonTarget?.module || modules[0];'), 'Parcours derives the hero module from the current lesson target');
assert.ok(!app.includes('const currentIndex = modules.findIndex(isRenderableModule);'), 'Parcours is no longer pinned to the module containing M0.1');
assert.ok(!app.includes('function isRenderableModule('), 'the M0.1-pinning helper is fully removed, not merely unused');
assert.ok(app.includes('const LESSON_VIEW_ID = Object.freeze(Object.fromEntries(LESSON_REGISTRY.map('), 'lesson routes are derived from the single Lesson Registry, never a second parallel map');
assert.ok(app.includes("id: 'M0.1', viewId: 'lesson'"), 'M0.1 keeps its historical reader view');
assert.ok(app.includes("id: 'M1.2', viewId: 'lesson-m12'"), 'M1.2 has an explicit reader route declared once in the registry');

console.log('RESULT: Parcours current-module contract passed');
