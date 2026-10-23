'use strict';

const { validateMarketSeriesV2 } = require('./market-data-v2');
const { SIGNAL_RULE_ID, classifyTrend } = require('./trend-rule-v1');
const { COST_MODEL_ID, adjustedFill, commissionAmount, executionCost, financingComponents } = require('./cost-model-v1');

const BACKTEST_CONTRACT_VERSION = 'dda.autotrader.historical-backtest.v1';
const BACKTEST_SPEC_VERSION = 'dda.autotrader.backtest-spec.v1';
const DAILY_BARS_PER_YEAR = 252;
const REQUIRED_WARMUP_BARS = 50;
const SUSPECTED_GAP_DAYS = 10;
const COST_STRESS_MULTIPLIERS = Object.freeze([1, 1.5, 2]);
const SPEC_KEYS = new Set([
  'contract_version', 'start', 'in_sample_end', 'end', 'initial_capital', 'currency',
  'position_fraction', 'position_unit', 'contract_multiplier', 'cost_model', 'risk_free_rate_annual', 'minimum_acceptable_return_annual',
  'price_adjustment_basis', 'dividend_policy', 'short_borrow_assumed_available', 'data_rights_reference', 'cost_model_reference'
]);
const COST_KEYS = new Set([
  'commission_bps_per_side', 'spread_bps_per_side', 'slippage_bps_per_side',
  'long_financing_bps_per_year', 'short_financing_bps_per_year', 'short_borrow_bps_per_year'
]);

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isUtcTimestamp(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(value)) return false;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) && new Date(parsed).toISOString() === value;
}

function addError(errors, path, code, message) {
  errors.push({ path, code, message });
}

function checkKeys(value, allowed, path, errors) {
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) addError(errors, `${path}.${key}`, 'unexpected_property', 'Property is not part of this backtest contract.');
  }
}

