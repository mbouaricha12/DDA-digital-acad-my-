'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'dist', 'academy.html'), 'utf8');
const app = fs.readFileSync(path.join(root, 'dist', 'app.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'dist', 'styles.css'), 'utf8');

assert.match(html, /id="profile-persistence-status"[^>]*role="status"/, 'profile must expose an accessible persistence status');
assert.match(html, /Progression locale[^<]*enregistrée sur cet appareil/, 'unauthenticated profile must state that progress is local');
assert.match(html, /pas encore de synchronisation multi-appareils/i, 'default privacy copy must disclose the local-only boundary');
assert.match(app, /progression de mes leçons et mon onboarding/, 'signup must describe only the progress categories linked to the account');
assert.match(app, /Journal, le Terminal, les préférences et mes réponses restent sur cet appareil/, 'signup must disclose the data that remains local');
assert.match(app, /Ouvre ta session DDA\. Les leçons et l’onboarding sont liés à ton compte/, 'login copy must limit the account claim to lesson progress and onboarding');
assert.doesNotMatch(app, /Retrouve ton parcours avec ton compte serveur sécurisé/, 'login must not make an unqualified remote-restoration promise');
assert.match(app, /profile-persistence-status/, 'app must update the profile persistence status');
assert.match(app, /DDA\.storageAvailable\(\)/, 'status must account for unavailable local storage');
assert.match(app, /Progression en mémoire · stockage local indisponible/, 'status must disclose when local persistence is unavailable');
assert.match(app, /Leçons et onboarding liés à ton compte/, 'connected profile must identify the account-linked data');
assert.match(app, /Journal, Terminal, préférences et réponses sur cet appareil/, 'connected profile must disclose local-only data');
assert.match(css, /\.profile-identity \.persistence-status/, 'persistence status must have dedicated responsive styling');

console.log('local persistence indicator contract: PASS');
