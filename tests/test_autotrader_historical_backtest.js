'use strict';

const assert = require('node:assert/strict');
const {
  BACKTEST_CONTRACT_VERSION,
  BACKTEST_SPEC_VERSION,
  computeTrendSignals,
  runHistoricalBacktest
} = require('../bff/src/autotrader/backtest-historical');
const { analyzeMarketSeriesV2 } = require('../bff/src/autotrader/market-analysis-v2');
const { REQUIRED_TREND_METRICS, classifyTrend } = require('../bff/src/autotrader/trend-rule-v1');

const asOf = new Date('2026-10-18T19:00:00.000Z');
const DAY = 86_400_000;

function closeFor(trend, index) {
  if (trend === 'flat') return 150;
  if (trend === 'up') return 100 + 0.02 * index + 0.0001 * index * index;
  if (trend === 'down') return 500 - 0.02 * index - 0.0001 * index * index;
  if (index < 500) return 100 + 0.03 * index + 0.0001 * index * index;
  const afterPeak = index - 500;
  return 140 - 0.05 * afterPeak - 0.00005 * afterPeak * afterPeak;
}

function makeSeries({ count = 1200, trend = 'mixed', dataMode = 'synthetic', sourceKind = 'synthetic_fixture', timeframe = '1d', startAt = '2018-01-01T00:00:00.000Z' } = {}) {
  const startMs = Date.parse(startAt);
  const bars = [];
  for (let index = 0; index < count; index += 1) {
    const close = closeFor(trend, index);
    const open = index === 0 ? close * 0.999 : closeFor(trend, index - 1);
    bars.push({
      timestamp: new Date(startMs + index * DAY).toISOString(),
      open,
      high: Math.max(open, close) + 0.5,
      low: Math.min(open, close) - 0.5,
      close,
      volume: { semantic: 'unavailable', reason: 'not_reported' }
    });
  }
  const source = { id: `${sourceKind}-test-series`, kind: sourceKind };
  if (sourceKind === 'provider') source.provider_symbol = 'TEST/USD';
  return {
    contract_version: 'dda.market-series.v2',
    instrument: { symbol: 'TEST', venue: 'SIMULATED:TEST', asset_class: 'equity', currency: 'USD' },
    timeframe,
    data_mode: dataMode,
    source,
    retrieved_at: asOf.toISOString(),
    bars
  };
}

function makeSpec(series, { startIndex = 60, inSampleEndIndex = 600, endIndex = 1050, patch = {} } = {}) {
  return {
    contract_version: BACKTEST_SPEC_VERSION,
    start: series.bars[startIndex].timestamp,
    in_sample_end: series.bars[inSampleEndIndex].timestamp,
    end: series.bars[endIndex].timestamp,
    initial_capital: 25_000,
    currency: 'USD',
    position_fraction: 0.5,
    position_unit: 'shares',
    contract_multiplier: 1,
    cost_model: {
      commission_bps_per_side: 5,
      spread_bps_per_side: 4,
      slippage_bps_per_side: 3,
      long_financing_bps_per_year: 20,
      short_financing_bps_per_year: 10,
      short_borrow_bps_per_year: 52
    },
    risk_free_rate_annual: 0.02,
    minimum_acceptable_return_annual: 0,
    price_adjustment_basis: 'total_return',
    dividend_policy: 'included',
    short_borrow_assumed_available: true,
    data_rights_reference: 'synthetic-test-fixture-only',
    cost_model_reference: 'synthetic-test-cost-scenario-v1',
    ...patch
  };
}

function runTest(name, fn) {
  fn();
  console.log(`PASS ${name}`);
}

function runFixture({ trend = 'mixed', seriesOptions = {}, specOptions = {}, options = { asOf, allowSyntheticFixture: true } } = {}) {
  const marketSeries = makeSeries({ trend, ...seriesOptions });
  const spec = makeSpec(marketSeries, specOptions);
  return { marketSeries, spec, result: runHistoricalBacktest({ marketSeries, spec, options }) };
}

runTest('fixed contracts return a hypothetical, non-executable result with temporal splits and benchmark', () => {
  const { result } = runFixture();
  assert.equal(result.contract_version, BACKTEST_CONTRACT_VERSION);
  assert.equal(result.mode, 'simulation');
  assert.equal(result.status, 'provisional');
  assert.equal(result.strategy.rule_id, 'dda.trend-confirmation.v1');
  assert.equal(result.validation.strategy_validation_status, 'unverified');
  assert.equal(result.validation.no_lookahead, 'pass');
  assert.equal(result.execution_enabled, false);
  assert.equal(result.is_trade_approval, false);
  assert.equal(result.order_recommendation, null);
  assert.equal(result.order_plan, null);
  assert.equal(result.cost_model.cost_model_id, 'dda.autotrader.cost-model.v1');
  assert.ok(result.performance.full.performance);
  assert.ok(result.performance.in_sample.performance);
  assert.ok(result.performance.out_of_sample.performance);
  assert.equal(result.benchmark.name, 'buy_and_hold_long_same_fraction');
  assert.deepEqual(result.cost_sensitivity.map(item => item.cost_multiplier), [1, 1.5, 2]);
  assert.ok(result.validation.hard_gates.some(gate => gate.name === 'data_rights' && gate.status === 'unknown_gate'));
});