function validateSpec(spec, errors) {
  if (!isRecord(spec)) {
    addError(errors, 'spec', 'invalid_object', 'A complete backtest specification is required.');
    return;
  }
  checkKeys(spec, SPEC_KEYS, 'spec', errors);
  if (spec.contract_version !== BACKTEST_SPEC_VERSION) addError(errors, 'spec.contract_version', 'unsupported_contract', `Expected ${BACKTEST_SPEC_VERSION}.`);
  for (const key of ['start', 'in_sample_end', 'end']) {
    if (!isUtcTimestamp(spec[key])) addError(errors, `spec.${key}`, 'invalid_timestamp', `${key} must be canonical UTC ISO with milliseconds and align to a bar close.`);
  }
  if (isUtcTimestamp(spec.start) && isUtcTimestamp(spec.in_sample_end) && Date.parse(spec.start) >= Date.parse(spec.in_sample_end)) {
    addError(errors, 'spec.in_sample_end', 'invalid_split', 'in_sample_end must be strictly after start.');
  }
  if (isUtcTimestamp(spec.in_sample_end) && isUtcTimestamp(spec.end) && Date.parse(spec.in_sample_end) >= Date.parse(spec.end)) {
    addError(errors, 'spec.end', 'invalid_split', 'end must be strictly after in_sample_end.');
  }
  if (typeof spec.initial_capital !== 'number' || !Number.isFinite(spec.initial_capital) || spec.initial_capital <= 0) {
    addError(errors, 'spec.initial_capital', 'invalid_initial_capital', 'initial_capital must be finite and positive.');
  }
  if (typeof spec.currency !== 'string' || !/^[A-Z]{3}$/.test(spec.currency)) addError(errors, 'spec.currency', 'invalid_currency', 'currency must be an uppercase three-letter code.');
  if (typeof spec.position_fraction !== 'number' || !Number.isFinite(spec.position_fraction) || spec.position_fraction <= 0 || spec.position_fraction > 1) {
    addError(errors, 'spec.position_fraction', 'invalid_position_fraction', 'position_fraction must be greater than zero and at most 1.0; leverage is not modeled.');
  }
  if (typeof spec.position_unit !== 'string' || !spec.position_unit.trim() || spec.position_unit.length > 32) {
    addError(errors, 'spec.position_unit', 'missing_position_unit', 'Declare the unit represented by one position unit, e.g. shares, troy_ounces, or base_units.');
  }
  if (typeof spec.contract_multiplier !== 'number' || !Number.isFinite(spec.contract_multiplier) || spec.contract_multiplier <= 0) {
    addError(errors, 'spec.contract_multiplier', 'invalid_contract_multiplier', 'contract_multiplier must be finite and positive; no multiplier is assumed.');
  }
  for (const key of ['risk_free_rate_annual', 'minimum_acceptable_return_annual']) {
    if (typeof spec[key] !== 'number' || !Number.isFinite(spec[key]) || spec[key] <= -1) {
      addError(errors, `spec.${key}`, 'invalid_annual_rate', `${key} must be a finite annual rate greater than -100%; no default is applied.`);
    }
  }
  if (!['raw', 'split_adjusted', 'total_return', 'not_applicable'].includes(spec.price_adjustment_basis)) {
    addError(errors, 'spec.price_adjustment_basis', 'missing_price_basis', 'Declare raw, split_adjusted, total_return, or not_applicable price basis.');
  }
  if (!['included', 'excluded', 'not_applicable'].includes(spec.dividend_policy)) {
    addError(errors, 'spec.dividend_policy', 'missing_dividend_policy', 'Declare whether dividends are included, excluded, or not_applicable.');
  }
  if (spec.price_adjustment_basis === 'total_return' && spec.dividend_policy !== 'included') {
    addError(errors, 'spec.dividend_policy', 'inconsistent_return_basis', 'total_return prices require dividend_policy=included.');
  }
  if (spec.short_borrow_assumed_available !== true) {
    addError(errors, 'spec.short_borrow_assumed_available', 'short_borrow_not_attested', 'The rule can go short; this simulation requires an explicit short-borrow availability assumption.');
  }
  if (typeof spec.data_rights_reference !== 'string' || !spec.data_rights_reference.trim() || spec.data_rights_reference.length > 200) {
    addError(errors, 'spec.data_rights_reference', 'missing_data_rights_reference', 'Provide a brief data-rights/source reference; this module does not verify licenses.');
  }
  if (typeof spec.cost_model_reference !== 'string' || !spec.cost_model_reference.trim() || spec.cost_model_reference.length > 200) {
    addError(errors, 'spec.cost_model_reference', 'missing_cost_model_reference', 'Provide a brief fee schedule or explicit scenario reference for the cost assumptions.');
  }
  if (!isRecord(spec.cost_model)) {
    addError(errors, 'spec.cost_model', 'missing_cost_model', 'A complete explicit cost model is required; zero-cost defaults are not used.');
    return;
  }
  checkKeys(spec.cost_model, COST_KEYS, 'spec.cost_model', errors);
  for (const key of COST_KEYS) {
    const value = spec.cost_model[key];
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 1_000_000) {
      addError(errors, `spec.cost_model.${key}`, 'invalid_cost', `${key} must be a finite non-negative number of basis points; no default is applied.`);
    }
  }
  const costs = spec.cost_model;
  if ([...COST_KEYS].every(key => typeof costs[key] === 'number' && Number.isFinite(costs[key]))) {
    const oneWayTotal = costs.commission_bps_per_side + costs.spread_bps_per_side + costs.slippage_bps_per_side;
    if (oneWayTotal <= 0) addError(errors, 'spec.cost_model', 'zero_transaction_costs', 'At least one explicit per-side transaction cost must be positive.');
    if (2 * (costs.spread_bps_per_side + costs.slippage_bps_per_side) >= 10_000 || 2 * oneWayTotal >= 10_000) {
      addError(errors, 'spec.cost_model', 'unusable_stress_costs', 'Transaction costs must remain below 100% of reference notional under the 2x cost stress.');
    }
  }
}

function blockedResult(errors, details = {}) {
  return {
    contract_version: BACKTEST_CONTRACT_VERSION,
    mode: 'simulation',
    status: 'blocked',
    strategy: { rule_id: SIGNAL_RULE_ID, strategy_id: 'dda.trend-confirmation.backtest.v1' },
    data: details.data || null,
    cost_model: null,
    performance: null,
    benchmark: null,
    cost_sensitivity: [],
    validation: { computational_status: 'blocked', strategy_validation_status: 'unverified', hard_gates: [] },
    assumptions: [],
    validation_errors: errors,
    execution_enabled: false,
    is_trade_approval: false,
    order_recommendation: null,
    order_plan: null
  };
}

function rollingSma(values, period) {
  const output = Array(values.length).fill(null);
  let sum = 0;
  for (let i = 0; i < values.length; i += 1) {
    sum += values[i];
    if (i >= period) sum -= values[i - period];
    if (i >= period - 1) output[i] = sum / period;
  }
  return output;
}

function seededEma(values, period) {
  const output = Array(values.length).fill(null);
  if (values.length < period) return output;
  let current = 0;
  for (let i = 0; i < period; i += 1) current += values[i];
  current /= period;
  output[period - 1] = current;
  const alpha = 2 / (period + 1);
  for (let i = period; i < values.length; i += 1) {
    current = alpha * values[i] + (1 - alpha) * current;
    output[i] = current;
  }
  return output;
}

