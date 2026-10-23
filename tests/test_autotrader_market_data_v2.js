'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { CONTRACT_VERSION, validateMarketSeries } = require('../bff/src/autotrader/market-data');
const { CONTRACT_VERSION_V2, validateMarketSeriesV2 } = require('../bff/src/autotrader/market-data-v2');

const asOf = new Date('2026-10-18T18:00:00.000Z');
const definitionRef = 'fixture:verified-volume-definition-v1';

function makeSeries({ dataMode = 'snapshot', sourceKind = 'provider', volume, closeAt = new Date(asOf.getTime() - 30_000), patch = {} } = {}) {
  const source = { id: 'simulated-provider', kind: sourceKind };
  if (sourceKind === 'provider') source.provider_symbol = 'XAU/USD';
  const bar = {
    timestamp: closeAt.toISOString(),
    open: 2000,
    high: 2010,
    low: 1995,
    close: 2005,
    volume: volume || { semantic: 'unavailable', reason: 'not_verified' }
  };
  return {
    contract_version: CONTRACT_VERSION_V2,
    instrument: { symbol: 'XAUUSD_SPOT', venue: 'SIMULATED:OTC', asset_class: 'precious_metal_spot', currency: 'USD' },
    timeframe: '1h',
    data_mode: dataMode,
    source,
    retrieved_at: asOf.toISOString(),
    bars: [bar],
    ...patch
  };
}

function run(name, fn) {
  fn();
  console.log(`PASS ${name}`);
}

function hasCode(result, code) {
  return result.errors.some(error => error.code === code);
}

run('v2 schema file parses and declares the four volume semantics', () => {
  const schema = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'contracts', 'autotrader', 'market-series-v2.schema.json'), 'utf8'));
  assert.equal(schema.properties.contract_version.const, CONTRACT_VERSION_V2);
  const variants = schema.properties.bars.items.properties.volume.oneOf;
  assert.deepEqual(variants.map(item => item.properties.semantic.const), ['traded_volume', 'transaction_count', 'tick_count', 'unavailable']);
  assert.equal(Object.hasOwn(variants[3].properties, 'value'), false);
});

run('valid traded volume requires an admitted unit and a definition reference', () => {
  const series = makeSeries({ volume: { semantic: 'traded_volume', value: 0, unit: 'troy_ounces', definition_ref: definitionRef } });
  assert.equal(validateMarketSeriesV2(series, { asOf }).valid, true);
});

run('transaction and tick counts remain distinct typed measurements', () => {
  const transactionSeries = makeSeries({ volume: { semantic: 'transaction_count', value: 17, unit: 'transactions', definition_ref: definitionRef } });
  const tickSeries = makeSeries({ volume: { semantic: 'tick_count', value: 17, unit: 'ticks', definition_ref: definitionRef } });
  assert.equal(validateMarketSeriesV2(transactionSeries, { asOf }).valid, true);
  assert.equal(validateMarketSeriesV2(tickSeries, { asOf }).valid, true);
});

run('explicitly unavailable volume is accepted without a numeric value', () => {
  const result = validateMarketSeriesV2(makeSeries(), { asOf });
  assert.equal(result.valid, true);
  assert.equal(result.freshness, 'fresh');
});

run('unavailable volume with value zero is rejected rather than treated as zero traded volume', () => {
  const series = makeSeries();
  series.bars[0].volume.value = 0;
  const result = validateMarketSeriesV2(series, { asOf });
  assert.equal(result.valid, false);
  assert.ok(hasCode(result, 'unavailable_has_measurement'));
});

run('unknown volume semantic and unknown unavailable reason are rejected', () => {
  const unknownSemantic = makeSeries({ volume: { semantic: 'unknown', value: 0, unit: 'instrument_units', definition_ref: definitionRef } });
  const unknownReason = makeSeries({ volume: { semantic: 'unavailable', reason: 'unknown' } });
  assert.ok(hasCode(validateMarketSeriesV2(unknownSemantic, { asOf }), 'invalid_volume_semantic'));
  assert.ok(hasCode(validateMarketSeriesV2(unknownReason, { asOf }), 'invalid_unavailable_reason'));
});

