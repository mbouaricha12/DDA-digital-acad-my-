'use strict';

const { validateMarketSeriesV2 } = require('./market-data-v2');

const API_BASE = 'https://api.twelvedata.com';
const PROVIDER_ID = 'twelve-data';
const DEFAULT_OUTPUT_SIZE = 100;
const MAX_OUTPUT_SIZE = 250;
const TIMEFRAMES = Object.freeze({
  '1m': { provider: '1min', durationMs: 60_000 },
  '5m': { provider: '5min', durationMs: 5 * 60_000 },
  '15m': { provider: '15min', durationMs: 15 * 60_000 },
  '30m': { provider: '30min', durationMs: 30 * 60_000 },
  '1h': { provider: '1h', durationMs: 60 * 60_000 },
  '4h': { provider: '4h', durationMs: 4 * 60 * 60_000 }
});
const INSTRUMENT_KEYS = new Set(['id', 'symbol', 'venue', 'venue_kind', 'asset_class', 'currency', 'timeframe']);

function providerError(code, status = 503) {
  return Object.assign(new Error(code), { code, status });
}

function requiredText(value, name, maxLength) {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > maxLength || /[\u0000-\u001f\u007f]/.test(value)) {
    throw new Error(`invalid Twelve Data instrument ${name}`);
  }
  return value.trim();
}

function normalizeInstrument(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('invalid Twelve Data instrument');
  for (const key of Object.keys(value)) if (!INSTRUMENT_KEYS.has(key)) throw new Error(`unexpected Twelve Data instrument field ${key}`);
  const id = requiredText(value.id, 'id', 64);
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/.test(id)) throw new Error('invalid Twelve Data instrument id');
  const symbol = requiredText(value.symbol, 'symbol', 64);
  if (!/^[A-Za-z0-9][A-Za-z0-9._/-]{0,63}$/.test(symbol)) throw new Error('invalid Twelve Data symbol');
  const venue = requiredText(value.venue, 'venue', 64);
  const venueKind = value.venue_kind;
  if (!['exchange', 'mic_code'].includes(venueKind)) throw new Error('venue_kind must be exchange or mic_code');
  const assetClass = requiredText(value.asset_class, 'asset_class', 32);
  const currency = requiredText(value.currency, 'currency', 16);
  if (!/^[A-Za-z][A-Za-z0-9._-]{0,15}$/.test(currency)) throw new Error('invalid Twelve Data currency');
  if (!Object.hasOwn(TIMEFRAMES, value.timeframe)) throw new Error('unsupported Twelve Data timeframe; only fixed intraday intervals are enabled');
  return Object.freeze({ id, symbol, venue, venue_kind: venueKind, asset_class: assetClass, currency, timeframe: value.timeframe });
}

function parseInstrumentAllowlist(raw) {
  if (typeof raw !== 'string' || !raw.trim()) return [];
  let parsed;
  try { parsed = JSON.parse(raw); } catch { throw new Error('DDA_AUTOTRADER_TWELVE_DATA_INSTRUMENTS_JSON must be valid JSON'); }
  if (!Array.isArray(parsed) || parsed.length > 50) throw new Error('Twelve Data instrument allowlist must be an array with at most 50 entries');
  const instruments = parsed.map(normalizeInstrument);
  const ids = new Set();
  for (const instrument of instruments) {
    if (ids.has(instrument.id)) throw new Error('Twelve Data instrument ids must be unique');
    ids.add(instrument.id);
  }
  return instruments;
}

function parseProviderDateTime(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value)) return null;
  const ms = Date.parse(`${value.replace(' ', 'T')}.000Z`);
  if (!Number.isFinite(ms) || new Date(ms).toISOString() !== `${value.replace(' ', 'T')}.000Z`) return null;
  return ms;
}

