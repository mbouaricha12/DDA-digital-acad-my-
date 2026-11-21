'use strict';

/* ==========================================================================
   DDA — M1 content anti-leak guard (docs/RISK_REGISTER.md R-04).

   The repo-state inspection on 2026-11-20 found the project's second
   severest unresolved content-leak: the real text, exercises and quiz
   answers of M1.1/M1.2/M1.3 — reserved for the advanced_modules entitlement
   (CDCP-OS §4.2, /launch/'s own copy) — were embedded in clear text in
   public, statically-served browser files (dist/m1-1-lesson.js,
   dist/m1-2-lesson.js, dist/m1-3-lesson.js), readable by anyone, Free or
   anonymous, with a single unauthenticated request. There was no server
   route to even deny: canUnlock('advanced_modules') only ever controlled
   whether the already-shipped data was rendered client-side. This fix
   mirrors Lot 2's P2.2/LAB4/LABCAP fix exactly: the content now lives only
   on the authenticated BFF (bff/src/m1-content.js), behind
   GET /v1/m1/content/:lessonId. This file is the durable, CI-enforced guard
   against that leak ever coming back silently.

   Run with: node tests/test_m1_content_not_public.js
   ========================================================================== */

const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const { createBff } = require(path.join(root, 'bff', 'src', 'app.js'));
const { M1_CONTENT } = require(path.join(root, 'bff', 'src', 'm1-content.js'));
const { MemorySessionStore } = require(path.join(root, 'bff', 'src', 'session-store.js'));

let passed = 0;
function test(name, fn) { fn(); passed++; console.log('PASS -', name); }
async function testAsync(name, fn) { await fn(); passed++; console.log('PASS -', name); }

// A handful of distinctive strings from the real authored content — picked
// so a coincidental match can never pass this check.
const SECRET_MARKERS = [
  { lesson: 'M1.1', text: 'Le prix se déplace quand l’équilibre des échanges change.' },
  { lesson: 'M1.1', text: 'Le prix évolue quand l’exécution des ordres et la liquidité disponible créent un déséquilibre' },
  { lesson: 'M1.2', text: 'Un prix affiché représente une possibilité d’échange, pas une promesse d’exécution.' },
  { lesson: 'M1.2', text: 'L’exécution dépend du type d’ordre et de la liquidité disponible aux prix rencontrés.' },
  { lesson: 'M1.3', text: 'Un marché organisé est une organisation, pas un endroit magique.' },
  { lesson: 'M1.3', text: 'Une organisation régulée qui relie ceux qui cherchent des capitaux et ceux qui en apportent' }
];

// --- Static files: the real text must never be present again --------------

const DIST_FILES_TO_CHECK = ['m1-1-lesson.js', 'm1-2-lesson.js', 'm1-3-lesson.js', 'app.js', 'bff-client.js', 'dda-lazy-modules.js', 'dda-core.js'];
const distSources = Object.fromEntries(DIST_FILES_TO_CHECK.map(name => [name, fs.readFileSync(path.join(root, 'dist', name), 'utf8')]));

test('every secret marker is present, verbatim, in bff/src/m1-content.js (the one place it may live)', () => {
  const m1ContentSource = fs.readFileSync(path.join(root, 'bff', 'src', 'm1-content.js'), 'utf8');
  SECRET_MARKERS.forEach(({ lesson, text }) => {
    assert.ok(m1ContentSource.includes(text), `${lesson}: expected marker text not found in bff/src/m1-content.js — update this test's markers if the authored content legitimately changed`);
  });
});

test('no public dist/*.js file ever contains a real M1.1/M1.2/M1.3 secret marker', () => {
  for (const [file, source] of Object.entries(distSources)) {
    SECRET_MARKERS.forEach(({ lesson, text }) => {
      assert.ok(!source.includes(text), `dist/${file} must never contain ${lesson}'s real authored text ("${text.slice(0, 40)}…") — this is exactly the leak docs/RISK_REGISTER.md R-04 described`);
    });
  }
});

test('dist/m1-1-lesson.js, m1-2-lesson.js and m1-3-lesson.js ship no embedded lesson/quiz data structures any more', () => {
  ['M1.1', 'M1.2', 'M1.3'].forEach((id, index) => {
    const file = `m1-${index + 1}-lesson.js`;
    assert.doesNotMatch(distSources[file], new RegExp(`id:\\s*'${id.replace('.', '\\.')}'`), `dist/${file} must not declare a ${id} data literal`);
  });
});

// --- Live server: an anonymous request must never see real content --------

function request(server, requestPath) {
  return new Promise((resolve, reject) => {
    const req = http.request({ ...server.address(), method: 'GET', path: requestPath, headers: { Origin: 'http://localhost:8745' } }, res => {
      let text = ''; res.on('data', chunk => { text += chunk; }); res.on('end', () => resolve({ status: res.statusCode, body: text }));
    });
    req.on('error', reject); req.end();
  });
}

