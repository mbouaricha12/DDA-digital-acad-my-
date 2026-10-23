'use strict';

const assert = require('node:assert/strict');
const { analyzeMarketSeriesV2, ANALYSIS_CONTRACT_VERSION, ENGINE_ID } = require('../bff/src/autotrader/market-analysis-v2');

const asOf = new Date('2026-10-18T18:00:00.000Z');

function makeSeries({ count = 60, dataMode = 'historical', sourceKind = 'historical_import', closeAt = new Date(asOf.getTime() - 30_000), patch = {} } = {}) {
  const bars = [];
  for (let i = 0; i < count; i += 1) {
    const close = 100 + i;
    bars.push({
      timestamp: new Date(closeAt.getTime() - (count - i - 1) * 60 * 60 * 1000).toISOString(),
      open: close - 0.25,
      high: close + 2,
      low: close - 1,
      close,
      volume: { semantic: 'unavailable', reason: 'not_reported' }
    });
  }
  const source = { id: 'simulated-market-fixture', kind: sourceKind };
  if (sourceKind === 'provider') source.provider_symbol = 'XAU/USD';
  return {
    contract_version: 'dda.market-series.v2',
    instrument: { symbol: 'XAUUSD_SPOT', venue: 'SIMULATED:OTC', asset_class: 'precious_metal_spot', currency: 'USD' },
    timeframe: '1h',
    data_mode: dataMode,
    source,
    retrieved_at: asOf.toISOString(),
    bars,
    ...patch
  };
}

function run(name, fn) {
  fn();
  console.log(`PASS ${name}`);
}

run('v2 analysis returns descriptive contract and immutable no-execution fields', () => {
  const result = analyzeMarketSeriesV2(makeSeries(), { asOf });
  assert.equal(result.contract_version, ANALYSIS_CONTRACT_VERSION);
  assert.equal(result.engine_id, ENGINE_ID);
  assert.equal(result.analysis_type, 'technical_descriptive');
  assert.equal(result.interpretation, 'descriptive_only');
  assert.equal(result.status, 'analysis_complete');
  assert.equal(result.execution_enabled, false);
  assert.equal(result.order_recommendation, null);
  assert.equal(Object.hasOwn(result, 'signal'), false);
  assert.equal(Object.hasOwn(result, 'order'), false);
});

run('trend moving averages and MACD are computed from close prices with traceable windows', () => {
  const result = analyzeMarketSeriesV2(makeSeries(), { asOf });
  assert.equal(result.metrics.trend_sma_20.value, 149.5);
  assert.equal(result.metrics.trend_sma_50.value, 134.5);
  assert.ok(Number.isFinite(result.metrics.trend_ema_20.value));
  assert.ok(Number.isFinite(result.metrics.trend_ema_50.value));
  assert.ok(result.metrics.trend_macd_line_12_26.value > 0);
  assert.ok(Number.isFinite(result.metrics.trend_macd_signal_9.value));
  assert.ok(Number.isFinite(result.metrics.trend_macd_histogram.value));
  assert.equal(result.metrics.trend_sma_20.window.n_obs, 20);
  assert.equal(result.metrics.trend_sma_20.window.frequency, '1h');
  assert.equal(result.metrics.trend_sma_20.window.annualization_factor, null);
  assert.deepEqual(result.metrics.trend_sma_20.inputs, ['close']);
});

run('MACD signal line requires 34 bars and never fills its warm-up window', () => {
  const at26 = analyzeMarketSeriesV2(makeSeries({ count: 26 }), { asOf });
  const at33 = analyzeMarketSeriesV2(makeSeries({ count: 33 }), { asOf });
  const at34 = analyzeMarketSeriesV2(makeSeries({ count: 34 }), { asOf });
  assert.equal(at26.metrics.trend_macd_line_12_26.status, 'computed');
  assert.equal(at26.metrics.trend_macd_signal_9.value, null);
  assert.equal(at33.metrics.trend_macd_signal_9.value, null);
  assert.equal(at34.metrics.trend_macd_signal_9.status, 'computed');
  assert.equal(at34.metrics.trend_macd_signal_9.window.n_obs, 9);
});

run('ATR and Bollinger indicators use documented OHLC/close windows', () => {
  const result = analyzeMarketSeriesV2(makeSeries(), { asOf });
  assert.equal(result.metrics.volatility_atr_14.value, 3);
  assert.ok(Math.abs(result.metrics.volatility_atr_14_fraction.value - 3 / 159) < 1e-12);
  assert.equal(result.metrics.volatility_bollinger_middle_20.value, 149.5);
  assert.ok(result.metrics.volatility_bollinger_upper_20_2.value > result.metrics.volatility_bollinger_middle_20.value);
  assert.ok(result.metrics.volatility_bollinger_lower_20_2.value < result.metrics.volatility_bollinger_middle_20.value);
  assert.ok(result.metrics.volatility_bollinger_bandwidth_20_2.value > 0);
  assert.equal(result.metrics.volatility_atr_14.window.n_obs, 60);
  assert.deepEqual(result.metrics.volatility_atr_14.inputs, ['high', 'low', 'close']);
});

