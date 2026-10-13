'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const contract = JSON.parse(fs.readFileSync(path.join(root, 'contracts', 'dda-admin-control-center-v1.json'), 'utf8'));
const docs = fs.readFileSync(path.join(root, 'docs', 'DDA_CONTROL_CENTER_FOUNDATION.md'), 'utf8');

assert.equal(contract.status, 'design_only_not_deployed');
assert.equal(contract.securityBoundary.adminClientIsUntrusted, true);
assert.equal(contract.securityBoundary.serverOwnsRoleAssignment, true);
assert.equal(contract.securityBoundary.serverOwnsPermissions, true);
assert.equal(contract.securityBoundary.serverOwnsAuditEvents, true);
assert.equal(contract.securityBoundary.secretsNeverReachBrowser, true);

for (const role of ['owner', 'admin', 'editor', 'support', 'analyst']) {
  assert.ok(contract.roles[role], `missing administrative role: ${role}`);
  assert.equal(contract.roles[role].requiresMfa, true, `${role} must require MFA`);
}

const routes = contract.adminApi.routes.map(route => `${route.method} ${route.path}`);
for (const expected of ['GET /overview', 'GET /services', 'GET /users', 'GET /content', 'GET /audit', 'GET /backups']) {
  assert.ok(routes.includes(expected), `missing admin route contract: ${expected}`);
}

assert.ok(contract.auditEvent.appendOnly);
assert.ok(contract.auditEvent.allowedEventNames.includes('role_changed'));
assert.ok(contract.auditEvent.allowedEventNames.includes('backup_restored'));
assert.ok(contract.productionGates.includes('backup and restore test passed'));
assert.match(docs, /non déployé/i);
assert.match(docs, /aucune route `\/v1\/admin\/\*` déployée/i);

console.log('DDA Control Center contract: PASS');
