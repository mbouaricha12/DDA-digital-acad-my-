'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {
  SNAPSHOT_VERSION,
  POLICY_VERSION,
  EVALUATION_VERSION,
  evaluateRiskLimits
} = require('../bff/src/autotrader/risk-management');

const asOf = new Date('2026-10-18T18:00:00.000Z');

function makeSnapshot({
  equity = 50_000,
  dailyPnl = -250,
  positions = [
    { position_id: 'sim-position-a', instrument: 'XAUUSD_SPOT', asset_class: 'precious_metal_spot', side: 'long', notional: 10_000, assumed_risk_amount: 100, currency: 'USD' },
    { position_id: 'sim-position-b', instrument: 'EURUSD_SPOT', asset_class: 'fx_spot', side: 'short', notional: 5_000, assumed_risk_amount: 80, currency: 'USD' }
  ],
  patch = {}
} = {}) {
  return {
    contract_version: SNAPSHOT_VERSION,
    data_mode: 'simulation',
    as_of: new Date(asOf.getTime() - 30_000).toISOString(),
    base_currency: 'USD',
    equity,
    positions_complete: true,
    daily_pnl: dailyPnl,
    positions,
    ...patch
  };
}

function makePolicy(patch = {}) {
  return {
    contract_version: POLICY_VERSION,
    policy_id: 'sim-policy-v1',
    max_snapshot_age_ms: 60_000,
    max_gross_exposure_fraction: 0.30,
    max_abs_net_exposure_fraction: 0.10,
    max_instrument_exposure_fraction: 0.20,
    max_asset_class_exposure_fraction: 0.20,
    max_single_position_risk_fraction: 0.002,
    max_total_open_risk_fraction: 0.004,
    max_daily_loss_fraction: 0.01,
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

run('versioned risk contracts parse and define strict required inputs', () => {
  const snapshotSchema = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'contracts', 'autotrader', 'risk-snapshot-v1.schema.json'), 'utf8'));
  const policySchema = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'contracts', 'autotrader', 'risk-policy-v1.schema.json'), 'utf8'));
  assert.equal(snapshotSchema.properties.contract_version.const, SNAPSHOT_VERSION);
  assert.equal(policySchema.properties.contract_version.const, POLICY_VERSION);
  assert.equal(snapshotSchema.properties.data_mode.const, 'simulation');
  assert.ok(snapshotSchema.required.includes('positions_complete'));
  assert.ok(policySchema.required.includes('max_gross_exposure_fraction'));
  assert.ok(policySchema.required.includes('max_snapshot_age_ms'));
});

run('complete simulated portfolio within every explicit limit returns arithmetic checks only', () => {
  const result = evaluateRiskLimits(makeSnapshot(), makePolicy(), { asOf });
  assert.equal(result.contract_version, EVALUATION_VERSION);
  assert.equal(result.status, 'within_configured_limits');
  assert.equal(result.metrics.gross_exposure_amount, 15_000);
  assert.equal(result.metrics.gross_exposure_fraction, 0.3);
  assert.equal(result.metrics.net_exposure_amount, 5_000);
  assert.equal(result.metrics.absolute_net_exposure_fraction, 0.1);
  assert.equal(result.metrics.total_assumed_open_risk_amount, 180);
  assert.equal(result.metrics.daily_loss_amount, 250);
  assert.deepEqual(result.breaches, []);
  assert.equal(result.is_trade_approval, false);
  assert.equal(result.execution_enabled, false);
  assert.equal(result.order_recommendation, null);
});

run('exposure aggregates use gross and net measures with long/short signs', () => {
  const result = evaluateRiskLimits(makeSnapshot(), makePolicy(), { asOf });
  assert.equal(result.metrics.instrument_gross_exposure_fraction.XAUUSD_SPOT, 0.2);
  assert.equal(result.metrics.asset_class_gross_exposure_fraction.precious_metal_spot, 0.2);
  assert.equal(result.metrics.instrument_gross_exposure_fraction.EURUSD_SPOT, 0.1);
  assert.equal(result.metrics.net_exposure_fraction, 0.1);
});

