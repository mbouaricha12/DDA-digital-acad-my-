'use strict';

/* P3.2 contract test: identity/session design is explicit before backend implementation. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const contract = JSON.parse(fs.readFileSync(path.join(root, 'contracts', 'p3-identity-session-api-v1.json'), 'utf8'));
const dataContract = JSON.parse(fs.readFileSync(path.join(root, 'contracts', 'p3-data-contract-v1.json'), 'utf8'));

assert.equal(contract.openapi, '3.1.0');
assert.equal(contract.info.version, 'p3.2-v1');
assert.equal(contract.info.description.includes('No endpoint is deployed'), true);
assert.equal(contract['x-dda-security'].contract, 'p3-data-contract-v1');

const paths = contract.paths;
for (const route of [
  '/auth/register', '/auth/verify-email', '/auth/login', '/auth/logout', '/auth/logout-all',
  '/auth/password-reset/request', '/auth/password-reset/confirm', '/me', '/sessions',
  '/sessions/{sessionId}', '/security/csrf'
]) assert.ok(paths[route], `missing API route: ${route}`);

assert.ok(paths['/me'].get.security.some(scheme => scheme.sessionCookie));
assert.ok(paths['/me'].patch.security.some(scheme => scheme.sessionCookie));
assert.ok(paths['/me'].patch.parameters.some(parameter => parameter.$ref.endsWith('/CsrfHeader')));
assert.ok(paths['/auth/logout'].post.parameters.some(parameter => parameter.$ref.endsWith('/CsrfHeader')));
assert.ok(paths['/sessions/{sessionId}'].delete.parameters.some(parameter => parameter.$ref.endsWith('/SessionId')));

const session = contract['x-dda-security'].session;
assert.equal(session.cookieName, '__Host-dda_session');
assert.equal(session.refreshTokensInLocalStorage, false);
assert.equal(session.rotateOnLogin, true);
assert.equal(session.rotateOnPrivilegeChange, true);

const csrf = contract['x-dda-security'].csrf;
assert.equal(csrf.method, 'double-submit-cookie');
assert.equal(csrf.headerName, 'X-CSRF-Token');
for (const method of ['POST', 'PUT', 'PATCH', 'DELETE']) assert.ok(csrf.requiredFor.includes(method));
assert.equal(csrf.originCheck, true);

const cors = contract['x-dda-security'].cors;
assert.equal(cors.allowCredentials, true);
assert.equal(cors.wildcardOriginWithCredentials, false);
assert.ok(cors.allowedOrigins.length > 0);

const registerSchema = contract.components.schemas.RegisterRequest;
assert.equal(registerSchema.additionalProperties, false);
assert.equal(registerSchema.properties.password.writeOnly, true);
assert.equal(registerSchema.properties.password.minLength >= 12, true);
const loginSchema = contract.components.schemas.LoginRequest;
assert.equal(loginSchema.additionalProperties, false);
assert.equal(loginSchema.properties.password.writeOnly, true);

const currentUser = contract.components.schemas.CurrentUser;
assert.equal(currentUser.properties.user_id.readOnly, true);
assert.equal(currentUser.properties.entitlements.readOnly, true);
assert.equal(contract.paths['/me'].patch.requestBody.$ref.endsWith('/ProfilePatch'), true);
assert.deepEqual(contract.components.schemas.ProfilePatch.properties, { display_name: { type: 'string', maxLength: 60 } });

for (const forbidden of ['password', 'token', 'cookie', 'authorization', 'full_email', 'journal_text', 'raw_body']) {
  assert.ok(contract['x-dda-security'].logging.forbidden.includes(forbidden), `logging must forbid ${forbidden}`);
}

assert.equal(dataContract.securityBoundary.serverOwnsIdentity, true);
assert.equal(dataContract.securityBoundary.serverOwnsEntitlements, true);
assert.equal(dataContract.securityBoundary.serverAssignsOwnership, true);
assert.equal(contract['x-dda-security'].session.cookieName.startsWith('__Host-'), true);

console.log('P3 identity/session API contract: PASS');
