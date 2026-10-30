'use strict';

// Lot J (DDA Product & Conversion Alignment Audit, §5) — lesson_progress and
// onboarding already existed in supabase/migrations/0002_business_entities.sql
// and were already applied in production, but the BFF only ever read them
// for account export/deletion. Nothing wrote to them during normal use, so a
// learner's progress lived exclusively in localStorage and vanished on any
// cache clear or device change. This covers the new read/write routes
// (bff/src/app.js) and the Postgrest store's request shape (bff/src/progress-store.js).

const assert = require('node:assert/strict');
const http = require('node:http');
const { createBff, SESSION_COOKIE, CSRF_COOKIE } = require('../bff/src/app');
const { MemorySessionStore } = require('../bff/src/session-store');
const { PostgrestProgressStore } = require('../bff/src/progress-store');

function makeAuth() {
  return {
    async getUser(userId) { return { user_id: userId, email: 'a@example.com', email_verified: true, display_name: 'A', status: 'active', entitlements: [] }; }
  };
}

// In-memory stand-in for PostgrestProgressStore, scoped like the real one by
// owner_id — a user can never read or write another user's rows through it.
function makeProgressStore() {
  const lessons = new Map(); // `${ownerId}\0${lessonId}` -> row
  const onboarding = new Map(); // ownerId -> row
  return {
    calls: [],
    async listLessons(ownerId) {
      return [...lessons.entries()].filter(([key]) => key.startsWith(`${ownerId}\0`)).map(([, row]) => row);
    },
    async getOnboarding(ownerId) { return onboarding.get(ownerId) || null; },
    async upsertLesson(ownerId, input) {
      this.calls.push(['upsertLesson', ownerId, input]);
      const row = { lesson_id: input.lessonId, lesson_viewed: input.lessonViewed, exercise_complete: input.exerciseComplete, quiz_complete: input.quizComplete };
      lessons.set(`${ownerId}\0${input.lessonId}`, row);
      return row;
    },
    async upsertOnboarding(ownerId, input) {
      this.calls.push(['upsertOnboarding', ownerId, input]);
      const row = { level: input.level, goal: input.goal, time: input.time, complete: input.complete };
      onboarding.set(ownerId, row);
      return row;
    }
  };
}

function request(server, method, path, { body, headers = {}, cookies = {} } = {}) {
  return new Promise((resolve, reject) => {
    const cookie = Object.entries(cookies).map(([key, value]) => `${key}=${encodeURIComponent(value)}`).join('; ');
    const req = http.request({ ...server.address(), method, path, headers: { Origin: 'http://localhost:8744', ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(cookie ? { Cookie: cookie } : {}), ...headers } }, res => {
      let text = ''; res.on('data', chunk => { text += chunk; }); res.on('end', () => resolve({ status: res.statusCode, body: text ? JSON.parse(text) : null }));
    });
    req.on('error', reject);
    if (body !== undefined) req.write(JSON.stringify(body));
    req.end();
  });
}

