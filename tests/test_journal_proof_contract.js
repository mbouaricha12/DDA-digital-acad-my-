const assert = require('assert');
const fs = require('fs');
const path = require('path');
const core = fs.readFileSync(path.join(__dirname, '../dist/dda-core.js'), 'utf8');
const app = fs.readFileSync(path.join(__dirname, '../dist/app.js'), 'utf8');
const css = fs.readFileSync(path.join(__dirname, '../dist/styles.css'), 'utf8');

assert.ok(core.includes("const JOURNAL_PROOF_FIELDS = ['sourceLesson', 'proofId', 'proofType']"), 'Journal declares proof metadata fields');
assert.ok(core.includes('entry.terminalSource = Boolean(raw.terminalSource)'), 'Journal normalizes Terminal provenance');
assert.ok(app.includes('proofId: proof.id || \'m02-zone-identification\''), 'Terminal draft transfers proof identity');
assert.ok(app.includes('journalComposerMetadata = fields.terminalSource'), 'composer keeps proof metadata while editing');
assert.ok(app.includes('...(journalComposerMetadata || {})'), 'saved Journal entry includes proof metadata');
assert.ok(app.includes('journal-proof-meta'), 'Journal renders proof provenance');
assert.ok(css.includes('.journal-proof-meta'), 'proof provenance has dedicated styling');
console.log('RESULT: Journal proof persistence contract passed');
