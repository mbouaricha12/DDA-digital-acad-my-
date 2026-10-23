'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {
  COST_MODEL_ID,
  validateCostContext,
  calculateNetRewardRisk
} = require('../bff/src/autotrader/cost-model-v1');

function makeContext(patch = {}) {
  return {
    cost_model_id: COST_MODEL_ID,
    reference: 'documented simulation assumptions; not independently verified',
    currency: 'USD',
    position_unit: 'unit',
    contract_multiplier: 1,
    holding_period_bars: 10,
    bars_per_year: 252,
    costs: {
      commission_bps_per_side: 2,
      spread_bps_per_side: 1,
      slippage_bps_per_side: 1,
      long_financing_bps_per_year: 5,
      short_financing_bps_per_year: 5,
      short_borrow_bps_per_year: 10
    },
    ...patch
  };
}

function run(name, fn) {
  fn();
  console.log(`PASS ${name}`);
}

run('cost model schema is strict, versioned, and requires every explicit input', () => {
  const schema = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'contracts', 'autotrader', 'cost-model-v1.schema.json'), 'utf8'));
  assert.equal(schema.properties.cost_model_id.const, COST_MODEL_ID);
  assert.equal(COST_MODEL_ID, 'dda.autotrader.cost-model.v1');
  assert.deepEqual(schema.required, ['cost_model_id', 'reference', 'currency', 'position_unit', 'contract_multiplier', 'holding_period_bars', 'bars_per_year', 'costs']);
  assert.ok(schema.properties.costs.required.includes('short_borrow_bps_per_year'));
  assert.equal(schema.additionalProperties, false);
});

run('long and short scenarios calculate finite net ratios and auditable currency amounts', () => {
  const common = {
    entryPrice: 100,
    notional: 1_000,
    instrumentCurrency: 'USD',
    exposureCurrency: 'USD',
    costContext: makeContext()
  };
  const long = calculateNetRewardRisk({ ...common, side: 'long', stopPrice: 98.5, targetPrice: 103 });
  const short = calculateNetRewardRisk({ ...common, side: 'short', stopPrice: 101.5, targetPrice: 97 });
  for (const result of [long, short]) {
    assert.equal(result.status, 'computed');
    assert.ok(Number.isFinite(result.net_ratio));
    assert.equal(result.breakdown.currency, 'USD');
    assert.ok(result.breakdown.net_risk_amount > 0);
    assert.ok(result.breakdown.net_reward_amount < result.breakdown.gross_reward_amount);
    assert.ok(result.assumptions.verification_status === 'caller_assumption_not_independently_verified');
  }
  assert.ok(long.net_ratio < 2);
  assert.ok(short.net_ratio < 2);
  assert.ok(short.breakdown.financing_cost_stop > 0);
});

run('absent, incomplete, or currency-mismatched costs do not produce a net ratio', () => {
  const absent = calculateNetRewardRisk({ side: 'long', entryPrice: 100, stopPrice: 98, targetPrice: 104, notional: 1_000, instrumentCurrency: 'USD', exposureCurrency: 'USD' });
  const incompleteContext = makeContext({ costs: { commission_bps_per_side: 2 } });
  const incomplete = calculateNetRewardRisk({ side: 'long', entryPrice: 100, stopPrice: 98, targetPrice: 104, notional: 1_000, instrumentCurrency: 'USD', exposureCurrency: 'USD', costContext: incompleteContext });
  const mismatch = calculateNetRewardRisk({ side: 'long', entryPrice: 100, stopPrice: 98, targetPrice: 104, notional: 1_000, instrumentCurrency: 'USD', exposureCurrency: 'USD', costContext: makeContext({ currency: 'EUR' }) });
  assert.equal(absent.status, 'not_supplied');
  assert.equal(absent.net_ratio, null);
  assert.equal(incomplete.status, 'not_computable');
  assert.equal(incomplete.net_ratio, null);
  assert.ok(incomplete.validation_errors.some(error => error.code === 'invalid_cost'));
  assert.equal(mismatch.status, 'not_computable');
  assert.equal(mismatch.net_ratio, null);
  assert.ok(mismatch.validation_errors.some(error => error.code === 'instrument_currency_mismatch'));
});

run('cost assumptions reject unknown fields, invalid horizon, and excessive round-trip friction', () => {
  const unknown = validateCostContext({ ...makeContext(), broker_secret: 'must-not-be-accepted' });
  const invalidHorizon = validateCostContext(makeContext({ holding_period_bars: 0 }));
  const excessive = validateCostContext(makeContext({ costs: { ...makeContext().costs, commission_bps_per_side: 5_000 } }));
  assert.ok(unknown.some(error => error.code === 'unexpected_property'));
  assert.ok(invalidHorizon.some(error => error.code === 'invalid_horizon'));
  assert.ok(excessive.some(error => error.code === 'unusable_transaction_costs'));
});

console.log('AutoTrader cost-model tests: 4 passed');
