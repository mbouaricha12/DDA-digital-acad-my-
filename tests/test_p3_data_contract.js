'use strict';

/* P3.1 contract test: data ownership is explicit before a remote backend exists. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const contractPath = path.join(root, 'contracts', 'p3-data-contract-v1.json');
const contract = JSON.parse(fs.readFileSync(contractPath, 'utf8'));

assert.equal(contract.contractVersion, 'p3-data-contract-v1');
assert.equal(contract.localSource.schemaVersion, 4);
assert.equal(contract.securityBoundary.clientIsUntrusted, true);
assert.equal(contract.securityBoundary.clientStateIsNeverAuthority, true);
assert.equal(contract.securityBoundary.serverOwnsIdentity, true);
assert.equal(contract.securityBoundary.serverOwnsEntitlements, true);
assert.equal(contract.securityBoundary.serverAssignsOwnership, true);
assert.equal(contract.securityBoundary.localPremiumDemoIsNonAuthoritative, true);

const premiumEntitlements = contract.premiumEntitlementContract;
assert.equal(premiumEntitlements.sourceOfTruth, 'server-membership-and-entitlement-service');
assert.equal(premiumEntitlements.localPlanMeaning, 'device-demo-display-only');
assert.equal(premiumEntitlements.clientRepresentation, 'read-only-server-snapshot');
for (const entitlement of ['resources_premium', 'certificate_preview', 'advanced_modules', 'premium_track']) {
  assert.ok(premiumEntitlements.allowedEntitlements.includes(entitlement), `missing Premium entitlement: ${entitlement}`);
}
for (const rule of [
  'grant or revoke an entitlement',
  'derive entitlement from premium proof_level',
  'treat a local demo plan as server membership',
  'use a proof id as an authorization credential'
]) assert.ok(premiumEntitlements.clientMustNot.includes(rule), `missing Premium client boundary: ${rule}`);

const requiredEntities = [
  'users', 'memberships', 'onboarding', 'lesson_progress', 'terminal_state',
  'journal_entries', 'journal_plans', 'premium_progress', 'preferences',
  'acquisition', 'audit_events'
];
for (const entity of requiredEntities) assert.ok(contract.entities[entity], `missing entity: ${entity}`);

for (const entity of ['onboarding', 'lesson_progress', 'terminal_state', 'journal_entries', 'journal_plans', 'premium_progress', 'preferences']) {
  assert.equal(contract.entities[entity].ownership.startsWith('user-owned'), true, `${entity} must be user-owned`);
}

assert.equal(contract.entities.memberships.clientWritable.length, 0);
assert.equal(contract.entities.memberships.clientNeverWritable.includes('plan'), true);
assert.equal(contract.entities.premium_progress.clientNeverWritable.includes('proof_level'), true);
assert.equal(contract.entities.premium_progress.clientNeverWritable.includes('entitlement'), true);
assert.deepEqual(contract.entities.premium_progress.clientInputOnly, contract.entities.premium_progress.clientWritable);
for (const field of ['assessment_result', 'passed', 'proof_level', 'entitlement', 'source_lesson', 'created_at', 'updated_at']) {
  assert.ok(contract.entities.premium_progress.serverDerived.includes(field), `missing server-derived Premium field: ${field}`);
}
assert.equal(contract.entities.audit_events.clientWritable.length, 0);
assert.equal(contract.entities.acquisition.defaultSync, 'not-synced-until-consent-and-policy');
assert.match(contract.entities.acquisition.ownershipNote, /never be promoted to user_id/);

const ownershipRules = new Set(contract.ownershipRules.map(rule => rule.id));
for (const rule of ['OWN-001', 'OWN-002', 'OWN-003', 'OWN-004', 'OWN-005', 'OWN-006']) {
  assert.equal(ownershipRules.has(rule), true, `missing ownership rule: ${rule}`);
}

assert.equal(contract.migration.requiresAuthenticatedUser, true);
assert.equal(contract.migration.requiresExplicitConsent, true);
assert.equal(contract.migration.preserveLocalCopyUntil.includes('server-confirmed'), true);
assert.equal(contract.migration.conflictPolicy.startsWith('never-silent-merge'), true);
assert.equal(contract.migration.mustNotImport.includes('local membership entitlement as authority'), true);

for (const testName of [
  'cross-user read denied',
  'cross-user update denied',
  'client owner_id ignored or rejected',
  'client membership plan cannot grant entitlement',
  'duplicate clientMutationId is idempotent',
  'migration retry creates no duplicates'
]) assert.equal(contract.requiredSecurityTests.includes(testName), true, `missing security test: ${testName}`);

console.log('P3 data contract: PASS');
