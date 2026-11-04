'use strict';

// DDA AI contract (mandat §DDA-AI): the Anthropic adapter enforces the
// pedagogical system prompt and never throws on the expected "provider
// unavailable" case, and the BFF route fails closed (503 ai_not_configured)
// when no key is configured — the same honest pattern as Chariow billing
// and the broker registry. This file never talks to the real Anthropic API;
// every provider call is a local mock.

const assert = require('node:assert/strict');
const http = require('node:http');
const { createBff, SESSION_COOKIE, CSRF_COOKIE } = require('../bff/src/app');
const { MemorySessionStore } = require('../bff/src/session-store');
const { AnthropicAiAssistant, validateAskRequest, SYSTEM_PROMPT } = require('../bff/src/ai-assistant');

function makeAuth() {
  return {
    async login() { return { user: { id: 'user-1' }, access_token: 'access-token', refresh_token: 'refresh-token' }; },
    async getUser(userId) { return { user_id: userId, email: 'a@example.com', email_verified: true, display_name: 'A', status: 'active', entitlements: [] }; }
  };
}

(async () => {
  // Unit: the system prompt forbids every category the mandate names.
  for (const forbidden of [/signal/i, /promesse/i, /conseill(er)? financier/i]) {
    assert.match(SYSTEM_PROMPT, forbidden, `system prompt must address ${forbidden}`);
  }

  // Unit: request validation.
  assert.equal(validateAskRequest({}).error, 'message is required.');
  assert.equal(validateAskRequest({ message: '   ' }).error, 'message cannot be empty.');
  assert.match(validateAskRequest({ message: 'x'.repeat(2001) }).error, /2000 characters/);
  const ok = validateAskRequest({ message: 'Qu’est-ce qu’un support ?', history: [{ role: 'user', content: 'bonjour' }, { role: 'system', content: 'dropped' }, { role: 'assistant', content: 'salut' }] });
  assert.equal(ok.message, 'Qu’est-ce qu’un support ?');
  assert.deepEqual(ok.history, [{ role: 'user', content: 'bonjour' }, { role: 'assistant', content: 'salut' }], 'an invalid-role turn is dropped, never forwarded');

  // Unit: the adapter sends the system prompt and the real message to Anthropic, and
  // surfaces a provider error instead of inventing a reply.
  {
    let sentBody = null;
    const assistant = new AnthropicAiAssistant({
      apiKey: 'sk-test',
      fetchImpl: async (url, init) => {
        sentBody = JSON.parse(init.body);
        assert.equal(url, 'https://api.anthropic.com/v1/messages');
        assert.equal(init.headers['x-api-key'], 'sk-test');
        return { ok: true, json: async () => ({ content: [{ type: 'text', text: 'Un support est une zone de prix.' }] }) };
      }
    });
    const result = await assistant.ask('Qu’est-ce qu’un support ?', { history: [] });
    assert.equal(sentBody.system, SYSTEM_PROMPT);
    assert.deepEqual(sentBody.messages, [{ role: 'user', content: 'Qu’est-ce qu’un support ?' }]);
    assert.equal(result.reply, 'Un support est une zone de prix.');
  }
  {
    const assistant = new AnthropicAiAssistant({ apiKey: 'sk-test', fetchImpl: async () => ({ ok: false, status: 529, text: async () => 'overloaded' }) });
    await assert.rejects(() => assistant.ask('x'), /ai_provider_error_529/);
  }

  // Integration: the BFF route itself.
  const auth = makeAuth();
  const sessions = new MemorySessionStore();
  const config = { allowedOrigins: ['http://localhost:8744'], secureCookies: true, sessionIdleMs: 60 * 60 * 1000, sessionAbsoluteMs: 24 * 60 * 60 * 1000, sessionEncryptionKey: null, emailRedirectTo: 'http://localhost:8744/access' };

  function requestRaw(server, method, path, { body, headers = {}, cookies = {} } = {}) {
    return new Promise((resolve, reject) => {
      const cookie = Object.entries(cookies).map(([key, value]) => `${key}=${encodeURIComponent(value)}`).join('; ');
      const req = http.request({ ...server.address(), method, path, headers: { Origin: 'http://localhost:8744', ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(cookie ? { Cookie: cookie } : {}), ...headers } }, res => {
        let text = ''; res.on('data', chunk => { text += chunk; }); res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: text ? JSON.parse(text) : null }));
      });
      req.on('error', reject); if (body !== undefined) req.write(JSON.stringify(body)); req.end();
    });
  }

  async function freshLoggedInServer(aiAssistant, rateLimiter) {
    const handler = createBff({ auth, sessions, config, aiAssistant, rateLimiter, clock: () => new Date('2026-11-04T00:00:00.000Z') });
    const server = http.createServer(handler);
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const login = await requestRaw(server, 'POST', '/v1/auth/login', { body: { email: 'a@example.com', password: 'whatever-long-enough' } });
    const setCookies = login.headers['set-cookie'];
    const sessionCookie = decodeURIComponent(setCookies.find(v => v.startsWith(`${SESSION_COOKIE}=`)).split(';')[0].split('=')[1]);
    const csrfCookie = decodeURIComponent(setCookies.find(v => v.startsWith(`${CSRF_COOKIE}=`)).split(';')[0].split('=')[1]);
    return { server, sessionCookie, csrfCookie };
  }

  {
    const { server, sessionCookie, csrfCookie } = await freshLoggedInServer(null);
    try {
      const response = await requestRaw(server, 'POST', '/v1/ai/ask', {
        cookies: { [SESSION_COOKIE]: sessionCookie, [CSRF_COOKIE]: csrfCookie },
        headers: { 'X-CSRF-Token': csrfCookie },
        body: { message: 'bonjour' }
      });
      assert.equal(response.status, 503);
      assert.equal(response.body.code, 'ai_not_configured');
    } finally { server.close(); }
  }

  // 401 without a session; 403 without a valid CSRF token; 400 on an invalid body.
  {
    const assistant = { ask: async () => ({ reply: 'never reached' }) };
    const { server, sessionCookie, csrfCookie } = await freshLoggedInServer(assistant);
    try {
      let response = await requestRaw(server, 'POST', '/v1/ai/ask', { body: { message: 'bonjour' } });
      assert.equal(response.status, 401);

      response = await requestRaw(server, 'POST', '/v1/ai/ask', {
        cookies: { [SESSION_COOKIE]: sessionCookie, [CSRF_COOKIE]: csrfCookie },
        headers: { 'X-CSRF-Token': 'wrong' },
        body: { message: 'bonjour' }
      });
      assert.equal(response.status, 403);

      response = await requestRaw(server, 'POST', '/v1/ai/ask', {
        cookies: { [SESSION_COOKIE]: sessionCookie, [CSRF_COOKIE]: csrfCookie },
        headers: { 'X-CSRF-Token': csrfCookie },
        body: { message: '' }
      });
      assert.equal(response.status, 400);
      assert.equal(response.body.code, 'validation_error');
    } finally { server.close(); }
  }

  // A configured, working assistant actually answers — and never fabricates a
  // reply when the provider call fails.
  {
    let shouldFail = false;
    const assistant = {
      ask: async message => {
        if (shouldFail) throw new Error('ai_provider_error_500');
        return { reply: `Réponse pédagogique à : ${message}` };
      }
    };
    const { server, sessionCookie, csrfCookie } = await freshLoggedInServer(assistant);
    try {
      let response = await requestRaw(server, 'POST', '/v1/ai/ask', {
        cookies: { [SESSION_COOKIE]: sessionCookie, [CSRF_COOKIE]: csrfCookie },
        headers: { 'X-CSRF-Token': csrfCookie },
        body: { message: 'Explique-moi un support.' }
      });
      assert.equal(response.status, 200);
      assert.equal(response.body.reply, 'Réponse pédagogique à : Explique-moi un support.');

      shouldFail = true;
      response = await requestRaw(server, 'POST', '/v1/ai/ask', {
        cookies: { [SESSION_COOKIE]: sessionCookie, [CSRF_COOKIE]: csrfCookie },
        headers: { 'X-CSRF-Token': csrfCookie },
        body: { message: 'Explique-moi un support.' }
      });
      assert.equal(response.status, 502);
      assert.equal(response.body.code, 'ai_provider_failed');
    } finally { server.close(); }
  }

  // Rate limiting: once the shared limiter says no, the route answers 429 and
  // never calls the (costly) provider.
  {
    let providerCalls = 0;
    const assistant = { ask: async () => { providerCalls += 1; return { reply: 'ok' }; } };
    let allow = true;
    const rateLimiter = { allow: async () => allow };
    const { server, sessionCookie, csrfCookie } = await freshLoggedInServer(assistant, rateLimiter);
    try {
      let response = await requestRaw(server, 'POST', '/v1/ai/ask', {
        cookies: { [SESSION_COOKIE]: sessionCookie, [CSRF_COOKIE]: csrfCookie },
        headers: { 'X-CSRF-Token': csrfCookie },
        body: { message: 'une question' }
      });
      assert.equal(response.status, 200);
      assert.equal(providerCalls, 1);

      allow = false;
      response = await requestRaw(server, 'POST', '/v1/ai/ask', {
        cookies: { [SESSION_COOKIE]: sessionCookie, [CSRF_COOKIE]: csrfCookie },
        headers: { 'X-CSRF-Token': csrfCookie },
        body: { message: 'une autre question' }
      });
      assert.equal(response.status, 429);
      assert.equal(providerCalls, 1, 'a rate-limited call never reaches the provider');
    } finally { server.close(); }
  }

  console.log('RESULT: DDA AI assistant contract passed');
})();
