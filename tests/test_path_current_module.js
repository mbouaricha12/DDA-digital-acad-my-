const assert = require('assert');
const fs = require('fs');

const app = fs.readFileSync(require('path').join(__dirname, '../dist/app.js'), 'utf8');

assert.ok(app.includes('const continueTarget = resolveContinueTarget();'), 'Parcours resolves the real next action');
assert.ok(app.includes('const currentModule = currentLessonTarget?.module || modules[0];'), 'Parcours derives the hero module from the current lesson target');
assert.ok(!app.includes('const currentIndex = modules.findIndex(isRenderableModule);'), 'Parcours is no longer pinned to the module containing M0.1');
assert.ok(app.includes("const LESSON_VIEW_ID = { 'M0.1': 'lesson', 'M0.2': 'lesson-m02', 'M0.3': 'lesson-m03', 'M1.1': 'lesson-m11', 'M1.2': 'lesson-m12' };"), 'M1.2 has an explicit reader route');

console.log('RESULT: Parcours current-module contract passed');
