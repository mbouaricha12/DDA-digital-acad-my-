'use strict';

const assert = require('node:assert/strict');
const {
  MAX_OUTPUT_SIZE,
  parseInstrumentAllowlist,
  createTwelveDataMarketProvider,
  createTwelveDataMarketProviderFromEnv
} = require('../bff/src/autotrader/twelve-data-market-provider');
const { validateMarketSeriesV2 } = require('../bff/src/autotrader/market-data-v2');
const { analyzeMarketSeriesV2 } = require('../bff/src/autotrader/market-analysis-v2');

const asOf = new Date('2026-10-20T12:00:00.000Z');
const instrument = {
  id: 'aapl-15m', symbol: 'AAPL', venue: 'NASDAQ', venue_kind: 'exchange',
  asset_class: 'equity', currency: 'USD', timeframe: '15m'
};
const raw = {
  meta: { symbol: 'AAPL', interval: '15min', currency: 'USD', exchange_timezone: 'America/New_York', exchange: 'NASDAQ', mic_code: 'XNAS', type: 'Common Stock' },
  values: [
    { datetime: '2026-10-20 11:00:00', open: '100', high: '102', low: '99', close: '101', volume: '1000' },
    { datetime: '2026-10-20 11:15:00', open: '101', high: '103', low: '100', close: '102', volume: '1100' },
    { datetime: '2026-10-20 11:30:00', open: '102', high: '104', low: '101', close: '103', volume: '1200' },
    { datetime: '2026-10-20 11:45:00', open: '103', high: '105', low: '102', close: '104', volume: '1300' },
    { datetime: '2026-10-20 12:00:00', open: '104', high: '106', low: '103', close: '105', volume: '1400' }
  ],
  status: 'ok'
};
function response(payload, status = 200) {
  return { ok: status >= 200 && status < 300, status, async text() { return JSON.stringify(payload); } };
}
function provider(fetchImpl = async () => response(raw)) {
  return createTwelveDataMarketProvider({
    apiKey: 'test-key-must-not-leak', licenseRef: 'approval:fixture-only', instruments: [instrument],
    fetchImpl, clock: () => new Date(asOf)
  });
}
async function run(name, fn) {
  await fn();
  console.log(`PASS ${name}`);
}

