'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {
  RECOMMENDATION_CONTRACT_VERSION,
  SIGNAL_RULE_ID,
  generateOrderRecommendation
} = require('../bff/src/autotrader/order-recommendations');

const asOf = new Date('2026-10-18T18:00:00.000Z');
const barCloseAt = new Date(asOf.getTime() - 30_000);

function makeSeries({ direction = 'up', count = 60, dataMode = 'historical', closeAt = barCloseAt } = {}) {
  const bars = [];
  for (let i = 0; i < count; i += 1) {
    let close;
    if (direction === 'up') close = 100 + i + 0.02 * i * i;
    else if (direction === 'down') close = 200 - i - 0.02 * i * i;
    else close = 150;
    bars.push({
      timestamp: new Date(closeAt.getTime() - (count - i - 1) * 60 * 60 * 1000).toISOString(),
      open: close - 0.25,
      high: close + 2,
      low: close - 1,
      close,
      volume: { semantic: 'unavailable', reason: 'not_reported' }
    });
  }
  const sourceKind = dataMode === 'synthetic' ? 'synthetic_fixture' : dataMode === 'snapshot' ? 'provider' : 'historical_import';
  const source = { id: 'simulated-recommendation-fixture', kind: sourceKind };
  if (sourceKind === 'provider') source.provider_symbol = 'XAU/USD';
  return {
    contract_version: 'dda.market-series.v2',
    instrument: { symbol: 'XAUUSD_SPOT', venue: 'SIMULATED:OTC', asset_class: 'precious_metal_spot', currency: 'USD' },
    timeframe: '1h',
    data_mode: dataMode,
    source,
    retrieved_at: asOf.toISOString(),
    bars
  };
}

function makeRiskSnapshot({ asOfTime = barCloseAt, positions, patch = {} } = {}) {
  return {
    contract_version: 'dda.risk-snapshot.v1',
    data_mode: 'simulation',
    as_of: asOfTime.toISOString(),
    base_currency: 'USD',
    equity: 50_000,
    positions_complete: true,
    daily_pnl: -250,
    positions: positions || [
      { position_id: 'sim-position-a', instrument: 'XAUUSD_SPOT', asset_class: 'precious_metal_spot', side: 'long', notional: 10_000, assumed_risk_amount: 100, currency: 'USD' },
      { position_id: 'sim-position-b', instrument: 'EURUSD_SPOT', asset_class: 'fx_spot', side: 'short', notional: 5_000, assumed_risk_amount: 80, currency: 'USD' }
    ],
    ...patch
  };
}

function makeRiskPolicy(patch = {}) {
  return {
    contract_version: 'dda.risk-policy.v1',
    policy_id: 'sim-policy-v1',
    max_snapshot_age_ms: 60_000,
    max_gross_exposure_fraction: 0.40,
    max_abs_net_exposure_fraction: 0.30,
    max_instrument_exposure_fraction: 0.30,
    max_asset_class_exposure_fraction: 0.30,
    max_single_position_risk_fraction: 0.005,
    max_total_open_risk_fraction: 0.02,
    max_daily_loss_fraction: 0.02,
    ...patch
  };
}

function makeCandidate(patch = {}) {
  return {
    notional: 1_000,
    assumed_risk_amount: 50,
    currency: 'USD',
    ...patch
  };
}

function makeInput({ direction = 'up', candidateExposure = makeCandidate(), riskPolicy = makeRiskPolicy(), riskSnapshot = makeRiskSnapshot(), marketSeries = makeSeries(), options = { asOf } } = {}) {
  return { marketSeries, riskSnapshot, riskPolicy, candidateExposure, options };
}

