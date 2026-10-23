'use strict';

const COST_MODEL_ID = 'dda.autotrader.cost-model.v1';
const BASIS_POINTS = 10_000;
const COST_KEYS = Object.freeze([
  'commission_bps_per_side',
  'spread_bps_per_side',
  'slippage_bps_per_side',
  'long_financing_bps_per_year',
  'short_financing_bps_per_year',
  'short_borrow_bps_per_year'
]);
const CONTEXT_KEYS = new Set([
  'cost_model_id', 'reference', 'currency', 'position_unit', 'contract_multiplier',
  'holding_period_bars', 'bars_per_year', 'costs'
]);
const COST_KEY_SET = new Set(COST_KEYS);

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function addError(errors, path, code, message) {
  errors.push({ path, code, message });
}

function adjustedFill(referencePrice, action, costs) {
  const impact = (costs.spread_bps_per_side + costs.slippage_bps_per_side) / BASIS_POINTS;
  return referencePrice * (action === 'buy' ? 1 + impact : 1 - impact);
}

function commissionAmount(units, fillPrice, contractMultiplier, commissionBpsPerSide) {
  return Math.abs(units * fillPrice * contractMultiplier) * commissionBpsPerSide / BASIS_POINTS;
}

function executionCost(units, fillPrice, referencePrice, contractMultiplier) {
  return Math.abs(units * (fillPrice - referencePrice) * contractMultiplier);
}

function financingComponents(entryNotional, costs, side, holdingBars, barsPerYear) {
  const periodFraction = holdingBars / barsPerYear / BASIS_POINTS;
  const longFinancing = side === 'long' ? entryNotional * costs.long_financing_bps_per_year * periodFraction : 0;
  const shortFinancing = side === 'short' ? entryNotional * costs.short_financing_bps_per_year * periodFraction : 0;
  const shortBorrow = side === 'short' ? entryNotional * costs.short_borrow_bps_per_year * periodFraction : 0;
  return {
    long_financing: longFinancing,
    short_financing: shortFinancing,
    short_borrow: shortBorrow,
    total: longFinancing + shortFinancing + shortBorrow
  };
}

function financingAmount(entryNotional, costs, side, holdingBars, barsPerYear) {
  return financingComponents(entryNotional, costs, side, holdingBars, barsPerYear).total;
}

function validateCostContext(context) {
  const errors = [];
  if (!isRecord(context)) {
    return [{ path: 'cost_context', code: 'invalid_object', message: 'An explicit cost context object is required to calculate net reward-to-risk.' }];
  }
  for (const key of Object.keys(context)) {
    if (!CONTEXT_KEYS.has(key)) addError(errors, `cost_context.${key}`, 'unexpected_property', 'Property is not part of dda.autotrader.cost-model.v1.');
  }
  if (context.cost_model_id !== COST_MODEL_ID) {
    addError(errors, 'cost_context.cost_model_id', 'unsupported_cost_model', `Expected ${COST_MODEL_ID}.`);
  }
  if (typeof context.reference !== 'string' || !context.reference.trim() || context.reference.length > 200) {
    addError(errors, 'cost_context.reference', 'missing_cost_reference', 'Provide a concise source or scenario reference; it is caller-supplied and not independently verified.');
  }
  if (typeof context.currency !== 'string' || !/^[A-Z]{3}$/.test(context.currency)) {
    addError(errors, 'cost_context.currency', 'invalid_currency', 'Currency must be an uppercase three-letter code.');
  }
  if (typeof context.position_unit !== 'string' || !context.position_unit.trim() || context.position_unit.length > 32) {
    addError(errors, 'cost_context.position_unit', 'missing_position_unit', 'Specify the instrument unit used for one position unit.');
  }
  if (typeof context.contract_multiplier !== 'number' || !Number.isFinite(context.contract_multiplier) || context.contract_multiplier <= 0 || context.contract_multiplier > 1e12) {
    addError(errors, 'cost_context.contract_multiplier', 'invalid_contract_multiplier', 'Contract multiplier must be explicit, finite, positive, and no greater than 1e12.');
  }
  for (const key of ['holding_period_bars', 'bars_per_year']) {
    if (!Number.isInteger(context[key]) || context[key] <= 0 || context[key] > 1_000_000) {
      addError(errors, `cost_context.${key}`, 'invalid_horizon', `${key} must be an explicit positive integer no greater than 1,000,000; no horizon is assumed.`);
    }
  }
  if (!isRecord(context.costs)) {
    addError(errors, 'cost_context.costs', 'invalid_costs', 'All per-side and financing cost assumptions must be supplied explicitly.');
  } else {
    for (const key of Object.keys(context.costs)) {
      if (!COST_KEY_SET.has(key)) addError(errors, `cost_context.costs.${key}`, 'unexpected_property', 'Cost field is not part of the versioned model.');
    }
    for (const key of COST_KEYS) {
      const value = context.costs[key];
      if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 1_000_000) {
        addError(errors, `cost_context.costs.${key}`, 'invalid_cost', `${key} must be explicitly supplied as a finite non-negative number of basis points, at most 1,000,000.`);
      }
    }
    if (COST_KEYS.every(key => typeof context.costs[key] === 'number' && Number.isFinite(context.costs[key]))) {
      const oneWayBps = context.costs.commission_bps_per_side + context.costs.spread_bps_per_side + context.costs.slippage_bps_per_side;
      if (oneWayBps <= 0) addError(errors, 'cost_context.costs', 'zero_transaction_costs', 'At least one explicit per-side transaction cost must be positive.');
      if (2 * (context.costs.spread_bps_per_side + context.costs.slippage_bps_per_side) >= BASIS_POINTS || 2 * oneWayBps >= BASIS_POINTS) {
        addError(errors, 'cost_context.costs', 'unusable_transaction_costs', 'Two-sided transaction costs must remain below 100% of notional under a 2x stress.');
      }
    }
  }
  return errors;
}