run('realized volatility is a sample standard deviation of 20 returns and is not annualized', () => {
  const result = analyzeMarketSeriesV2(makeSeries(), { asOf });
  const metric = result.metrics.volatility_realized_20;
  assert.ok(metric.value > 0);
  assert.equal(metric.unit, 'fraction_per_bar');
  assert.equal(metric.window.n_obs, 20);
  assert.equal(metric.window.start, result.data_as_of ? new Date(Date.parse(result.data_as_of) - 20 * 60 * 60 * 1000).toISOString() : null);
  assert.equal(metric.window.annualization_factor, null);
  assert.match(metric.method, /[Ss]ample standard deviation \(n-1\)/);
});

run('insufficient history returns null indicators with insufficient_data status', () => {
  const result = analyzeMarketSeriesV2(makeSeries({ count: 10 }), { asOf });
  assert.equal(result.status, 'analysis_complete');
  for (const key of ['trend_sma_20', 'trend_sma_50', 'trend_ema_20', 'trend_ema_50', 'trend_macd_line_12_26', 'trend_macd_signal_9', 'volatility_atr_14', 'volatility_bollinger_upper_20_2', 'volatility_realized_20']) {
    assert.equal(result.metrics[key].value, null, `${key} must be null until its minimum window is met`);
    assert.equal(result.metrics[key].status, 'insufficient_data');
  }
});

run('short histories populate metrics only after each indicator minimum observation count', () => {
  const at14 = analyzeMarketSeriesV2(makeSeries({ count: 14 }), { asOf });
  const at20 = analyzeMarketSeriesV2(makeSeries({ count: 20 }), { asOf });
  const at21 = analyzeMarketSeriesV2(makeSeries({ count: 21 }), { asOf });
  assert.equal(at14.metrics.volatility_atr_14.status, 'computed');
  assert.equal(at14.metrics.volatility_bollinger_middle_20.value, null);
  assert.equal(at20.metrics.volatility_bollinger_middle_20.status, 'computed');
  assert.equal(at20.metrics.volatility_realized_20.value, null);
  assert.equal(at21.metrics.volatility_realized_20.status, 'computed');
});

run('unavailable v2 volume is preserved as provenance and never used as a numeric indicator input', () => {
  const series = makeSeries();
  const result = analyzeMarketSeriesV2(series, { asOf });
  assert.equal(result.status, 'analysis_complete');
  assert.equal(result.source.id, 'simulated-market-fixture');
  assert.equal(result.metrics.volume, undefined);
  assert.ok(result.limitations.some(text => text.includes('unavailable volume is not treated as zero')));
});

run('historical, provider snapshot, and synthetic data retain their modes and freshness states', () => {
  const historical = analyzeMarketSeriesV2(makeSeries(), { asOf });
  const snapshot = analyzeMarketSeriesV2(makeSeries({ dataMode: 'snapshot', sourceKind: 'provider' }), { asOf });
  const synthetic = analyzeMarketSeriesV2(makeSeries({ dataMode: 'synthetic', sourceKind: 'synthetic_fixture' }), { asOf });
  assert.equal(historical.data_mode, 'historical');
  assert.equal(historical.freshness, 'not_applicable');
  assert.equal(snapshot.data_mode, 'snapshot');
  assert.equal(snapshot.freshness, 'fresh');
  assert.equal(synthetic.data_mode, 'synthetic');
  assert.equal(synthetic.freshness, 'not_applicable');
});

run('invalid and stale v2 series fail closed without metrics or execution', () => {
  const stale = analyzeMarketSeriesV2(makeSeries({ dataMode: 'snapshot', sourceKind: 'provider', closeAt: new Date(asOf.getTime() - 10 * 60_000) }), { asOf });
  assert.equal(stale.status, 'stale_data');
  assert.deepEqual(stale.metrics, {});
  assert.equal(stale.execution_enabled, false);
  assert.equal(stale.order_recommendation, null);

  const invalidSeries = makeSeries({ patch: { bars: [] } });
  const invalid = analyzeMarketSeriesV2(invalidSeries, { asOf });
  assert.equal(invalid.status, 'rejected');
  assert.deepEqual(invalid.metrics, {});
  assert.equal(invalid.execution_enabled, false);
  assert.equal(invalid.order_recommendation, null);
});

run('v1 series is rejected by the v2 engine without implicit coercion', () => {
  const v1 = {
    contract_version: 'dda.market-series.v1',
    instrument: { symbol: 'TEST', venue: 'TEST-X', asset_class: 'equity', currency: 'USD' },
    timeframe: '1h', data_mode: 'historical', source: { id: 'legacy', kind: 'historical_import' },
    retrieved_at: asOf.toISOString(),
    bars: [{ timestamp: '2026-10-18T17:00:00.000Z', open: 1, high: 2, low: 1, close: 2, volume: 0 }]
  };
  const result = analyzeMarketSeriesV2(v1, { asOf });
  assert.equal(result.status, 'rejected');
  assert.ok(result.validation_errors.some(error => error.code === 'unsupported_contract'));
  assert.equal(result.execution_enabled, false);
  assert.equal(result.order_recommendation, null);
});

console.log('AutoTrader market-analysis v2 tests: 11 passed');
