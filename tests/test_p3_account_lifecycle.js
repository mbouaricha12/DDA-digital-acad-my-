'use strict';

const assert = require('node:assert/strict');
const http = require('node:http');
const { createBff, SESSION_COOKIE, CSRF_COOKIE } = require('../bff/src/app');
const { MemorySessionStore } = require('../bff/src/session-store');
const { MemoryBusinessStore } = require('../bff/src/business-store');

const auth = {
  deleted: [],
  async login() { return { user: { id: 'user-1' }, access_token: 'access', refresh_token: 'refresh' }; },
  async getUser(userId) { assert.equal(userId, 'user-1'); return { user_id: userId, email: 'learner@example.com', email_verified: true, display_name: 'Learner', status: 'active', entitlements: [] }; },
  async deleteUser(userId) { this.deleted.push(userId); }
};

function request(server, method, path, { body, headers = {}, cookies = {} } = {}) {
  return new Promise((resolve, reject) => {
    const cookie = Object.entries(cookies).map(([key, value]) => `${key}=${encodeURIComponent(value)}`).join('; ');
    const payload = body ? JSON.stringify(body) : '';
    const req = http.request({ ...server.address(), method, path, headers: { Origin: 'http://localhost:8744', ...(body ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } : {}), ...(cookie ? { Cookie: cookie } : {}), ...headers } }, res => {
      let text = ''; res.on('data', chunk => { text += chunk; }); res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: text ? JSON.parse(text) : null }));
    });
    req.on('error', reject); if (payload) req.write(payload); req.end();
  });
}

(async () => {
  const sessions = new MemorySessionStore();
  const businessStore = new MemoryBusinessStore({ journal_entries: [{ entry_id: 'entry-1', owner_id: 'user-1', note: 'private' }, { entry_id: 'entry-2', owner_id: 'other-user', note: 'not mine' }] });
  const handler = createBff({ auth, sessions, businessStore, config: { allowedOrigins: ['http://localhost:8744'], secureCookies: false, sessionIdleMs: 60 * 60 * 1000, sessionAbsoluteMs: 24 * 60 * 60 * 1000, sessionEncryptionKey: null }, clock: () => new Date('2026-10-01T00:00:00.000Z') });
  const server = http.createServer(handler);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    let response = await request(server, 'POST', '/v1/auth/login', { body: { email: 'learner@example.com', password: 'long-enough-password' } });
    assert.equal(response.status, 204);
    const cookies = Object.fromEntries(response.headers['set-cookie'].map(value => value.split(';')[0].split('=')));
    const session = decodeURIComponent(cookies[SESSION_COOKIE]);
    const csrf = decodeURIComponent(cookies[CSRF_COOKIE]);

    response = await request(server, 'GET', '/v1/account/export', { cookies: { [SESSION_COOKIE]: session } });
    assert.equal(response.status, 200);
    assert.equal(response.body.contract, 'p3-data-contract-v1');
    assert.equal(response.body.data.journal_entries.length, 1);
    assert.equal(response.body.data.journal_entries[0].note, 'private');
    assert.equal(JSON.stringify(response.body).includes('refresh'), false);

    response = await request(server, 'DELETE', '/v1/account', { cookies: { [SESSION_COOKIE]: session, [CSRF_COOKIE]: csrf }, headers: { 'X-CSRF-Token': csrf }, body: { confirmation: 'delete' } });
    assert.equal(response.status, 400);
    assert.equal(auth.deleted.length, 0);

    response = await request(server, 'DELETE', '/v1/account', { cookies: { [SESSION_COOKIE]: session, [CSRF_COOKIE]: csrf }, headers: { 'X-CSRF-Token': csrf }, body: { confirmation: 'DELETE' } });
    assert.equal(response.status, 204);
    assert.deepEqual(auth.deleted, ['user-1']);
    assert.equal((await businessStore.exportUserData('user-1')).journal_entries.length, 0);
    assert.equal((await businessStore.exportUserData('other-user')).journal_entries.length, 1);
  } finally { server.close(); }
  console.log('P3 account lifecycle contract: PASS');
})();
