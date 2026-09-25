const assert = require('assert');
const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, '../dist/index.html'), 'utf8');
const app = fs.readFileSync(path.join(__dirname, '../dist/app.js'), 'utf8');
const css = fs.readFileSync(path.join(__dirname, '../dist/styles.css'), 'utf8');

assert.ok(app.includes("if (entry.id === 'M0.2')"), 'M0.2 receives the authored Practice handoff');
assert.ok(app.includes('data-practice-launch="M0.2"'), 'handoff identifies its source lesson');
assert.ok(app.includes('sourceLesson: lesson'), 'source lesson is persisted with the practice proof');
assert.ok(app.includes('sourceLessonTitle: \'Support & Résistance\''), 'source competency remains explicit');
assert.ok(app.includes('Après la leçon ${practice.sourceLesson}'), 'Progression displays the source lesson');
assert.ok(html.includes('class="analysis-terminal"'), 'handoff target remains the existing Terminal');
assert.ok(css.includes('.lesson-practice-handoff'), 'lesson handoff has dedicated styling');
console.log('RESULT: M0.2 → Practice Terminal handoff contract passed');