runTest('single-pass trend signals match the existing v2 analyzer and shared rule at every tested prefix', () => {
  const series = makeSeries({ trend: 'mixed', count: 180 });
  const signals = computeTrendSignals(series.bars);
  for (const index of [49, 60, 75, 100, 125, 179]) {
    const prefix = { ...series, bars: series.bars.slice(0, index + 1) };
    const analysis = analyzeMarketSeriesV2(prefix, { asOf });
    const values = Object.fromEntries(REQUIRED_TREND_METRICS.map(key => [key, analysis.metrics[key].value]));
    assert.equal(signals[index].direction, classifyTrend(values), `rule mismatch at bar ${index}`);
    assert.equal(signals[index].ready, REQUIRED_TREND_METRICS.every(key => Number.isFinite(values[key])));
  }
});

runTest('signals are causal: changing bars after a cutoff cannot change earlier signal states', () => {
  const original = makeSeries({ trend: 'mixed', count: 240 });
  const changed = structuredClone(original);
  const cutoff = 150;
  for (let index = cutoff + 1; index < changed.bars.length; index += 1) {
    changed.bars[index].open *= 1.25;
    changed.bars[index].high *= 1.25;
    changed.bars[index].low *= 1.25;
    changed.bars[index].close *= 1.25;
  }
  const before = computeTrendSignals(original.bars);
  const after = computeTrendSignals(changed.bars);
  for (let index = 0; index <= cutoff; index += 1) assert.deepEqual(after[index], before[index]);
});

runTest('rule entries use the next bar open and directional spread/slippage are reflected in fills', () => {
  const { marketSeries, result } = runFixture({ trend: 'up' });
  const trades = result.performance.full.trade_log;
  assert.ok(trades.length > 0, 'the accelerating up fixture should produce at least one trade');
  const longTrades = trades.filter(trade => trade.direction === 'long');
  assert.ok(longTrades.length > 0);
  assert.ok(longTrades.every(trade => trade.long_financing_cost > 0));
  assert.ok(longTrades.every(trade => Math.abs(trade.long_financing_cost - trade.entry_notional * 20 / 10_000 * trade.holding_daily_bars / 252) < 1e-8));
  for (const trade of trades) {
    const entryIndex = marketSeries.bars.findIndex(bar => bar.timestamp === trade.entry_bar_timestamp);
    assert.ok(entryIndex > 0);
    assert.equal(trade.signal_at, marketSeries.bars[entryIndex - 1].timestamp);
    assert.equal(trade.entry_price_reference, marketSeries.bars[entryIndex].open);
    assert.ok(trade.entry_price_fill > trade.entry_price_reference);
    assert.ok(trade.total_costs > 0);
  }
});

runTest('the final close liquidates an open position and the final-bar signal is not filled', () => {
  const { marketSeries, spec, result } = runFixture({ trend: 'up' });
  const trades = result.performance.full.trade_log;
  assert.ok(trades.length > 0);
  const endTrade = trades.at(-1);
  assert.equal(endTrade.exit_reason, 'end_of_period');
  assert.equal(endTrade.exit_bar_timestamp, spec.end);
  assert.ok(trades.every(trade => trade.entry_bar_timestamp <= spec.end));
  assert.equal(result.performance.full.equity_curve.at(-1).timestamp, spec.end);
  assert.equal(result.performance.full.performance.market_exposure_fraction, 1);
  assert.ok(marketSeries.bars.findIndex(bar => bar.timestamp === spec.end) >= 0);
});

runTest('cost stress reports increasing costs and never changes the signal rule', () => {
  const { result } = runFixture({ trend: 'mixed' });
  const runs = result.cost_sensitivity;
  assert.equal(runs[0].performance.trade_count, result.performance.full.performance.trade_count);
  assert.ok(runs[0].performance.total_costs <= runs[1].performance.total_costs);
  assert.ok(runs[1].performance.total_costs <= runs[2].performance.total_costs);
});

runTest('short trades include assumed borrow cost and remain marked as hypothetical', () => {
  const { result } = runFixture({ trend: 'down' });
  const shorts = result.performance.full.trade_log.filter(trade => trade.direction === 'short');
  assert.ok(shorts.length > 0, 'the accelerating down fixture should produce a short trade');
  assert.ok(shorts.every(trade => trade.short_borrow_cost > 0));
  assert.ok(shorts.every(trade => trade.short_financing_cost > 0));
  assert.ok(shorts.every(trade => Math.abs(trade.short_borrow_cost - trade.entry_notional * 52 / 10_000 * trade.holding_daily_bars / 252) < 1e-8));
  assert.ok(shorts.every(trade => Math.abs(trade.short_financing_cost - trade.entry_notional * 10 / 10_000 * trade.holding_daily_bars / 252) < 1e-8));
  assert.ok(result.validation.hard_gates.some(gate => gate.name === 'short_borrow' && gate.status === 'unknown_gate' && gate.evidence.includes('recalls')));
});