run('same canonical instrument is aggregated before its concentration limit is checked', () => {
  const positions = [
    { position_id: 'sim-a', instrument: 'XAUUSD_SPOT', asset_class: 'precious_metal_spot', side: 'long', notional: 8_000, assumed_risk_amount: 20, currency: 'USD' },
    { position_id: 'sim-b', instrument: 'XAUUSD_SPOT', asset_class: 'precious_metal_spot', side: 'short', notional: 7_000, assumed_risk_amount: 20, currency: 'USD' }
  ];
  const result = evaluateRiskLimits(makeSnapshot({ positions }), makePolicy({
    max_gross_exposure_fraction: 1,
    max_abs_net_exposure_fraction: 1,
    max_instrument_exposure_fraction: 0.25,
    max_asset_class_exposure_fraction: 1
  }), { asOf });
  assert.equal(result.metrics.instrument_gross_exposure_fraction.XAUUSD_SPOT, 0.3);
  assert.ok(result.breaches.some(item => item.metric === 'instrument_gross_exposure_fraction' && item.subject === 'XAUUSD_SPOT'));
});

run('gross and absolute net caps are independently enforced', () => {
  const result = evaluateRiskLimits(makeSnapshot(), makePolicy({
    max_gross_exposure_fraction: 0.25,
    max_abs_net_exposure_fraction: 0.05
  }), { asOf });
  assert.ok(result.breaches.some(item => item.metric === 'gross_exposure_fraction'));
  assert.ok(result.breaches.some(item => item.metric === 'absolute_net_exposure_fraction'));
  assert.equal(result.status, 'limits_exceeded');
});

run('asset-class, per-position assumed-risk, and aggregate assumed-risk caps are enforced', () => {
  const result = evaluateRiskLimits(makeSnapshot(), makePolicy({
    max_asset_class_exposure_fraction: 0.15,
    max_single_position_risk_fraction: 0.001,
    max_total_open_risk_fraction: 0.002
  }), { asOf });
  assert.ok(result.breaches.some(item => item.metric === 'asset_class_gross_exposure_fraction'));
  assert.ok(result.breaches.some(item => item.metric === 'position_assumed_risk_fraction'));
  assert.ok(result.breaches.some(item => item.metric === 'total_assumed_open_risk_fraction'));
});

run('session-to-date daily loss is measured against equity and capped', () => {
  const snapshot = makeSnapshot({ dailyPnl: -1_250 });
  const result = evaluateRiskLimits(snapshot, makePolicy({ max_daily_loss_fraction: 0.01 }), { asOf });
  assert.equal(result.metrics.daily_loss_fraction, 0.025);
  assert.ok(result.breaches.some(item => item.metric === 'daily_loss_fraction'));
});

run('limit equality is allowed and no tolerance silently expands the configured cap', () => {
  const result = evaluateRiskLimits(makeSnapshot(), makePolicy({
    max_gross_exposure_fraction: 0.3,
    max_abs_net_exposure_fraction: 0.1,
    max_instrument_exposure_fraction: 0.2,
    max_asset_class_exposure_fraction: 0.2,
    max_single_position_risk_fraction: 0.002,
    max_total_open_risk_fraction: 0.0036,
    max_daily_loss_fraction: 0.005
  }), { asOf });
  assert.equal(result.status, 'within_configured_limits');
  assert.equal(result.breaches.length, 0);
});

run('stale snapshots fail closed without producing exposure metrics', () => {
  const snapshot = makeSnapshot({ patch: { as_of: new Date(asOf.getTime() - 90_000).toISOString() } });
  const result = evaluateRiskLimits(snapshot, makePolicy(), { asOf });
  assert.equal(result.status, 'stale_snapshot');
  assert.equal(result.metrics, null);
  assert.ok(hasCode(result, 'stale_snapshot'));
  assert.equal(result.execution_enabled, false);
});

