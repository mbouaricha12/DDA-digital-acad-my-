'use strict';

/* ==========================================================================
   DDA — protected member/Premium resource downloads (final pre-launch
   audit, 2026-11, Chantier 3).

   Verifies GET /v1/resources (metadata) and GET /v1/resources/:id/download
   (the actual file) enforce membership server-side, exactly like
   bff/src/premium-content.js's /v1/premium/content/:lessonId already does
   for lesson text — see bff/src/premium-resources-store.js's header.

   Run with: node tests/test_premium_resources_protection.js
   ========================================================================== */

const assert = require('node:assert/strict');
const http = require('node:http');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const root = path.join(__dirname, '..');
const { createBff } = require(path.join(root, 'bff', 'src', 'app.js'));
const { createPremiumResourcesStore } = require(path.join(root, 'bff', 'src', 'premium-resources-store.js'));
const { MemorySessionStore } = require(path.join(root, 'bff', 'src', 'session-store.js'));

let passed = 0;
async function test(name, fn) { await fn(); passed++; console.log('PASS -', name); }

const BASE_CONFIG = { allowedOrigins: ['http://localhost:8746'], secureCookies: true, sessionIdleMs: 3600000, sessionAbsoluteMs: 86400000, sessionEncryptionKey: null, emailRedirectTo: 'http://localhost:8746/access', passwordRecoveryRedirectTo: 'http://localhost:8746/access?type=recovery' };
const CLOCK = () => new Date('2026-11-22T00:00:00.000Z');

function request(server, requestPath, { cookie } = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request({ ...server.address(), method: 'GET', path: requestPath, headers: { Origin: 'http://localhost:8746', ...(cookie ? { Cookie: cookie } : {}) } }, res => {
      let body = ''; res.on('data', chunk => { body += chunk; }); res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
    });
    req.on('error', reject); req.end();
  });
}

async function createAuthedCookie(sessions, userId) {
  const token = 't-' + userId;
  await sessions.create({ user_id: userId, token_hash: crypto.createHash('sha256').update(token).digest('hex'), provider_access_token_enc: null, provider_refresh_token_enc: null, user_agent: 'test', ip_hash: 'x', created_at: new Date().toISOString(), last_seen_at: new Date().toISOString(), expires_at: new Date(Date.now() + 86400000).toISOString() });
  return `__Host-dda_session=${token}`;
}

