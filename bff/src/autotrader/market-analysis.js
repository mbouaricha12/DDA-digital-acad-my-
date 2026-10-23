'use strict';

const { validateMarketSeries } = require('./market-data');

const STRATEGY_ID = 'dda.descriptive-market-context.v1';
const SMA_PERIOD = 20;

function metric(value, unit, method, bars, inputs = ['close']) {
  const first = bars[0]?.timestamp || null;
  const last = bars.at(-1)?.timestamp || null;
  return {
    value,
    unit,
    window: { start: first, end: last, frequency: null, n_obs: bars.length, annualization_factor: null },
    method,
    inputs,
    status: value === null ? 'insufficient_data' : 'computed'
  };
}

/**
 * Produces descriptive context only. This module does not generate entries,
 * stops, targets, recommendations, orders, or broker payloads.
 */
function analyzeMarketSeries(series, options = {}) {
  const validation = validateMarketSeries(series, options);
  const base = {
    contract_version: 'dda.market-analysis.v1',
    strategy_id: STRATEGY_ID,
    interpretation: 'descriptive_only',
    data_mode: series?.data_mode || 'unknown',
    source: series?.source || null,
    instrument: series?.instrument || null,
    timeframe: series?.timeframe || null,
    data_as_of: validation.latestBarAt,
    freshness: validation.freshness,
    validation_errors: validation.errors,
    execution_enabled: false,
    order_recommendation: null
  };
  if (!validation.valid) return { ...base, status: validation.freshness === 'stale' ? 'stale_data' : 'rejected', metrics: {}, context: null };

  const bars = series.bars;
  const closes = bars.map(bar => bar.close);
  const lastClose = closes.at(-1);
  const periodReturn = closes.length >= 2 ? lastClose / closes.at(-2) - 1 : null;
  const sma20 = closes.length >= SMA_PERIOD ? closes.slice(-SMA_PERIOD).reduce((sum, value) => sum + value, 0) / SMA_PERIOD : null;
  const closeVsSma20 = sma20 === null ? null : lastClose / sma20 - 1;
  const observedRange = bars.length >= 2
    ? bars.reduce((range, bar) => ({ high: Math.max(range.high, bar.high), low: Math.min(range.low, bar.low) }), { high: -Infinity, low: Infinity })
    : null;
  const rangeFraction = observedRange === null ? null : (observedRange.high - observedRange.low) / lastClose;

  const metrics = {
    last_close: metric(lastClose, series.instrument.currency, 'Last observed candle close; no quote/execution claim.', bars.slice(-1)),
    latest_period_return: metric(periodReturn, 'fraction', 'close_t / close_(t-1) - 1; simple close-to-close return, not total return.', bars.slice(-2)),
    sma_20: metric(sma20, series.instrument.currency, 'Arithmetic mean of the latest 20 closes; null until 20 observations.', bars.slice(-SMA_PERIOD)),
    close_vs_sma_20: metric(closeVsSma20, 'fraction', 'last_close / SMA_20 - 1; descriptive position, not a directional recommendation.', bars.slice(-SMA_PERIOD)),
    observed_range_over_last_close: metric(rangeFraction, 'fraction', '(max(high) - min(low)) / last_close over supplied bars; custom descriptive range, not volatility forecast.', bars, ['high', 'low', 'close'])
  };
  let relativeContext = 'insufficient_data';
  if (closeVsSma20 !== null) relativeContext = closeVsSma20 > 0 ? 'above_sma_20' : closeVsSma20 < 0 ? 'below_sma_20' : 'at_sma_20';

  return {
    ...base,
    status: 'analysis_complete',
    metrics,
    context: { close_relative_to_sma_20: relativeContext },
    limitations: [
      'Descriptive historical context only; not investment advice or a trade signal.',
      'No order, entry, stop-loss, target, position size, or execution instruction is generated.',
      'Results depend on the supplied OHLCV data, which has not been independently verified by this module.'
    ]
  };
}

module.exports = { STRATEGY_ID, SMA_PERIOD, analyzeMarketSeries };