function makeCostContext(patch = {}) {
  return {
    cost_model_id: 'dda.autotrader.cost-model.v1',
    reference: 'explicit test fixture; not verified',
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

function hasCode(result, code) {
  return result.validation_errors.some(error => error.code === code);
}

run('versioned recommendation contract parses and identifies the fixed v1 rule', () => {
  const schema = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'contracts', 'autotrader', 'order-recommendation-v2.schema.json'), 'utf8'));
  assert.equal(schema.properties.contract_version.const, RECOMMENDATION_CONTRACT_VERSION);
  assert.equal(RECOMMENDATION_CONTRACT_VERSION, 'dda.order-recommendation.v2');
  assert.equal(schema.properties.rule_id.const, SIGNAL_RULE_ID);
  assert.equal(schema.properties.execution_enabled.const, false);
  assert.ok(schema.$defs.signalCard.required.includes('proposal_levels'));
  assert.ok(schema.$defs.proposalLevels.properties.reward_to_risk);
  assert.equal(Object.hasOwn(schema.$defs.orderRecommendation.properties.caller_supplied_exposure.properties, 'position_id'), false);
});

run('uptrend yields a proposed-unsubmitted candidate only after projected risk passes', () => {
  const result = generateOrderRecommendation(makeInput());
  assert.equal(result.status, 'candidate_generated');
  assert.equal(result.signal_card.recommendation, 'LONG_CANDIDATE');
  assert.equal(result.signal_card.direction, 'long');
  assert.equal(result.order_recommendation.proposal_status, 'proposed_unsubmitted');
  assert.equal(result.order_recommendation.order_ready, false);
  assert.equal(result.order_recommendation.risk_check_status, 'within_configured_limits');
  assert.equal(result.risk_check.baseline.status, 'within_configured_limits');
  assert.equal(result.risk_check.projected.status, 'within_configured_limits');
  assert.equal(result.order_recommendation.reference_close.executable, false);
  const levels = result.signal_card.proposal_levels;
  assert.equal(levels.status, 'computed');
  assert.equal(levels.method.model_id, 'dda.autotrader.atr-levels.v1');
  assert.equal(levels.method.atr_period, 14);
  assert.equal(levels.entry.price, makeSeries().bars.at(-1).close);
  assert.equal(levels.entry.currency, 'USD');
  assert.equal(levels.entry.executable, false);
  assert.ok(levels.entry.price > levels.stop_loss.price);
  assert.ok(levels.targets[0].price > levels.entry.price);
  assert.ok(Math.abs(levels.reward_to_risk.gross_ratio - 2) < 1e-10);
  assert.equal(levels.reward_to_risk.net_status, 'not_supplied');
  assert.equal(levels.reward_to_risk.net_ratio, null);
  assert.equal(result.signal_card.proposal_levels.executable, false);
  assert.equal(result.order_recommendation.caller_supplied_exposure.notional, 1_000);
  assert.equal(Object.hasOwn(result.order_recommendation.caller_supplied_exposure, 'position_id'), false);
  assert.equal(JSON.stringify(result.risk_check).includes('sim-position-a'), false);
  assert.equal(result.order_recommendation.order_fields.quantity, null);
  assert.equal(result.order_recommendation.order_fields.order_type, null);
  assert.equal(result.order_recommendation.order_fields.stop_loss, null);
  assert.equal(result.order_recommendation.order_fields.target, null);
  assert.equal(result.order_plan, null);
  assert.equal(result.execution_enabled, false);
  assert.equal(result.is_trade_approval, false);
});

run('downtrend yields a short candidate using the exact same configured risk gate', () => {
  const result = generateOrderRecommendation(makeInput({ direction: 'down', marketSeries: makeSeries({ direction: 'down' }) }));
  assert.equal(result.status, 'candidate_generated');
  assert.equal(result.signal_card.recommendation, 'SHORT_CANDIDATE');
  assert.equal(result.order_recommendation.side, 'short');
  assert.equal(result.risk_check.projected.status, 'within_configured_limits');
  const levels = result.signal_card.proposal_levels;
  assert.equal(levels.status, 'computed');
  assert.ok(levels.stop_loss.price > levels.entry.price);
  assert.ok(levels.targets[0].price < levels.entry.price);
  assert.ok(Math.abs(levels.reward_to_risk.gross_ratio - 2) < 1e-10);
});