function parseFiniteNumber(value) {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  if (typeof value === 'string' && !value.trim()) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function providerStatusError(status, body) {
  const providerCode = Number(body?.code) || status;
  if (providerCode === 401) return providerError('provider_credential_error', 503);
  if (providerCode === 403) return providerError('provider_plan_denied', 503);
  if (providerCode === 429) return providerError('provider_rate_limited', 429);
  if (providerCode === 400 || providerCode === 404 || providerCode === 414) return providerError('provider_request_rejected', 502);
  return providerError('provider_unavailable', 503);
}

function createTwelveDataMarketProvider({ apiKey, instruments, licenseRef, fetchImpl = globalThis.fetch, timeoutMs = 8_000, clock = () => new Date() } = {}) {
  const key = typeof apiKey === 'string' ? apiKey.trim() : '';
  if (!key || key.length > 512 || /[\u0000-\u001f\u007f]/.test(key)) throw new Error('Twelve Data API key is required');
  const licenseReference = typeof licenseRef === 'string' ? licenseRef.trim() : '';
  if (!licenseReference || licenseReference.length > 200 || /[\u0000-\u001f\u007f]/.test(licenseReference)) throw new Error('Twelve Data license reference is required');
  if (typeof fetchImpl !== 'function') throw new Error('Twelve Data provider requires fetch');
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1_000 || timeoutMs > 30_000) throw new Error('Twelve Data timeout must be between 1000 and 30000 ms');
  const list = Array.isArray(instruments) ? instruments.map(normalizeInstrument) : parseInstrumentAllowlist(instruments);
  const byId = new Map();
  for (const instrument of list) {
    if (byId.has(instrument.id)) throw new Error('Twelve Data instrument ids must be unique');
    byId.set(instrument.id, instrument);
  }

  async function getSeries(instrumentId, { asOf = clock(), outputSize = DEFAULT_OUTPUT_SIZE } = {}) {
    const instrument = byId.get(instrumentId);
    if (!instrument) throw providerError('instrument_not_configured', 404);
    if (!Number.isSafeInteger(outputSize) || outputSize < 1 || outputSize > MAX_OUTPUT_SIZE) throw providerError('provider_request_rejected', 400);
    const asOfDate = asOf instanceof Date ? new Date(asOf.getTime()) : new Date(asOf);
    if (!Number.isFinite(asOfDate.getTime())) throw providerError('provider_request_rejected', 400);

    const timeframe = TIMEFRAMES[instrument.timeframe];
    const url = new URL('/time_series', API_BASE);
    url.searchParams.set('symbol', instrument.symbol);
    url.searchParams.set(instrument.venue_kind, instrument.venue);
    url.searchParams.set('interval', timeframe.provider);
    url.searchParams.set('outputsize', String(outputSize));
    url.searchParams.set('order', 'asc');
    url.searchParams.set('timezone', 'UTC');
    url.searchParams.set('adjust', 'none');
    url.searchParams.set('prepost', 'false');
    url.searchParams.set('format', 'JSON');

    let response;
    try {
      const signal = typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function'
        ? AbortSignal.timeout(timeoutMs)
        : undefined;
      response = await fetchImpl(url.toString(), {
        method: 'GET',
        headers: { Accept: 'application/json', Authorization: `apikey ${key}` },
        ...(signal ? { signal } : {})
      });
    } catch {
      throw providerError('provider_unavailable', 503);
    }

    let text;
    try { text = await response.text(); } catch { throw providerError('provider_invalid_response', 502); }
    if (typeof text !== 'string' || text.length > 512 * 1024) throw providerError('provider_invalid_response', 502);
    let payload;
    try { payload = JSON.parse(text); } catch { throw providerError('provider_invalid_response', 502); }
    if (!response.ok || payload?.status === 'error' || payload?.code) throw providerStatusError(response.status, payload);
    if (!payload || payload.status !== 'ok' || !payload.meta || !Array.isArray(payload.values) || payload.values.length > MAX_OUTPUT_SIZE) {
      throw providerError('provider_invalid_response', 502);
    }

    const meta = payload.meta;
    const expectedVenueField = instrument.venue_kind;
    const returnedVenue = expectedVenueField === 'mic_code' ? meta.mic_code : meta.exchange;
    if (String(meta.symbol || '').trim().toLowerCase() !== instrument.symbol.toLowerCase()
      || String(returnedVenue || '').trim().toLowerCase() !== instrument.venue.toLowerCase()
      || String(meta.interval || '') !== timeframe.provider
      || String(meta.currency || '').trim().toLowerCase() !== instrument.currency.toLowerCase()) {
      throw providerError('provider_instrument_mismatch', 502);
    }

    const bars = [];
    let previousClose = -Infinity;
    for (const value of payload.values) {
      const openedAt = parseProviderDateTime(value?.datetime);
      if (openedAt === null) throw providerError('provider_invalid_response', 502);
      const closeAt = openedAt + timeframe.durationMs;
      // Twelve Data labels intraday values by bar-open time. Drop a still-open
      // or future candle; only completed historical bars enter the analysis.
      if (closeAt > asOfDate.getTime()) continue;
      if (closeAt <= previousClose) throw providerError('provider_invalid_response', 502);
      const open = parseFiniteNumber(value.open);
      const high = parseFiniteNumber(value.high);
      const low = parseFiniteNumber(value.low);
      const close = parseFiniteNumber(value.close);
      if ([open, high, low, close].some(number => number === null || number <= 0)
        || high < Math.max(open, high, low, close)
        || low > Math.min(open, high, low, close)) {
        throw providerError('provider_invalid_response', 502);
      }
      bars.push({
        timestamp: new Date(closeAt).toISOString(),
        open,
        high,
        low,
        close,
        // The provider describes a volume field but this integration has not
        // verified the quantity/unit for the configured instrument.
        volume: { semantic: 'unavailable', reason: 'not_verified' }
      });
      previousClose = closeAt;
    }
    if (!bars.length) throw providerError('provider_no_closed_bars', 502);

    const series = {
      contract_version: 'dda.market-series.v2',
      instrument: {
        symbol: instrument.symbol,
        venue: instrument.venue,
        asset_class: instrument.asset_class,
        currency: instrument.currency
      },
      timeframe: instrument.timeframe,
      data_mode: 'historical',
      source: { id: PROVIDER_ID, kind: 'provider', provider_symbol: instrument.symbol, license_ref: licenseReference },
      retrieved_at: asOfDate.toISOString(),
      bars
    };
    const validation = validateMarketSeriesV2(series, { asOf: asOfDate });
    if (!validation.valid) throw providerError('provider_invalid_series', 502);
    return series;
  }

  return Object.freeze({
    providerId: PROVIDER_ID,
    hasInstrument: id => byId.has(id),
    listInstruments: () => [...byId.values()].map(({ id, symbol, venue, asset_class, currency, timeframe }) => ({ id, symbol, venue, asset_class, currency, timeframe })),
    getSeries
  });
}