(async () => {
  await run('normalizes only completed intraday bars as historical v2 with UTC close timestamps', async () => {
    let request;
    const client = provider(async (url, options) => { request = { url: new URL(url), options }; return response(raw); });
    const series = await client.getSeries('aapl-15m', { asOf });
    assert.equal(series.contract_version, 'dda.market-series.v2');
    assert.equal(series.data_mode, 'historical');
    assert.equal(series.source.id, 'twelve-data');
    assert.equal(series.source.provider_symbol, 'AAPL');
    assert.equal(series.source.license_ref, 'approval:fixture-only');
    assert.equal(series.retrieved_at, asOf.toISOString());
    assert.equal(series.bars.length, 4, 'the bar whose close is after asOf must be discarded');
    assert.equal(series.bars[0].timestamp, '2026-10-20T11:15:00.000Z');
    assert.equal(series.bars[3].timestamp, '2026-10-20T12:00:00.000Z');
    assert.deepEqual(series.bars[0].volume, { semantic: 'unavailable', reason: 'not_verified' });
    assert.equal(Object.hasOwn(series.bars[0], 'raw_volume'), false);
    assert.equal(validateMarketSeriesV2(series, { asOf }).valid, true);
    const analysis = analyzeMarketSeriesV2(series, { asOf });
    assert.equal(analysis.status, 'analysis_complete');
    assert.equal(analysis.data_mode, 'historical');
    assert.equal(analysis.execution_enabled, false);
    assert.equal(analysis.order_recommendation, null);
    assert.equal(request.url.origin, 'https://api.twelvedata.com');
    assert.equal(request.url.pathname, '/time_series');
    assert.equal(request.url.searchParams.get('symbol'), 'AAPL');
    assert.equal(request.url.searchParams.get('exchange'), 'NASDAQ');
    assert.equal(request.url.searchParams.get('interval'), '15min');
    assert.equal(request.url.searchParams.get('outputsize'), '100');
    assert.equal(request.url.searchParams.get('order'), 'asc');
    assert.equal(request.url.searchParams.get('timezone'), 'UTC');
    assert.equal(request.url.searchParams.get('adjust'), 'none');
    assert.equal(request.url.searchParams.get('prepost'), 'false');
    assert.equal(request.url.searchParams.has('apikey'), false);
    assert.equal(request.options.headers.Authorization, 'apikey test-key-must-not-leak');
    assert.equal(JSON.stringify(series).includes('test-key-must-not-leak'), false);
  });

  await run('never sends a provider request for an unconfigured instrument', async () => {
    let requests = 0;
    const client = provider(async () => { requests += 1; return response(raw); });
    await assert.rejects(() => client.getSeries('other', { asOf }), error => error.code === 'instrument_not_configured');
    assert.equal(requests, 0);
  });

  await run('rejects daily intervals until exchange-local timestamps have a verified conversion', async () => {
    assert.throws(() => parseInstrumentAllowlist(JSON.stringify([{ ...instrument, timeframe: '1d' }])), /unsupported Twelve Data timeframe/);
    assert.throws(() => parseInstrumentAllowlist(JSON.stringify([{ ...instrument, timeframe: '1w' }])), /unsupported Twelve Data timeframe/);
  });

  await run('rejects unsafe symbols, duplicate ids, unexpected fields, and oversized output requests', async () => {
    assert.throws(() => parseInstrumentAllowlist(JSON.stringify([{ ...instrument, symbol: 'AAPL&apikey=oops' }])), /invalid Twelve Data symbol/);
    assert.throws(() => parseInstrumentAllowlist(JSON.stringify([instrument, instrument])), /ids must be unique/);
    assert.throws(() => parseInstrumentAllowlist(JSON.stringify([{ ...instrument, api_key: 'secret' }])), /unexpected Twelve Data instrument field/);
    assert.equal(MAX_OUTPUT_SIZE, 250);
    await assert.rejects(() => provider().getSeries('aapl-15m', { asOf, outputSize: MAX_OUTPUT_SIZE + 1 }), error => error.code === 'provider_request_rejected');
  });

  await run('fails closed on returned instrument metadata mismatch', async () => {
    const payload = structuredClone(raw);
    payload.meta.exchange = 'NYSE';
    await assert.rejects(() => provider(async () => response(payload)).getSeries('aapl-15m', { asOf }), error => error.code === 'provider_instrument_mismatch');
  });

  await run('fails closed on malformed OHLC, invalid UTC timestamps, or provider ordering errors', async () => {
    const invalidRange = structuredClone(raw);
    invalidRange.values[1].low = '200';
    await assert.rejects(() => provider(async () => response(invalidRange)).getSeries('aapl-15m', { asOf }), error => error.code === 'provider_invalid_response');

    const invalidTime = structuredClone(raw);
    invalidTime.values[0].datetime = '2026-10-20 11:00:00-04:00';
    await assert.rejects(() => provider(async () => response(invalidTime)).getSeries('aapl-15m', { asOf }), error => error.code === 'provider_invalid_response');

    const reverse = structuredClone(raw);
    reverse.values.reverse();
    await assert.rejects(() => provider(async () => response(reverse)).getSeries('aapl-15m', { asOf }), error => error.code === 'provider_invalid_response');
  });

  await run('maps provider quota errors to a safe code without exposing provider message or key', async () => {
    const client = provider(async () => response({ code: 429, status: 'error', message: 'private provider details' }, 200));
    await assert.rejects(() => client.getSeries('aapl-15m', { asOf }), error => {
      assert.equal(error.code, 'provider_rate_limited');
      assert.equal(error.status, 429);
      assert.equal(error.message.includes('private provider details'), false);
      assert.equal(error.message.includes('test-key-must-not-leak'), false);
      return true;
    });
  });

  await run('maps network errors to a redacted provider-unavailable error', async () => {
    const client = provider(async () => { throw new Error('secret-bearing network error'); });
    await assert.rejects(() => client.getSeries('aapl-15m', { asOf }), error => {
      assert.equal(error.code, 'provider_unavailable');
      assert.equal(error.status, 503);
      assert.equal(error.message.includes('secret-bearing'), false);
      return true;
    });
  });

  await run('environment configuration stays disabled without an instrument allowlist and requires server credentials/license when enabled', async () => {
    assert.equal(createTwelveDataMarketProviderFromEnv({ TWELVE_DATA_API_KEY: 'key' }), null);
    assert.throws(() => createTwelveDataMarketProviderFromEnv({ DDA_AUTOTRADER_TWELVE_DATA_INSTRUMENTS_JSON: JSON.stringify([instrument]) }), /TWELVE_DATA_API_KEY is required/);
    assert.throws(() => createTwelveDataMarketProviderFromEnv({
      TWELVE_DATA_API_KEY: 'key', DDA_AUTOTRADER_TWELVE_DATA_INSTRUMENTS_JSON: JSON.stringify([instrument])
    }), /DDA_AUTOTRADER_TWELVE_DATA_LICENSE_REF is required/);
    const configured = createTwelveDataMarketProviderFromEnv({
      TWELVE_DATA_API_KEY: 'key',
      DDA_AUTOTRADER_TWELVE_DATA_LICENSE_REF: 'legal:contract-id',
      DDA_AUTOTRADER_TWELVE_DATA_INSTRUMENTS_JSON: JSON.stringify([instrument])
    }, { fetchImpl: async () => response(raw), clock: () => new Date(asOf) });
    assert.equal(configured.hasInstrument('aapl-15m'), true);
    assert.deepEqual(configured.listInstruments(), [{ id: 'aapl-15m', symbol: 'AAPL', venue: 'NASDAQ', asset_class: 'equity', currency: 'USD', timeframe: '15m' }]);
  });

  console.log('AutoTrader Twelve Data provider tests: 8 passed');
})().catch(error => { console.error(error); process.exitCode = 1; });