(async () => {
  const auth = { async getUser() { throw Object.assign(new Error('no session'), { status: 401 }); } };
  const sessions = new MemorySessionStore();
  const handler = createBff({
    auth, sessions,
    config: { allowedOrigins: ['http://localhost:8745'], secureCookies: true, sessionIdleMs: 60 * 60 * 1000, sessionAbsoluteMs: 24 * 60 * 60 * 1000, sessionEncryptionKey: null, emailRedirectTo: 'http://localhost:8745/access', passwordRecoveryRedirectTo: 'http://localhost:8745/access?type=recovery' },
    clock: () => new Date('2026-09-28T00:00:00.000Z')
  });
  const server = http.createServer(handler);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    await testAsync('an anonymous request (no session cookie at all) to /v1/m1/content/:id is rejected before any content is ever sent, for every M1 lesson', async () => {
      for (const id of ['M1.1', 'M1.2', 'M1.3']) {
        const response = await request(server, `/v1/m1/content/${encodeURIComponent(id)}`);
        assert.equal(response.status, 401, `${id}: an anonymous request must be denied (401), never served real content`);
        SECRET_MARKERS.filter(m => m.lesson === id).forEach(({ text }) => assert.ok(!response.body.includes(text), `${id}: the real authored text must never appear in an anonymous response body`));
      }
    });

    await testAsync('an authenticated session with no advanced_modules entitlement is refused (403), never served real content', async () => {
      const freeAuth = { async getUser(userId) { return { user_id: userId, email: 'free@example.com', email_verified: true, display_name: 'Free', status: 'active', entitlements: [] }; } };
      const freeSessions = new MemorySessionStore();
      const row = await freeSessions.create({ user_id: 'user-free', token_hash: require('node:crypto').createHash('sha256').update('t').digest('hex'), provider_access_token_enc: null, provider_refresh_token_enc: null, user_agent: 'test', ip_hash: 'x', created_at: new Date().toISOString(), last_seen_at: new Date().toISOString(), expires_at: new Date(Date.now() + 86400000).toISOString() });
      assert.ok(row, 'session row created');
      const entitlements = { async getForUser() { return { membership: null, entitlements: [] }; } };
      const freeHandler = createBff({
        auth: freeAuth, sessions: freeSessions, entitlements,
        config: { allowedOrigins: ['http://localhost:8745'], secureCookies: true, sessionIdleMs: 60 * 60 * 1000, sessionAbsoluteMs: 24 * 60 * 60 * 1000, sessionEncryptionKey: null, emailRedirectTo: 'http://localhost:8745/access', passwordRecoveryRedirectTo: 'http://localhost:8745/access?type=recovery' },
        clock: () => new Date('2026-09-28T00:00:00.000Z')
      });
      const freeServer = http.createServer(freeHandler);
      await new Promise(resolve => freeServer.listen(0, '127.0.0.1', resolve));
      try {
        const response = await new Promise((resolve, reject) => {
          const req = http.request({ ...freeServer.address(), method: 'GET', path: '/v1/m1/content/M1.1', headers: { Origin: 'http://localhost:8745', Cookie: '__Host-dda_session=t' } }, res => {
            let text = ''; res.on('data', c => { text += c; }); res.on('end', () => resolve({ status: res.statusCode, body: text }));
          });
          req.on('error', reject); req.end();
        });
        assert.equal(response.status, 403, 'a Free/no-entitlement session must be refused, never served real content');
        assert.ok(!response.body.includes('Le prix se déplace quand l’équilibre'), 'the real authored text must never appear in a 403 response body');
      } finally {
        await new Promise(resolve => freeServer.close(resolve));
      }
    });

    await testAsync('the content actually served to a genuinely entitled session matches bff/src/m1-content.js exactly, proving the route is real (not a stub that happens to also deny other callers)', async () => {
      const entitledAuth = { async getUser(userId) { return { user_id: userId, email: 'a@example.com', email_verified: true, display_name: 'A', status: 'active', entitlements: [] }; } };
      const entitledSessions = new MemorySessionStore();
      const row = await entitledSessions.create({ user_id: 'user-1', token_hash: require('node:crypto').createHash('sha256').update('t').digest('hex'), provider_access_token_enc: null, provider_refresh_token_enc: null, user_agent: 'test', ip_hash: 'x', created_at: new Date().toISOString(), last_seen_at: new Date().toISOString(), expires_at: new Date(Date.now() + 86400000).toISOString() });
      assert.ok(row, 'session row created');
      // Entitled via the admin-granted layer (entitlementsStore), with no
      // live Chariow membership at all — proving advanced_modules access
      // does not require Premium specifically, and that an admin grant
      // alone is sufficient (the additive-layer bug fixed alongside this).
      const entitlementsStore = { async listForUser() { return [{ entitlement_key: 'advanced_modules', status: 'active', expires_at: null }]; } };
      const entitlements = { async getForUser() { return { membership: null, entitlements: [] }; } };
      const entitledHandler = createBff({
        auth: entitledAuth, sessions: entitledSessions, entitlements, entitlementsStore,
        config: { allowedOrigins: ['http://localhost:8745'], secureCookies: true, sessionIdleMs: 60 * 60 * 1000, sessionAbsoluteMs: 24 * 60 * 60 * 1000, sessionEncryptionKey: null, emailRedirectTo: 'http://localhost:8745/access', passwordRecoveryRedirectTo: 'http://localhost:8745/access?type=recovery' },
        clock: () => new Date('2026-09-28T00:00:00.000Z')
      });
      const entitledServer = http.createServer(entitledHandler);
      await new Promise(resolve => entitledServer.listen(0, '127.0.0.1', resolve));
      try {
        const response = await new Promise((resolve, reject) => {
          const req = http.request({ ...entitledServer.address(), method: 'GET', path: '/v1/m1/content/M1.1', headers: { Origin: 'http://localhost:8745', Cookie: '__Host-dda_session=t' } }, res => {
            let text = ''; res.on('data', c => { text += c; }); res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(text) }));
          });
          req.on('error', reject); req.end();
        });
        assert.equal(response.status, 200);
        assert.deepEqual(response.body.lesson, M1_CONTENT['M1.1'], 'the route serves exactly the content held in bff/src/m1-content.js — proving it is the real route, not a stub');
      } finally {
        await new Promise(resolve => entitledServer.close(resolve));
      }
    });

    console.log(`\nRESULT: ${passed} M1-content anti-leak checks passed`);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
})();
