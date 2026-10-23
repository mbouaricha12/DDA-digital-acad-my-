'use strict';

const CONTRACT_VERSION_V2 = 'dda.market-series.v2';
const MAX_BARS_V2 = 100_000;
const SUPPORTED_TIMEFRAMES_V2 = new Set(['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w']);
const SOURCE_KINDS_V2 = new Set(['provider', 'historical_import', 'synthetic_fixture']);
const TRADED_VOLUME_UNITS = new Set(['instrument_units', 'contracts', 'lots', 'shares', 'troy_ounces']);
const UNAVAILABLE_REASONS = new Set(['not_reported', 'not_supported', 'not_verified', 'not_applicable']);
const VOLUME_FIELDS = new Set(['semantic', 'value', 'unit', 'definition_ref', 'reason']);

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

function validText(value, maxLength) {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= maxLength;
}

/**
 * Checks the shape and basic semantics of a v2 volume measurement.
 * definition_ref is an auditable reference, not proof that the referenced
 * provider definition is accurate; a future provider registry must establish that.
 */
function validateVolumeMeasurement(volume, path, errors) {
  if (!isRecord(volume)) {
    add(errors, path, 'invalid_volume_measurement', 'volume must be a typed measurement object.');
    return;
  }

  checkKeys(volume, VOLUME_FIELDS, path, errors);
  const semantic = volume.semantic;
  if (semantic === 'unavailable') {
    if (!UNAVAILABLE_REASONS.has(volume.reason)) {
      add(errors, `${path}.reason`, 'invalid_unavailable_reason', 'Unavailable volume requires an approved reason.');
    }
    for (const key of ['value', 'unit', 'definition_ref']) {
      if (Object.hasOwn(volume, key)) add(errors, `${path}.${key}`, 'unavailable_has_measurement', 'Unavailable volume cannot contain a value, unit, or definition reference.');
    }
    return;
  }

  if (!['traded_volume', 'transaction_count', 'tick_count'].includes(semantic)) {
    add(errors, `${path}.semantic`, 'invalid_volume_semantic', 'semantic must be traded_volume, transaction_count, tick_count, or unavailable.');
    return;
  }

  if (typeof volume.value !== 'number' || !Number.isFinite(volume.value) || volume.value < 0) {
    add(errors, `${path}.value`, 'invalid_volume_value', 'Measured volume must be a finite non-negative number.');
  }
  if (!validText(volume.definition_ref, 200)) {
    add(errors, `${path}.definition_ref`, 'invalid_definition_ref', 'A measured value requires a non-empty definition reference of at most 200 characters.');
  }

  if (semantic === 'traded_volume') {
    if (!TRADED_VOLUME_UNITS.has(volume.unit)) add(errors, `${path}.unit`, 'invalid_traded_volume_unit', 'Traded volume requires a supported instrument-volume unit.');
    if (Object.hasOwn(volume, 'reason')) add(errors, `${path}.reason`, 'unexpected_property', 'reason is only valid when volume is unavailable.');
    return;
  }

  const expectedUnit = semantic === 'transaction_count' ? 'transactions' : 'ticks';
  if (volume.unit !== expectedUnit) add(errors, `${path}.unit`, 'volume_unit_semantic_mismatch', `${semantic} requires unit ${expectedUnit}.`);
  if (typeof volume.value !== 'number' || !Number.isInteger(volume.value) || !Number.isFinite(volume.value) || volume.value < 0) {
    add(errors, `${path}.value`, 'invalid_count_value', `${semantic} requires a finite non-negative integer.`);
  }
  if (Object.hasOwn(volume, 'reason')) add(errors, `${path}.reason`, 'unexpected_property', 'reason is only valid when volume is unavailable.');
}

/**
 * Validates a normalized v2 market series. This validator is intentionally
 * separate from the v1 validator; callers must select a version explicitly.
 * Snapshot freshness defaults to the existing v1 five-minute policy, but callers
 * should pass a timeframe/provider-specific limit before using real market data.
 */
