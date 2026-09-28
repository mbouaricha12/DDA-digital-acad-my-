const assert = require('assert');
const fs = require('fs');

const html = fs.readFileSync('dist/index.html', 'utf8');
const css = fs.readFileSync('dist/styles.css', 'utf8');

const dashboard = html.match(/<section class="view[^>]*id="dashboard"[\s\S]*?<section class="view[^>]*id="path"/i)?.[0] || '';
const access = html.match(/<section class="view[^>]*id="access"[\s\S]*?<section class="view[^>]*id="dashboard"/i)?.[0] || '';
const path = html.match(/<section class="view[^>]*id="path"[\s\S]*?<section class="view[^>]*id="lesson"/i)?.[0] || '';
const resources = html.match(/<section class="view[^>]*id="resources"[\s\S]*?<section class="view[^>]*id="membership"/i)?.[0] || '';

assert(dashboard.includes('dashboard-mission'), 'Dashboard keeps a single explicit page mission');
assert(dashboard.includes('dashboard-supporting'), 'Dashboard secondary surfaces are grouped and labelled');
assert(dashboard.includes('terminal-practice-mission'), 'Dashboard retains a real practice output');
assert(dashboard.includes('data-scroll-to="terminal-practice-mission"'), 'Dashboard secondary CTA has a different practice intent');

assert(!access.includes('data-view="journal"'), 'Access does not become a Journal navigation hub');
assert(!access.includes('data-view="markets"'), 'Access does not become a Market Intelligence navigation hub');
assert(access.includes('onboarding-form'), 'Access keeps the onboarding value');

assert(path.includes('path-context-grid'), 'Path explains how to read the curriculum before the journey');
assert(path.includes('Un ordre, pas une course'), 'Path gives context about locked modules');
assert(path.includes('Une validation par étape'), 'Path explains proof-based progression');

assert(resources.includes('resource-meta'), 'Resources expose usable metadata for each item');
assert(resources.includes('resource-use-note'), 'Resources explains how to use the library');
assert(css.includes('.dashboard-supporting'), 'Dashboard hierarchy has dedicated styling');
assert(css.includes('.path-context-grid'), 'Path context has dedicated styling');
assert(css.includes('.resource-use-note'), 'Resource guidance has dedicated styling');

console.log('RESULT: Content depth and page mission contract passed');