run('semantic and unit mismatches are rejected', () => {
  const wrongTransactionUnit = makeSeries({ volume: { semantic: 'transaction_count', value: 1, unit: 'ticks', definition_ref: definitionRef } });
  const wrongTickUnit = makeSeries({ volume: { semantic: 'tick_count', value: 1, unit: 'transactions', definition_ref: definitionRef } });
  assert.ok(hasCode(validateMarketSeriesV2(wrongTransactionUnit, { asOf }), 'volume_unit_semantic_mismatch'));
  assert.ok(hasCode(validateMarketSeriesV2(wrongTickUnit, { asOf }), 'volume_unit_semantic_mismatch'));
});

run('counts require non-negative integers and measured values require a definition reference', () => {
  const fractionalCount = makeSeries({ volume: { semantic: 'tick_count', value: 1.5, unit: 'ticks', definition_ref: definitionRef } });
  const negativeCount = makeSeries({ volume: { semantic: 'transaction_count', value: -1, unit: 'transactions', definition_ref: definitionRef } });
  const noDefinition = makeSeries({ volume: { semantic: 'traded_volume', value: 4, unit: 'contracts' } });
  assert.ok(hasCode(validateMarketSeriesV2(fractionalCount, { asOf }), 'invalid_count_value'));
  assert.ok(hasCode(validateMarketSeriesV2(negativeCount, { asOf }), 'invalid_volume_value'));
  assert.ok(hasCode(validateMarketSeriesV2(noDefinition, { asOf }), 'invalid_definition_ref'));
});

run('unsupported units, non-finite values, and extra measurement fields are rejected', () => {
  const badUnit = makeSeries({ volume: { semantic: 'traded_volume', value: 1, unit: 'ticks', definition_ref: definitionRef } });
  const infinite = makeSeries({ volume: { semantic: 'traded_volume', value: Infinity, unit: 'lots', definition_ref: definitionRef } });
  const extra = makeSeries({ volume: { semantic: 'tick_count', value: 1, unit: 'ticks', definition_ref: definitionRef, reason: 'not_reported' } });
  assert.ok(hasCode(validateMarketSeriesV2(badUnit, { asOf }), 'invalid_traded_volume_unit'));
  assert.ok(hasCode(validateMarketSeriesV2(infinite, { asOf }), 'invalid_volume_value'));
  assert.ok(hasCode(validateMarketSeriesV2(extra, { asOf }), 'unexpected_property'));
});

run('provider source requires the exact external symbol', () => {
  const series = makeSeries();
  delete series.source.provider_symbol;
  const result = validateMarketSeriesV2(series, { asOf });
  assert.ok(hasCode(result, 'missing_provider_symbol'));
});

run('historical provider data is distinct from historical imports and synthetic fixtures', () => {
  const historicalProvider = makeSeries({ dataMode: 'historical', sourceKind: 'provider' });
  const historicalImport = makeSeries({ dataMode: 'historical', sourceKind: 'historical_import' });
  const synthetic = makeSeries({ dataMode: 'synthetic', sourceKind: 'synthetic_fixture' });
  assert.equal(validateMarketSeriesV2(historicalProvider, { asOf }).valid, true);
  assert.equal(validateMarketSeriesV2(historicalImport, { asOf }).valid, true);
  const fixtureResult = validateMarketSeriesV2(synthetic, { asOf });
  assert.equal(fixtureResult.valid, true);
  assert.equal(fixtureResult.freshness, 'not_applicable');
});

run('snapshot and source-kind mismatches are rejected', () => {
  const series = makeSeries({ dataMode: 'snapshot', sourceKind: 'historical_import' });
  const result = validateMarketSeriesV2(series, { asOf });
  assert.ok(hasCode(result, 'source_mode_mismatch'));
});