run('explicit cost model v1 computes auditable net R/R without enabling an order', () => {
  const result = generateOrderRecommendation(makeInput({ options: { asOf, costContext: makeCostContext() } }));
  const rr = result.signal_card.proposal_levels.reward_to_risk;
  assert.equal(result.status, 'candidate_generated');
  assert.equal(rr.net_status, 'computed');
  assert.equal(rr.cost_model_id, 'dda.autotrader.cost-model.v1');
  assert.equal(rr.cost_model_reference, 'explicit test fixture; not verified');
  assert.ok(rr.net_ratio < rr.gross_ratio);
  assert.equal(rr.cost_assumptions.holding_period_bars, 10);
  assert.equal(rr.cost_assumptions.verification_status, 'caller_assumption_not_independently_verified');
  assert.equal(rr.by_target[0].currency, 'USD');
  assert.equal(result.order_recommendation.order_ready, false);
  assert.equal(result.execution_enabled, false);
});

run('missing or currency-incompatible cost context never fabricates a net ratio', () => {
  const absent = generateOrderRecommendation(makeInput());
  const mismatched = generateOrderRecommendation(makeInput({ options: { asOf, costContext: makeCostContext({ currency: 'EUR' }) } }));
  assert.equal(absent.signal_card.proposal_levels.reward_to_risk.net_status, 'not_supplied');
  assert.equal(absent.signal_card.proposal_levels.reward_to_risk.net_ratio, null);
  assert.equal(mismatched.status, 'candidate_generated');
  assert.equal(mismatched.signal_card.proposal_levels.reward_to_risk.net_status, 'not_computable');
  assert.equal(mismatched.signal_card.proposal_levels.reward_to_risk.net_ratio, null);
  assert.ok(mismatched.signal_card.proposal_levels.reward_to_risk.net_validation_errors.some(error => error.code === 'instrument_currency_mismatch'));
});

run('non-positive ATR stop is withheld instead of returning misleading levels or ratios', () => {
  const marketSeries = makeSeries();
  marketSeries.bars.at(-1).high = 100_000;
  marketSeries.bars.at(-1).low = 0.01;
  const result = generateOrderRecommendation(makeInput({ marketSeries }));
  const levels = result.signal_card.proposal_levels;
  assert.equal(result.status, 'candidate_generated');
  assert.equal(levels.status, 'not_computable');
  assert.equal(levels.entry.price, null);
  assert.equal(levels.stop_loss.price, null);
  assert.deepEqual(levels.targets, []);
  assert.equal(levels.reward_to_risk.gross_ratio, null);
  assert.equal(levels.reward_to_risk.net_ratio, null);
  assert.equal(result.order_recommendation.order_ready, false);
});

run('candidate that breaches projected gross exposure is blocked although baseline passes', () => {
  const result = generateOrderRecommendation(makeInput({ riskPolicy: makeRiskPolicy({ max_gross_exposure_fraction: 0.30 }) }));
  assert.equal(result.status, 'blocked');
  assert.equal(result.risk_check.baseline.status, 'within_configured_limits');
  assert.equal(result.risk_check.projected.status, 'limits_exceeded');
  assert.ok(result.risk_check.projected.breaches.some(item => item.metric === 'gross_exposure_fraction'));
  assert.equal(result.order_recommendation, null);
});

run('baseline risk breaches block signal generation before candidate evaluation', () => {
  const result = generateOrderRecommendation(makeInput({ riskPolicy: makeRiskPolicy({ max_gross_exposure_fraction: 0.25 }) }));
  assert.equal(result.status, 'blocked');
  assert.equal(result.risk_check.baseline.status, 'limits_exceeded');
  assert.equal(result.risk_check.projected, null);
  assert.equal(result.order_recommendation, null);
});

run('misaligned technical conditions yield WAIT and do not require candidate exposure', () => {
  const result = generateOrderRecommendation(makeInput({ marketSeries: makeSeries({ direction: 'flat' }), candidateExposure: undefined }));
  assert.equal(result.status, 'no_setup');
  assert.equal(result.signal_card.recommendation, 'WAIT');
  assert.equal(result.signal_card.proposal_levels.status, 'not_defined_by_rule');
  assert.equal(result.signal_card.proposal_levels.reward_to_risk.status, 'not_defined_by_rule');
  assert.equal(result.order_recommendation, null);
  assert.equal(result.order_plan, null);
});

