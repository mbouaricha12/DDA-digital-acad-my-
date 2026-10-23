'use strict';

const { validateMarketSeriesV2 } = require('./market-data-v2');

const ANALYSIS_CONTRACT_VERSION = 'dda.market-analysis.v2';
const ENGINE_ID = 'dda.technical-context.v1';
const MACD_FAST_PERIOD = 12;
const MACD_SLOW_PERIOD = 26;
const MACD_SIGNAL_PERIOD = 9;
const ATR_PERIOD = 14;
const BOLLINGER_PERIOD = 20;
const BOLLINGER_MULTIPLIER = 2;
const REALIZED_VOLATILITY_PERIOD = 20;

function metric(value, unit, method, windowBars, frequency, inputs, nObs = windowBars.length) {
  return {
    value,
    unit,
    window: {
      start: windowBars[0]?.timestamp || null,
      end: windowBars.at(-1)?.timestamp || null,
      frequency,
      n_obs: nObs,
      annualization_factor: null
    },
    method,
    inputs,
    status: value === null ? 'insufficient_data' : 'computed'
  };
}

function sma(values, period) {
  if (values.length < period) return null;
  const window = values.slice(-period);
  return window.reduce((sum, value) => sum + value, 0) / period;
}

/** EMA seeded by the SMA of the first `period` supplied observations. */
function emaSeries(values, period) {
  if (values.length < period) return [];
  const alpha = 2 / (period + 1);
  let current = values.slice(0, period).reduce((sum, value) => sum + value, 0) / period;
  const result = Array(period - 1).fill(null);
  result.push(current);
  for (let i = period; i < values.length; i += 1) {
    current = alpha * values[i] + (1 - alpha) * current;
    result.push(current);
  }
  return result;
}