/** Single-pass indicators matching market-analysis-v2.js seed and window conventions. */
function computeTrendSignals(bars) {
  const closes = bars.map(bar => bar.close);
  const sma20 = rollingSma(closes, 20);
  const sma50 = rollingSma(closes, 50);
  const ema20 = seededEma(closes, 20);
  const ema50 = seededEma(closes, 50);
  const ema12 = seededEma(closes, 12);
  const ema26 = seededEma(closes, 26);
  const macd = Array(bars.length).fill(null);
  for (let i = 25; i < bars.length; i += 1) macd[i] = ema12[i] - ema26[i];
  const macdValues = macd.slice(25);
  const macdSignalValues = seededEma(macdValues, 9);
  const results = Array(bars.length);
  for (let i = 0; i < bars.length; i += 1) {
    const macdIndex = i - 25;
    const values = {
      trend_close_vs_sma_20: sma20[i] === null ? null : closes[i] / sma20[i] - 1,
      trend_sma_20: sma20[i],
      trend_sma_50: sma50[i],
      trend_ema_20: ema20[i],
      trend_ema_50: ema50[i],
      trend_macd_line_12_26: macd[i],
      trend_macd_signal_9: macdIndex < 0 ? null : macdSignalValues[macdIndex],
      trend_macd_histogram: macdIndex < 0 || macdSignalValues[macdIndex] === null ? null : macd[i] - macdSignalValues[macdIndex]
    };
    const ready = Object.values(values).every(value => typeof value === 'number' && Number.isFinite(value));
    results[i] = { direction: ready ? classifyTrend(values) : 'none', ready };
  }
  return results;
}

function mean(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
}

function sampleStd(values) {
  if (values.length < 2) return null;
  const average = mean(values);
  const sumSquares = values.reduce((sum, value) => sum + (value - average) ** 2, 0);
  return Math.sqrt(sumSquares / (values.length - 1));
}

function maxDrawdown(curve) {
  let peakValue = curve[0]?.equity ?? null;
  let peakAt = curve[0]?.timestamp ?? null;
  let worst = 0;
  let worstPeakAt = peakAt;
  let troughAt = peakAt;
  let recoveryAt = null;
  let recoveryTarget = null;
  for (const point of curve) {
    if (peakValue !== null && peakValue > 0) {
      const drawdown = point.equity / peakValue - 1;
      if (drawdown < worst) {
        worst = drawdown;
        worstPeakAt = peakAt;
        troughAt = point.timestamp;
        recoveryAt = null;
        recoveryTarget = peakValue;
      }
      if (recoveryTarget !== null && recoveryAt === null && point.timestamp > troughAt && point.equity >= recoveryTarget) recoveryAt = point.timestamp;
    }
    if (peakValue === null || point.equity > peakValue) {
      peakValue = point.equity;
      peakAt = point.timestamp;
    }
  }
  return { value: worst, peak_timestamp: worstPeakAt, trough_timestamp: troughAt, recovery_timestamp: recoveryAt };
}

