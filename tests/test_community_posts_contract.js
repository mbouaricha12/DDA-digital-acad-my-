'use strict';

/*
 * Lot 7 (Communauté — fil de posts) — contract for GET/POST
 * /v1/community/posts. Covers: unconfigured store fails closed with 503
 * (never a fake/simulated feed), auth is required for both read and write,
 * CSRF is required for write, the post author is always the authenticated
 * session user (never a client-supplied id — a privilege/impersonation
 * guard), invalid body is rejected with 400, a store failure is reported
 * honestly as 502 (never a fake success), and per-user rate limiting
 * exists on posting.
 */
const assert = require('node:assert/strict');
const http = require('node:http');
const { createBff, SESSION_COOKIE, CSRF_COOKIE } = require('../bff/src/app');
const { MemorySessionStore } = require('../bff/src/session-store');

function makeAuth() {
  return {
    async login({ email }) { return { user: { id: '11111111-1111-4111-8111-111111111111' }, access_token: 'a', refresh_token: 'r' }; },
    async getUser(userId) { return { user_id: userId, email: 'ada@example.com', email_verified: true, display_name: 'Ada Lovelace', status: 'active', entitlements: [] }; }
  };
}

function request(server, method, path, { body, headers = {}, cookies = {} } = {}) {
  return new Promise((resolve, reject) => {
    const cookie = Object.entries(cookies).map(([key, value]) => `${key}=${encodeURIComponent(value)}`).join('; ');
    const req = http.request({ ...server.address(), method, path, headers: { Origin: 'http://localhost:8745', ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(cookie ? { Cookie: cookie } : {}), ...headers } }, res => {
      let text = ''; res.on('data', chunk => { text += chunk; }); res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: text ? JSON.parse(text) : null }));
    });
    req.on('error', reject); if (body !== undefined) req.write(JSON.stringify(body)); req.end();
  });
}

const baseConfig = { allowedOrigins: ['http://localhost:8745'], secureCookies: true, sessionIdleMs: 60 * 60 * 1000, sessionAbsoluteMs: 24 * 60 * 60 * 1000, sessionEncryptionKey: null, emailRedirectTo: 'http://localhost:8745/access', passwordRecoveryRedirectTo: 'http://localhost:8745/access?type=recovery' };

async function login(server) {
  const login = await request(server, 'POST', '/v1/auth/login', { body: { email: 'ada@example.com', password: 'long-enough-password' } });
  const setCookies = [].concat(login.headers['set-cookie'] || []);
  const sessionCookie = decodeURIComponent(setCookies.find(v => v.startsWith(`${SESSION_COOKIE}=`)).split(';')[0].split('=')[1]);
  const csrfCookie = decodeURIComponent(setCookies.find(v => v.startsWith(`${CSRF_COOKIE}=`)).split(';')[0].split('=')[1]);
  return { sessionCookie, csrfCookie };
}