run('future, incomplete, or invalidly timestamped snapshots are rejected', () => {
  const future = evaluateRiskLimits(makeSnapshot({ patch: { as_of: new Date(asOf.getTime() + 1).toISOString() } }), makePolicy(), { asOf });
  const incomplete = evaluateRiskLimits(makeSnapshot({ patch: { positions_complete: false } }), makePolicy(), { asOf });
  const badTimestamp = evaluateRiskLimits(makeSnapshot({ patch: { as_of: 'yesterday' } }), makePolicy(), { asOf });
  assert.equal(future.status, 'invalid_input');
  assert.ok(hasCode(future, 'future_snapshot'));
  assert.ok(hasCode(incomplete, 'incomplete_positions'));
  assert.ok(hasCode(badTimestamp, 'invalid_timestamp'));
});

run('non-simulation snapshots and zero assumed risk for an open position are rejected', () => {
  const nonSimulation = evaluateRiskLimits(makeSnapshot({ patch: { data_mode: 'live' } }), makePolicy(), { asOf });
  const zeroRiskPositions = makeSnapshot().positions.map(position => ({ ...position, assumed_risk_amount: 0 }));
  const zeroRisk = evaluateRiskLimits(makeSnapshot({ positions: zeroRiskPositions }), makePolicy(), { asOf });
  assert.ok(hasCode(nonSimulation, 'invalid_data_mode'));
  assert.ok(hasCode(zeroRisk, 'invalid_assumed_risk'));
});

run('policy thresholds are mandatory and invalid, missing, or unknown limits reject the input', () => {
  const missing = makePolicy();
  delete missing.max_gross_exposure_fraction;
  const unknown = makePolicy({ max_position_leverage: 10 });
  const negative = makePolicy({ max_daily_loss_fraction: -0.01 });
  const missingResult = evaluateRiskLimits(makeSnapshot(), missing, { asOf });
  assert.ok(hasCode(missingResult, 'invalid_limit'));
  assert.ok(hasCode(evaluateRiskLimits(makeSnapshot(), unknown, { asOf }), 'unexpected_property'));
  assert.ok(hasCode(evaluateRiskLimits(makeSnapshot(), negative, { asOf }), 'invalid_limit'));
});

run('duplicate position identifiers and mixed valuation currencies are rejected', () => {
  const duplicatePositions = [
    { position_id: 'same', instrument: 'A', asset_class: 'test', side: 'long', notional: 100, assumed_risk_amount: 1, currency: 'USD' },
    { position_id: 'same', instrument: 'B', asset_class: 'test', side: 'long', notional: 100, assumed_risk_amount: 1, currency: 'USD' }
  ];
  const duplicate = evaluateRiskLimits(makeSnapshot({ positions: duplicatePositions }), makePolicy(), { asOf });
  const mismatchPositions = [
    { position_id: 'sim-eur', instrument: 'EURUSD_SPOT', asset_class: 'fx_spot', side: 'long', notional: 1_000, assumed_risk_amount: 10, currency: 'EUR' }
  ];
  const mismatch = evaluateRiskLimits(makeSnapshot({ positions: mismatchPositions }), makePolicy(), { asOf });
  assert.ok(hasCode(duplicate, 'duplicate_position_id'));
  assert.ok(hasCode(mismatch, 'currency_mismatch'));
});

run('empty but complete portfolio yields zero exposures and remains within explicit limits', () => {
  const result = evaluateRiskLimits(makeSnapshot({ positions: [], dailyPnl: 0 }), makePolicy(), { asOf });
  assert.equal(result.status, 'within_configured_limits');
  assert.equal(result.metrics.gross_exposure_fraction, 0);
  assert.equal(result.metrics.total_assumed_open_risk_fraction, 0);
  assert.deepEqual(result.metrics.instrument_gross_exposure_fraction, {});
});

run('invalid options and non-object inputs return structured errors without throwing', () => {
  const invalid = evaluateRiskLimits(null, null, { asOf: 'not-a-date' });
  const badOptions = evaluateRiskLimits(makeSnapshot(), makePolicy(), null);
  assert.equal(invalid.status, 'invalid_input');
  assert.ok(hasCode(invalid, 'invalid_object'));
  assert.ok(hasCode(invalid, 'invalid_timestamp'));
  assert.equal(badOptions.status, 'invalid_input');
  assert.ok(hasCode(badOptions, 'invalid_options'));
});

console.log('AutoTrader risk-management tests: 15 passed');
