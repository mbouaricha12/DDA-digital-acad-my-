'use strict';

/* Unit contract for PostgrestCommunityStore — the layer that talks to
 * Supabase directly. Covers: listRecent() only returns well-shaped rows
 * (never crashes on a malformed row), createPost() validates body length
 * and rejects empty bodies before ever calling the network, and a failed
 * Supabase response never resolves to a fabricated post. */
const assert = require('node:assert/strict');
const { PostgrestCommunityStore } = require('../bff/src/community-store');

(async () => {
  let passed = 0;
  async function test(name, fn) {
    try { await fn(); passed++; console.log(`  ok — ${name}`); }
    catch (error) { console.log(`  FAIL — ${name}\n    ${error.stack}`); process.exitCode = 1; }
  }

  await test('listRecent() filters out malformed rows instead of crashing', async () => {
    const fetchImpl = async () => ({ ok: true, async text() { return JSON.stringify([
      { post_id: 'p1', author_display_name: 'Ada', body: 'Bonjour', created_at: '2026-11-14T00:00:00.000Z' },
      { post_id: null, body: 'invalid row' },
      { author_display_name: 'No id' }
    ]); } });
    const store = new PostgrestCommunityStore({ supabaseUrl: 'https://example.supabase.co', serviceRoleKey: 'key', fetchImpl });
    const rows = await store.listRecent({ limit: 10 });
    assert.equal(rows.length, 1);
    assert.equal(rows[0].id, 'p1');
  });

  await test('createPost() rejects an empty body without ever calling the network', async () => {
    let called = false;
    const fetchImpl = async () => { called = true; return { ok: true, async text() { return '[]'; } }; };
    const store = new PostgrestCommunityStore({ supabaseUrl: 'https://example.supabase.co', serviceRoleKey: 'key', fetchImpl });
    await assert.rejects(() => store.createPost({ userId: 'u1', authorDisplayName: 'Ada', body: '   ' }), /invalid_body/);
    assert.equal(called, false, 'an invalid body must never reach the network');
  });

  await test('createPost() rejects a body over 1000 characters', async () => {
    const store = new PostgrestCommunityStore({ supabaseUrl: 'https://example.supabase.co', serviceRoleKey: 'key', fetchImpl: async () => ({ ok: true, async text() { return '[]'; } }) });
    await assert.rejects(() => store.createPost({ userId: 'u1', authorDisplayName: 'Ada', body: 'x'.repeat(1001) }), /invalid_body/);
  });

  await test('createPost() surfaces a Supabase failure as a thrown error, never a fabricated post', async () => {
    const fetchImpl = async () => ({ ok: false, status: 500, async text() { return '{}'; } });
    const store = new PostgrestCommunityStore({ supabaseUrl: 'https://example.supabase.co', serviceRoleKey: 'key', fetchImpl });
    await assert.rejects(() => store.createPost({ userId: 'u1', authorDisplayName: 'Ada', body: 'Hello' }), /community_post_create_failed/);
  });

  await test('createPost() sends the trimmed body and a safe fallback display name', async () => {
    let sentBody;
    const fetchImpl = async (url, options) => { sentBody = JSON.parse(options.body); return { ok: true, async text() { return JSON.stringify([{ post_id: 'p2', author_display_name: sentBody.author_display_name, body: sentBody.body, created_at: '2026-11-14T00:00:00.000Z' }]); } }; };
    const store = new PostgrestCommunityStore({ supabaseUrl: 'https://example.supabase.co', serviceRoleKey: 'key', fetchImpl });
    await store.createPost({ userId: 'u1', authorDisplayName: '  ', body: '  Ma première observation.  ' });
    assert.equal(sentBody.body, 'Ma première observation.');
    assert.equal(sentBody.author_display_name, 'Apprenant DDA');
  });

  console.log(`\n${passed}/5 community store unit checks passed`);
  if (passed !== 5) process.exit(1);
})();