(async () => {
  let passed = 0;
  async function test(name, fn) {
    try { await fn(); passed++; console.log(`  ok — ${name}`); }
    catch (error) { console.log(`  FAIL — ${name}\n    ${error.stack}`); process.exitCode = 1; }
  }

  await test('unconfigured community store fails closed with 503 on both GET and POST — never a fake feed', async () => {
    const auth = makeAuth();
    const sessions = new MemorySessionStore();
    const handler = createBff({ auth, sessions, config: baseConfig });
    const server = http.createServer(handler);
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    try {
      const { sessionCookie, csrfCookie } = await login(server);
      const getResp = await request(server, 'GET', '/v1/community/posts', { cookies: { [SESSION_COOKIE]: sessionCookie } });
      assert.equal(getResp.status, 503);
      assert.equal(getResp.body.code, 'community_unavailable');
      const postResp = await request(server, 'POST', '/v1/community/posts', { cookies: { [SESSION_COOKIE]: sessionCookie, [CSRF_COOKIE]: csrfCookie }, headers: { 'X-CSRF-Token': csrfCookie }, body: { body: 'Hello' } });
      assert.equal(postResp.status, 503);
    } finally { server.close(); }
  });

  await test('unauthenticated GET and POST are rejected before anything else', async () => {
    const auth = makeAuth();
    const sessions = new MemorySessionStore();
    const communityStore = { listRecent: async () => [], createPost: async () => ({}) };
    const handler = createBff({ auth, sessions, config: baseConfig, communityStore });
    const server = http.createServer(handler);
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    try {
      assert.equal((await request(server, 'GET', '/v1/community/posts')).status, 401);
      assert.equal((await request(server, 'POST', '/v1/community/posts', { body: { body: 'Hi' } })).status, 401);
    } finally { server.close(); }
  });

  await test('authenticated POST with missing/invalid CSRF is rejected', async () => {
    const auth = makeAuth();
    const sessions = new MemorySessionStore();
    const communityStore = { listRecent: async () => [], createPost: async () => ({}) };
    const handler = createBff({ auth, sessions, config: baseConfig, communityStore });
    const server = http.createServer(handler);
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    try {
      const { sessionCookie } = await login(server);
      const resp = await request(server, 'POST', '/v1/community/posts', { cookies: { [SESSION_COOKIE]: sessionCookie }, headers: { 'X-CSRF-Token': 'wrong' }, body: { body: 'Hi' } });
      assert.equal(resp.status, 403);
      assert.equal(resp.body.code, 'csrf_failed');
    } finally { server.close(); }
  });

  await test('a real post: the author is always the session user, never a client-supplied id (impersonation guard)', async () => {
    const auth = makeAuth();
    const sessions = new MemorySessionStore();
    const createCalls = [];
    const communityStore = {
      listRecent: async () => [],
      createPost: async (args) => { createCalls.push(args); return { id: 'post-1', authorDisplayName: args.authorDisplayName, body: args.body, createdAt: '2026-11-14T00:00:00.000Z' }; }
    };
    const handler = createBff({ auth, sessions, config: baseConfig, communityStore });
    const server = http.createServer(handler);
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    try {
      const { sessionCookie, csrfCookie } = await login(server);
      const resp = await request(server, 'POST', '/v1/community/posts', {
        cookies: { [SESSION_COOKIE]: sessionCookie, [CSRF_COOKIE]: csrfCookie },
        headers: { 'X-CSRF-Token': csrfCookie },
        body: { body: 'Ma première observation sur le marché.', userId: '00000000-0000-4000-8000-attacker0000' }
      });
      assert.equal(resp.status, 201);
      assert.equal(resp.body.post.body, 'Ma première observation sur le marché.');
      assert.equal(createCalls.length, 1);
      assert.equal(createCalls[0].userId, '11111111-1111-4111-8111-111111111111', 'the real session user_id is used, never the client-supplied one');
      assert.equal(createCalls[0].authorDisplayName, 'Ada Lovelace');
    } finally { server.close(); }
  });

  await test('an empty or missing post body is rejected with 400, never silently accepted', async () => {
    const auth = makeAuth();
    const sessions = new MemorySessionStore();
    const communityStore = { listRecent: async () => [], createPost: async () => { throw Object.assign(new Error('community_post_invalid_body'), { status: 400 }); } };
    const handler = createBff({ auth, sessions, config: baseConfig, communityStore });
    const server = http.createServer(handler);
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    try {
      const { sessionCookie, csrfCookie } = await login(server);
      const resp = await request(server, 'POST', '/v1/community/posts', { cookies: { [SESSION_COOKIE]: sessionCookie, [CSRF_COOKIE]: csrfCookie }, headers: { 'X-CSRF-Token': csrfCookie }, body: { body: '' } });
      assert.equal(resp.status, 400);
      assert.equal(resp.body.code, 'community_post_invalid_body');
    } finally { server.close(); }
  });

  await test('a store failure is reported honestly as 502, never a fabricated success', async () => {
    const auth = makeAuth();
    const sessions = new MemorySessionStore();
    const communityStore = { listRecent: async () => [], createPost: async () => { throw new Error('network down'); } };
    const handler = createBff({ auth, sessions, config: baseConfig, communityStore });
    const server = http.createServer(handler);
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    try {
      const { sessionCookie, csrfCookie } = await login(server);
      const resp = await request(server, 'POST', '/v1/community/posts', { cookies: { [SESSION_COOKIE]: sessionCookie, [CSRF_COOKIE]: csrfCookie }, headers: { 'X-CSRF-Token': csrfCookie }, body: { body: 'Hello' } });
      assert.equal(resp.status, 502);
      assert.equal(resp.body.code, 'community_post_failed');
    } finally { server.close(); }
  });

  await test('per-user rate limiting applies to posting', async () => {
    const auth = makeAuth();
    const sessions = new MemorySessionStore();
    const communityStore = { listRecent: async () => [], createPost: async (args) => ({ id: 'p', authorDisplayName: args.authorDisplayName, body: args.body, createdAt: '2026-11-14T00:00:00.000Z' }) };
    const postCalls = [];
    const rateLimiter = { async allow(key) { if (!key.startsWith('community_post:')) return true; postCalls.push(key); return postCalls.length <= 10; } };
    const handler = createBff({ auth, sessions, rateLimiter, config: baseConfig, communityStore });
    const server = http.createServer(handler);
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    try {
      const { sessionCookie, csrfCookie } = await login(server);
      let lastStatus;
      for (let i = 0; i < 11; i++) {
        const resp = await request(server, 'POST', '/v1/community/posts', { cookies: { [SESSION_COOKIE]: sessionCookie, [CSRF_COOKIE]: csrfCookie }, headers: { 'X-CSRF-Token': csrfCookie }, body: { body: `Post ${i}` } });
        lastStatus = resp.status;
      }
      assert.equal(lastStatus, 429);
    } finally { server.close(); }
  });

  await test('GET returns the real list from the store, shaped for the frontend', async () => {
    const auth = makeAuth();
    const sessions = new MemorySessionStore();
    const communityStore = { listRecent: async () => [{ id: 'p1', authorDisplayName: 'Ada Lovelace', body: 'Première leçon terminée.', createdAt: '2026-11-14T08:00:00.000Z' }], createPost: async () => ({}) };
    const handler = createBff({ auth, sessions, config: baseConfig, communityStore });
    const server = http.createServer(handler);
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    try {
      const { sessionCookie } = await login(server);
      const resp = await request(server, 'GET', '/v1/community/posts', { cookies: { [SESSION_COOKIE]: sessionCookie } });
      assert.equal(resp.status, 200);
      assert.equal(resp.body.posts.length, 1);
      assert.equal(resp.body.posts[0].body, 'Première leçon terminée.');
    } finally { server.close(); }
  });

  console.log(`\n${passed}/8 community posts contract checks passed`);
  if (passed !== 8) process.exit(1);
})();
