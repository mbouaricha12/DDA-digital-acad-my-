'use strict';

/* ==========================================================================
   DDA — protected member/Premium resource downloads + admin catalogue
   management (final pre-launch audit, 2026-11, and its "passage à
   l'implémentation concrète" follow-up).

   Verifies GET /v1/resources (metadata), GET /v1/resources/:id/download
   (the actual file) and the owner-only CRUD routes
   (/v1/admin/resources[/:id]) — see bff/src/premium-resources-store.js's
   header for why this exists.

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
const { MemoryResourcesStore } = require(path.join(root, 'bff', 'src', 'premium-resources-store.js'));
const { MemorySessionStore } = require(path.join(root, 'bff', 'src', 'session-store.js'));
const { MemoryAdminRolesStore } = require(path.join(root, 'bff', 'src', 'admin-roles-store.js'));

let passed = 0;
async function test(name, fn) { await fn(); passed++; console.log('PASS -', name); }

const BASE_CONFIG = { allowedOrigins: ['http://localhost:8747'], secureCookies: true, sessionIdleMs: 3600000, sessionAbsoluteMs: 86400000, sessionEncryptionKey: null, emailRedirectTo: 'http://localhost:8747/access', passwordRecoveryRedirectTo: 'http://localhost:8747/access?type=recovery' };
const CLOCK = () => new Date('2026-11-22T00:00:00.000Z');

function request(server, requestPath, { method = 'GET', cookie, csrf, body } = {}) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : '';
    const headers = { Origin: 'http://localhost:8747', ...(cookie ? { Cookie: csrf ? `${cookie}; ${csrf.cookie}` : cookie } : {}), ...(csrf ? { 'X-CSRF-Token': csrf.token } : {}), ...(body ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } : {}) };
    const req = http.request({ ...server.address(), method, path: requestPath, headers }, res => {
      let text = ''; res.on('data', chunk => { text += chunk; }); res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: text }));
    });
    req.on('error', reject); if (payload) req.write(payload); req.end();
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

  const noEntitlementAuth = { async getUser(userId) { return { user_id: userId, email: `${userId}@example.com`, email_verified: true, display_name: userId, status: 'active', entitlements: [] }; } };

  async function withServer(entitlementsStoreRows, fn, { seedResources } = {}) {
    const premiumResourcesStore = new MemoryResourcesStore();
    const draftDoc = await premiumResourcesStore.create({ name: 'Checklist Free', category: 'Templates', membershipRequired: 'free', file: 'free-doc.pdf', mimeType: 'application/pdf' });
    await premiumResourcesStore.update(draftDoc.id, { status: 'published', order: 1 });
    const premiumDoc = await premiumResourcesStore.create({ name: 'Indicateur Premium', category: 'Outils', membershipRequired: 'premium', file: 'premium-doc.pdf', mimeType: 'application/pdf' });
    await premiumResourcesStore.update(premiumDoc.id, { status: 'published', order: 2 });
    const ghostDoc = await premiumResourcesStore.create({ name: 'Fantôme', category: 'Outils', membershipRequired: 'premium', file: 'premium-ghost.pdf', mimeType: 'application/pdf' });
    await premiumResourcesStore.update(ghostDoc.id, { status: 'published', order: 3 });
    await premiumResourcesStore.create({ name: 'Brouillon', category: 'Outils', membershipRequired: 'free', file: 'free-doc.pdf', mimeType: 'application/pdf' }); // stays draft
    if (seedResources) await seedResources(premiumResourcesStore);
    const ids = { free: draftDoc.id, premium: premiumDoc.id, ghost: ghostDoc.id };

    const sessions = new MemorySessionStore();
    const adminRoles = new MemoryAdminRolesStore({ 'u-owner': 'owner' });
    const entitlementsStore = { async listForUser() { return entitlementsStoreRows || []; } };
    const handler = createBff({ auth: noEntitlementAuth, sessions, entitlementsStore, adminRoles, premiumResourcesStore, resourcesStorageDir: storageDir, config: BASE_CONFIG, clock: CLOCK });
    const server = http.createServer(handler);
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    try { await fn(server, sessions, adminRoles, ids, premiumResourcesStore); } finally { await new Promise(resolve => server.close(resolve)); }
  }

  await test('an unknown resource id is refused with 404 before any auth check runs', async () => {
    await withServer([], async server => {
      const response = await request(server, '/v1/resources/00000000-0000-4000-8000-000000000000/download');
      assert.equal(response.status, 404);
    });
  });

  await test('an anonymous visitor cannot download the FREE resource either -- download requires being a signed-up member', async () => {
    await withServer([], async (server, sessions, adminRoles, ids) => {
      const response = await request(server, `/v1/resources/${ids.free}/download`);
      assert.equal(response.status, 401);
      assert.ok(!response.body.includes('FREE_DOC_BYTES'));
    });
  });

  await test('an anonymous visitor cannot download the PREMIUM resource', async () => {
    await withServer([], async (server, sessions, adminRoles, ids) => {
      const response = await request(server, `/v1/resources/${ids.premium}/download`);
      assert.equal(response.status, 401);
    });
  });

  await test('a Free member can download the FREE resource, and the real bytes are the ones actually sent', async () => {
    await withServer([], async (server, sessions, adminRoles, ids) => {
      const cookie = await createAuthedCookie(sessions, 'u-free');
      const response = await request(server, `/v1/resources/${ids.free}/download`, { cookie });
      assert.equal(response.status, 200);
      assert.equal(response.body, 'FREE_DOC_BYTES');
      assert.match(response.headers['content-disposition'] || '', /attachment/);
    });
  });

  await test('a Free member (no premium_track entitlement) is refused 403 for the PREMIUM resource, never served its bytes', async () => {
    await withServer([], async (server, sessions, adminRoles, ids) => {
      const cookie = await createAuthedCookie(sessions, 'u-free-2');
      const response = await request(server, `/v1/resources/${ids.premium}/download`, { cookie });
      assert.equal(response.status, 403);
      assert.ok(!response.body.includes('PREMIUM_DOC_BYTES'));
    });
  });

  await test('a genuinely entitled Premium member can download the PREMIUM resource', async () => {
    await withServer([{ entitlement_key: 'premium_track', status: 'active', expires_at: null }], async (server, sessions, adminRoles, ids) => {
      const cookie = await createAuthedCookie(sessions, 'u-premium');
      const response = await request(server, `/v1/resources/${ids.premium}/download`, { cookie });
      assert.equal(response.status, 200);
      assert.equal(response.body, 'PREMIUM_DOC_BYTES');
    });
  });

  await test('an EXPIRED premium_track grant is refused 403', async () => {
    await withServer([{ entitlement_key: 'premium_track', status: 'active', expires_at: '2020-01-01T00:00:00.000Z' }], async (server, sessions, adminRoles, ids) => {
      const cookie = await createAuthedCookie(sessions, 'u-expired');
      const response = await request(server, `/v1/resources/${ids.premium}/download`, { cookie });
      assert.equal(response.status, 403);
    });
  });

  await test('a REVOKED premium_track grant (status != active) is refused 403', async () => {
    await withServer([{ entitlement_key: 'premium_track', status: 'revoked', expires_at: null }], async (server, sessions, adminRoles, ids) => {
      const cookie = await createAuthedCookie(sessions, 'u-revoked');
      const response = await request(server, `/v1/resources/${ids.premium}/download`, { cookie });
      assert.equal(response.status, 403);
    });
  });

  await test('a published resource whose file is missing on disk returns an honest 404, never a crash, even for an entitled user', async () => {
    await withServer([{ entitlement_key: 'premium_track', status: 'active', expires_at: null }], async (server, sessions, adminRoles, ids) => {
      const cookie = await createAuthedCookie(sessions, 'u-premium-2');
      const response = await request(server, `/v1/resources/${ids.ghost}/download`, { cookie });
      assert.equal(response.status, 404);
    });
  });

  await test('a DRAFT resource is never served, even to an entitled user who somehow guesses its id', async () => {
    await withServer([{ entitlement_key: 'premium_track', status: 'active', expires_at: null }], async (server, sessions, adminRoles, ids, store) => {
      const draft = (await store.listAll()).find(r => r.status === 'draft');
      const cookie = await createAuthedCookie(sessions, 'u-premium-3');
      const response = await request(server, `/v1/resources/${draft.id}/download`, { cookie });
      assert.equal(response.status, 404);
    });
  });

  await test('GET /v1/resources requires authentication and lists only published resources, with no file path or internal fields leaked', async () => {
    await withServer([], async (server, sessions, adminRoles, ids) => {
      const anon = await request(server, '/v1/resources');
      assert.equal(anon.status, 401);
      const cookie = await createAuthedCookie(sessions, 'u-list');
      const response = await request(server, '/v1/resources', { cookie });
      assert.equal(response.status, 200);
      const { items } = JSON.parse(response.body);
      const names = items.map(item => item.name);
      assert.ok(names.includes('Checklist Free') && names.includes('Indicateur Premium'));
      assert.ok(!names.includes('Brouillon'), 'a draft-status resource must never be listed');
      assert.ok(!('file' in items[0]) && !('mimeType' in items[0]), 'the server-only file path/mime must never reach the client via the listing');
    });
  });

  // --- Admin catalogue management (owner-only mutations) -------------------

  async function ownerSetup(server, sessions) {
    const cookie = await createAuthedCookie(sessions, 'u-owner');
    const csrfRes = await request(server, '/v1/security/csrf', { cookie });
    const setCookie = csrfRes.headers['set-cookie']?.[0]?.split(';')[0] || '';
    return { cookie, csrf: { cookie: setCookie, token: setCookie.split('=')[1] } };
  }

  await test('a non-admin cannot read or write the admin resources catalogue', async () => {
    await withServer([], async (server, sessions) => {
      const cookie = await createAuthedCookie(sessions, 'u-plain');
      const listResponse = await request(server, '/v1/admin/resources', { cookie });
      assert.equal(listResponse.status, 403);
      const createResponse = await request(server, '/v1/admin/resources', { method: 'POST', cookie, body: { name: 'x', category: 'y', membershipRequired: 'free', file: 'x.pdf' } });
      assert.equal(createResponse.status, 403);
    });
  });

  await test('an owner can create a resource (as draft), publish it, and it then appears in the real learner-facing listing', async () => {
    await withServer([], async (server, sessions, adminRoles) => {
      const { cookie, csrf } = await ownerSetup(server, sessions);
      const createResponse = await request(server, '/v1/admin/resources', { method: 'POST', cookie, csrf, body: { name: 'Nouveau guide', category: 'Trading & Analyse', level: 'Débutant', membershipRequired: 'free', type: 'pdf', file: 'free-doc.pdf', mimeType: 'application/pdf' } });
      assert.equal(createResponse.status, 200);
      const created = JSON.parse(createResponse.body).item;
      assert.equal(created.status, 'draft', 'a newly created resource must start as a draft, never auto-published');

      const beforePublish = JSON.parse((await request(server, '/v1/resources', { cookie })).body).items;
      assert.ok(!beforePublish.some(item => item.id === created.id), 'a draft must not appear in the learner-facing listing');

      const publishResponse = await request(server, `/v1/admin/resources/${created.id}`, { method: 'PATCH', cookie, csrf, body: { status: 'published' } });
      assert.equal(publishResponse.status, 200);
      assert.equal(JSON.parse(publishResponse.body).item.status, 'published');

      const afterPublish = JSON.parse((await request(server, '/v1/resources', { cookie })).body).items;
      assert.ok(afterPublish.some(item => item.id === created.id), 'once published, the resource must appear in the real learner-facing listing');
    });
  });

  await test('an owner can unpublish and delete a resource, and it then disappears from the learner-facing listing', async () => {
    await withServer([], async (server, sessions, adminRoles, ids) => {
      const { cookie, csrf } = await ownerSetup(server, sessions);
      const unpublish = await request(server, `/v1/admin/resources/${ids.free}`, { method: 'PATCH', cookie, csrf, body: { status: 'draft' } });
      assert.equal(unpublish.status, 200);
      const afterUnpublish = JSON.parse((await request(server, '/v1/resources', { cookie })).body).items;
      assert.ok(!afterUnpublish.some(item => item.id === ids.free));

      const del = await request(server, `/v1/admin/resources/${ids.premium}`, { method: 'DELETE', cookie, csrf });
      assert.equal(del.status, 204);
      const afterDelete = await request(server, `/v1/admin/resources/${ids.premium}`, { method: 'PATCH', cookie, csrf, body: { status: 'published' } });
      assert.equal(afterDelete.status, 404, 'a deleted resource must genuinely be gone, not just hidden');
    });
  });

  await test('creating a resource with an invalid membershipRequired is rejected with a precise validation error', async () => {
    await withServer([], async (server, sessions, adminRoles) => {
      const { cookie, csrf } = await ownerSetup(server, sessions);
      const response = await request(server, '/v1/admin/resources', { method: 'POST', cookie, csrf, body: { name: 'x', category: 'y', membershipRequired: 'gold', file: 'x.pdf' } });
      assert.equal(response.status, 400);
    });
  });

  console.log(`RESULT: ${passed} premium resource protection + admin catalogue checks passed`);
})().catch(error => { console.error('FAIL -', error); process.exitCode = 1; });