function performanceMetrics(curve, trades, spec, exposureBars, totalBars, totalTradedNotional) {
  const startEquity = curve[0]?.equity ?? null;
  const endEquity = curve.at(-1)?.equity ?? null;
  const periodReturns = [];
  for (let i = 1; i < curve.length; i += 1) {
    const prior = curve[i - 1].equity;
    if (Number.isFinite(prior) && prior > 0 && Number.isFinite(curve[i].equity)) periodReturns.push(curve[i].equity / prior - 1);
  }
  const totalReturn = startEquity > 0 && endEquity !== null ? endEquity / startEquity - 1 : null;
  const elapsedDays = curve.length > 1 ? (Date.parse(curve.at(-1).timestamp) - Date.parse(curve[0].timestamp)) / 86_400_000 : 0;
  const cagr = startEquity > 0 && endEquity > 0 && elapsedDays > 0 ? (endEquity / startEquity) ** (365 / elapsedDays) - 1 : null;
  const perBarRf = (1 + spec.risk_free_rate_annual) ** (1 / DAILY_BARS_PER_YEAR) - 1;
  const perBarMar = (1 + spec.minimum_acceptable_return_annual) ** (1 / DAILY_BARS_PER_YEAR) - 1;
  const periodStd = sampleStd(periodReturns);
  const excessReturns = periodReturns.map(value => value - perBarRf);
  const excessStd = sampleStd(excessReturns);
  const downsideSquares = periodReturns.map(value => Math.min(value - perBarMar, 0) ** 2);
  const downsideDeviation = downsideSquares.length ? Math.sqrt(mean(downsideSquares)) : null;
  const positiveTrades = trades.filter(trade => trade.net_pnl > 0);
  const negativeTrades = trades.filter(trade => trade.net_pnl < 0);
  const grossProfit = positiveTrades.reduce((sum, trade) => sum + trade.net_pnl, 0);
  const grossLoss = negativeTrades.reduce((sum, trade) => sum + Math.abs(trade.net_pnl), 0);
  const closedTrades = trades.length;
  const averageNav = mean(curve.map(point => point.equity));
  const totalCosts = trades.reduce((sum, trade) => sum + trade.total_costs, 0);
  const meanWin = positiveTrades.length ? grossProfit / positiveTrades.length : null;
  const meanLoss = negativeTrades.length ? -grossLoss / negativeTrades.length : null;
  const winRate = closedTrades ? positiveTrades.length / closedTrades : null;
  return {
    initial_equity: startEquity,
    ending_equity: endEquity,
    currency: spec.currency,
    period_total_return: totalReturn,
    cagr: cagr === null ? null : { value: cagr, status: elapsedDays < 365 ? 'short_window' : 'computed', calendar_days: elapsedDays },
    annualized_volatility: periodStd === null ? null : periodStd * Math.sqrt(DAILY_BARS_PER_YEAR),
    sharpe_ratio: excessStd === null || excessStd === 0 ? null : mean(excessReturns) / excessStd * Math.sqrt(DAILY_BARS_PER_YEAR),
    sortino_ratio: downsideDeviation === null || downsideDeviation === 0 ? null : (mean(periodReturns) - perBarMar) / downsideDeviation * Math.sqrt(DAILY_BARS_PER_YEAR),
    max_drawdown: maxDrawdown(curve),
    calmar_ratio: cagr === null || maxDrawdown(curve).value === 0 ? null : cagr / Math.abs(maxDrawdown(curve).value),
    trade_count: closedTrades,
    win_rate: winRate,
    break_even_trade_count: trades.filter(trade => trade.net_pnl === 0).length,
    average_win: meanWin,
    average_loss: meanLoss,
    profit_factor: grossLoss === 0 ? null : grossProfit / grossLoss,
    expectancy_per_closed_trade: closedTrades ? trades.reduce((sum, trade) => sum + trade.net_pnl, 0) / closedTrades : null,
    total_costs: totalCosts,
    total_costs_fraction_of_initial_equity: startEquity > 0 ? totalCosts / startEquity : null,
    trading_turnover: averageNav > 0 ? totalTradedNotional / averageNav : null,
    trading_turnover_convention: 'double_sided_total_traded_notional_divided_by_average_marked_equity',
    market_exposure_fraction: totalBars > 0 ? exposureBars / totalBars : null,
    market_exposure_convention: 'fraction_of_daily_close_observations_with_an_open_position',
    annualization_factor: DAILY_BARS_PER_YEAR,
    observations: periodReturns.length
  };
}

