'use strict';

/* ==========================================================================
   DDA — protected member/Premium resource downloads + admin catalogue
   management + file upload (final pre-launch audit, 2026-11, and its
   "administration totalement autonome" follow-up).

   Verifies GET /v1/resources (metadata), GET /v1/resources/:id/download
   (the actual file), the owner-only CRUD routes (/v1/admin/resources[/:id])
   and the owner-only file upload route (/v1/admin/resources/:id/file) —
   see bff/src/premium-resources-store.js and bff/src/resources-storage.js
   headers for why this exists.

   Run with: node tests/test_premium_resources_protection.js
   ========================================================================== */

const assert = require('node:assert/strict');
const http = require('node:http');
const crypto = require('node:crypto');
const path = require('node:path');

const root = path.join(__dirname, '..');
const { createBff } = require(path.join(root, 'bff', 'src', 'app.js'));
const { MemoryResourcesStore } = require(path.join(root, 'bff', 'src', 'premium-resources-store.js'));
const { MemoryFileStorage } = require(path.join(root, 'bff', 'src', 'resources-storage.js'));
const { MemorySessionStore } = require(path.join(root, 'bff', 'src', 'session-store.js'));
const { MemoryAdminRolesStore } = require(path.join(root, 'bff', 'src', 'admin-roles-store.js'));

let passed = 0;
async function test(name, fn) { await fn(); passed++; console.log('PASS -', name); }

const BASE_CONFIG = { allowedOrigins: ['http://localhost:8747'], secureCookies: true, sessionIdleMs: 3600000, sessionAbsoluteMs: 86400000, sessionEncryptionKey: null, emailRedirectTo: 'http://localhost:8747/access', passwordRecoveryRedirectTo: 'http://localhost:8747/access?type=recovery' };
const CLOCK = () => new Date('2026-11-22T00:00:00.000Z');

