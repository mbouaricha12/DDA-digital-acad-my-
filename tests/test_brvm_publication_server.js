'use strict';

const assert = require('node:assert/strict');
const http = require('node:http');
const { PostgrestBrvmPublicationStore } = require('../bff/src/brvm-publication-store');
const { createBff } = require('../bff/src/app');
const { MemorySessionStore } = require('../bff/src/session-store');

const now = new Date('2026-10-18T12:00:00.000Z');
const validRow = {
  id: 'doc-test-1', title: 'Publication de test', source: 'Institution de test',
  source_url: 'https://source.test/', document_url: 'https://source.test/document-test.pdf',
  reference_date: '2026-10-15', retrieved_at: '2026-10-17T12:00:00.000Z',
  fresh_until: '2026-11-17T12:00:00.000Z'
};

function fakeResponse(status, body) {
  return { ok: status >= 200 && status < 300, status, async text() { return typeof body === 'string' ? body : JSON.stringify(body); } };
}
function fakeFetchFor(rows, status = 200) {
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url, options });
    return fakeResponse(status, rows);
  };
  return { calls, fetchImpl };
}
function request(server, path) {
  return new Promise((resolve, reject) => {
    const req = http.request({ ...server.address(), method: 'GET', path, headers: { Origin: 'http://localhost:8744' } }, res => {
      let text = '';
      res.on('data', chunk => { text += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: text ? JSON.parse(text) : null }));
    });
    req.on('error', reject);
    req.end();
  });
}
async function serve(options, fn) {
  const handler = createBff({
    auth: {}, sessions: new MemorySessionStore(),
    config: { allowedOrigins: ['http://localhost:8744'], secureCookies: true, sessionIdleMs: 3600000, sessionAbsoluteMs: 86400000, sessionEncryptionKey: null, emailRedirectTo: 'http://localhost:8744/access' },
    ...options
  });
  const server = http.createServer(handler);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try { await fn(server); } finally { await new Promise(resolve => server.close(resolve)); }
}

(async () => {
  const fake = fakeFetchFor([
    validRow,
    { ...validRow, id: 'expired', fresh_until: '2026-10-17T00:00:00.000Z' },
    { ...validRow, id: 'insecure', document_url: 'http://source.test/document.pdf' },
    { ...validRow, id: 'future-retrieval', retrieved_at: '2026-10-19T00:00:00.000Z' },
    null
  ]);
  const store = new PostgrestBrvmPublicationStore({ supabaseUrl: 'https://project.supabase.co/', serviceRoleKey: 'service-role-test-key', fetchImpl: fake.fetchImpl, clock: () => now });
  const items = await store.listPublished();
  assert.equal(items.length, 1, 'only complete, HTTPS, current rows from the public projection survive the server-side filter');
  assert.equal(items[0].verificationStatus, 'verified');
  assert.equal(items[0].freshnessStatus, 'current');
  assert.equal(items[0].redistributionRights, 'authorized');
  assert.match(fake.calls[0].url, /\/rest\/v1\/dda_brvm_publications\?/);
  assert.equal(fake.calls[0].options.headers.Authorization, 'Bearer service-role-test-key');

  await serve({ brvmPublicationStore: { async listPublished() { return items; } } }, async server => {
    const response = await request(server, '/v1/publications/brvm');
    assert.equal(response.status, 200, 'a public read needs no learner cookie');
    assert.deepEqual(response.body, { items });
    assert.equal(response.headers['cache-control'], 'no-store');
    assert.equal(response.headers['set-cookie'], undefined);
  });

  await serve({}, async server => {
    const response = await request(server, '/v1/publications/brvm');
    assert.equal(response.status, 503, 'missing database adapter is unavailable, not a successful empty registry');
    assert.equal(response.body.code, 'publications_unavailable');
  });

  await serve({ brvmPublicationStore: { async listPublished() { throw new Error('private document payload'); } } }, async server => {
    const response = await request(server, '/v1/publications/brvm');
    assert.equal(response.status, 500, 'a database failure never becomes an empty success');
    assert.doesNotMatch(JSON.stringify(response.body), /private document payload/);
  });

  console.log('BRVM publication server/store fail-closed contract: PASS');
})().catch(error => { console.error(error); process.exitCode = 1; });