runTest('contract multiplier changes quantity while preserving the target notional and modeled P&L', () => {
  const series = makeSeries({ trend: 'up' });
  const unitOne = runHistoricalBacktest({ marketSeries: series, spec: makeSpec(series), options: { asOf, allowSyntheticFixture: true } });
  const unitTenSpec = makeSpec(series, { patch: { position_unit: 'contracts', contract_multiplier: 10 } });
  const unitTen = runHistoricalBacktest({ marketSeries: series, spec: unitTenSpec, options: { asOf, allowSyntheticFixture: true } });
  const tradeOne = unitOne.performance.full.trade_log[0];
  const tradeTen = unitTen.performance.full.trade_log[0];
  assert.ok(tradeOne && tradeTen);
  assert.ok(Math.abs(tradeOne.units / 10 - tradeTen.units) < 1e-12);
  assert.ok(Math.abs(tradeOne.entry_notional - tradeTen.entry_notional) < 1e-9);
  assert.ok(Math.abs(tradeOne.net_pnl - tradeTen.net_pnl) < 1e-9);
});

runTest('no-signal series returns null trade statistics instead of fabricated zero ratios', () => {
  const { result } = runFixture({ trend: 'flat' });
  const metrics = result.performance.full.performance;
  assert.equal(metrics.trade_count, 0);
  assert.equal(metrics.win_rate, null);
  assert.equal(metrics.profit_factor, null);
  assert.equal(metrics.average_win, null);
  assert.equal(metrics.average_loss, null);
  assert.equal(metrics.period_total_return, 0);
});

runTest('provider history remains blocked pending instrument-specific rights and activation approval', () => {
  const series = makeSeries({ dataMode: 'historical', sourceKind: 'provider' });
  const result = runHistoricalBacktest({ marketSeries: series, spec: makeSpec(series), options: { asOf } });
  assert.equal(result.status, 'blocked');
  assert.ok(result.validation_errors.some(error => error.code === 'unsupported_backtest_source'));
  assert.equal(result.execution_enabled, false);
});

runTest('synthetic data is rejected unless explicitly opted into for test fixtures', () => {
  const series = makeSeries();
  const result = runHistoricalBacktest({ marketSeries: series, spec: makeSpec(series), options: { asOf } });
  assert.equal(result.status, 'blocked');
  assert.ok(result.validation_errors.some(error => error.code === 'unsupported_backtest_source'));
});

runTest('non-daily data and insufficient indicator warm-up are blocked', () => {
  const hourly = makeSeries({ timeframe: '1h' });
  const hourlyResult = runHistoricalBacktest({ marketSeries: hourly, spec: makeSpec(hourly), options: { asOf, allowSyntheticFixture: true } });
  assert.ok(hourlyResult.validation_errors.some(error => error.code === 'unsupported_frequency'));

  const short = makeSeries({ count: 120 });
  const shortResult = runHistoricalBacktest({
    marketSeries: short,
    spec: makeSpec(short, { startIndex: 40, inSampleEndIndex: 80, endIndex: 100 }),
    options: { asOf, allowSyntheticFixture: true }
  });
  assert.ok(shortResult.validation_errors.some(error => error.code === 'insufficient_warmup'));
});

runTest('zero transaction costs, unrecognized spec fields, and future end dates fail closed', () => {
  const series = makeSeries();
  const zeroCosts = makeSpec(series, { patch: { cost_model: { commission_bps_per_side: 0, spread_bps_per_side: 0, slippage_bps_per_side: 0, long_financing_bps_per_year: 0, short_financing_bps_per_year: 0, short_borrow_bps_per_year: 0 } } });
  const zeroResult = runHistoricalBacktest({ marketSeries: series, spec: zeroCosts, options: { asOf, allowSyntheticFixture: true } });
  assert.ok(zeroResult.validation_errors.some(error => error.code === 'zero_transaction_costs'));

  const unknownSpec = makeSpec(series, { patch: { silent_leverage: 2 } });
  const unknownResult = runHistoricalBacktest({ marketSeries: series, spec: unknownSpec, options: { asOf, allowSyntheticFixture: true } });
  assert.ok(unknownResult.validation_errors.some(error => error.code === 'unexpected_property'));

  const futureSpec = makeSpec(series, { patch: { end: '2027-01-01T00:00:00.000Z' } });
  const futureResult = runHistoricalBacktest({ marketSeries: series, spec: futureSpec, options: { asOf, allowSyntheticFixture: true } });
  assert.ok(futureResult.validation_errors.some(error => error.code === 'period_boundary_not_found' || error.code === 'future_backtest_end'));
});

console.log('AutoTrader historical backtest tests: 13 passed');