function request(server, requestPath, { method = 'GET', cookie, csrf, body, rawBody, headers = {} } = {}) {
  return new Promise((resolve, reject) => {
    const payload = rawBody !== undefined ? rawBody : (body ? JSON.stringify(body) : '');
    const reqHeaders = {
      Origin: 'http://localhost:8747',
      ...(cookie ? { Cookie: csrf ? `${cookie}; ${csrf.cookie}` : cookie } : {}),
      ...(csrf ? { 'X-CSRF-Token': csrf.token } : {}),
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
      ...headers
    };
    const req = http.request({ ...server.address(), method, path: requestPath, headers: reqHeaders }, res => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks).toString('binary') }));
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
  const noEntitlementAuth = { async getUser(userId) { return { user_id: userId, email: `${userId}@example.com`, email_verified: true, display_name: userId, status: 'active', entitlements: [] }; } };

  async function withServer(entitlementsStoreRows, fn, { maxBytes } = {}) {
    const premiumResourcesStore = new MemoryResourcesStore();
    const resourceFileStorage = new MemoryFileStorage();

    const draftDoc = await premiumResourcesStore.create({ name: 'Checklist Free', category: 'Templates', membershipRequired: 'free' });
    await resourceFileStorage.upload(draftDoc.id, Buffer.from('FREE_DOC_BYTES'), 'application/pdf');
    await premiumResourcesStore.update(draftDoc.id, { status: 'published', order: 1, file: 'free-doc.pdf', mimeType: 'application/pdf' });

    const premiumDoc = await premiumResourcesStore.create({ name: 'Indicateur Premium', category: 'Outils', membershipRequired: 'premium' });
    await resourceFileStorage.upload(premiumDoc.id, Buffer.from('PREMIUM_DOC_BYTES'), 'application/pdf');
    await premiumResourcesStore.update(premiumDoc.id, { status: 'published', order: 2, file: 'premium-doc.pdf', mimeType: 'application/pdf' });

    const ghostDoc = await premiumResourcesStore.create({ name: 'Fantôme', category: 'Outils', membershipRequired: 'premium' });
    await premiumResourcesStore.update(ghostDoc.id, { status: 'published', order: 3 }); // published but no file ever uploaded

    await premiumResourcesStore.create({ name: 'Brouillon', category: 'Outils', membershipRequired: 'free' }); // stays draft
    const ids = { free: draftDoc.id, premium: premiumDoc.id, ghost: ghostDoc.id };

    const sessions = new MemorySessionStore();
    const adminRoles = new MemoryAdminRolesStore({ 'u-owner': 'owner' });
    const entitlementsStore = { async listForUser() { return entitlementsStoreRows || []; } };
    const handler = createBff({ auth: noEntitlementAuth, sessions, entitlementsStore, adminRoles, premiumResourcesStore, resourceFileStorage, resourceUploadMaxBytes: maxBytes, config: BASE_CONFIG, clock: CLOCK });
    const server = http.createServer(handler);
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    try { await fn(server, sessions, adminRoles, ids, premiumResourcesStore, resourceFileStorage); } finally { await new Promise(resolve => server.close(resolve)); }
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

  await test('a published resource with no file ever uploaded returns an honest 404, never a crash, even for an entitled user', async () => {
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
    await withServer([], async (server, sessions) => {
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
      const createResponse = await request(server, '/v1/admin/resources', { method: 'POST', cookie, body: { name: 'x', category: 'y', membershipRequired: 'free' } });
      assert.equal(createResponse.status, 403);
    });
  });

  await test('an owner can create a resource (as draft), publish it, and it then appears in the real learner-facing listing', async () => {
    await withServer([], async (server, sessions) => {
      const { cookie, csrf } = await ownerSetup(server, sessions);
      const createResponse = await request(server, '/v1/admin/resources', { method: 'POST', cookie, csrf, body: { name: 'Nouveau guide', category: 'Trading & Analyse', level: 'Débutant', membershipRequired: 'free', type: 'pdf' } });
      assert.equal(createResponse.status, 200);
      const created = JSON.parse(createResponse.body).item;
      assert.equal(created.status, 'draft', 'a newly created resource must start as a draft, never auto-published');
      assert.equal(created.file, null, 'a resource is created with no file -- it is attached afterward via the upload route');

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
    await withServer([], async (server, sessions) => {
      const { cookie, csrf } = await ownerSetup(server, sessions);
      const response = await request(server, '/v1/admin/resources', { method: 'POST', cookie, csrf, body: { name: 'x', category: 'y', membershipRequired: 'gold' } });
      assert.equal(response.status, 400);
    });
  });

  // --- File upload (2026-11, "administration autonome" follow-up) --------

  await test('an owner can upload a file straight from the admin UI, and it becomes downloadable through the real protected route', async () => {
    await withServer([{ entitlement_key: 'premium_track', status: 'active', expires_at: null }], async (server, sessions, adminRoles, ids) => {
      const { cookie, csrf } = await ownerSetup(server, sessions);
      const upload = await request(server, `/v1/admin/resources/${ids.ghost}/file`, {
        method: 'POST', cookie, csrf, rawBody: 'NEW_INDICATOR_BYTES',
        headers: { 'Content-Type': 'application/pdf', 'X-Resource-File-Name': encodeURIComponent('indicateur-vwap.pdf') }
      });
      assert.equal(upload.status, 200);
      const item = JSON.parse(upload.body).item;
      assert.equal(item.file, 'indicateur-vwap.pdf');

      const premiumCookie = await createAuthedCookie(sessions, 'u-premium-upload');
      const download = await request(server, `/v1/resources/${ids.ghost}/download`, { cookie: premiumCookie });
      assert.equal(download.status, 200);
      assert.equal(download.body, 'NEW_INDICATOR_BYTES', 'the ghost resource, which had no file at all, is now really downloadable');
    });
  });

  await test('a non-owner (plain learner or non-owner admin) cannot upload a file', async () => {
    await withServer([], async (server, sessions, adminRoles, ids) => {
      const plainCookie = await createAuthedCookie(sessions, 'u-plain-2');
      const anonAttempt = await request(server, `/v1/admin/resources/${ids.free}/file`, { method: 'POST', rawBody: 'X', headers: { 'Content-Type': 'application/pdf' } });
      assert.equal(anonAttempt.status, 401);
      const plainAttempt = await request(server, `/v1/admin/resources/${ids.free}/file`, { method: 'POST', cookie: plainCookie, rawBody: 'X', headers: { 'Content-Type': 'application/pdf' } });
      assert.equal(plainAttempt.status, 403);
    });
  });

  await test('an oversized upload is rejected with 413 before being stored', async () => {
    await withServer([], async (server, sessions, adminRoles, ids, store, storage) => {
      const { cookie, csrf } = await ownerSetup(server, sessions);
      const tooLarge = Buffer.alloc(2048, 'a').toString();
      const response = await request(server, `/v1/admin/resources/${ids.free}/file`, {
        method: 'POST', cookie, csrf, rawBody: tooLarge, headers: { 'Content-Type': 'application/pdf' }
      });
      assert.equal(response.status, 413);
      const stillOriginal = await storage.download(ids.free);
      assert.equal(stillOriginal.buffer.toString(), 'FREE_DOC_BYTES', 'the original file must be untouched by a rejected oversized upload');
    }, { maxBytes: 1024 });
  });

  await test('an unsupported file type is rejected with 415', async () => {
    await withServer([], async (server, sessions, adminRoles, ids) => {
      const { cookie, csrf } = await ownerSetup(server, sessions);
      const response = await request(server, `/v1/admin/resources/${ids.free}/file`, {
        method: 'POST', cookie, csrf, rawBody: '#!/bin/sh\necho hi', headers: { 'Content-Type': 'application/x-sh' }
      });
      assert.equal(response.status, 415);
    });
  });

  await test('a MetaTrader .ex5 upload is accepted with the generic Content-Type a browser actually sends for it', async () => {
    await withServer([], async (server, sessions, adminRoles, ids, store, storage) => {
      const { cookie, csrf } = await ownerSetup(server, sessions);
      const response = await request(server, `/v1/admin/resources/${ids.ghost}/file`, {
        method: 'POST', cookie, csrf, rawBody: 'FAKE_EX5_BINARY_BYTES',
        headers: { 'Content-Type': '', 'X-Resource-File-Name': encodeURIComponent('SMC-BOT PRO.ex5') }
      });
      assert.equal(response.status, 200);
      const item = JSON.parse(response.body).item;
      assert.equal(item.file, 'SMC-BOT PRO.ex5');
      const stored = await storage.download(ids.ghost);
      assert.equal(stored.buffer.toString(), 'FAKE_EX5_BINARY_BYTES', 'the binary bytes must reach storage unaltered');
    });
  });

  await test('a non-.ex5 file cannot slip through under the generic octet-stream exception', async () => {
    await withServer([], async (server, sessions, adminRoles, ids) => {
      const { cookie, csrf } = await ownerSetup(server, sessions);
      const response = await request(server, `/v1/admin/resources/${ids.free}/file`, {
        method: 'POST', cookie, csrf, rawBody: 'MZ_FAKE_EXE_BYTES',
        headers: { 'Content-Type': 'application/octet-stream', 'X-Resource-File-Name': encodeURIComponent('not-an-indicator.exe') }
      });
      assert.equal(response.status, 415);
    });
  });

  await test('replacing a resource\'s file keeps its metadata (name, category, status) untouched', async () => {
    await withServer([], async (server, sessions, adminRoles, ids, store) => {
      const { cookie, csrf } = await ownerSetup(server, sessions);
      const before = await store.get(ids.free);
      const replace = await request(server, `/v1/admin/resources/${ids.free}/file`, {
        method: 'POST', cookie, csrf, rawBody: 'REPLACED_BYTES',
        headers: { 'Content-Type': 'application/pdf', 'X-Resource-File-Name': encodeURIComponent('checklist-v2.pdf') }
      });
      assert.equal(replace.status, 200);
      const after = await store.get(ids.free);
      assert.equal(after.name, before.name);
      assert.equal(after.category, before.category);
      assert.equal(after.status, before.status);
      assert.equal(after.file, 'checklist-v2.pdf', 'the display filename does update to the newly uploaded file');

      const freeCookie = await createAuthedCookie(sessions, 'u-free-replace');
      const download = await request(server, `/v1/resources/${ids.free}/download`, { cookie: freeCookie });
      assert.equal(download.body, 'REPLACED_BYTES', 'the old bytes are gone -- the same storage key was overwritten');
    });
  });

  await test('uploading to an unknown resource id is refused with 404', async () => {
    await withServer([], async (server, sessions) => {
      const { cookie, csrf } = await ownerSetup(server, sessions);
      const response = await request(server, '/v1/admin/resources/00000000-0000-4000-8000-000000000000/file', {
        method: 'POST', cookie, csrf, rawBody: 'X', headers: { 'Content-Type': 'application/pdf' }
      });
      assert.equal(response.status, 404);
    });
  });

  await test('deleting a resource also removes its uploaded file from storage', async () => {
    await withServer([], async (server, sessions, adminRoles, ids, store, storage) => {
      const { cookie, csrf } = await ownerSetup(server, sessions);
      const del = await request(server, `/v1/admin/resources/${ids.premium}`, { method: 'DELETE', cookie, csrf });
      assert.equal(del.status, 204);
      const remaining = await storage.download(ids.premium);
      assert.equal(remaining, null, 'the file must be removed from storage, not just orphaned');
    });
  });

  console.log(`RESULT: ${passed} premium resource protection + admin catalogue + upload checks passed`);
})().catch(error => { console.error('FAIL -', error); process.exitCode = 1; });