(async () => {
  const auth = makeAuth();
  const sessions = new MemorySessionStore();
  const progressStore = makeProgressStore();
  const config = { allowedOrigins: ['http://localhost:8744'], secureCookies: true, sessionIdleMs: 60 * 60 * 1000, sessionAbsoluteMs: 24 * 60 * 60 * 1000, sessionEncryptionKey: null, emailRedirectTo: 'http://localhost:8744/access' };
  const handler = createBff({ auth, sessions, progressStore, config, clock: () => new Date('2026-10-30T00:00:00.000Z') });
  const server = http.createServer(handler);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));

  async function createAuthedSession(userId) {
    const now = new Date('2026-10-30T00:00:00.000Z');
    const row = await sessions.create({ user_id: userId, token_hash: require('crypto').createHash('sha256').update('tok-' + userId).digest('hex'), provider_access_token_enc: null, provider_refresh_token_enc: null, user_agent: 'test', ip_hash: 'x', created_at: now.toISOString(), last_seen_at: now.toISOString(), expires_at: new Date(now.getTime() + 86400000).toISOString() });
    return { token: 'tok-' + userId, row };
  }

  // No progressStore configured at all → 503, never a silent empty success.
  const noStoreSessions = new MemorySessionStore();
  const noStoreHandler = createBff({ auth, sessions: noStoreSessions, config, clock: () => new Date('2026-10-30T00:00:00.000Z') });
  const noStoreServer = http.createServer(noStoreHandler);
  await new Promise(resolve => noStoreServer.listen(0, '127.0.0.1', resolve));
  try {
    const now = new Date('2026-10-30T00:00:00.000Z');
    await noStoreSessions.create({ user_id: 'user-no-store', token_hash: require('crypto').createHash('sha256').update('tok-no-store').digest('hex'), provider_access_token_enc: null, provider_refresh_token_enc: null, user_agent: 'test', ip_hash: 'x', created_at: now.toISOString(), last_seen_at: now.toISOString(), expires_at: new Date(now.getTime() + 86400000).toISOString() });
    const response = await request(noStoreServer, 'GET', '/v1/progress', { cookies: { [SESSION_COOKIE]: 'tok-no-store' } });
    assert.equal(response.status, 503, 'progress sync must fail loudly, not silently, when unconfigured');
  } finally {
    await new Promise(resolve => noStoreServer.close(resolve));
  }

  try {
    const { token: userAToken } = await createAuthedSession('user-a');

    let response = await request(server, 'GET', '/v1/progress');
    assert.equal(response.status, 401, 'progress requires authentication');

    response = await request(server, 'GET', '/v1/progress', { cookies: { [SESSION_COOKIE]: userAToken } });
    assert.equal(response.status, 200);
    assert.deepEqual(response.body, { lessons: {}, onboarding: null }, 'a fresh account has no server progress yet — never fabricated');

    response = await request(server, 'PUT', '/v1/progress/lesson', { cookies: { [SESSION_COOKIE]: userAToken }, body: { lessonId: 'M0.1', lessonViewed: true } });
    assert.equal(response.status, 403, 'a mutating progress write requires CSRF just like /v1/me');

    // Issue a CSRF token the same way the app does, then reuse it as both cookie and header.
    const issued = await new Promise((resolve, reject) => {
      const req = http.request({ ...server.address(), method: 'GET', path: '/v1/security/csrf', headers: { Origin: 'http://localhost:8744', Cookie: `${SESSION_COOKIE}=${userAToken}` } }, res => { res.resume(); res.on('end', () => resolve(res.headers['set-cookie'])); });
      req.on('error', reject); req.end();
    });
    const csrfToken = decodeURIComponent(issued.find(v => v.startsWith(`${CSRF_COOKIE}=`)).split(';')[0].split('=')[1]);

    response = await request(server, 'PUT', '/v1/progress/lesson', {
      cookies: { [SESSION_COOKIE]: userAToken, [CSRF_COOKIE]: csrfToken },
      headers: { 'X-CSRF-Token': csrfToken },
      body: { lessonId: 'not valid!!', lessonViewed: true }
    });
    assert.equal(response.status, 400, 'a malformed lessonId is rejected before reaching the store');

    response = await request(server, 'PUT', '/v1/progress/lesson', {
      cookies: { [SESSION_COOKIE]: userAToken, [CSRF_COOKIE]: csrfToken },
      headers: { 'X-CSRF-Token': csrfToken },
      body: { lessonId: 'M0.1', lessonViewed: true, exerciseComplete: true, quizComplete: false }
    });
    assert.equal(response.status, 200);
    assert.deepEqual(response.body, { lessonId: 'M0.1', lessonViewed: true, exerciseComplete: true, quizComplete: false });

    response = await request(server, 'PUT', '/v1/progress/onboarding', {
      cookies: { [SESSION_COOKIE]: userAToken, [CSRF_COOKIE]: csrfToken },
      headers: { 'X-CSRF-Token': csrfToken },
      body: { level: 'beginner', goal: 'markets', time: '30min', complete: true }
    });
    assert.equal(response.status, 200);
    assert.deepEqual(response.body, { level: 'beginner', goal: 'markets', time: '30min', complete: true });

    response = await request(server, 'GET', '/v1/progress', { cookies: { [SESSION_COOKIE]: userAToken } });
    assert.equal(response.status, 200);
    assert.deepEqual(response.body, {
      lessons: { 'M0.1': { lessonViewed: true, exerciseComplete: true, quizComplete: false } },
      onboarding: { level: 'beginner', goal: 'markets', time: '30min', complete: true }
    });

    // A second account must never see the first account's progress.
    const { token: userBToken } = await createAuthedSession('user-b');
    response = await request(server, 'GET', '/v1/progress', { cookies: { [SESSION_COOKIE]: userBToken } });
    assert.equal(response.status, 200);
    assert.deepEqual(response.body, { lessons: {}, onboarding: null }, 'progress must be scoped per account, never shared');

    console.log('test_progress_sync.js: route assertions passed');
  } finally {
    server.close();
  }
})();