function validateMarketSeriesV2(series, options = {}) {
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
  if (series.contract_version !== CONTRACT_VERSION_V2) add(errors, 'contract_version', 'unsupported_contract', `Expected ${CONTRACT_VERSION_V2}.`);

  if (!isRecord(series.instrument)) {
    add(errors, 'instrument', 'required_object', 'instrument is required.');
  } else {
    checkKeys(series.instrument, new Set(['symbol', 'venue', 'asset_class', 'currency']), 'instrument', errors);
    const limits = { symbol: 32, venue: 100, asset_class: 32, currency: 32 };
    for (const [key, maxLength] of Object.entries(limits)) {
      if (!validText(series.instrument[key], maxLength)) add(errors, `instrument.${key}`, 'invalid_text', `${key} must be a non-empty string of at most ${maxLength} characters.`);
    }
  }

  if (!SUPPORTED_TIMEFRAMES_V2.has(series.timeframe)) add(errors, 'timeframe', 'unsupported_timeframe', 'timeframe is not in the supported v2 set.');

  if (!isRecord(series.source)) {
    add(errors, 'source', 'required_object', 'source metadata is required.');
  } else {
    checkKeys(series.source, new Set(['id', 'kind', 'provider_symbol', 'license_ref', 'provider_timestamp']), 'source', errors);
    if (!validText(series.source.id, 100)) add(errors, 'source.id', 'invalid_source_id', 'source.id must be a non-empty identifier of at most 100 characters.');
    if (!SOURCE_KINDS_V2.has(series.source.kind)) add(errors, 'source.kind', 'invalid_source_kind', 'source.kind must identify provider, historical import, or synthetic fixture.');
    if (series.source.kind === 'provider' && !validText(series.source.provider_symbol, 64)) {
      add(errors, 'source.provider_symbol', 'missing_provider_symbol', 'Provider sources require the exact provider symbol.');
    }
    if (series.source.provider_symbol !== undefined && !validText(series.source.provider_symbol, 64)) {
      add(errors, 'source.provider_symbol', 'invalid_provider_symbol', 'provider_symbol must be a non-empty string of at most 64 characters.');
    }
    if (series.source.license_ref !== undefined && !validText(series.source.license_ref, 200)) {
      add(errors, 'source.license_ref', 'invalid_license_reference', 'license_ref must be a non-empty string of at most 200 characters.');
    }
    if (series.source.provider_timestamp !== undefined && !isUtcTimestamp(series.source.provider_timestamp)) {
      add(errors, 'source.provider_timestamp', 'invalid_timestamp', 'provider_timestamp must be canonical UTC ISO with milliseconds.');
    }
    if (isUtcTimestamp(series.source.provider_timestamp) && Number.isFinite(asOf.getTime()) && Date.parse(series.source.provider_timestamp) > asOf.getTime()) {
      add(errors, 'source.provider_timestamp', 'future_source_timestamp', 'Provider timestamp cannot be after asOf.');
    }
  }

  const validModes = new Set(['snapshot', 'historical', 'synthetic']);
  if (!validModes.has(series.data_mode)) {
    add(errors, 'data_mode', 'invalid_data_mode', 'data_mode must be snapshot, historical, or synthetic.');
  } else if (series.data_mode === 'snapshot' && series.source?.kind !== 'provider') {
    add(errors, 'data_mode', 'source_mode_mismatch', 'snapshot mode requires provider source metadata.');
  } else if (series.data_mode === 'historical' && !['provider', 'historical_import'].includes(series.source?.kind)) {
    add(errors, 'data_mode', 'source_mode_mismatch', 'historical mode requires provider or historical_import source metadata.');
  } else if (series.data_mode === 'synthetic' && series.source?.kind !== 'synthetic_fixture') {
    add(errors, 'data_mode', 'source_mode_mismatch', 'synthetic mode requires synthetic_fixture source metadata.');
  }

  if (!isUtcTimestamp(series.retrieved_at)) {
    add(errors, 'retrieved_at', 'invalid_timestamp', 'retrieved_at must be canonical UTC ISO with milliseconds.');
  } else if (Number.isFinite(asOf.getTime()) && Date.parse(series.retrieved_at) > asOf.getTime()) {
    add(errors, 'retrieved_at', 'future_retrieval', 'retrieved_at cannot be after asOf.');
  }

  if (!Array.isArray(series.bars) || series.bars.length < 1 || series.bars.length > MAX_BARS_V2) {
    add(errors, 'bars', 'invalid_bar_count', `bars must contain between 1 and ${MAX_BARS_V2} entries.`);
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
      add(errors, `${base}.timestamp`, 'invalid_timestamp', 'timestamp must be a canonical UTC candle close time.');
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
    if (['open', 'high', 'low', 'close'].every(key => typeof bar[key] === 'number' && Number.isFinite(bar[key]) && bar[key] > 0)) {
      if (bar.high < Math.max(bar.open, bar.close, bar.low)) add(errors, `${base}.high`, 'invalid_ohlc_range', 'high must be greater than or equal to open, close, and low.');
      if (bar.low > Math.min(bar.open, bar.close, bar.high)) add(errors, `${base}.low`, 'invalid_ohlc_range', 'low must be less than or equal to open, close, and high.');
    }
    validateVolumeMeasurement(bar.volume, `${base}.volume`, errors);
  }

  let freshness = series.data_mode === 'snapshot' ? 'unknown' : 'not_applicable';
  if (series.data_mode === 'snapshot' && latestBarAt && Number.isFinite(asOf.getTime()) && Number.isFinite(maxAgeMs) && maxAgeMs >= 0) {
    const age = asOf.getTime() - Date.parse(latestBarAt);
    freshness = age > maxAgeMs ? 'stale' : 'fresh';
    if (freshness === 'stale') add(errors, 'bars', 'stale_snapshot', 'Latest provider candle exceeds maxAgeMs; analysis must fail closed.');
  }

  return { valid: errors.length === 0, errors, freshness, latestBarAt };
}

module.exports = {
  CONTRACT_VERSION_V2,
  MAX_BARS_V2,
  SUPPORTED_TIMEFRAMES_V2,
  validateMarketSeriesV2
};
