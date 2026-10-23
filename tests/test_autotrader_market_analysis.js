'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { CONTRACT_VERSION, validateMarketSeries } = require('../bff/src/autotrader/market-data');
const { analyzeMarketSeries, STRATEGY_ID } = require('../bff/src/autotrader/market-analysis');

const asOf = new Date('2026-10-18T17:00:00.000Z');
function makeSeries({ count = 20, mode = 'historical', sourceKind = 'historical_import', closeAt = asOf, patch = {} } = {}) {
  const bars = [];
  for (let i = 0; i < count; i += 1) {
    const timestamp = new Date(closeAt.getTime() - (count - i - 1) * 60 * 60 * 1000).toISOString();
    const close = i + 1;
    bars.push({ timestamp, open: close - 0.25, high: close + 0.5, low: close - 0.5, close, volume: i * 10 });
  }
  return {
    contract_version: CONTRACT_VERSION,
    instrument: { symbol: 'TEST', venue: 'TEST-X', asset_class: 'equity', currency: 'USD' },
    timeframe: '1h',
    data_mode: mode,
    source: { id: 'unit-test-fixture', kind: sourceKind },
    retrieved_at: asOf.toISOString(),
    bars,
    ...patch
  };
}

function run(name, fn) {
  fn();
  console.log(`PASS ${name}`);
}

run('contract schema parses and uses the expected version', () => {
  const schema = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'contracts', 'autotrader', 'market-series-v1.schema.json'), 'utf8'));
  assert.equal(schema.properties.contract_version.const, CONTRACT_VERSION);
  assert.equal(schema.properties.bars.maxItems, 100000);
});

run('valid historical OHLCV series passes and is never represented as live', () => {
  const series = makeSeries();
  const result = validateMarketSeries(series, { asOf });
  assert.equal(result.valid, true);
  assert.equal(result.freshness, 'not_applicable');
  const analysis = analyzeMarketSeries(series, { asOf });
  assert.equal(analysis.status, 'analysis_complete');
  assert.equal(analysis.data_mode, 'historical');
  assert.equal(analysis.strategy_id, STRATEGY_ID);
  assert.equal(analysis.interpretation, 'descriptive_only');
  assert.equal(analysis.execution_enabled, false);
  assert.equal(analysis.order_recommendation, null);
  assert.equal(analysis.metrics.sma_20.value, 10.5);
  assert.equal(analysis.context.close_relative_to_sma_20, 'above_sma_20');
  assert.ok(Math.abs(analysis.metrics.latest_period_return.value - (20 / 19 - 1)) < 1e-12);
});

run('synthetic fixtures must be explicitly labelled synthetic', () => {
  const result = validateMarketSeries(makeSeries({ mode: 'synthetic', sourceKind: 'synthetic_fixture' }), { asOf });
  assert.equal(result.valid, true);
  assert.equal(result.freshness, 'not_applicable');
});

run('fresh provider snapshot passes and stale snapshot fails closed', () => {
  const recentAt = new Date(asOf.getTime() - 30_000);
  const fresh = makeSeries({ count: 2, mode: 'snapshot', sourceKind: 'provider', closeAt: recentAt });
  assert.equal(validateMarketSeries(fresh, { asOf, maxAgeMs: 60_000 }).freshness, 'fresh');
  const staleAt = new Date(asOf.getTime() - 10 * 60_000);
  const stale = makeSeries({ count: 2, mode: 'snapshot', sourceKind: 'provider', closeAt: staleAt });
  const result = analyzeMarketSeries(stale, { asOf, maxAgeMs: 60_000 });
  assert.equal(result.status, 'stale_data');
  assert.ok(result.validation_errors.some(error => error.code === 'stale_snapshot'));
  assert.equal(result.metrics && Object.keys(result.metrics).length, 0);
});

run('bad contract version and unsupported timeframe are rejected', () => {
  const series = makeSeries({ patch: { contract_version: 'v0', timeframe: '3m' } });
  const result = validateMarketSeries(series, { asOf });
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(error => error.code === 'unsupported_contract'));
  assert.ok(result.errors.some(error => error.code === 'unsupported_timeframe'));
});

run('OHLC range and negative volume are rejected', () => {
  const series = makeSeries({ count: 2 });
  series.bars[1].high = series.bars[1].close - 1;
  series.bars[1].volume = -1;
  const result = validateMarketSeries(series, { asOf });
  assert.ok(result.errors.some(error => error.code === 'invalid_ohlc_range'));
  assert.ok(result.errors.some(error => error.code === 'invalid_volume'));
});

run('duplicate and descending candle timestamps are rejected', () => {
  const series = makeSeries({ count: 3 });
  series.bars[1].timestamp = series.bars[0].timestamp;
  const result = validateMarketSeries(series, { asOf });
  assert.ok(result.errors.some(error => error.code === 'non_increasing_time'));
});

run('future bars are rejected', () => {
  const futureSeries = makeSeries({ count: 1, closeAt: new Date(asOf.getTime() + 1_000) });
  const result = validateMarketSeries(futureSeries, { asOf });
  assert.ok(result.errors.some(error => error.code === 'future_bar'));
});

run('insufficient history reports null indicators instead of inventing values', () => {
  const analysis = analyzeMarketSeries(makeSeries({ count: 3 }), { asOf });
  assert.equal(analysis.status, 'analysis_complete');
  assert.equal(analysis.metrics.sma_20.value, null);
  assert.equal(analysis.metrics.sma_20.status, 'insufficient_data');
  assert.equal(analysis.context.close_relative_to_sma_20, 'insufficient_data');
});

run('invalid mode/source pairing is rejected', () => {
  const result = validateMarketSeries(makeSeries({ mode: 'snapshot', sourceKind: 'historical_import' }), { asOf });
  assert.ok(result.errors.some(error => error.code === 'source_mode_mismatch'));
});

run('unknown properties and future retrieval timestamps are rejected', () => {
  const series = makeSeries({ patch: { unexpected: true, retrieved_at: new Date(asOf.getTime() + 1_000).toISOString() } });
  const result = validateMarketSeries(series, { asOf });
  assert.ok(result.errors.some(error => error.code === 'unexpected_property'));
  assert.ok(result.errors.some(error => error.code === 'future_retrieval'));
});

console.log('AutoTrader market-analysis tests: 11 passed');