function simulateSegment({ bars, signals, startIndex, endIndex, spec, costModel, fixedDirection = null }) {
  let capital = spec.initial_capital;
  let position = null;
  let exposureBars = 0;
  let totalTradedNotional = 0;
  const trades = [];
  const curve = [{ timestamp: bars[startIndex].timestamp, equity: capital }];

  function openPosition(direction, index, referencePrice, signalAt) {
    if (!(capital > 0)) return;
    const action = direction === 'long' ? 'buy' : 'sell';
    const fillPrice = adjustedFill(referencePrice, action, costModel);
    const targetNotional = capital * spec.position_fraction;
    const units = targetNotional / (referencePrice * spec.contract_multiplier);
    if (!(Number.isFinite(units) && units > 0 && Number.isFinite(fillPrice) && fillPrice > 0)) return;
    const entryCommission = commissionAmount(units, fillPrice, spec.contract_multiplier, costModel.commission_bps_per_side);
    const entryExecutionCost = executionCost(units, fillPrice, referencePrice, spec.contract_multiplier);
    capital -= entryCommission;
    totalTradedNotional += Math.abs(units * referencePrice * spec.contract_multiplier);
    position = {
      direction,
      entry_index: index,
      entry_signal_at: signalAt,
      entry_bar_timestamp: bars[index].timestamp,
      entry_reference_price: referencePrice,
      entry_fill_price: fillPrice,
      units,
      entry_notional: Math.abs(units * referencePrice * spec.contract_multiplier),
      entry_commission: entryCommission,
      entry_execution_cost: entryExecutionCost,
      long_financing_cost_accrued: 0,
      short_financing_cost_accrued: 0,
      borrow_cost_accrued: 0
    };
  }

  function closePosition(index, referencePrice, reason, exitSignalAt = null) {
    if (!position) return;
    const action = position.direction === 'long' ? 'sell' : 'buy';
    const fillPrice = adjustedFill(referencePrice, action, costModel);
    const exitCommission = commissionAmount(position.units, fillPrice, spec.contract_multiplier, costModel.commission_bps_per_side);
    const exitExecutionCost = executionCost(position.units, fillPrice, referencePrice, spec.contract_multiplier);
    const sign = position.direction === 'long' ? 1 : -1;
    const grossPnl = sign * position.units * (referencePrice - position.entry_reference_price) * spec.contract_multiplier;
    const holdingDailyBars = Math.max(1, index - position.entry_index + (['end_of_period', 'equity_depleted'].includes(reason) ? 1 : 0));
    const longFinancingCost = position.long_financing_cost_accrued;
    const shortFinancingCost = position.short_financing_cost_accrued;
    const borrowCost = position.borrow_cost_accrued;
    const totalFinancingCost = longFinancingCost + shortFinancingCost + borrowCost;
    const spreadSlippageCost = position.entry_execution_cost + exitExecutionCost;
    const totalCosts = position.entry_commission + exitCommission + spreadSlippageCost + totalFinancingCost;
    capital += sign * position.units * (fillPrice - position.entry_fill_price) * spec.contract_multiplier - exitCommission - totalFinancingCost;
    totalTradedNotional += Math.abs(position.units * referencePrice * spec.contract_multiplier);
    trades.push({
      direction: position.direction,
      position_unit: spec.position_unit,
      contract_multiplier: spec.contract_multiplier,
      signal_at: position.entry_signal_at,
      entry_bar_timestamp: position.entry_bar_timestamp,
      entry_price_reference: position.entry_reference_price,
      entry_price_fill: position.entry_fill_price,
      exit_signal_at: exitSignalAt,
      exit_bar_timestamp: bars[index].timestamp,
      exit_price_reference: referencePrice,
      exit_price_fill: fillPrice,
      units: position.units,
      entry_notional: position.entry_notional,
      exit_notional: Math.abs(position.units * referencePrice * spec.contract_multiplier),
      gross_pnl: grossPnl,
      commission_cost: position.entry_commission + exitCommission,
      spread_slippage_cost: spreadSlippageCost,
      long_financing_cost: longFinancingCost,
      short_financing_cost: shortFinancingCost,
      short_borrow_cost: borrowCost,
      total_financing_cost: totalFinancingCost,
      total_costs: totalCosts,
      net_pnl: grossPnl - totalCosts,
      holding_daily_bars: holdingDailyBars,
      exit_reason: reason
    });
    position = null;
  }

  for (let index = startIndex + 1; index <= endIndex; index += 1) {
    const desired = fixedDirection || signals[index - 1].direction;
    if (position && desired !== position.direction) {
      closePosition(index, bars[index].open, desired === 'none' ? 'signal_not_confirmed' : 'opposite_signal', bars[index - 1].timestamp);
    }
    if (!position && desired !== 'none') openPosition(desired, index, bars[index].open, bars[index - 1].timestamp);
    if (position) {
      const financing = financingComponents(position.entry_notional, costModel, position.direction, 1, DAILY_BARS_PER_YEAR);
      position.long_financing_cost_accrued += financing.long_financing;
      position.short_financing_cost_accrued += financing.short_financing;
      position.borrow_cost_accrued += financing.short_borrow;
    }
    if (position) exposureBars += 1;
    if (index === endIndex && position) closePosition(index, bars[index].close, 'end_of_period', null);
    let unrealized = position
      ? (position.direction === 'long' ? 1 : -1) * position.units * (bars[index].close - position.entry_fill_price) * spec.contract_multiplier
      : 0;
    if (position) unrealized -= position.long_financing_cost_accrued + position.short_financing_cost_accrued + position.borrow_cost_accrued;
    let equity = capital + unrealized;
    if (!(equity > 0) && position) {
      closePosition(index, bars[index].close, 'equity_depleted', null);
      unrealized = 0;
      equity = capital;
    }
    curve.push({ timestamp: bars[index].timestamp, equity });
    if (!(equity > 0)) break;
  }

  const metrics = performanceMetrics(curve, trades, spec, exposureBars, Math.max(0, curve.length - 1), totalTradedNotional);
  return { performance: metrics, trade_log: trades, equity_curve: curve };
}

function findIndexByTimestamp(bars, timestamp) {
  return bars.findIndex(bar => bar.timestamp === timestamp);
}

function suspectGaps(bars, startIndex, endIndex) {
  const gaps = [];
  for (let index = startIndex + 1; index <= endIndex; index += 1) {
    const days = (Date.parse(bars[index].timestamp) - Date.parse(bars[index - 1].timestamp)) / 86_400_000;
    if (days > SUSPECTED_GAP_DAYS) gaps.push({ from: bars[index - 1].timestamp, to: bars[index].timestamp, calendar_days: days });
  }
  return gaps;
}

