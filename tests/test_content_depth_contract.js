const assert = require('assert');
const fs = require('fs');

const html = fs.readFileSync('dist/academy.html', 'utf8');
const css = fs.readFileSync('dist/styles.css', 'utf8');

const dashboard = html.match(/<section class="view[^>]*id="dashboard"[\s\S]*?<section class="view[^>]*id="path"/i)?.[0] || '';
const access = html.match(/<section class="view[^>]*id="access"[\s\S]*?<section class="view[^>]*id="dashboard"/i)?.[0] || '';
const path = html.match(/<section class="view[^>]*id="path"[\s\S]*?<section class="view[^>]*id="lesson"/i)?.[0] || '';
const resources = html.match(/<section class="view[^>]*id="resources"[\s\S]*?<section class="view[^>]*id="membership"/i)?.[0] || '';

assert(!dashboard.includes('dashboard-mission'), 'Dashboard avoids a redundant page mission');
assert(dashboard.includes('terminal-lead'), 'Dashboard keeps a clear primary learning action');
assert(dashboard.includes('lesson-primary-action'), 'Dashboard exposes a direct resume-lesson action');
assert(dashboard.includes('data-view="path"') || dashboard.includes('lesson-primary-action'), 'Dashboard directs learners to a concrete next step');

assert(!access.includes('data-view="journal"'), 'Access does not become a Journal navigation hub');
assert(!access.includes('data-view="markets"'), 'Access does not become a Market Intelligence navigation hub');
assert(access.includes('onboarding-form'), 'Access keeps the onboarding value');

assert(!path.includes('path-context-grid'), 'Path avoids redundant explanatory cards');
assert(path.includes('path-list'), 'Path presents the learning sequence');


assert(resources.includes('resource-meta'), 'Resources expose usable metadata for each item');
assert(resources.includes('resource-use-note'), 'Resources explains how to use the library');


assert(css.includes('.resource-use-note'), 'Resource guidance has dedicated styling');

console.log('RESULT: Content depth and page mission contract passed');
