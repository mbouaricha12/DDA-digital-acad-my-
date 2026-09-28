'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'dist', 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'dist', 'alpha-polish.css'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'dist', 'sw.js'), 'utf8');
const app = fs.readFileSync(path.join(root, 'dist', 'app.js'), 'utf8');

assert.match(html, /class="landing-device-stage" aria-hidden="true"/, 'hero device preview is decorative and hidden from assistive technology');
assert.match(html, /landing-device-laptop/, 'landing hero shows the desktop terminal mockup');
assert.match(html, /landing-device-phone/, 'landing hero shows the mobile journal mockup');
assert.match(html, /pédagogiques locales/i, 'hero preview identifies its synthetic educational series');
assert.match(html, /<strong>4 outils<\/strong> de lecture technique/, 'the trust strip shows only the verifiable count of four terminal tools');

const marketCards = [...html.matchAll(/class="landing-market-card" data-view="markets"/g)];
assert.equal(marketCards.length, 5, 'the landing has five market-learning cards');
for (const market of ['BRVM Composite', 'Forex', 'Actions', 'Indices', 'Crypto']) {
  assert.ok(html.includes(`>${market}<`), `market preview includes ${market}`);
}
assert.match(html, /mini-courbes sont illustratives et statiques/, 'landing market charts are clearly disclosed as non-live');
assert.match(html, /ne représentent ni prix, ni performance, ni signal/, 'market cards must not imply a quote or trading signal');
assert.match(html, />Revue hebdomadaire</, 'Journal review actions use consistent French product copy');

const toolbar = html.match(/<div class="analysis-terminal-tools"[\s\S]*?<div class="analysis-chart-frame">/)?.[0] || '';
assert.ok(toolbar, 'terminal toolbar remains mounted before the existing chart');
assert.match(toolbar, /class="terminal-tool-primary-group"/, 'analysis tools are grouped separately');
assert.match(toolbar, /class="terminal-tool-utility-group"/, 'zoom, pan and drawing commands are grouped separately');
assert.equal((toolbar.match(/data-terminal-tool=/g) || []).length, 4, 'all four original technical tools remain available');
assert.match(toolbar, /id="terminal-zoom"/, 'the original zoom slider is preserved');
assert.match(toolbar, /id="terminal-pan-left"[\s\S]*id="terminal-pan-right"/, 'both original pan controls are preserved');
assert.match(toolbar, /id="terminal-undo-drawing"[\s\S]*id="terminal-clear-drawings"/, 'drawing undo and clear controls are preserved');
assert.match(toolbar, /<svg viewBox="0 0 24 24" aria-hidden="true"><path/, 'toolbar actions use vector icons');