(async () => {
  const storageDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dda-resources-test-'));
  fs.writeFileSync(path.join(storageDir, 'free-doc.pdf'), 'FREE_DOC_BYTES');
  fs.writeFileSync(path.join(storageDir, 'premium-doc.pdf'), 'PREMIUM_DOC_BYTES');
  // premium-ghost.pdf is deliberately NOT written to disk.
  const registry = Object.freeze([
    { id: 'free-doc', name: 'Checklist Free', description: 'desc', category: 'Templates', level: 'Débutant', tags: [], membershipRequired: 'free', type: 'pdf', status: 'published', order: 1, file: 'free-doc.pdf', mimeType: 'application/pdf' },
    { id: 'premium-doc', name: 'Indicateur Premium', description: 'desc', category: 'Outils', level: 'Avancé', tags: [], membershipRequired: 'premium', type: 'pdf', status: 'published', order: 2, file: 'premium-doc.pdf', mimeType: 'application/pdf' },
    { id: 'premium-ghost', name: 'Fantôme', description: 'desc', category: 'Outils', level: 'Avancé', tags: [], membershipRequired: 'premium', type: 'pdf', status: 'published', order: 3, file: 'premium-ghost.pdf', mimeType: 'application/pdf' },
    { id: 'draft-doc', name: 'Brouillon', description: 'desc', category: 'Outils', level: 'Avancé', tags: [], membershipRequired: 'free', type: 'pdf', status: 'draft', order: 4, file: 'free-doc.pdf', mimeType: 'application/pdf' }
  ]);
  const premiumResourcesStore = createPremiumResourcesStore({ registry, storageDir });

  const noEntitlementAuth = { async getUser(userId) { return { user_id: userId, email: `${userId}@example.com`, email_verified: true, display_name: userId, status: 'active', entitlements: [] }; } };

  async function withServer(entitlementsStoreRows, fn) {
    const sessions = new MemorySessionStore();
    const entitlementsStore = { async listForUser() { return entitlementsStoreRows || []; } };
    const handler = createBff({ auth: noEntitlementAuth, sessions, entitlementsStore, premiumResourcesStore, config: BASE_CONFIG, clock: CLOCK });
    const server = http.createServer(handler);
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    try { await fn(server, sessions); } finally { await new Promise(resolve => server.close(resolve)); }
  }

  await test('an unknown resource id is refused with 404 before any auth check runs (never leaks whether a session is valid)', async () => {
    await withServer([], async server => {
      const response = await request(server, '/v1/resources/does-not-exist/download');
      assert.equal(response.status, 404);
    });
  });

  await test('an anonymous visitor (no session cookie) cannot download the FREE resource either -- download requires being a signed-up member', async () => {
    await withServer([], async server => {
      const response = await request(server, '/v1/resources/free-doc/download');
      assert.equal(response.status, 401);
      assert.ok(!response.body.includes('FREE_DOC_BYTES'));
    });
  });

  await test('an anonymous visitor cannot download the PREMIUM resource', async () => {
    await withServer([], async server => {
      const response = await request(server, '/v1/resources/premium-doc/download');
      assert.equal(response.status, 401);
      assert.ok(!response.body.includes('PREMIUM_DOC_BYTES'));
    });
  });

  await test('a Free member can download the FREE resource, and the real bytes are the ones actually sent', async () => {
    await withServer([], async (server, sessions) => {
      const cookie = await createAuthedCookie(sessions, 'u-free');
      const response = await request(server, '/v1/resources/free-doc/download', { cookie });
      assert.equal(response.status, 200);
      assert.equal(response.body, 'FREE_DOC_BYTES');
      assert.match(response.headers['content-disposition'] || '', /attachment/);
    });
  });

  await test('a Free member (no premium_track entitlement) is refused 403 for the PREMIUM resource, never served its bytes', async () => {
    await withServer([], async (server, sessions) => {
      const cookie = await createAuthedCookie(sessions, 'u-free-2');
      const response = await request(server, '/v1/resources/premium-doc/download', { cookie });
      assert.equal(response.status, 403);
      assert.ok(!response.body.includes('PREMIUM_DOC_BYTES'));
    });
  });

  await test('a genuinely entitled Premium member (active premium_track grant) can download the PREMIUM resource', async () => {
    await withServer([{ entitlement_key: 'premium_track', status: 'active', expires_at: null }], async (server, sessions) => {
      const cookie = await createAuthedCookie(sessions, 'u-premium');
      const response = await request(server, '/v1/resources/premium-doc/download', { cookie });
      assert.equal(response.status, 200);
      assert.equal(response.body, 'PREMIUM_DOC_BYTES');
    });
  });

  await test('an EXPIRED premium_track grant is treated as no entitlement at all -- still refused 403', async () => {
    await withServer([{ entitlement_key: 'premium_track', status: 'active', expires_at: '2020-01-01T00:00:00.000Z' }], async (server, sessions) => {
      const cookie = await createAuthedCookie(sessions, 'u-expired');
      const response = await request(server, '/v1/resources/premium-doc/download', { cookie });
      assert.equal(response.status, 403);
    });
  });

  await test('a REVOKED premium_track grant (status != active) is refused 403', async () => {
    await withServer([{ entitlement_key: 'premium_track', status: 'revoked', expires_at: null }], async (server, sessions) => {
      const cookie = await createAuthedCookie(sessions, 'u-revoked');
      const response = await request(server, '/v1/resources/premium-doc/download', { cookie });
      assert.equal(response.status, 403);
    });
  });

  await test('a registry entry whose file is missing on disk returns an honest 404, never a crash or empty 200, even for an entitled user', async () => {
    await withServer([{ entitlement_key: 'premium_track', status: 'active', expires_at: null }], async (server, sessions) => {
      const cookie = await createAuthedCookie(sessions, 'u-premium-2');
      const response = await request(server, '/v1/resources/premium-ghost/download', { cookie });
      assert.equal(response.status, 404);
    });
  });

  await test('GET /v1/resources requires authentication and lists only published resources, with no file path or internal fields leaked', async () => {
    await withServer([], async (server, sessions) => {
      const anon = await request(server, '/v1/resources');
      assert.equal(anon.status, 401);
      const cookie = await createAuthedCookie(sessions, 'u-list');
      const response = await request(server, '/v1/resources', { cookie });
      assert.equal(response.status, 200);
      const { items } = JSON.parse(response.body);
      const ids = items.map(item => item.id);
      assert.ok(ids.includes('free-doc') && ids.includes('premium-doc'));
      assert.ok(!ids.includes('draft-doc'), 'a draft-status resource must never be listed');
      assert.ok(!('file' in items[0]) && !('mimeType' in items[0]), 'the server-only file path/mime must never reach the client via the listing');
    });
  });

  console.log(`RESULT: ${passed} premium resource protection checks passed`);
})().catch(error => { console.error('FAIL -', error); process.exitCode = 1; });
