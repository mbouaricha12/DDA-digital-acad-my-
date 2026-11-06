'use strict';

/* ==========================================================================
   DDA — Premium content anti-leak guard (Lot 5, mandate §6 audit).

   MASTER_AUDIT_DDA_LAUNCH.md §6 found the project's most severe commercial
   blocker: the real text, exercises and quiz answers of every Premium
   lesson/lab (P2.1, P2.2, LAB4, LABCAP) were embedded in clear text in
   public, statically-served browser files (dist/p2-lessons.js,
   dist/dda-lab.js) — readable by anyone, Free or anonymous, with a single
   unauthenticated request, no authentication to defeat. Lot 2 moved that
   content onto the authenticated BFF (bff/src/premium-content.js, behind
   GET /v1/premium/content/:lessonId). This file is the durable, CI-enforced
   guard against that leak ever coming back silently: it fails loudly the
   moment any of the real lesson text or a correct-quiz-answer marker
   reappears in a public dist/*.js file, or an anonymous HTTP request to the
   BFF route returns real content.

   Verified against the pre-Lot-2 code (commit 4646d6e, before this fix):
   this exact test fails — dist/p2-lessons.js and dist/dda-lab.js contained
   the real strings checked below in clear text, and there was no
   /v1/premium/content/:id route to deny an anonymous request to. That
   confirms this test actually exercises the fixed behavior, not a facade.

   Run with: node tests/test_premium_content_not_public.js
   ========================================================================== */

const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const { createBff } = require(path.join(root, 'bff', 'src', 'app.js'));
const { PREMIUM_CONTENT } = require(path.join(root, 'bff', 'src', 'premium-content.js'));
const { MemorySessionStore } = require(path.join(root, 'bff', 'src', 'session-store.js'));

let passed = 0;
function test(name, fn) { fn(); passed++; console.log('PASS -', name); }
async function testAsync(name, fn) { await fn(); passed++; console.log('PASS -', name); }

// A handful of distinctive strings from the real authored content — picked
// so a coincidental match (e.g. a generic word) can never pass this check.
// One per lesson, plus one correct-quiz-answer marker per lesson so a leak
// that kept the prose but renamed ids/blocks is still caught.
const SECRET_MARKERS = [
  { lesson: 'P2.1', text: 'Before the trade, define the risk.' },
  { lesson: 'P2.1', text: 'Une invalidation claire permet de définir une limite de risque mesurable' },
  { lesson: 'P2.2', text: 'Un trade contrôlé se construit dans cet ordre' },
  { lesson: 'P2.2', text: 'Une décision contrôlée relie contexte, setup, entrée, invalidation, risque, objectif puis revue.' },
  { lesson: 'LAB4', text: 'Produire un document complet, en quatre étapes' },
  { lesson: 'LAB4', text: 'Elle relie un événement déclencheur à une action qui se répète toujours de la même façon.' },
  { lesson: 'LABCAP', text: 'Ton projet : une page de présentation prête à partager' },
  { lesson: 'LABCAP', text: 'J’ai comparé mon texte final à la grille d’auto-évaluation et corrigé ce qui manquait' }
];

// --- Static files: the real text must never be present again --------------

const DIST_FILES_TO_CHECK = ['p2-lessons.js', 'dda-lab.js', 'app.js', 'bff-client.js', 'dda-lazy-modules.js'];
const distSources = Object.fromEntries(DIST_FILES_TO_CHECK.map(name => [name, fs.readFileSync(path.join(root, 'dist', name), 'utf8')]));

test('every secret marker is present, verbatim, in bff/src/premium-content.js (the one place it may live)', () => {
  const premiumContentSource = fs.readFileSync(path.join(root, 'bff', 'src', 'premium-content.js'), 'utf8');
  SECRET_MARKERS.forEach(({ lesson, text }) => {
    assert.ok(premiumContentSource.includes(text), `${lesson}: expected marker text not found in bff/src/premium-content.js — update this test's markers if the authored content legitimately changed`);
  });
});

test('no public dist/*.js file ever contains a real P2.1/P2.2/LAB4/LABCAP secret marker', () => {
  for (const [file, source] of Object.entries(distSources)) {
    SECRET_MARKERS.forEach(({ lesson, text }) => {
      assert.ok(!source.includes(text), `dist/${file} must never contain ${lesson}'s real authored text ("${text.slice(0, 40)}…") — this is exactly the leak mandate §6 closed`);
    });
  }
});