assert.match(css, /--dda-elite-canvas:#060d17/, 'the resting Deep Navy canvas is part of the shared visual layer');
assert.match(css, /--dda-aurora-electric:#2588ff/, 'the DDA Aurora cobalt signature is vivid and branded');
assert.match(css, /--dda-aurora-cyan:#39d6cf/, 'the mineral-cyan accent differentiates the palette from generic SaaS blue');
assert.match(css, /--dda-elite-gold-soft:#f3c76c/, 'the DDA gold proof accent is warm and legible');
assert.match(css, /#journal \.journal-toolbar\{[^}]*padding-inline:18px/, 'Journal count and actions have deliberate breathing room inside the glass panel');
assert.match(css, /radial-gradient\(ellipse 54% 26% at 96% 2%/, 'every route receives a restrained DDA light field');
assert.match(css, /#dashboard \.analysis-terminal-tools\{position:sticky/, 'the Terminal tools use a compact floating dock');
assert.match(css, /#dashboard \.terminal-tool-label\{display:none\}/, 'mobile tools are icon-first while accessible names remain on buttons');
assert.match(css, /#landing \.landing-market-cards\{display:grid/, 'market cards adapt to a responsive grid');
assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/, 'reduced-motion preference is respected');
assert.match(css, /body\.low-data #landing \.landing-3d-scene\{display:none\}/, 'the existing low-data guard for decorative 3D remains');
assert.match(sw, /const CACHE = 'dda-shell-v22';/, 'PWA cache is bumped for the latest Journal copy and visual refinements');
assert.match(app, /window\.addEventListener\('popstate'/, 'browser Back/Forward is handled by the existing SPA router');
assert.match(app, /window\.addEventListener\('hashchange'/, 'hash links remain synchronized with application navigation');
assert.match(app, /history\.back\(\)/, 'in-app Retour uses the native route history when available');
assert.match(app, /function writeDdaHistory\(/, 'route entries store only the current DDA view in history state');

const appViews = ['landing','access','dashboard','path','lesson','lesson-m02','lesson-m03','lesson-m11','lesson-m12','lesson-m13','lesson-p21','lesson-p22','premium-track','premium-lab','premium-assessment','progress','journal','resources','membership','markets','brokers','support','community','practice','intelligence','profile'];
for (const view of appViews) {
  assert.match(html, new RegExp(`id="${view}"`), `the existing ${view} route remains mounted`);
  assert.match(css, new RegExp(`#${view}\\.view`), `the global Deep Navy shell includes ${view}`);
}
assert.match(css, /\.view :is\(input:not\(\[type=checkbox\]\):not\(\[type=radio\]\),select,textarea\)/, 'all view forms share dark accessible fields');
assert.match(css, /#markets \.brvm-panel[^\{]*\{[^}]*background:/, 'the regional BRVM panel no longer falls back to parchment');
assert.match(css, /#support \.support-contact[^\{]*\{[^}]*background:/, 'the support form uses the global dark surface');
assert.match(css, /#membership \.plan-card[^\{]*\{[^}]*background:/, 'membership cards use the shared dark surface');
assert.match(css, /#profile \.profile-panel[^\{]*\{[^}]*background:/, 'profile and preference forms use the shared dark surface');
assert.match(css, /#gate-layer \.gate-card[^\{]*\{[^}]*background:/, 'permission overlays use the shared dark surface');
assert.match(html, /data-scroll-to="analysis-terminal"/, 'Terminal remains a reachable in-dashboard practice destination');
assert.match(html, /<p class="nav-section-label">Mon travail<\/p>/, 'Progression and Journal have a distinct work/evidence group');
assert.match(html, /<button class="nav-item" data-view="journal"><svg class="icon"><use href="#icon-journal"\/><\/svg> Journal<\/button>/, 'navigation calls the destination Journal, not a second Plan');
assert.match(css, /#landing \.landing-aperture-copy\{display:none!important\}/, 'decorative hero slogan cannot obscure the product mockups');
assert.match(css, /#landing \.landing-device-chart-head strong\{[^}]*font:600 8px\//, 'device mockup labels stay at product scale rather than inheriting the hero headline');
assert.match(css, /#progress \.mastery-context-note\{[^}]*background:rgba\(10,20,36,\.78\)/, 'future skill context uses the same calm dark surface as the rest of Progression');
assert.match(css, /#progress \.view-photo-band \.photo-fill\{filter:saturate\(\.68\) brightness\(\.8\)\}/, 'the Progress hero image keeps its texture with DDA color visibly present');
assert.match(css, /#landing \.landing-device-stage::before\{/, 'the laptop and phone mockups receive a reflected DDA light pool');
assert.match(css, /@keyframes dda-aperture-float/, 'the Aperture has a slow, low-amplitude 3D motion');
assert.match(css, /body\.low-data #landing \.landing-device-stage\{animation:none!important\}/, 'low-data mode disables decorative 3D motion');
assert.match(css, /body\.low-data #landing \.landing-device-stage::before\{animation:none!important\}/, 'low-data mode disables the reflected light animation');
assert.match(css, /#landing \.landing-market-card\{backdrop-filter:blur\(8px\)/, 'market preview cards use the DDA smoked-glass treatment');

console.log('RESULT: Elite UI visual contract passed');