// --- bff/src/progress-store.js: the Postgrest request shape itself ---

(async () => {
  const calls = [];
  const store = new PostgrestProgressStore({
    supabaseUrl: 'https://project.supabase.co',
    serviceRoleKey: 'service-role-key',
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      if (options.method === 'GET') return { ok: true, async text() { return url.includes('lesson_progress') ? '[{"lesson_id":"M0.1","lesson_viewed":true,"exercise_complete":false,"quiz_complete":false}]' : '[{"level":"beginner","goal":"markets","time":"30min","complete":true}]'; } };
      return { ok: true, async text() { return JSON.stringify([JSON.parse(options.body)[0]]); } };
    }
  });

  await store.listLessons('user-a');
  assert.equal(calls[0].url, 'https://project.supabase.co/rest/v1/lesson_progress?owner_id=eq.user-a&select=lesson_id,lesson_viewed,exercise_complete,quiz_complete,updated_at');
  assert.equal(calls[0].options.headers.Authorization, 'Bearer service-role-key');

  await store.getOnboarding('user-a');
  assert.equal(calls[1].url, 'https://project.supabase.co/rest/v1/onboarding?owner_id=eq.user-a&select=level,goal,time,complete,updated_at&limit=1');

  await store.upsertLesson('user-a', { lessonId: 'M0.2', lessonViewed: true, exerciseComplete: true, quizComplete: true });
  assert.equal(calls[2].url, 'https://project.supabase.co/rest/v1/lesson_progress?on_conflict=owner_id,lesson_id');
  assert.equal(calls[2].options.headers.Prefer, 'resolution=merge-duplicates,return=representation');
  assert.deepEqual(JSON.parse(calls[2].options.body), [{ owner_id: 'user-a', lesson_id: 'M0.2', lesson_viewed: true, exercise_complete: true, quiz_complete: true }]);

  await store.upsertOnboarding('user-a', { level: 'beginner', goal: 'markets', time: '30min', complete: true });
  assert.equal(calls[3].url, 'https://project.supabase.co/rest/v1/onboarding?on_conflict=owner_id');
  assert.deepEqual(JSON.parse(calls[3].options.body), [{ owner_id: 'user-a', level: 'beginner', goal: 'markets', time: '30min', complete: true }]);

  const failing = new PostgrestProgressStore({ supabaseUrl: 'https://project.supabase.co', serviceRoleKey: 'k', fetchImpl: async () => ({ ok: false, status: 500, async text() { return ''; } }) });
  await assert.rejects(() => failing.listLessons('user-a'), /progress store error 500/);

  console.log('test_progress_sync.js: store request-shape assertions passed');
})();
