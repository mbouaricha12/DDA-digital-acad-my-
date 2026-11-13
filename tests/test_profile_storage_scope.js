'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const core = fs.readFileSync(path.join(root, 'dist', 'dda-core.js'), 'utf8');
const app = fs.readFileSync(path.join(root, 'dist', 'app.js'), 'utf8');
const lazyLoader = fs.readFileSync(path.join(root, 'dist', 'dda-lazy-modules.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'dist', 'academy.html'), 'utf8');
const values = new Map();
const localStorage = {
  getItem: key => values.has(key) ? values.get(key) : null,
  setItem: (key, value) => values.set(key, String(value)),
  removeItem: key => values.delete(key)
};

const historicalState = {
  schemaVersion: 4,
  user: { id: 'old-device-user', name: 'Ancienne visiteuse', email: 'old@example.com' },
  lessons: { 'M0.1': { lessonViewed: true, exerciseComplete: true, quizComplete: true } },
  onboarding: { level: 'Débutant', goal: 'Comprendre les marchés', time: '10 minutes par jour', complete: true },
  journal: { entries: [{ id: 'private-entry', note: 'must not be imported' }] },
  terminal: { observation: 'must not be imported' },
  preferences: { lowData: true }
};
values.set('dda-prototype-state-v4', JSON.stringify(historicalState));
values.set('dda-prototype-state-v3', JSON.stringify({ user: { name: 'Ancien format' } }));

const window = {};
vm.runInNewContext(core, {
  window, localStorage, Date, Math, JSON, URL, URLSearchParams, Intl,
  crypto: { randomUUID: () => 'dda-test-visitor' }, console
});
const DDA = window.DDA;
assert.equal(DDA.load().user.email, 'old@example.com', 'legacy local mode remains backward-compatible before account scope is selected');

const accountA = DDA.setStorageScope('account-a');
assert.equal(accountA.user, null, 'account A never inherits the unscoped local profile');
assert.equal(accountA.lessons['M0.1'], undefined, 'account A never inherits unowned local progress');
assert.deepEqual(JSON.parse(JSON.stringify(DDA.readUnscopedProgressCandidate())), {
  lessons: { 'M0.1': { lessonViewed: true, exerciseComplete: true, quizComplete: true } },
  onboarding: { level: 'Débutant', goal: 'Comprendre les marchés', time: '10 minutes par jour', complete: true }
}, 'explicit recovery exposes only lesson completion and onboarding');
DDA.save({ ...accountA, user: { name: 'Compte A', email: 'a@example.com' }, lessons: { 'M0.2': { lessonViewed: true, exerciseComplete: false, quizComplete: false } } });

const accountB = DDA.setStorageScope('account-b');
assert.equal(accountB.user, null, 'account B starts with its own profile');
assert.equal(accountB.lessons['M0.2'], undefined, 'account B cannot read account A lesson progress');
DDA.save({ ...accountB, user: { name: 'Compte B', email: 'b@example.com' } });

const restoredA = DDA.setStorageScope('account-a');
assert.equal(restoredA.user.name, 'Compte A', 'account A restores its own profile');
assert.equal(restoredA.lessons['M0.2'].lessonViewed, true, 'account A restores its own lesson progress');
assert.equal(DDA.setStorageScope(null).lessons['M0.1'], undefined, 'BFF guest scope is separate from the historic global key');
assert.deepEqual(JSON.parse(values.get('dda-prototype-state-v4')), historicalState, 'unowned historic data is preserved, not migrated or overwritten');
assert.ok(values.has('dda-prototype-state-v3'), 'older legacy data also remains untouched by account scoping');
assert.equal(DDA.setStorageScope('invalid id'), null, 'invalid account identifiers fail closed');
assert.equal(DDA.storageKey(), 'dda-prototype-state-v4:guest', 'invalid identities cannot switch storage into an account');

assert.match(app, /DDA\.setStorageScope\(user\.user_id\)/, 'the active namespace is selected from the BFF-provided stable user_id');
assert.match(app, /await hydrateRemoteSession\(\)[\s\S]*await refreshServerPremiumEntitlement\(\)/, 'account data and Premium checks complete before the first personalized render');
assert.match(app, /dda-ai-chat-v1:user:\$\{encodeURIComponent\(remoteUser\.user_id\)\}/, 'AI history is scoped to the authenticated account');
assert.doesNotMatch(lazyLoader, /localStorage\.getItem\(['"]dda-prototype-state-v4['"]\)/, 'deferred module loading does not inspect unscoped progress before authentication');
assert.match(app, /profile-import-progress[\s\S]*?readUnscopedProgressCandidate/, 'the import path is user initiated and uses the restricted recovery payload');
assert.doesNotMatch(app, /Richard/, 'app.js has no hard-coded learner identity fallback');
assert.doesNotMatch(html, /Richard/, 'static Academy markup has no hard-coded learner identity');
console.log('Profile storage scope contract: PASS');
