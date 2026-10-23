'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'dist', 'bff-client.js'), 'utf8');
const series = {
  contract_version: 'dda.market-series.v1',
  instrument: { symbol: 'TEST', venue: 'TEST-X', asset_class: 'equity', currency: 'USD' },
  timeframe: '1m',
  data_mode: 'historical',
  source: { id: 'client-test', kind: 'historical_import' },
  retrieved_at: '2026-10-18T18:00:00.000Z',
  bars: []
};

function loadClient({ baseUrl = 'https://bff.example.test', fetchImpl }) {
  const document = { cookie: '' };
  const window = { DDA_BFF_BASE_URL: baseUrl };
  vm.runInNewContext(source, { window, document, fetch: fetchImpl });
  return { client: window.DDABFF, document };
}

function response(status, body = null) {
  return {
    ok: status >= 200 && status < 300,
    status,
    async json() { return body; }
  };
}

async function run(name, fn) {
  await fn();
  console.log(`PASS ${name}`);
}

(async () => {
  await run('analysis method sends the series through the credentialed CSRF-protected BFF route', async () => {
    const calls = [];
    let documentRef;
    const { client, document } = loadClient({
      fetchImpl: async (url, options) => {
        calls.push({ url, options });
        if (url.endsWith('/v1/security/csrf')) {
          document.cookie = '__Host-dda_csrf=csrf-token';
          return response(204);
        }
        return response(200, {
          contract_version: 'dda.autotrader.analysis-response.v1',
          analyzed_at: '2026-10-18T18:00:00.000Z',
          analysis: { status: 'analysis_complete', execution_enabled: false, order_recommendation: null }
        });
      }
    });
    documentRef = document;
    const result = await client.analyzeAutoTrader(series);
    assert.equal(result.contract_version, 'dda.autotrader.analysis-response.v1');
    assert.equal(calls.length, 2);
    assert.ok(calls[0].url.endsWith('/v1/security/csrf'));
    assert.equal(calls[1].url, 'https://bff.example.test/v1/autotrader/analyze');
    assert.equal(calls[1].options.method, 'POST');
    assert.equal(calls[1].options.credentials, 'include');
    assert.equal(calls[1].options.headers['X-CSRF-Token'], 'csrf-token');
    assert.deepEqual(JSON.parse(calls[1].options.body), { series });
    assert.equal(documentRef.cookie, '__Host-dda_csrf=csrf-token');
  });

  await run('analysis API errors preserve the safe error code and HTTP status', async () => {
    const { client } = loadClient({
      fetchImpl: async url => url.endsWith('/v1/security/csrf')
        ? response(204)
        : response(403, { code: 'entitlement_required', message: 'An active entitlement is required.' })
    });
    await assert.rejects(client.analyzeAutoTrader(series), error => {
      assert.equal(error.message, 'entitlement_required');
      assert.equal(error.status, 403);
      return true;
    });
  });

  await run('provider analysis sends only a configured instrument id through the CSRF-protected BFF', async () => {
    const calls = [];
    const { client, document } = loadClient({
      fetchImpl: async (url, options) => {
        calls.push({ url, options });
        if (url.endsWith('/v1/security/csrf')) {
          document.cookie = '__Host-dda_csrf=csrf-token';
          return response(204);
        }
        return response(200, {
          contract_version: 'dda.autotrader.provider-analysis-response.v1',
          analyzed_at: '2026-10-20T12:00:00.000Z',
          series_summary: { data_mode: 'historical', bar_count: 40, source: { kind: 'provider' } },
          analysis: {
            contract_version: 'dda.market-analysis.v2', status: 'analysis_complete', data_mode: 'historical',
            execution_enabled: false, order_recommendation: null
          }
        });
      }
    });
    const result = await client.analyzeProviderInstrument('aapl-15m');
    assert.equal(result.contract_version, 'dda.autotrader.provider-analysis-response.v1');
    assert.equal(calls.length, 2);
    assert.equal(calls[1].url, 'https://bff.example.test/v1/autotrader/provider-analysis');
    assert.equal(calls[1].options.method, 'POST');
    assert.equal(calls[1].options.headers['X-CSRF-Token'], 'csrf-token');
    assert.deepEqual(JSON.parse(calls[1].options.body), { instrument_id: 'aapl-15m' });
    assert.equal(calls[1].options.body.includes('apikey'), false);
  });

  await run('provider analysis rejects invalid identifiers before network access and rejects executable responses', async () => {
    let calls = 0;
    const { client } = loadClient({ fetchImpl: async url => {
      calls += 1;
      return url.endsWith('/v1/security/csrf')
        ? response(204)
        : response(200, {
          contract_version: 'dda.autotrader.provider-analysis-response.v1',
          series_summary: { data_mode: 'historical', bar_count: 1, source: { kind: 'provider' } },
          analysis: { contract_version: 'dda.market-analysis.v2', status: 'analysis_complete', data_mode: 'historical', execution_enabled: true, order_recommendation: {} }
        });
    } });
    await assert.rejects(client.analyzeProviderInstrument('AAPL&symbol=OTHER'), { name: 'TypeError', message: 'autotrader_instrument_required' });
    assert.equal(calls, 0);
    await assert.rejects(client.analyzeProviderInstrument('aapl-15m'), { message: 'autotrader_provider_analysis_invalid_response' });
  });

  await run('provider analysis API errors preserve safe code and status', async () => {
    const { client } = loadClient({ fetchImpl: async url => url.endsWith('/v1/security/csrf')
      ? response(204)
      : response(429, { code: 'provider_quota_exceeded', message: 'Vendor details are hidden.' }) });
    await assert.rejects(client.analyzeProviderInstrument('aapl-15m'), error => {
      assert.equal(error.message, 'provider_quota_exceeded');
      assert.equal(error.status, 429);
      return true;
    });
  });

  await run('unconfigured BFF returns null without making a network request', async () => {
    let requests = 0;
    const { client } = loadClient({ baseUrl: '', fetchImpl: async () => { requests += 1; return response(500); } });
    assert.equal(await client.analyzeAutoTrader(series), null);
    assert.equal(await client.analyzeProviderInstrument('aapl-15m'), null);
    assert.equal(requests, 0);
  });

  await run('invalid series input and malformed server response fail closed', async () => {
    const { client } = loadClient({ fetchImpl: async url => url.endsWith('/v1/security/csrf')
      ? response(204)
      : response(200, { contract_version: 'wrong', analysis: null }) });
    await assert.rejects(client.analyzeAutoTrader(null), { name: 'TypeError', message: 'autotrader_series_required' });
    await assert.rejects(client.analyzeAutoTrader(series), { message: 'autotrader_analysis_invalid_response' });
  });

  console.log('BFF AutoTrader client tests: 7 passed');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