test('dist/p2-lessons.js and dist/dda-lab.js ship no embedded lesson/quiz data structures any more', () => {
  // Pre-Lot-2, both files declared `id: 'P2.1'` / `id: 'LAB4'` etc. directly
  // as part of a returned data literal. Post-fix, those ids only ever
  // appear as plain strings passed to fetchPremiumContent(...) — this
  // checks the specific `id: '<ID>'` object-literal pattern is gone, not
  // just the id string itself (which legitimately still appears, e.g.
  // `fetchPremiumContent('P2.1')`).
  ['P2.1', 'P2.2'].forEach(id => assert.doesNotMatch(distSources['p2-lessons.js'], new RegExp(`id:\\s*'${id.replace('.', '\\.')}'`), `dist/p2-lessons.js must not declare a ${id} data literal`));
  ['LAB4', 'LABCAP'].forEach(id => assert.doesNotMatch(distSources['dda-lab.js'], new RegExp(`id:\\s*'${id}'[^}]*\\bblocks:\\s*Object\\.freeze\\(\\[\\s*Object\\.freeze`), `dist/dda-lab.js must not declare ${id}'s real (non-empty) blocks array`));
});

// --- Live server: an anonymous request must never see real content --------

function request(server, requestPath) {
  return new Promise((resolve, reject) => {
    const req = http.request({ ...server.address(), method: 'GET', path: requestPath, headers: { Origin: 'http://localhost:8744' } }, res => {
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
    config: { allowedOrigins: ['http://localhost:8744'], secureCookies: true, sessionIdleMs: 60 * 60 * 1000, sessionAbsoluteMs: 24 * 60 * 60 * 1000, sessionEncryptionKey: null, emailRedirectTo: 'http://localhost:8744/access', passwordRecoveryRedirectTo: 'http://localhost:8744/access?type=recovery' },
    clock: () => new Date('2026-09-28T00:00:00.000Z')
  });
  const server = http.createServer(handler);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    await testAsync('an anonymous request (no session cookie at all) to /v1/premium/content/:id is rejected before any content is ever sent, for every lesson including the free-preview one', async () => {
      for (const id of ['P2.1', 'P2.2', 'LAB4', 'LABCAP']) {
        const response = await request(server, `/v1/premium/content/${encodeURIComponent(id)}`);
        assert.equal(response.status, 401, `${id}: an anonymous request must be denied (401), never served real content`);
        SECRET_MARKERS.filter(m => m.lesson === id).forEach(({ text }) => assert.ok(!response.body.includes(text), `${id}: the real authored text must never appear in an anonymous response body`));
      }
    });

    await testAsync('the content actually served to a genuinely entitled session matches bff/src/premium-content.js exactly, proving the route is real (not a stub that happens to also deny anonymous callers)', async () => {
      // A second server with a session store seeded with one active premium
      // session, to prove the 401s above are a real auth check, not a
      // route that always 404s/501s regardless of the caller.
      const entitledAuth = { async getUser(userId) { return { user_id: userId, email: 'a@example.com', email_verified: true, display_name: 'A', status: 'active', entitlements: [] }; } };
      const entitledSessions = new MemorySessionStore();
      const row = await entitledSessions.create({ user_id: 'user-1', token_hash: require('node:crypto').createHash('sha256').update('t').digest('hex'), provider_access_token_enc: null, provider_refresh_token_enc: null, user_agent: 'test', ip_hash: 'x', created_at: new Date().toISOString(), last_seen_at: new Date().toISOString(), expires_at: new Date(Date.now() + 86400000).toISOString() });
      assert.ok(row, 'session row created');
      const entitlements = { async getForUser() { return { membership: { plan: 'premium', status: 'active', ends_at: null, revoked_at: null }, entitlements: ['premium_track'] }; } };
      const entitledHandler = createBff({
        auth: entitledAuth, sessions: entitledSessions, entitlements,
        config: { allowedOrigins: ['http://localhost:8744'], secureCookies: true, sessionIdleMs: 60 * 60 * 1000, sessionAbsoluteMs: 24 * 60 * 60 * 1000, sessionEncryptionKey: null, emailRedirectTo: 'http://localhost:8744/access', passwordRecoveryRedirectTo: 'http://localhost:8744/access?type=recovery' },
        clock: () => new Date('2026-09-28T00:00:00.000Z')
      });
      const entitledServer = http.createServer(entitledHandler);
      await new Promise(resolve => entitledServer.listen(0, '127.0.0.1', resolve));
      try {
        const response = await new Promise((resolve, reject) => {
          const req = http.request({ ...entitledServer.address(), method: 'GET', path: '/v1/premium/content/LAB4', headers: { Origin: 'http://localhost:8744', Cookie: '__Host-dda_session=t' } }, res => {
            let text = ''; res.on('data', c => { text += c; }); res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(text) }));
          });
          req.on('error', reject); req.end();
        });
        assert.equal(response.status, 200);
        assert.deepEqual(response.body.lesson, PREMIUM_CONTENT.LAB4, 'the route serves exactly the content held in bff/src/premium-content.js — proving it is the real route, not a stub');
      } finally {
        await new Promise(resolve => entitledServer.close(resolve));
      }
    });

    console.log(`\nRESULT: ${passed} premium-content anti-leak checks passed`);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
})();