run('insufficient indicator history yields WAIT rather than filling missing metrics', () => {
  const result = generateOrderRecommendation(makeInput({ marketSeries: makeSeries({ count: 30 }), candidateExposure: undefined }));
  assert.equal(result.status, 'insufficient_data');
  assert.equal(result.signal_card.recommendation, 'WAIT');
  assert.equal(result.signal_card.proposal_levels.entry.price, null);
  assert.equal(result.signal_card.proposal_levels.reward_to_risk.gross_ratio, null);
  assert.equal(result.order_recommendation, null);
});

run('provider snapshots and live-like series are rejected by the simulation-only v1 generator', () => {
  const result = generateOrderRecommendation(makeInput({ marketSeries: makeSeries({ dataMode: 'snapshot' }) }));
  assert.equal(result.status, 'blocked');
  assert.ok(hasCode(result, 'unsupported_market_mode'));
  assert.equal(result.order_recommendation, null);
});

run('missing or invalid caller-supplied candidate exposure fails closed', () => {
  const missing = generateOrderRecommendation(makeInput({ candidateExposure: null }));
  const zeroRisk = generateOrderRecommendation(makeInput({ candidateExposure: makeCandidate({ assumed_risk_amount: 0 }) }));
  const mismatch = generateOrderRecommendation(makeInput({ candidateExposure: makeCandidate({ currency: 'EUR' }) }));
  const suppliedIdentifier = generateOrderRecommendation(makeInput({ candidateExposure: makeCandidate({ position_id: 'order-identifier-must-not-be-accepted' }) }));
  assert.equal(missing.status, 'blocked');
  assert.ok(hasCode(missing, 'invalid_object'));
  assert.ok(hasCode(zeroRisk, 'invalid_assumed_risk'));
  assert.ok(hasCode(mismatch, 'currency_mismatch'));
  assert.ok(hasCode(suppliedIdentifier, 'unexpected_property'));
  assert.equal(missing.order_recommendation, null);
});

run('risk snapshot must use simulation mode and not precede the analyzed bar', () => {
  const liveRisk = generateOrderRecommendation(makeInput({ riskSnapshot: makeRiskSnapshot({ patch: { data_mode: 'live' } }) }));
  const staleTimeline = generateOrderRecommendation(makeInput({ riskSnapshot: makeRiskSnapshot({ asOfTime: new Date(asOf.getTime() - 60_000) }) }));
  assert.ok(hasCode(liveRisk, 'unsupported_risk_mode'));
  assert.ok(hasCode(staleTimeline, 'risk_snapshot_precedes_market_data'));
  assert.equal(liveRisk.order_recommendation, null);
  assert.equal(staleTimeline.order_recommendation, null);
});

run('reserved internal candidate alias collision blocks projection without leaking position IDs', () => {
  const positions = [{ position_id: 'dda-order-recommendation-candidate-v1', instrument: 'OTHER', asset_class: 'test', side: 'long', notional: 100, assumed_risk_amount: 1, currency: 'USD' }];
  const result = generateOrderRecommendation(makeInput({ riskSnapshot: makeRiskSnapshot({ positions }) }));
  assert.equal(result.status, 'blocked');
  assert.ok(hasCode(result, 'reserved_candidate_id_collision'));
  assert.equal(result.order_recommendation, null);
});

run('invalid top-level inputs and unknown fields return controlled errors without throwing', () => {
  const invalid = generateOrderRecommendation(null);
  const unknown = generateOrderRecommendation({ ...makeInput(), broker: { enabled: true } });
  assert.equal(invalid.status, 'blocked');
  assert.ok(hasCode(invalid, 'invalid_object'));
  assert.equal(unknown.status, 'blocked');
  assert.ok(hasCode(unknown, 'unexpected_property'));
  assert.equal(unknown.execution_enabled, false);
});

console.log('AutoTrader order-recommendations tests: 15 passed');
