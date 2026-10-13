'use strict';

const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'dist', 'academy.html'), 'utf8');
const app = fs.readFileSync(path.join(root, 'dist', 'app.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'dist', 'styles.css'), 'utf8');

assert.ok(html.includes('class="journal-tabs"'), 'Journal exposes compact tab navigation');
assert.ok(html.includes('aria-controls="journal-entries-panel"'), 'Journal tab controls the entries panel');
assert.ok(html.includes('aria-controls="journal-plan-panel"'), 'Plan tab controls the plan panel');
assert.ok(html.includes('class="journal-toolbar"'), 'Journal exposes contextual toolbar');
assert.ok(html.includes('id="journal-count"') && html.includes('id="journal-last-entry"'), 'Toolbar exposes volume and last-edit metadata');
assert.ok(html.includes('id="weekly-review-open"'), 'Toolbar exposes weekly review action');
assert.ok(html.includes('class="journal-list"'), 'Journal exposes chronological list');
assert.ok(html.includes('class="journal-composer"'), 'Journal exposes structured composer');
assert.ok(html.includes('id="journal-step-dot-1"') && html.includes('id="journal-step-dot-3"'), 'Composer exposes three guided steps');
assert.ok(app.includes('function switchJournalTab(tab)'), 'Journal tabs have runtime behavior');
assert.ok(app.includes('function openWeeklyReview()'), 'Weekly review action has runtime behavior');
assert.ok(app.includes('function renderJournalList()'), 'Journal list is rendered from persisted entries');
assert.ok(css.includes('.journal-toolbar-actions'), 'Toolbar actions are styled as a contextual group');
assert.ok(css.includes('.journal-entry-card{'), 'Timeline entries have structured card styling');
assert.ok(css.includes('.journal-composer{'), 'Composer has a structured panel surface');
assert.ok(css.includes('@media (max-width: 700px)'), 'Journal has mobile-specific responsive rules');

console.log('RESULT: Journal optimization contract passed');
