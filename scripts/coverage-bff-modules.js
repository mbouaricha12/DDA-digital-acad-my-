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
  assert.equal(businessCalls.length, 8);
  const memoryBusiness = new MemoryBusinessStore({ journal_entries: [{ owner_id: 'user-1', note: 'private' }] });
  assert.equal((await memoryBusiness.exportUserData('user-1')).journal_entries.length, 1);
  await memoryBusiness.deleteUserData('user-1');
  assert.equal((await memoryBusiness.exportUserData('user-1')).journal_entries.length, 0);

  const audit = new MemoryAccessAuditStore();
  const auditEvent = await audit.record({
    eventName: 'admin_access_granted', resourceType: 'admin_route', actorUserId: 'user-1', requestId: 'request-1',
    metadata: { route: '/v1/admin/overview', method: 'GET', role: 'owner' }
  });
  assert.equal(audit.list().length, 1);
  assert.equal(auditEvent.metadata.role, 'owner');
  await assert.rejects(() => audit.record({ eventName: 'invalid', resourceType: 'admin_route', actorUserId: 'user-1', requestId: 'request-2' }), /Unsupported audit event/);
  const postgrestAudit = new PostgrestAccessAuditStore({
    supabaseUrl: 'https://supabase.example/', serviceRoleKey: 'service-key',
    fetchImpl: async () => ({ ok: true, async text() { return JSON.stringify([{ id: 'audit-1' }]); } })
  });
  assert.equal((await postgrestAudit.record({ eventName: 'role_assigned', resourceType: 'admin_role', actorUserId: 'user-1', requestId: 'request-3' })).id, 'audit-1');

  const community = new PostgrestCommunityStore({
    supabaseUrl: 'https://supabase.example/', serviceRoleKey: 'service-key',
    fetchImpl: async (url, options) => options.method === 'GET'
      ? { ok: true, async text() { return JSON.stringify([{ post_id: 'post-1', body: 'Bonjour', created_at: '2026-11-15T00:00:00.000Z' }]); } }
      : { ok: true, async text() { return JSON.stringify([{ post_id: 'post-2', body: 'Publication', created_at: '2026-11-15T00:00:00.000Z' }]); } }
  });
  assert.equal((await community.listRecent({ limit: 0 }))[0].authorDisplayName, 'Apprenant DDA');
  assert.equal((await community.createPost({ userId: 'user-1', authorDisplayName: '  DDA  ', body: ' Publication ' })).body, 'Publication');

  const marketConfig = marketDataConfigFromEnv({ TWELVEDATA_API_KEY: 'td-key', COINGECKO_API_KEY: 'cg-key', MARKET_DATA_MAX_AGE_MS: '60000' });
  assert.equal(providerConfigured('twelvedata', marketConfig), true);
  const quotes = await fetchMarketQuotes({ config: marketConfig, fetchImpl: async url => ({ ok: true, async json() { return url.includes('twelvedata') ? { price: '123.45' } : { bitcoin: { usd: 50000 } }; } }) });
  assert.equal(quotes.XAUUSD.status, 'ok');
  assert.equal(quotes.BTCUSD.status, 'ok');
  assert.equal((await fetchMarketQuotes({ config: marketDataConfigFromEnv({}), fetchImpl: async () => { throw new Error('must not call provider'); } })).BTCUSD.status, 'not_configured');
  assert.throws(() => buildHandler({}), /BFF startup refused/);

  console.log('BFF module coverage driver: PASS');
})().catch(error => { console.error(error.stack || error); process.exitCode = 1; });