function createTwelveDataMarketProviderFromEnv(env = process.env, options = {}) {
  const rawKey = String(env.TWELVE_DATA_API_KEY || '').trim();
  const rawInstruments = String(env.DDA_AUTOTRADER_TWELVE_DATA_INSTRUMENTS_JSON || '').trim();
  const licenseRef = String(env.DDA_AUTOTRADER_TWELVE_DATA_LICENSE_REF || '').trim();
  if (!rawInstruments) return null;
  if (!rawKey) throw new Error('TWELVE_DATA_API_KEY is required when the Twelve Data instrument allowlist is configured');
  if (!licenseRef) throw new Error('DDA_AUTOTRADER_TWELVE_DATA_LICENSE_REF is required when the Twelve Data instrument allowlist is configured');
  if (['REPLACE_ME', 'YOUR_API_KEY', 'YOUR_API_KEY_HERE'].includes(rawKey)) throw new Error('TWELVE_DATA_API_KEY contains a placeholder value');
  return createTwelveDataMarketProvider({ apiKey: rawKey, licenseRef, instruments: parseInstrumentAllowlist(rawInstruments), ...options });
}

module.exports = {
  API_BASE,
  PROVIDER_ID,
  DEFAULT_OUTPUT_SIZE,
  MAX_OUTPUT_SIZE,
  TIMEFRAMES,
  parseInstrumentAllowlist,
  createTwelveDataMarketProvider,
  createTwelveDataMarketProviderFromEnv
};
