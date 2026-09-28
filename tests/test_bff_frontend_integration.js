'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const client = fs.readFileSync(path.join(__dirname, '..', 'dist', 'bff-client.js'), 'utf8');
const app = fs.readFileSync(path.join(__dirname, '..', 'dist', 'app.js'), 'utf8');
const index = fs.readFileSync(path.join(__dirname, '..', 'dist', 'index.html'), 'utf8');

assert.match(client, /credentials:\s*'include'/);
assert.match(client, /\/v1\/security\/csrf/);
assert.match(client, /\/v1\/auth\/register/);
assert.match(client, /\/v1\/auth\/verify-email/);
assert.match(client, /\/v1\/auth\/login/);
assert.match(client, /\/v1\/auth\/password-reset\/request/);
assert.match(client, /\/v1\/me/);
assert.match(client, /X-CSRF-Token/);
assert.match(app, /DDABFF/);
assert.match(app, /handleBffVerificationToken/);
assert.match(app, /setBffAuthMode/);
assert.match(app, /requestPasswordReset/);
assert.match(app, /updateMe/);
assert.match(index, /bff-client\.js/);
assert.match(index, /window\.DDA_BFF_BASE_URL/);
assert.match(index, /bff-verify-panel/);
assert.match(index, /bff-recovery-form/);

console.log('BFF frontend integration contract: PASS');