function populationStd(values) {
  if (values.length === 0) return null;
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function sampleStd(values) {
  if (values.length < 2) return null;
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const squaredDeviations = values.reduce((sum, value) => sum + (value - mean) ** 2, 0);
  return Math.sqrt(squaredDeviations / (values.length - 1));
}

function trueRanges(bars) {
  return bars.map((bar, index) => {
    if (index === 0) return bar.high - bar.low;
    const previousClose = bars[index - 1].close;
    return Math.max(
      bar.high - bar.low,
      Math.abs(bar.high - previousClose),
      Math.abs(bar.low - previousClose)
    );
  });
}

function wilderAtr(trs, period) {
  if (trs.length < period) return null;
  let current = trs.slice(0, period).reduce((sum, value) => sum + value, 0) / period;
  for (let i = period; i < trs.length; i += 1) {
    current = ((period - 1) * current + trs[i]) / period;
  }
  return current;
}

function lastOrNull(values) {
  return values.length ? values.at(-1) : null;
}

function analyzeMarketSeriesV2(series, options = {}) {
  const validation = validateMarketSeriesV2(series, options);
  const base = {
    contract_version: ANALYSIS_CONTRACT_VERSION,
    engine_id: ENGINE_ID,
    analysis_type: 'technical_descriptive',
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

  if (!validation.valid) {
    return {
      ...base,
      status: validation.freshness === 'stale' ? 'stale_data' : 'rejected',
      metrics: {},
      context: null
    };
  }

  const bars = series.bars;
  const closes = bars.map(bar => bar.close);
  const lastClose = closes.at(-1);
  const currency = series.instrument.currency;
  const frequency = series.timeframe;

  const sma20 = sma(closes, 20);
  const sma50 = sma(closes, 50);
  const ema20Series = emaSeries(closes, 20);
  const ema50Series = emaSeries(closes, 50);
  const ema20 = lastOrNull(ema20Series);
  const ema50 = lastOrNull(ema50Series);
  const closeVsSma20 = sma20 === null ? null : lastClose / sma20 - 1;

  const fastEma = emaSeries(closes, MACD_FAST_PERIOD);
  const slowEma = emaSeries(closes, MACD_SLOW_PERIOD);
  const macdValues = [];
  const macdStartIndex = MACD_SLOW_PERIOD - 1;
  for (let i = macdStartIndex; i < closes.length; i += 1) {
    macdValues.push(fastEma[i] - slowEma[i]);
  }
  const macdLine = lastOrNull(macdValues);
  const macdSignal = lastOrNull(emaSeries(macdValues, MACD_SIGNAL_PERIOD));
  const macdHistogram = macdLine === null || macdSignal === null ? null : macdLine - macdSignal;

  const trs = trueRanges(bars);
  const atr14 = wilderAtr(trs, ATR_PERIOD);
  const atr14Fraction = atr14 === null ? null : atr14 / lastClose;

  const bollingerCloses = closes.slice(-BOLLINGER_PERIOD);
  const bollingerMiddle = sma(bollingerCloses, BOLLINGER_PERIOD);
  const bollingerStd = bollingerCloses.length < BOLLINGER_PERIOD ? null : populationStd(bollingerCloses);
  const bollingerUpper = bollingerMiddle === null || bollingerStd === null ? null : bollingerMiddle + BOLLINGER_MULTIPLIER * bollingerStd;
  const bollingerLower = bollingerMiddle === null || bollingerStd === null ? null : bollingerMiddle - BOLLINGER_MULTIPLIER * bollingerStd;
  const bollingerBandwidth = bollingerMiddle === null || bollingerMiddle === 0 ? null : (bollingerUpper - bollingerLower) / bollingerMiddle;

  const returnBars = bars.slice(-REALIZED_VOLATILITY_PERIOD - 1);
  const returns = [];
  for (let i = 1; i < returnBars.length; i += 1) {
    returns.push(returnBars[i].close / returnBars[i - 1].close - 1);
  }
  const realizedVolatility = returns.length < REALIZED_VOLATILITY_PERIOD ? null : sampleStd(returns);

  const smaWindow20 = bars.slice(-20);
  const smaWindow50 = bars.slice(-50);
  const bollingerWindow = bars.slice(-BOLLINGER_PERIOD);
  const macdWindow = bars.slice(Math.min(macdStartIndex, bars.length));
  const macdSignalWindow = bars.slice(Math.min(macdStartIndex, bars.length));
  const volatilityWindow = returnBars;
  const metrics = {
    trend_sma_20: metric(sma20, currency, 'Arithmetic mean of the latest 20 closes.', smaWindow20, frequency, ['close']),
    trend_sma_50: metric(sma50, currency, 'Arithmetic mean of the latest 50 closes.', smaWindow50, frequency, ['close']),
    trend_close_vs_sma_20: metric(closeVsSma20, 'fraction', 'last_close / SMA_20 - 1; descriptive relative position, not a directional recommendation.', smaWindow20, frequency, ['close']),
    trend_ema_20: metric(ema20, currency, 'EMA with alpha=2/(20+1), seeded by the SMA of the first 20 supplied closes and updated over the supplied series.', bars, frequency, ['close']),
    trend_ema_50: metric(ema50, currency, 'EMA with alpha=2/(50+1), seeded by the SMA of the first 50 supplied closes and updated over the supplied series.', bars, frequency, ['close']),
    trend_macd_line_12_26: metric(macdLine, currency, 'EMA_12 - EMA_26; each EMA is SMA-seeded on the supplied history.', bars, frequency, ['close']),
    trend_macd_signal_9: metric(macdSignal, currency, 'EMA_9 of the MACD line, seeded by the SMA of the first 9 available MACD observations.', macdSignalWindow, frequency, ['close'], macdSignalWindow.length),
    trend_macd_histogram: metric(macdHistogram, currency, 'MACD line - MACD signal line; descriptive indicator, not an entry signal.', macdSignalWindow, frequency, ['close'], macdSignalWindow.length),
    volatility_atr_14: metric(atr14, currency, 'Wilder-smoothed true range over 14 bars, seeded by the arithmetic mean of the first 14 true ranges; first true range is high-low.', bars, frequency, ['high', 'low', 'close']),
    volatility_atr_14_fraction: metric(atr14Fraction, 'fraction', 'ATR_14 / last_close; per-bar descriptive normalization, not a forecast.', bars, frequency, ['high', 'low', 'close']),
    volatility_bollinger_middle_20: metric(bollingerMiddle, currency, 'SMA of the latest 20 closes; Bollinger middle band.', bollingerWindow, frequency, ['close']),
    volatility_bollinger_upper_20_2: metric(bollingerUpper, currency, 'SMA_20 + 2 × population standard deviation of the latest 20 closes.', bollingerWindow, frequency, ['close']),
    volatility_bollinger_lower_20_2: metric(bollingerLower, currency, 'SMA_20 - 2 × population standard deviation of the latest 20 closes.', bollingerWindow, frequency, ['close']),
    volatility_bollinger_bandwidth_20_2: metric(bollingerBandwidth, 'fraction', '(upper_band - lower_band) / middle_band; population standard deviation, not a volatility forecast.', bollingerWindow, frequency, ['close']),
    volatility_realized_20: metric(realizedVolatility, 'fraction_per_bar', 'Sample standard deviation (n-1) of the latest 20 simple close-to-close returns; 21 closes required; not annualized.', volatilityWindow, frequency, ['close'], returns.length)
  };

  return {
    ...base,
    status: 'analysis_complete',
    metrics,
    limitations: [
      'Technical indicators are descriptive transformations of the supplied v2 OHLC data; they are not forecasts, recommendations, or trade signals.',
      'No entry, exit, stop-loss, target, position size, or order is generated.',
      'The v2 volume field is validated but not consumed by these indicators; unavailable volume is not treated as zero.',
      'Indicator periods count supplied bars. Missing intervals, market calendars, and provider-specific timestamps may change the effective elapsed window.',
      'Annualization is omitted because no verified trading calendar or frequency-to-period factor is supplied.',
      'Values depend on supplied prices and are not independently verified by this engine.'
    ]
  };
}

module.exports = {
  ANALYSIS_CONTRACT_VERSION,
  ENGINE_ID,
  analyzeMarketSeriesV2
};
