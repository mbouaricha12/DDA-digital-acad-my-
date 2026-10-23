'use strict';

const SIGNAL_RULE_ID = 'dda.trend-confirmation.v1';
const REQUIRED_TREND_METRICS = Object.freeze([
  'trend_close_vs_sma_20',
  'trend_sma_20',
  'trend_sma_50',
  'trend_ema_20',
  'trend_ema_50',
  'trend_macd_line_12_26',
  'trend_macd_signal_9',
  'trend_macd_histogram'
]);

function classifyTrend(values) {
  if (!values || REQUIRED_TREND_METRICS.some(name => typeof values[name] !== 'number' || !Number.isFinite(values[name]))) return 'none';
  const long = values.trend_close_vs_sma_20 > 0
    && values.trend_sma_20 > values.trend_sma_50
    && values.trend_ema_20 > values.trend_ema_50
    && values.trend_macd_line_12_26 > 0
    && values.trend_macd_histogram > 0;
  const short = values.trend_close_vs_sma_20 < 0
    && values.trend_sma_20 < values.trend_sma_50
    && values.trend_ema_20 < values.trend_ema_50
    && values.trend_macd_line_12_26 < 0
    && values.trend_macd_histogram < 0;
  if (long) return 'long';
  if (short) return 'short';
  return 'none';
}

module.exports = { SIGNAL_RULE_ID, REQUIRED_TREND_METRICS, classifyTrend };
