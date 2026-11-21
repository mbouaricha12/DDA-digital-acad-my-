'use strict';

// Unit contract for bff/src/entitlements-store.js (MemoryEntitlementsStore,
// used in tests and by the server contract test), independent of the HTTP
// layer. Covers the real invariants: only the whitelisted entitlement keys
// can be granted, revoking/suspending a row that doesn't exist fails
// honestly, and grant() is idempotent per (user, entitlement) pair.

const assert = require('node:assert/strict');
const { MemoryEntitlementsStore, VALID_ENTITLEMENTS } = require('../bff/src/entitlements-store');

(async () => {
  const store = new MemoryEntitlementsStore();
  const USER = 'u1';
  const OWNER = 'owner-1';

  assert.deepEqual(await store.listForUser(USER), [], 'a user with no grants starts with an empty list');

  await assert.rejects(
    () => store.grant(USER, 'not_a_real_entitlement', { grantedBy: OWNER, reason: 'test' }),
    /invalid_entitlement|must be one of/,
    'an invented entitlement key is rejected, never silently accepted'
  );

  const granted = await store.grant(USER, 'premium_track', { grantedBy: OWNER, reason: 'Goodwill access', expiresAt: null });
  assert.equal(granted.entitlement_key, 'premium_track');
  assert.equal(granted.status, 'active');
  assert.equal(granted.granted_by, OWNER);
  let rows = await store.listForUser(USER);
  assert.equal(rows.length, 1, 'the grant is now visible in the user\'s list');

  // Re-granting the same entitlement updates the existing row rather than duplicating it.
  await store.grant(USER, 'premium_track', { grantedBy: OWNER, reason: 'Renewed goodwill', expiresAt: '2027-01-01T00:00:00.000Z' });
  rows = await store.listForUser(USER);
  assert.equal(rows.length, 1, 'granting the same entitlement again updates the row, never duplicates it');
  assert.equal(rows[0].reason, 'Renewed goodwill');
  assert.equal(rows[0].expires_at, '2027-01-01T00:00:00.000Z');

  const suspended = await store.setStatus(USER, 'premium_track', 'suspended');
  assert.equal(suspended.status, 'suspended');

  await assert.rejects(
    () => store.setStatus(USER, 'resources_premium', 'active'),
    error => error.code === 'entitlement_not_found',
    'suspending/reactivating a grant that was never made fails honestly, not silently'
  );

  await store.revoke(USER, 'premium_track');
  assert.deepEqual(await store.listForUser(USER), [], 'revoke actually removes the row');

  await assert.rejects(() => store.revoke(USER, 'premium_track'), error => error.code === 'entitlement_not_found', 'revoking a non-existent grant fails honestly');

  assert.ok(VALID_ENTITLEMENTS.length >= 4, 'the whitelist mirrors the real entitlement keys billing-store.js already grants');

  console.log('RESULT: entitlements store contract passed');
})().catch(error => { console.error(error); process.exitCode = 1; });
