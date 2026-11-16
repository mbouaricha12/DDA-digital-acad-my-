'use strict';

const assert = require('node:assert/strict');
const { buildHandler } = require('../bff/src/handler');

const baseEnv = {
  SUPABASE_URL: 'https://supabase.example',
  SUPABASE_PUBLISHABLE_KEY: 'coverage-publishable-key',
  SUPABASE_SERVICE_ROLE_KEY: 'coverage-service-role-key',
  SESSION_ENCRYPTION_KEY: Buffer.alloc(32, 0x41).toString('base64url'),
  ALLOWED_ORIGINS: 'https://app.example',
  EMAIL_REDIRECT_TO: 'https://app.example/access',
  BFF_COOKIE_SECURE: 'true'
};

function makeResponse() {
  return {
    statusCode: null,
    headers: Object.create(null),
    body: '',
    setHeader(name, value) { this.headers[name] = value; },
    writeHead(status, headers = {}) {
      this.statusCode = status;
      Object.assign(this.headers, headers);
    },
    end(body = '') { this.body = body; }
  };
}

async function dispatch(handler, req) {
  const res = makeResponse();
  await handler(req, res);
  return res;
}

function jsonResponse(body, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get() { return null; } },
    async text() { return JSON.stringify(body); }
  };
}

(async () => {
  const originalFetch = global.fetch;
  const originalConsoleError = console.error;
  let unexpectedNetworkCalls = 0;
  global.fetch = async () => {
    unexpectedNetworkCalls += 1;
    throw new Error('serverless webhook contract must never call an external service');
  };
  console.error = () => {};

  try {
    const unconfiguredHandler = buildHandler(baseEnv);
    const unconfigured = await dispatch(unconfiguredHandler, {
      method: 'POST', url: '/webhooks/chariow', headers: {}
    });
    assert.equal(unconfigured.statusCode, 503);
    assert.deepEqual(JSON.parse(unconfigured.body), { error: 'billing_webhook_not_configured' });
    assert.equal(unconfigured.headers['Cache-Control'], 'no-store');

    const configuredHandler = buildHandler({
      ...baseEnv,
      CHARIOW_PULSE_SECRET: 'coverage-pulse-secret',
      CHARIOW_PREMIUM_PRODUCT_IDS: 'premium-product'
    });
    const invalidSignature = await dispatch(configuredHandler, {
      method: 'POST', url: '/webhooks/chariow?source=contract',
      headers: { 'x-chariow-signature': 'sha256=invalid' },
      async *[Symbol.asyncIterator]() { yield Buffer.from('{}'); }
    });
    assert.equal(invalidSignature.statusCode, 401);
    assert.deepEqual(JSON.parse(invalidSignature.body), { error: 'invalid_signature' });
    assert.equal(invalidSignature.headers['Cache-Control'], 'no-store');

    const streamFailure = await dispatch(configuredHandler, {
      method: 'POST', url: '/webhooks/chariow', headers: {},
      async *[Symbol.asyncIterator]() { throw new Error('synthetic stream failure'); }
    });
    assert.equal(streamFailure.statusCode, 500);
    assert.deepEqual(JSON.parse(streamFailure.body), { error: 'billing_webhook_failed' });
    assert.equal(streamFailure.headers['Cache-Control'], 'no-store');

    const secret = 'coverage-pulse-secret';
    const payload = Buffer.from(JSON.stringify({
      event: 'license.activated',
      product: { id: 'premium-product' },
      license: {
        id: 'license-123',
        activated_at: '2026-11-15T21:00:00.000Z',
        custom_metadata: { dda_user_id: '11111111-1111-4111-8111-111111111111' }
      },
      customer: { id: 'customer-123', email: 'learner@example.test' }
    }));
    const signature = `sha256=${require('node:crypto').createHmac('sha256', secret).update(payload).digest('hex')}`;
    const databaseCalls = [];
    let membershipUpsert = null;
    const supabasePrefix = 'https://supabase.example/rest/v1/';
    global.fetch = async (url, options = {}) => {
      if (!String(url).startsWith(supabasePrefix)) {
        if (String(url).endsWith('/capture/')) return jsonResponse({ status: 'ok' });
        unexpectedNetworkCalls += 1;
        throw new Error(`unexpected non-local request: ${url}`);
      }
      databaseCalls.push({ url, options });
      const path = String(url).slice(supabasePrefix.length);
      if (path === 'dda_billing_deliveries' && options.method === 'POST') {
        const delivery = JSON.parse(options.body);
        return jsonResponse(delivery.delivery_id === 'delivery-1' ? [delivery] : [], 201);
      }
      if (path.startsWith('dda_billing_memberships?provider=eq.chariow') && options.method === 'GET') {
        return jsonResponse([]);
      }
      if (path.startsWith('dda_billing_memberships?on_conflict=provider,external_id') && options.method === 'POST') {
        membershipUpsert = JSON.parse(options.body);
        return jsonResponse([membershipUpsert], 201);
      }
      if ((path.startsWith('dda_billing_deliveries?delivery_id=eq.delivery-1')
        || path.startsWith('dda_billing_deliveries?delivery_id=eq.delivery-duplicate')) && options.method === 'PATCH') {
        return jsonResponse([]);
      }
      throw new Error(`unexpected local PostgREST request: ${options.method} ${path}`);
    };
    const successHandler = buildHandler({
      ...baseEnv,
      CHARIOW_PULSE_SECRET: secret,
      CHARIOW_PREMIUM_PRODUCT_IDS: 'premium-product'
    });
    const accepted = await dispatch(successHandler, {
      method: 'POST', url: '/webhooks/chariow',
      headers: {
        'x-chariow-signature': signature,
        'x-pulse-event': 'license.activated',
        'x-pulse-delivery-id': 'delivery-1'
      },
      async *[Symbol.asyncIterator]() { yield payload; }
    });
    assert.equal(accepted.statusCode, 202);
    assert.deepEqual(JSON.parse(accepted.body), {
      accepted: true, kind: 'membership_transition', event: 'license.activated'
    });
    assert.equal(membershipUpsert.user_id, '11111111-1111-4111-8111-111111111111');
    assert.deepEqual(membershipUpsert.entitlement_snapshot, [
      'premium_track', 'resources_premium', 'certificate_preview', 'advanced_modules'
    ]);
    assert.equal(databaseCalls.length, 4, 'claim, read, membership upsert, and mark-processed must all use the local PostgREST stub');
    assert.ok(databaseCalls.every(call => call.options.headers.Authorization === 'Bearer coverage-service-role-key'));

    const duplicate = await dispatch(successHandler, {
      method: 'POST', url: '/webhooks/chariow',
      headers: {
        'x-chariow-signature': signature,
        'x-pulse-event': 'license.activated',
        'x-pulse-delivery-id': 'delivery-duplicate'
      },
      async *[Symbol.asyncIterator]() { yield payload; }
    });
    assert.equal(duplicate.statusCode, 204);
    assert.equal(duplicate.body, '');
    assert.equal(databaseCalls.length, 6, 'a duplicate is rejected after the insert claim and failed-only retry check');
    assert.equal(unexpectedNetworkCalls, 0, 'the tested serverless branches must not contact Supabase or Chariow');
  } finally {
    global.fetch = originalFetch;
    console.error = originalConsoleError;
  }

  console.log('Serverless Chariow webhook handler contract: PASS');
})().catch(error => { console.error(error.stack || error); process.exitCode = 1; });
