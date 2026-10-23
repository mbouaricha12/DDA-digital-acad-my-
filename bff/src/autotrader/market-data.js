'use strict';

const CONTRACT_VERSION = 'dda.market-series.v1';
const MAX_BARS = 100_000;
const SUPPORTED_TIMEFRAMES = new Set(['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w']);
const SOURCE_KINDS = new Set(['provider', 'historical_import', 'synthetic_fixture']);

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isUtcTimestamp(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(value)) return false;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) && new Date(parsed).toISOString() === value;
}

function add(errors, path, code, message) {
  errors.push({ path, code, message });
}

function checkKeys(value, allowed, path, errors) {
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) add(errors, `${path}.${key}`, 'unexpected_property', 'Property is not part of this contract version.');
  }
}

/**
 * Validates a normalized OHLCV time series. Candle timestamps are UTC close times.
 * Freshness is enforced only for provider snapshots; historical and synthetic data
 * remain explicitly non-live and are never promoted to a live status.
 */
function validateMarketSeries(series, options = {}) {
  const errors = [];
  const asOf = options.asOf === undefined ? new Date() : new Date(options.asOf);
  const maxAgeMs = options.maxAgeMs === undefined ? 5 * 60 * 1000 : options.maxAgeMs;

  if (!Number.isFinite(asOf.getTime())) add(errors, 'options.asOf', 'invalid_timestamp', 'asOf must be a valid timestamp.');
  if (!Number.isFinite(maxAgeMs) || maxAgeMs < 0) add(errors, 'options.maxAgeMs', 'invalid_age_limit', 'maxAgeMs must be a non-negative finite number.');
  if (!isRecord(series)) {
    add(errors, '$', 'invalid_object', 'Market series must be a JSON object.');
    return { valid: false, errors, freshness: 'unknown', latestBarAt: null };
  }
  checkKeys(series, new Set(['contract_version', 'instrument', 'timeframe', 'data_mode', 'source', 'retrieved_at', 'bars']), '$', errors);

  if (series.contract_version !== CONTRACT_VERSION) add(errors, 'contract_version', 'unsupported_contract', `Expected ${CONTRACT_VERSION}.`);
  if (!isRecord(series.instrument)) add(errors, 'instrument', 'required_object', 'instrument is required.');
  else {
    checkKeys(series.instrument, new Set(['symbol', 'venue', 'asset_class', 'currency']), 'instrument', errors);
    for (const key of ['symbol', 'venue', 'asset_class', 'currency']) {
      if (typeof series.instrument[key] !== 'string' || !series.instrument[key].trim() || series.instrument[key].length > 32) {
        add(errors, `instrument.${key}`, 'invalid_text', `${key} must be a non-empty string of at most 32 characters.`);
      }
    }
  }
  if (!SUPPORTED_TIMEFRAMES.has(series.timeframe)) add(errors, 'timeframe', 'unsupported_timeframe', 'timeframe is not in the supported v1 set.');
  if (!isRecord(series.source)) add(errors, 'source', 'required_object', 'source metadata is required.');
  else {
    checkKeys(series.source, new Set(['id', 'kind', 'license_ref', 'provider_timestamp']), 'source', errors);
    if (typeof series.source.id !== 'string' || !series.source.id.trim() || series.source.id.length > 100) add(errors, 'source.id', 'invalid_source_id', 'source.id must be a non-empty identifier.');
    if (!SOURCE_KINDS.has(series.source.kind)) add(errors, 'source.kind', 'invalid_source_kind', 'source.kind must identify provider, historical import, or synthetic fixture.');
    if (series.source.license_ref !== undefined && (typeof series.source.license_ref !== 'string' || series.source.license_ref.length > 200)) add(errors, 'source.license_ref', 'invalid_license_reference', 'license_ref must be a string of at most 200 characters.');
    if (series.source.provider_timestamp !== undefined && !isUtcTimestamp(series.source.provider_timestamp)) add(errors, 'source.provider_timestamp', 'invalid_timestamp', 'provider_timestamp must be a canonical UTC ISO timestamp with milliseconds.');
    if (isUtcTimestamp(series.source.provider_timestamp) && Number.isFinite(asOf.getTime()) && Date.parse(series.source.provider_timestamp) > asOf.getTime()) add(errors, 'source.provider_timestamp', 'future_source_timestamp', 'Provider timestamp cannot be after asOf.');
  }
  if (!['snapshot', 'historical', 'synthetic'].includes(series.data_mode)) add(errors, 'data_mode', 'invalid_data_mode', 'data_mode must be snapshot, historical, or synthetic.');
  if (series.data_mode === 'snapshot' && series.source?.kind !== 'provider') add(errors, 'data_mode', 'source_mode_mismatch', 'snapshot mode requires provider source metadata.');
  if (series.data_mode === 'historical' && series.source?.kind !== 'historical_import') add(errors, 'data_mode', 'source_mode_mismatch', 'historical mode requires historical_import source metadata.');
  if (series.data_mode === 'synthetic' && series.source?.kind !== 'synthetic_fixture') add(errors, 'data_mode', 'source_mode_mismatch', 'synthetic mode requires synthetic_fixture source metadata.');
  if (!isUtcTimestamp(series.retrieved_at)) add(errors, 'retrieved_at', 'invalid_timestamp', 'retrieved_at must be a canonical UTC ISO timestamp with milliseconds.');
  if (isUtcTimestamp(series.retrieved_at) && Number.isFinite(asOf.getTime()) && Date.parse(series.retrieved_at) > asOf.getTime()) add(errors, 'retrieved_at', 'future_retrieval', 'retrieved_at cannot be after asOf.');
  if (!Array.isArray(series.bars) || series.bars.length < 1 || series.bars.length > MAX_BARS) {
    add(errors, 'bars', 'invalid_bar_count', `bars must contain between 1 and ${MAX_BARS} entries.`);
  }

  const bars = Array.isArray(series.bars) ? series.bars : [];
  let previousTimestamp = -Infinity;
  let latestBarAt = null;
  for (let i = 0; i < bars.length; i += 1) {
    const bar = bars[i];
    const base = `bars[${i}]`;
    if (!isRecord(bar)) {
      add(errors, base, 'invalid_bar', 'Each bar must be an object.');
      continue;
    }
    checkKeys(bar, new Set(['timestamp', 'open', 'high', 'low', 'close', 'volume']), base, errors);
    if (!isUtcTimestamp(bar.timestamp)) {
      add(errors, `${base}.timestamp`, 'invalid_timestamp', 'timestamp must be a canonical UTC close time.');
    } else {
      const time = Date.parse(bar.timestamp);
      if (time <= previousTimestamp) add(errors, `${base}.timestamp`, 'non_increasing_time', 'Bars must be unique and strictly chronological.');
      previousTimestamp = time;
      latestBarAt = bar.timestamp;
      if (Number.isFinite(asOf.getTime()) && time > asOf.getTime()) add(errors, `${base}.timestamp`, 'future_bar', 'A candle cannot close after the analysis asOf time.');
    }
    for (const key of ['open', 'high', 'low', 'close']) {
      if (typeof bar[key] !== 'number' || !Number.isFinite(bar[key]) || bar[key] <= 0) {
        add(errors, `${base}.${key}`, 'invalid_price', `${key} must be a finite positive number.`);
      }
    }
    if (typeof bar.volume !== 'number' || !Number.isFinite(bar.volume) || bar.volume < 0) add(errors, `${base}.volume`, 'invalid_volume', 'volume must be a finite non-negative number.');
    if (['open', 'high', 'low', 'close'].every(key => typeof bar[key] === 'number' && Number.isFinite(bar[key]) && bar[key] > 0)) {
      if (bar.high < Math.max(bar.open, bar.close, bar.low)) add(errors, `${base}.high`, 'invalid_ohlc_range', 'high must be greater than or equal to open, close, and low.');
      if (bar.low > Math.min(bar.open, bar.close, bar.high)) add(errors, `${base}.low`, 'invalid_ohlc_range', 'low must be less than or equal to open, close, and high.');
    }
  }

  let freshness = series.data_mode === 'snapshot' ? 'unknown' : 'not_applicable';
  if (series.data_mode === 'snapshot' && latestBarAt && Number.isFinite(asOf.getTime()) && Number.isFinite(maxAgeMs) && maxAgeMs >= 0) {
    const age = asOf.getTime() - Date.parse(latestBarAt);
    freshness = age > maxAgeMs ? 'stale' : 'fresh';
    if (freshness === 'stale') add(errors, 'bars', 'stale_snapshot', 'Latest provider candle exceeds maxAgeMs; analysis must fail closed.');
  }

  return { valid: errors.length === 0, errors, freshness, latestBarAt };
}

module.exports = { CONTRACT_VERSION, MAX_BARS, SUPPORTED_TIMEFRAMES, validateMarketSeries };
