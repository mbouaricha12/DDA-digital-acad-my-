'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const {
  AnthropicAiAssistant,
  aiAssistantFromEnv,
  validateAskRequest
} = require('../bff/src/ai-assistant');
const { analyticsConfigFromEnv, trackServerEvent } = require('../bff/src/analytics');
const {
  chariowConfigFromEnv,
  verifyChariowPulse,
  mapChariowPulse,
  createChariowCheckout
} = require('../bff/src/chariow');
const { isHttpsUrl, validPublishedRow, PostgrestBrvmPublicationStore } = require('../bff/src/brvm-publication-store');
const { PostgrestRateLimiter, checkAuthRateLimit } = require('../bff/src/rate-limiter');
const { PostgrestBusinessStore, MemoryBusinessStore } = require('../bff/src/business-store');
const { MemoryAccessAuditStore, PostgrestAccessAuditStore } = require('../bff/src/access-audit-store');
const { PostgrestCommunityStore } = require('../bff/src/community-store');
const { marketDataConfigFromEnv, providerConfigured, fetchMarketQuotes } = require('../bff/src/market-data');
const { buildHandler } = require('../bff/src/handler');
const { acceptsTransition } = require('../bff/src/billing-store');

const userId = '11111111-1111-4111-8111-111111111111';

