const assert = require('node:assert/strict');
const fs = require('node:fs');

const html = fs.readFileSync('dist/academy.html', 'utf8');
const app = fs.readFileSync('dist/app.js', 'utf8');
const css = fs.readFileSync('dist/styles.css', 'utf8');
const doc = fs.readFileSync('docs/DDA_QUICK_SKILLS_DISCOVERY_2026-11-14.md', 'utf8');

assert.match(html, /class="dashboard-quick-skills"/);
assert.match(html, /id="quick-skills-title"/);
assert.match(html, /id="quick-skills-list"/);
assert.match(html, /Produits Digitaux restent en préparation/);

const registryMatch = app.match(/const QUICK_SKILLS_REGISTRY = Object\.freeze\(\[(.*?)\]\);/s);
assert.ok(registryMatch, 'Quick Skills registry is declared');
const registry = registryMatch[1];
for (const marker of ['quick-observe', 'quick-zones', 'quick-brvm', 'quick-ai', 'M0.1', 'M0.2', 'MBRVM.1', 'LAB1']) {
  assert.match(registry, new RegExp(marker.replace('.', '\\.'), 'g'), `registry contains ${marker}`);
}
assert.match(app, /function quickSkillStatus\(skill\)/);
assert.match(app, /progress\.quizComplete/);
assert.match(app, /status\.key === 'locked' \? 'path' : skill\.viewId/);
assert.match(app, /data-quick-skill-view="\$\{target\}"/);
assert.match(app, /button\.dataset\.quickSkillView/);
assert.doesNotMatch(app, /quick-skill-view="[^"]+"[^>]*data-view=/);
assert.match(app, /renderQuickSkills\(\);/);
assert.doesNotMatch(app, /Produits Digitaux.*data-view/si, 'no inactive digital-products route is presented');

for (const view of ['lesson', 'lesson-m02', 'lesson-mbrvm1', 'lesson-lab1']) {
  assert.match(html, new RegExp(`id="${view}"`), `${view} mount exists`);
}
assert.match(css, /#dashboard \.quick-skills-list\{display:grid;grid-template-columns:repeat\(2/);
assert.match(css, /#dashboard \.quick-skill-footer \.text-action\{min-height:44px/);
assert.match(css, /@media\(max-width:640px\)[\s\S]*#dashboard \.quick-skills-list\{grid-template-columns:1fr\}/);
assert.match(doc, /KEEP \/ MODIFY \/ ADD \/ DEFER/);
assert.match(doc, /Produits Digitaux.*DEFER/si);

console.log('Quick Skills Discovery contract: PASS');