function notComputed(status, reason, validationErrors = [], context = null) {
  return {
    status,
    net_ratio: null,
    model_id: context?.cost_model_id === COST_MODEL_ID ? COST_MODEL_ID : null,
    reference: typeof context?.reference === 'string' ? context.reference : null,
    currency: typeof context?.currency === 'string' ? context.currency : null,
    assumptions: null,
    breakdown: null,
    validation_errors: validationErrors,
    reason
  };
}

function calculateNetRewardRisk({ side, entryPrice, stopPrice, targetPrice, notional, instrumentCurrency, exposureCurrency, costContext } = {}) {
  if (costContext === undefined || costContext === null) {
    return notComputed('not_supplied', 'No explicit cost, contract, currency, or holding-horizon context was supplied; net ratio remains null.');
  }
  const validationErrors = validateCostContext(costContext);
  if (side !== 'long' && side !== 'short') addError(validationErrors, 'side', 'invalid_side', 'Side must be long or short.');
  if (typeof notional !== 'number' || !Number.isFinite(notional) || notional <= 0) addError(validationErrors, 'notional', 'invalid_notional', 'A finite positive caller-supplied notional is required.');
  for (const [key, value] of Object.entries({ entryPrice, stopPrice, targetPrice })) {
    if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) addError(validationErrors, key, 'invalid_price', `${key} must be a finite positive price.`);
  }
  if (typeof instrumentCurrency !== 'string' || costContext.currency !== instrumentCurrency) {
    addError(validationErrors, 'cost_context.currency', 'instrument_currency_mismatch', 'Cost currency must match the market instrument currency; no FX conversion is performed.');
  }
  if (typeof exposureCurrency !== 'string' || costContext.currency !== exposureCurrency) {
    addError(validationErrors, 'cost_context.currency', 'exposure_currency_mismatch', 'Cost currency must also match caller-supplied exposure currency; no FX conversion is performed.');
  }
  if (validationErrors.length) return notComputed('not_computable', 'Net ratio was not calculated because one or more explicit cost-context inputs are invalid or currency-incompatible.', validationErrors, costContext);

  const costs = costContext.costs;
  const isLong = side === 'long';
  const directionSign = isLong ? 1 : -1;
  const entryAction = isLong ? 'buy' : 'sell';
  const exitAction = isLong ? 'sell' : 'buy';
  const units = notional / (entryPrice * costContext.contract_multiplier);
  const entryFill = adjustedFill(entryPrice, entryAction, costs);
  const targetFill = adjustedFill(targetPrice, exitAction, costs);
  const stopFill = adjustedFill(stopPrice, exitAction, costs);
  const entryCommission = commissionAmount(units, entryFill, costContext.contract_multiplier, costs.commission_bps_per_side);
  const targetCommission = commissionAmount(units, targetFill, costContext.contract_multiplier, costs.commission_bps_per_side);
  const stopCommission = commissionAmount(units, stopFill, costContext.contract_multiplier, costs.commission_bps_per_side);
  const entryExecutionCost = executionCost(units, entryFill, entryPrice, costContext.contract_multiplier);
  const targetExecutionCost = executionCost(units, targetFill, targetPrice, costContext.contract_multiplier);
  const stopExecutionCost = executionCost(units, stopFill, stopPrice, costContext.contract_multiplier);
  const grossReward = directionSign * units * (targetPrice - entryPrice) * costContext.contract_multiplier;
  const grossStopPnl = directionSign * units * (stopPrice - entryPrice) * costContext.contract_multiplier;
  const grossRisk = Math.abs(grossStopPnl);
  const financingCost = financingAmount(notional, costs, side, costContext.holding_period_bars, costContext.bars_per_year);
  const netReward = grossReward - entryCommission - targetCommission - entryExecutionCost - targetExecutionCost - financingCost;
  const netRisk = grossRisk + entryCommission + stopCommission + entryExecutionCost + stopExecutionCost + financingCost;
  const values = [units, entryFill, targetFill, stopFill, entryCommission, targetCommission, stopCommission, entryExecutionCost, targetExecutionCost, stopExecutionCost, grossReward, grossRisk, financingCost, netReward, netRisk];
  if (!values.every(Number.isFinite) || !(netRisk > 0)) {
    return notComputed('not_computable', 'A derived cost or payoff was non-finite or risk was not positive.', [{ path: 'cost_context', code: 'non_finite_calculation', message: 'Derived net R/R values must be finite and risk must be positive.' }], costContext);
  }
  const netRatio = netReward / netRisk;
  if (!Number.isFinite(netRatio)) {
    return notComputed('not_computable', 'Derived net R/R was not finite.', [{ path: 'net_ratio', code: 'non_finite_calculation', message: 'Derived net ratio must be finite.' }], costContext);
  }
  const assumptions = {
    model_id: COST_MODEL_ID,
    reference: costContext.reference,
    currency: costContext.currency,
    position_unit: costContext.position_unit,
    contract_multiplier: costContext.contract_multiplier,
    holding_period_bars: costContext.holding_period_bars,
    bars_per_year: costContext.bars_per_year,
    costs: { ...costs },
    verification_status: 'caller_assumption_not_independently_verified',
    convention: 'Spread and slippage adjust each side fill; commission applies per side to fill notional; financing/short borrow use entry notional over the explicit holding bars. The same holding horizon is applied to target and stop scenarios.'
  };
  return {
    status: 'computed',
    net_ratio: netRatio,
    model_id: COST_MODEL_ID,
    reference: costContext.reference,
    currency: costContext.currency,
    assumptions,
    breakdown: {
      currency: costContext.currency,
      gross_reward_amount: grossReward,
      gross_risk_amount: grossRisk,
      entry_execution_cost: entryExecutionCost,
      entry_commission: entryCommission,
      target_exit_execution_cost: targetExecutionCost,
      target_exit_commission: targetCommission,
      stop_exit_execution_cost: stopExecutionCost,
      stop_exit_commission: stopCommission,
      financing_cost_target: financingCost,
      financing_cost_stop: financingCost,
      net_reward_amount: netReward,
      net_risk_amount: netRisk
    },
    validation_errors: [],
    reason: 'Net R/R is a hypothetical scenario under caller-supplied, unverified costs, contract specification, and the same explicit holding horizon for target and stop; it is not a forecast or guaranteed loss limit.'
  };
}

module.exports = {
  COST_MODEL_ID,
  COST_KEYS,
  adjustedFill,
  commissionAmount,
  executionCost,
  financingAmount,
  financingComponents,
  validateCostContext,
  calculateNetRewardRisk
};