run('invalid OHLC ranges, duplicate times, future bars, and future retrievals fail closed', () => {
  const badRange = makeSeries();
  badRange.bars[0].low = 2006;
  assert.ok(hasCode(validateMarketSeriesV2(badRange, { asOf }), 'invalid_ohlc_range'));

  const duplicate = makeSeries({ patch: { bars: [
    { timestamp: '2026-10-18T17:59:00.000Z', open: 1, high: 2, low: 1, close: 2, volume: { semantic: 'unavailable', reason: 'not_reported' } },
    { timestamp: '2026-10-18T17:59:00.000Z', open: 1, high: 2, low: 1, close: 2, volume: { semantic: 'unavailable', reason: 'not_reported' } }
  ] } });
  assert.ok(hasCode(validateMarketSeriesV2(duplicate, { asOf }), 'non_increasing_time'));

  const futureBar = makeSeries({ closeAt: new Date(asOf.getTime() + 1_000) });
  assert.ok(hasCode(validateMarketSeriesV2(futureBar, { asOf }), 'future_bar'));

  const futureRetrieval = makeSeries({ patch: { retrieved_at: new Date(asOf.getTime() + 1_000).toISOString() } });
  assert.ok(hasCode(validateMarketSeriesV2(futureRetrieval, { asOf }), 'future_retrieval'));
});

run('stale snapshots fail closed while historical and synthetic modes are not marked live', () => {
  const stale = makeSeries({ closeAt: new Date(asOf.getTime() - 2 * 60_000) });
  const staleResult = validateMarketSeriesV2(stale, { asOf, maxAgeMs: 60_000 });
  assert.equal(staleResult.valid, false);
  assert.equal(staleResult.freshness, 'stale');
  assert.ok(hasCode(staleResult, 'stale_snapshot'));

  const historical = validateMarketSeriesV2(makeSeries({ dataMode: 'historical', sourceKind: 'provider', closeAt: new Date(asOf.getTime() - 24 * 60 * 60_000) }), { asOf });
  assert.equal(historical.valid, true);
  assert.equal(historical.freshness, 'not_applicable');
});

run('v1 and v2 validators reject cross-version series instead of coercing volume meaning', () => {
  const v1Series = {
    contract_version: CONTRACT_VERSION,
    instrument: { symbol: 'TEST', venue: 'TEST-X', asset_class: 'equity', currency: 'USD' },
    timeframe: '1h', data_mode: 'historical', source: { id: 'test-import', kind: 'historical_import' },
    retrieved_at: asOf.toISOString(),
    bars: [{ timestamp: '2026-10-18T17:00:00.000Z', open: 1, high: 2, low: 1, close: 2, volume: 5 }]
  };
  const v2Series = makeSeries({ dataMode: 'historical', sourceKind: 'historical_import' });
  assert.ok(hasCode(validateMarketSeries(v2Series, { asOf }), 'unsupported_contract'));
  assert.ok(hasCode(validateMarketSeriesV2(v1Series, { asOf }), 'unsupported_contract'));
  assert.equal(validateMarketSeries(v1Series, { asOf }).valid, true);
  assert.equal(validateMarketSeriesV2(v2Series, { asOf }).valid, true);
});

run('unsupported contract versions, timeframes, and top-level keys are rejected', () => {
  const series = makeSeries({ patch: { contract_version: 'dda.market-series.v1', timeframe: '2m', unexpected: true } });
  const result = validateMarketSeriesV2(series, { asOf });
  assert.ok(hasCode(result, 'unsupported_contract'));
  assert.ok(hasCode(result, 'unsupported_timeframe'));
  assert.ok(hasCode(result, 'unexpected_property'));
});

run('invalid options and non-object series return structured errors', () => {
  const result = validateMarketSeriesV2(null, { asOf: 'not-a-date', maxAgeMs: -1 });
  assert.equal(result.valid, false);
  assert.equal(result.freshness, 'unknown');
  assert.ok(hasCode(result, 'invalid_timestamp'));
  assert.ok(hasCode(result, 'invalid_age_limit'));
  assert.ok(hasCode(result, 'invalid_object'));
});

console.log('AutoTrader market-data v2 tests: 16 passed');