(async () => {
  assert.equal(validateAskRequest({ message: '  risque  ', history: [{ role: 'user', content: 'contexte' }] }).message, 'risque');
  assert.equal(validateAskRequest({ message: '' }).error, 'message cannot be empty.');
  assert.equal(validateAskRequest({ message: 'x'.repeat(2001) }).error, 'message must be at most 2000 characters.');
  assert.equal(aiAssistantFromEnv({}), null);

  const aiCalls = [];
  const assistant = new AnthropicAiAssistant({
    apiKey: 'test-key',
    fetchImpl: async (url, options) => {
      aiCalls.push({ url, options });
      return { ok: true, async json() { return { content: [{ type: 'text', text: 'Réponse pédagogique.' }] }; } };
    }
  });
  assert.deepEqual(await assistant.ask('Explique le risque.'), { reply: 'Réponse pédagogique.' });
  assert.equal(aiCalls.length, 1);
  assert.throws(() => new AnthropicAiAssistant({}), /requires an API key/);

  assert.deepEqual(analyticsConfigFromEnv({}), { apiKey: null, host: 'https://us.i.posthog.com' });
  const tracked = [];
  await trackServerEvent('coverage_event', 'user-1', { safe: true }, {
    config: { apiKey: 'posthog-key', host: 'https://posthog.example' },
    fetchImpl: async (url, options) => {
      tracked.push({ url, options });
      return { ok: true };
    }
  });
  assert.equal(tracked.length, 1);

  const pulseSecret = 'coverage-secret';
  const pulseBody = Buffer.from(JSON.stringify({ event: 'successful.sale' }));
  const signature = `sha256=${crypto.createHmac('sha256', pulseSecret).update(pulseBody).digest('hex')}`;
  assert.equal(verifyChariowPulse(pulseBody, signature, pulseSecret), true);
  assert.equal(verifyChariowPulse(pulseBody, 'sha256=bad', pulseSecret), false);
  const chariowConfig = chariowConfigFromEnv({
    CHARIOW_API_KEY: 'api-key',
    CHARIOW_PREMIUM_PRODUCT_IDS: 'premium-1',
    CHARIOW_CHECKOUT_REDIRECT_URL: 'https://app.example/return'
  });
  const mapped = mapChariowPulse({
    event: 'successful.sale',
    sale: { id: 'sale-1', product_id: 'premium-1', custom_metadata: { dda_user_id: userId } },
    customer: { id: 'customer-1', email: 'Learner@Example.com' }
  }, { 'x-pulse-delivery-id': 'delivery-1' }, chariowConfig);
  assert.equal(mapped.kind, 'membership_transition');
  assert.equal(mapped.status, 'active');
  assert.equal(mapChariowPulse({ event: 'unknown' }, {}, chariowConfig).kind, 'ignored');
  const checkout = await createChariowCheckout({
    config: chariowConfig,
    input: { productId: 'premium-1', email: 'learner@example.com', firstName: 'DDA', customMetadata: { dda_user_id: userId } },
    fetchImpl: async () => ({ ok: true, async json() { return { data: { step: 'checkout', payment: { checkout_url: 'https://pay.example/1' }, purchase: { id: 'sale-1', status: 'pending' } } }; } })
  });
  assert.equal(checkout.checkoutUrl, 'https://pay.example/1');

  // Billing transitions are also measured by c8, not just asserted by the
  // broader security suite. Old provider events and reactivation after a
  // terminal state must fail closed; a newer revocation may strengthen it.
  assert.equal(acceptsTransition(null, { status: 'active' }), true, 'a first membership event may be applied');
  assert.equal(acceptsTransition(
    { status: 'revoked', provider_event_at: '2026-11-10T10:00:00.000Z' },
    { status: 'active', occurredAt: '2026-11-10T11:00:00.000Z' }
  ), false, 'revoked membership must not reactivate');
  assert.equal(acceptsTransition(
    { status: 'active', provider_event_at: '2026-11-10T12:00:00.000Z' },
    { status: 'active', occurredAt: '2026-11-10T11:00:00.000Z' }
  ), false, 'stale provider event must be rejected');
  assert.equal(acceptsTransition(
    { status: 'expired', provider_event_at: '2026-11-10T10:00:00.000Z' },
    { status: 'revoked', occurredAt: '2026-11-10T11:00:00.000Z' }
  ), true, 'a newer revocation may strengthen a terminal state');

  assert.equal(isHttpsUrl('https://source.example/report'), true);
  assert.equal(isHttpsUrl('http://source.example/report'), false);
  const row = {
    id: 'pub-1', title: 'Publication', source: 'Source', source_url: 'https://source.example', document_url: 'https://source.example/report.pdf',
    reference_date: '2026-11-01T00:00:00.000Z', retrieved_at: '2026-11-02T00:00:00.000Z', fresh_until: '2026-12-01T00:00:00.000Z'
  };
  assert.equal(validPublishedRow(row, new Date('2026-11-15T00:00:00.000Z')), true);
  const publicationStore = new PostgrestBrvmPublicationStore({
    supabaseUrl: 'https://supabase.example/', serviceRoleKey: 'service-key', clock: () => new Date('2026-11-15T00:00:00.000Z'),
    fetchImpl: async () => ({ ok: true, async text() { return JSON.stringify([row]); } })
  });
  assert.equal((await publicationStore.listPublished()).length, 1);

  const limiterCalls = [];
  const limiter = new PostgrestRateLimiter({
    supabaseUrl: 'https://supabase.example', serviceRoleKey: 'service-key',
    fetchImpl: async (url, options) => {
      limiterCalls.push({ url, options });
      return { ok: true, async json() { return true; } };
    }
  });
  assert.equal(await limiter.allow('login:ip:127.0.0.1', { windowSeconds: 900, limit: 10 }), true);
  assert.equal(await checkAuthRateLimit(limiter, 'login', { ip: '127.0.0.1', email: 'learner@example.com' }), true);
  assert.ok(limiterCalls.length >= 3);
  assert.equal(await checkAuthRateLimit(null, 'login', { ip: '127.0.0.1', email: 'learner@example.com' }), true);

  const businessCalls = [];
  const business = new PostgrestBusinessStore({
    supabaseUrl: 'https://supabase.example/', serviceRoleKey: 'service-key',
    fetchImpl: async (url, options) => {
      businessCalls.push({ url, options });
      return { ok: true, async text() { return '[]'; } };
    }
  });
  const exported = await business.exportUserData('user-1');
  assert.deepEqual(Object.keys(exported), ['lesson_progress', 'journal_entries', 'journal_plans', 'preferences']);
  await business.deleteUserData('user-1');
  assert.deepEqual(businessCalls.map(({ url, options }) => {
    const parsed = new URL(url);
    return [parsed.pathname.split('/').pop(), options.method, parsed.searchParams.get('owner_id')];
  }), [
    ['lesson_progress', 'GET', 'eq.user-1'],
    ['journal_entries', 'GET', 'eq.user-1'],
    ['journal_plans', 'GET', 'eq.user-1'],
    ['preferences', 'GET', 'eq.user-1'],
    ['lesson_progress', 'DELETE', 'eq.user-1'],
    ['journal_entries', 'DELETE', 'eq.user-1'],
    ['journal_plans', 'DELETE', 'eq.user-1'],
    ['preferences', 'DELETE', 'eq.user-1']
  ], 'export and deletion must target only the four contract tables and the requested owner');
  assert.equal(new URL(businessCalls[3].url).searchParams.get('order'), 'updated_at.asc');
  assert.ok(businessCalls.every(({ options }) => options.headers.Authorization === 'Bearer service-key'));
  const failingBusiness = new PostgrestBusinessStore({
    supabaseUrl: 'https://supabase.example/', serviceRoleKey: 'service-key',
    fetchImpl: async () => ({ ok: false, status: 503, async text() { return 'provider detail must not leak'; } })
  });
  await assert.rejects(() => failingBusiness.exportUserData('user-1'), /business store error 503/);

  const memoryBusiness = new MemoryBusinessStore({ journal_entries: [
    { owner_id: 'user-1', note: 'private' },
    { owner_id: 'user-2', note: 'other learner' }
  ] });
  assert.deepEqual((await memoryBusiness.exportUserData('user-1')).journal_entries, [{ owner_id: 'user-1', note: 'private' }]);
  await memoryBusiness.deleteUserData('user-1');
  assert.deepEqual((await memoryBusiness.exportUserData('user-1')).journal_entries, []);
  assert.deepEqual((await memoryBusiness.exportUserData('user-2')).journal_entries, [{ owner_id: 'user-2', note: 'other learner' }]);

  const audit = new MemoryAccessAuditStore();
  const auditEvent = await audit.record({
    eventName: 'admin_access_granted', resourceType: 'admin_route', actorUserId: 'user-1', requestId: 'request-1',
    metadata: { route: '/v1/admin/overview', method: 'GET', role: 'owner' }
  });
  assert.equal(audit.list().length, 1);
  assert.equal(auditEvent.metadata.role, 'owner');
  await assert.rejects(() => audit.record({ eventName: 'invalid', resourceType: 'admin_route', actorUserId: 'user-1', requestId: 'request-2' }), /Unsupported audit event/);
  await assert.rejects(() => audit.record({
    eventName: 'role_assigned', resourceType: 'admin_role', actorUserId: 'user-1', requestId: 'request-3', metadata: { secret: 'must not be recorded' }
  }), /unsupported field/);

  const auditCalls = [];
  const postgrestAudit = new PostgrestAccessAuditStore({
    supabaseUrl: 'https://supabase.example/', serviceRoleKey: 'service-key',
    fetchImpl: async (url, options) => {
      auditCalls.push({ url, options });
      return { ok: true, async text() { return JSON.stringify([{ id: 'audit-1' }]); } };
    }
  });
  const recordedAudit = await postgrestAudit.record({
    eventName: 'role_assigned', resourceType: 'admin_role', actorUserId: 'user-1', requestId: 'request-4',
    metadata: { route: '/v1/admin/roles', method: 'POST', role: 'owner', granted_role: 'admin' }
  });
  assert.equal(recordedAudit.id, 'audit-1');
  assert.equal(auditCalls[0].options.method, 'POST');
  assert.equal(auditCalls[0].options.headers.Authorization, 'Bearer service-key');
  assert.equal(new URL(auditCalls[0].url).pathname, '/rest/v1/audit_events');
  assert.equal(JSON.parse(auditCalls[0].options.body).actor_user_id, 'user-1');
  const failingAudit = new PostgrestAccessAuditStore({
    supabaseUrl: 'https://supabase.example/', serviceRoleKey: 'service-key',
    fetchImpl: async () => ({ ok: false, status: 503, async text() { return ''; } })
  });
  await assert.rejects(() => failingAudit.record({
    eventName: 'role_assigned', resourceType: 'admin_role', actorUserId: 'user-1', requestId: 'request-5'
  }), /access audit store error 503/);

  const communityCalls = [];
  const community = new PostgrestCommunityStore({
    supabaseUrl: 'https://supabase.example/', serviceRoleKey: 'service-key',
    fetchImpl: async (url, options) => {
      communityCalls.push({ url, options });
      return options.method === 'GET'
        ? { ok: true, async text() { return JSON.stringify([
          { post_id: 'post-1', body: 'Bonjour', created_at: '2026-11-15T00:00:00.000Z' },
          { invalid: true }
        ]); } }
        : { ok: true, async text() { return JSON.stringify([{ post_id: 'post-2', body: 'Publication', created_at: '2026-11-15T00:00:00.000Z' }]); } };
    }
  });
  const recentPosts = await community.listRecent({ limit: 0 });
  assert.equal(recentPosts.length, 1, 'invalid rows must be discarded');
  assert.equal(recentPosts[0].authorDisplayName, 'Apprenant DDA');
  const listUrl = new URL(communityCalls[0].url);
  assert.equal(listUrl.searchParams.get('status'), 'eq.visible');
  assert.equal(listUrl.searchParams.get('limit'), '30');
  assert.equal(communityCalls[0].options.method, 'GET');
  assert.equal(communityCalls[0].options.headers.Authorization, 'Bearer service-key');
  const createdPost = await community.createPost({ userId: 'user-1', authorDisplayName: '  DDA  ', body: ' Publication ' });
  assert.equal(createdPost.body, 'Publication');
  assert.deepEqual(JSON.parse(communityCalls[1].options.body), { user_id: 'user-1', author_display_name: 'DDA', body: 'Publication' });
  await assert.rejects(() => community.createPost({ userId: 'user-1', body: '   ' }), error => error.status === 400 && /invalid_body/.test(error.message));
  const failingCommunity = new PostgrestCommunityStore({
    supabaseUrl: 'https://supabase.example/', serviceRoleKey: 'service-key',
    fetchImpl: async () => ({ ok: false, status: 503, async text() { return ''; } })
  });
  await assert.rejects(() => failingCommunity.listRecent(), /community_posts_store_failed/);
  const malformedCommunity = new PostgrestCommunityStore({
    supabaseUrl: 'https://supabase.example/', serviceRoleKey: 'service-key',
    fetchImpl: async () => ({ ok: true, async text() { return '{'; } })
  });
  await assert.rejects(() => malformedCommunity.listRecent(), /community_posts_store_invalid_json/);

  const marketConfig = marketDataConfigFromEnv({ TWELVEDATA_API_KEY: 'td-key', COINGECKO_API_KEY: 'cg-key', MARKET_DATA_MAX_AGE_MS: '60000' });
  assert.equal(providerConfigured('twelvedata', marketConfig), true);
  const quotes = await fetchMarketQuotes({ config: marketConfig, fetchImpl: async url => ({ ok: true, async json() { return url.includes('twelvedata') ? { price: '123.45' } : { bitcoin: { usd: 50000 } }; } }) });
  assert.equal(quotes.XAUUSD.status, 'ok');
  assert.equal(quotes.BTCUSD.status, 'ok');
  const isolatedFailures = await fetchMarketQuotes({
    config: marketConfig,
    fetchImpl: async url => {
      if (url.includes('twelvedata')) return { ok: true, async json() { return { price: 'not-a-number' }; } };
      throw new Error('simulated CoinGecko outage');
    }
  });
  assert.equal(isolatedFailures.XAUUSD.status, 'unavailable', 'invalid provider prices must never be surfaced');
  assert.equal(isolatedFailures.BTCUSD.status, 'unavailable', 'provider exceptions must be isolated as unavailable');
  assert.equal((await fetchMarketQuotes({ config: marketDataConfigFromEnv({}), fetchImpl: async () => { throw new Error('must not call provider'); } })).BTCUSD.status, 'not_configured');

  // buildHandler must be constructible with valid server config without making
  // an outbound request. This synthetic GET exercises its serverless wiring
  // and the BFF 404 envelope through a local response double only.
  const handlerEnv = {
    SUPABASE_URL: 'https://supabase.example',
    SUPABASE_PUBLISHABLE_KEY: 'coverage-publishable-key',
    SUPABASE_SERVICE_ROLE_KEY: 'coverage-service-role-key',
    SESSION_ENCRYPTION_KEY: Buffer.alloc(32, 0x41).toString('base64url'),
    ALLOWED_ORIGINS: 'https://app.example',
    EMAIL_REDIRECT_TO: 'https://app.example/access',
    BFF_COOKIE_SECURE: 'true'
  };
  const handler = buildHandler(handlerEnv);
  const response = {
    headers: Object.create(null), statusCode: null, body: '',
    setHeader(name, value) { this.headers[name] = value; },
    writeHead(status, headers = {}) { this.statusCode = status; Object.assign(this.headers, headers); },
    end(body = '') { this.body = body; }
  };
  await handler({ method: 'GET', url: '/v1/coverage-probe', headers: { origin: 'https://app.example' } }, response);
  assert.equal(response.statusCode, 404);
  assert.equal(JSON.parse(response.body).code, 'not_found');
  assert.match(response.headers['X-Request-Id'], /^req_/);
  assert.equal(response.headers['Access-Control-Allow-Origin'], 'https://app.example');
  assert.doesNotMatch(response.body, /coverage-service-role-key/);
  assert.throws(() => buildHandler({}), /BFF startup refused/);

  console.log('BFF module coverage driver: PASS');
})().catch(error => { console.error(error.stack || error); process.exitCode = 1; });
