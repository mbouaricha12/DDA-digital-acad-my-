'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'dist', 'academy.html'), 'utf8');
const app = fs.readFileSync(path.join(root, 'dist', 'app.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'dist', 'styles.css'), 'utf8');

assert.match(html, /id="profile-persistence-status"[^>]*role="status"/, 'profile must expose an accessible persistence status');
assert.match(html, /Progression locale[^<]*enregistrée sur cet appareil/, 'profile must state that progress is local');
assert.match(html, /pas encore de synchronisation multi-appareils/i, 'profile privacy copy must disclose the current sync boundary');
assert.doesNotMatch(app, /Retrouve ton parcours avec ton compte serveur sécurisé/i, 'login must not promise remote progress restoration before sync exists');
assert.match(app, /synchronisation de ta progression sera activée progressivement/i, 'login must state that progress sync is not active yet');
assert.match(app, /profile-persistence-status/, 'app must update the profile persistence status');
assert.match(app, /DDA\.storageAvailable\(\)/, 'status must account for unavailable local storage');
assert.match(app, /synchronisation non activée/, 'connected accounts must not be presented as synchronized');
assert.match(css, /\.profile-identity \.persistence-status/, 'persistence status must have dedicated responsive styling');

console.log('local persistence indicator contract: PASS');