function scaleCosts(costs, multiplier) {
  return Object.fromEntries(Object.entries(costs).map(([key, value]) => [key, value * multiplier]));
}

function nonFiniteNumbers(value, path = 'result', errors = []) {
  if (typeof value === 'number' && !Number.isFinite(value)) {
    errors.push({ path, code: 'non_finite_calculation', message: 'A derived numeric value was not finite; the run is blocked rather than serialized as null.' });
  } else if (Array.isArray(value)) {
    value.forEach((item, index) => nonFiniteNumbers(item, `${path}[${index}]`, errors));
  } else if (isRecord(value)) {
    for (const [key, item] of Object.entries(value)) nonFiniteNumbers(item, `${path}.${key}`, errors);
  }
  return errors;
}

function runHistoricalBacktest(input = {}) {
  if (!isRecord(input)) return blockedResult([{ path: 'input', code: 'invalid_object', message: 'Backtest input must be an object.' }]);
  const errors = [];
  checkKeys(input, new Set(['marketSeries', 'spec', 'options']), 'input', errors);
  const { marketSeries, spec, options = {} } = input;
  validateSpec(spec, errors);
  if (!isRecord(options)) {
    addError(errors, 'options', 'invalid_options', 'options must be an object.');
  } else {
    checkKeys(options, new Set(['asOf', 'allowSyntheticFixture']), 'options', errors);
  }
  const asOfInput = isRecord(options) && options.asOf !== undefined ? options.asOf : new Date();
  const asOf = new Date(asOfInput);
  if (!Number.isFinite(asOf.getTime())) addError(errors, 'options.asOf', 'invalid_timestamp', 'asOf must be a valid evaluation timestamp.');
  if (errors.length) return blockedResult(errors);

  const validation = validateMarketSeriesV2(marketSeries, { asOf });
  if (!validation.valid) return blockedResult(validation.errors.map(error => ({ ...error })), { cost_model: spec.cost_model });
  const isHistoricalImport = marketSeries.data_mode === 'historical' && marketSeries.source.kind === 'historical_import';
  const isExplicitSyntheticFixture = marketSeries.data_mode === 'synthetic'
    && marketSeries.source.kind === 'synthetic_fixture'
    && options.allowSyntheticFixture === true;
  if (!isHistoricalImport && !isExplicitSyntheticFixture) {
    return blockedResult([{
      path: 'marketSeries',
      code: 'unsupported_backtest_source',
      message: 'Backtest v1 accepts historical_import data only. Synthetic fixtures are allowed only when options.allowSyntheticFixture=true; provider data is excluded pending a separate rights review.'
    }], { cost_model: spec.cost_model });
  }
  if (marketSeries.timeframe !== '1d') {
    return blockedResult([{ path: 'marketSeries.timeframe', code: 'unsupported_frequency', message: 'Backtest v1 is daily-only so annualization and financing conventions remain explicit.' }], { cost_model: spec.cost_model });
  }
  if (spec.currency !== marketSeries.instrument.currency) {
    return blockedResult([{ path: 'spec.currency', code: 'currency_mismatch', message: 'Initial capital currency must match the market series currency; no FX conversion is performed.' }], { cost_model: spec.cost_model });
  }
  if (Date.parse(spec.end) > asOf.getTime()) {
    return blockedResult([{ path: 'spec.end', code: 'future_backtest_end', message: 'Backtest end must not be after the evaluation timestamp.' }], { cost_model: spec.cost_model });
  }

  const bars = marketSeries.bars;
  const startIndex = findIndexByTimestamp(bars, spec.start);
  const inSampleEndIndex = findIndexByTimestamp(bars, spec.in_sample_end);
  const endIndex = findIndexByTimestamp(bars, spec.end);
  if (startIndex < 0) addError(errors, 'spec.start', 'period_boundary_not_found', 'start must exactly match a market bar timestamp.');
  if (inSampleEndIndex < 0) addError(errors, 'spec.in_sample_end', 'period_boundary_not_found', 'in_sample_end must exactly match a market bar timestamp.');
  if (endIndex < 0) addError(errors, 'spec.end', 'period_boundary_not_found', 'end must exactly match a market bar timestamp.');
  if (startIndex >= 0 && startIndex < REQUIRED_WARMUP_BARS) addError(errors, 'marketSeries.bars', 'insufficient_warmup', `At least ${REQUIRED_WARMUP_BARS} bars before start are required for indicator warm-up.`);
  if (startIndex >= 0 && inSampleEndIndex >= 0 && endIndex >= 0) {
    if (inSampleEndIndex <= startIndex || inSampleEndIndex >= endIndex) addError(errors, 'spec.in_sample_end', 'invalid_split', 'The in-sample boundary must leave non-empty in-sample and out-of-sample periods.');
    if (inSampleEndIndex + 1 >= endIndex) addError(errors, 'spec.end', 'insufficient_out_of_sample_bars', 'At least two out-of-sample daily bars are required.');
  }
  if (errors.length) return blockedResult(errors, { cost_model: spec.cost_model });

  const signals = computeTrendSignals(bars);
  const full = simulateSegment({ bars, signals, startIndex, endIndex, spec, costModel: spec.cost_model });
  const inSample = simulateSegment({ bars, signals, startIndex, endIndex: inSampleEndIndex, spec, costModel: spec.cost_model });
  const outOfSampleStart = inSampleEndIndex + 1;
  const outOfSample = simulateSegment({ bars, signals, startIndex: inSampleEndIndex, endIndex, spec, costModel: spec.cost_model });
  const benchmark = simulateSegment({ bars, signals, startIndex, endIndex, spec, costModel: spec.cost_model, fixedDirection: 'long' });
  const costSensitivity = COST_STRESS_MULTIPLIERS.map(multiplier => {
    const run = simulateSegment({ bars, signals, startIndex, endIndex, spec, costModel: scaleCosts(spec.cost_model, multiplier) });
    return { cost_multiplier: multiplier, performance: run.performance };
  });
  const numericalErrors = nonFiniteNumbers({ full, inSample, outOfSample, benchmark, costSensitivity });
  if (numericalErrors.length) return blockedResult(numericalErrors, { cost_model: spec.cost_model });

  const gaps = suspectGaps(bars, startIndex, endIndex);
  const totalYears = (Date.parse(spec.end) - Date.parse(spec.start)) / (365.2425 * 86_400_000);
  const inSampleYears = (Date.parse(spec.in_sample_end) - Date.parse(spec.start)) / (365.2425 * 86_400_000);
  const outOfSampleYears = (Date.parse(spec.end) - Date.parse(bars[outOfSampleStart].timestamp)) / (365.2425 * 86_400_000);
  const equitySeriesIncomplete = marketSeries.instrument.asset_class === 'equity'
    && (spec.price_adjustment_basis !== 'total_return' || spec.dividend_policy !== 'included');
  const evidenceGates = [
    { name: 'historical_source_or_explicit_test_fixture', status: isHistoricalImport ? 'pass' : 'unknown_gate', evidence: isHistoricalImport ? 'Historical import source; provider adapters are not used.' : 'Synthetic fixture is explicitly marked and cannot support performance conclusions.' },
    { name: 'multi_year_period', status: totalYears >= 2 ? 'pass' : 'unknown_gate', evidence: `Requested window spans ${totalYears.toFixed(2)} calendar years; two years are required for the multi-year gate.` },
    { name: 'in_sample_and_out_of_sample', status: inSampleYears >= 1 && outOfSampleYears >= 1 ? 'pass' : 'unknown_gate', evidence: `In-sample ${inSampleYears.toFixed(2)} years; out-of-sample ${outOfSampleYears.toFixed(2)} years; each requires at least one year.` },
    { name: 'suspected_calendar_gaps', status: gaps.length === 0 ? 'pass' : 'unknown_gate', evidence: gaps.length === 0 ? `No adjacent daily-bar gap exceeded ${SUSPECTED_GAP_DAYS} calendar days.` : `${gaps.length} suspected gap(s) exceeded ${SUSPECTED_GAP_DAYS} calendar days.` },
    { name: 'price_adjustment_and_dividends', status: equitySeriesIncomplete ? 'unknown_gate' : 'pass', evidence: `Caller-declared price basis=${spec.price_adjustment_basis}; dividend policy=${spec.dividend_policy}; the engine does not verify adjustment semantics.` },
    { name: 'cost_model', status: 'pass', evidence: 'Explicit non-zero transaction friction and cost multipliers 1x/1.5x/2x were applied.' },
    { name: 'data_rights', status: 'unknown_gate', evidence: 'The caller supplied a reference, but source licensing and redistribution rights were not independently verified.' },
    { name: 'short_borrow', status: 'unknown_gate', evidence: 'Borrow availability, recalls, and historical locate fees are represented only by caller assumptions.' }
  ];
  const sampleCoveragePassed = isHistoricalImport
    && totalYears >= 2
    && inSampleYears >= 1
    && outOfSampleYears >= 1
    && gaps.length === 0
    && !equitySeriesIncomplete;
  const resultStatus = sampleCoveragePassed && evidenceGates.every(gate => gate.status === 'pass') ? 'complete' : 'provisional';
  const data = {
    data_mode: marketSeries.data_mode,
    source_id: marketSeries.source.id,
    source_kind: marketSeries.source.kind,
    data_rights_reference: isHistoricalImport ? spec.data_rights_reference : null,
    data_rights_status: isHistoricalImport ? 'caller_reference_not_verified' : 'synthetic_fixture_only',
    instrument: marketSeries.instrument.symbol,
    asset_class: marketSeries.instrument.asset_class,
    currency: marketSeries.instrument.currency,
    timeframe: marketSeries.timeframe,
    position_unit: spec.position_unit,
    contract_multiplier: spec.contract_multiplier,
    first_bar_at: bars[0].timestamp,
    last_bar_at: bars.at(-1).timestamp,
    requested_start: spec.start,
    in_sample_end: spec.in_sample_end,
    requested_end: spec.end,
    bars_available: bars.length,
    warmup_bars_before_start: startIndex,
    bars_in_sample: inSampleEndIndex - startIndex + 1,
    bars_out_of_sample: endIndex - outOfSampleStart + 1,
    price_adjustment_basis: spec.price_adjustment_basis,
    dividend_policy: spec.dividend_policy,
    suspected_gaps: gaps
  };
  return {
    contract_version: BACKTEST_CONTRACT_VERSION,
    mode: 'simulation',
    status: resultStatus,
    strategy: {
      rule_id: SIGNAL_RULE_ID,
      strategy_id: 'dda.trend-confirmation.backtest.v1',
      specification: {
        signal: 'Use the shared dda.trend-confirmation.v1 rule at each completed daily close.',
        entry: 'At the next observed daily bar open after a long/short signal, with directional spread and slippage applied.',
        exit: 'At the next observed daily bar open after the signal becomes none or reverses; opposite signals reverse at the same open.',
        sizing: 'Single instrument, one open position maximum; target notional is position_fraction of current marked equity, with no leverage model.',
        terminal_liquidation: 'Any open position is liquidated at the final included bar close; the signal on the final bar is not entered.',
        shorts: 'Shorts are modeled only under the explicit caller assumption that borrow is available; recalls and actual availability are not modeled.'
      }
    },
    data,
    cost_model: {
      cost_model_id: COST_MODEL_ID,
      cost_model_reference: spec.cost_model_reference,
      ...spec.cost_model,
      convention: 'All bps are explicit; spread and slippage adjust each directional fill, commission is charged per side, long/short financing and short borrow accrue daily on entry notional into marked equity.',
      costs_are_hypothetical: true
    },
    performance: { full, in_sample: inSample, out_of_sample: outOfSample },
    benchmark: { name: 'buy_and_hold_long_same_fraction', ...benchmark },
    cost_sensitivity: costSensitivity,
    validation: {
      computational_status: 'complete',
      strategy_validation_status: 'unverified',
      multi_year_span: totalYears >= 2 ? 'pass' : 'provisional',
      out_of_sample_span: inSampleYears >= 1 && outOfSampleYears >= 1 ? 'pass' : 'provisional',
      no_lookahead: 'pass',
      no_lookahead_method: 'Signals use bars through the prior completed close; fills use the next included bar open, and the final-bar signal is ignored.',
      data_coverage: gaps.length === 0 ? 'no_large_gap_detected' : 'suspected_gaps',
      hard_gates: evidenceGates,
      limitation: 'Passing computational checks does not validate strategy profitability, data rights, market tradability, or future performance.'
    },
    assumptions: [
      'Daily bars only; annualization factor 252 is used for daily risk statistics and long/short financing and short-borrow accrual.',
      'No overlapping positions; each next-bar-open execution follows the last completed-bar rule state.',
      'No stops, targets, limit orders, partial fills, market impact beyond the supplied slippage, margin calls, dividends unless already represented by the declared price basis, or corporate-action processing are generated.',
      'The 10-calendar-day gap detector is a warning heuristic, not an exchange calendar or proof of complete coverage.',
      'The source and data-rights reference are caller-supplied and are not independently verified; no provider adapter or entitlement service is involved.',
      'A completed backtest is not a trade approval, signal to act, or evidence that the rule has an edge.'
    ],
    validation_errors: [],
    execution_enabled: false,
    is_trade_approval: false,
    order_recommendation: null,
    order_plan: null
  };
}

module.exports = {
  BACKTEST_CONTRACT_VERSION,
    BACKTEST_SPEC_VERSION,
    DAILY_BARS_PER_YEAR,
    REQUIRED_WARMUP_BARS,
    computeTrendSignals,
  runHistoricalBacktest
};
