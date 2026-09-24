const assert = require('assert');
const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, '../dist/index.html'), 'utf8');
const app = fs.readFileSync(path.join(__dirname, '../dist/app.js'), 'utf8');
const css = fs.readFileSync(path.join(__dirname, '../dist/styles.css'), 'utf8');

assert.ok(html.includes('id="terminal-journal-handoff"'), 'Terminal exposes an explicit Journal handoff');
assert.ok(html.includes('data-terminal-handoff="true"'), 'handoff is distinct from ordinary Journal navigation');
assert.ok(html.includes('id="journal-source-context"'), 'Journal composer exposes source context');
assert.ok(app.includes('function terminalJournalDraft()'), 'Terminal draft has a single conversion function');
assert.ok(app.includes('openJournalComposer(null, button, terminalJournalDraft())'), 'handoff opens the reusable Journal composer');
assert.ok(app.includes('market: state.instrument'), 'instrument is transferred to Journal');
assert.ok(app.includes('timeframe ${state.timeframe}'), 'timeframe is transferred to Journal context');
assert.ok(app.includes('annotations : ${drawingLabels}'), 'annotation types are transferred to Journal');
assert.ok(app.includes('fields.terminalSource'), 'composer identifies Terminal-originated drafts');
assert.ok(css.includes('.journal-source-context'), 'Terminal source context is styled');
console.log('RESULT: Terminal → Journal contract passed');
