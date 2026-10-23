'use strict';

const SNAPSHOT_VERSION = 'dda.risk-snapshot.v1';
const POLICY_VERSION = 'dda.risk-policy.v1';
const EVALUATION_VERSION = 'dda.risk-evaluation.v1';
const MAX_POSITIONS = 10_000;
const SNAPSHOT_KEYS = new Set(['contract_version', 'data_mode', 'as_of', 'base_currency', 'equity', 'positions_complete', 'daily_pnl', 'positions']);
const POSITION_KEYS = new Set(['position_id', 'instrument', 'asset_class', 'side', 'notional', 'assumed_risk_amount', 'currency']);
const POLICY_KEYS = new Set([
  'contract_version', 'policy_id', 'max_snapshot_age_ms', 'max_gross_exposure_fraction',
  'max_abs_net_exposure_fraction', 'max_instrument_exposure_fraction',
  'max_asset_class_exposure_fraction', 'max_single_position_risk_fraction',
  'max_total_open_risk_fraction', 'max_daily_loss_fraction'
]);
const FRACTION_LIMITS = [
  'max_gross_exposure_fraction',
  'max_abs_net_exposure_fraction',
  'max_instrument_exposure_fraction',
  'max_asset_class_exposure_fraction',
  'max_single_position_risk_fraction',
  'max_total_open_risk_fraction',
  'max_daily_loss_fraction'
];

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isUtcTimestamp(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(value)) return false;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) && new Date(parsed).toISOString() === value;
}

function add(errors, path, code, message) {
  errors.push({ path, code, message });
}

function checkKeys(value, allowed, path, errors) {
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) add(errors, `${path}.${key}`, 'unexpected_property', 'Property is not part of this risk contract version.');
  }
}

function validText(value, maxLength) {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= maxLength;
}

function validateSnapshot(snapshot, evaluationTime, errors) {
  if (!isRecord(snapshot)) {
    add(errors, 'snapshot', 'invalid_object', 'Risk snapshot must be a JSON object.');
    return;
  }
  checkKeys(snapshot, SNAPSHOT_KEYS, 'snapshot', errors);
  if (snapshot.contract_version !== SNAPSHOT_VERSION) add(errors, 'snapshot.contract_version', 'unsupported_contract', `Expected ${SNAPSHOT_VERSION}.`);
  if (snapshot.data_mode !== 'simulation') add(errors, 'snapshot.data_mode', 'invalid_data_mode', 'Risk snapshot v1 accepts simulation data only.');
  if (!isUtcTimestamp(snapshot.as_of)) {
    add(errors, 'snapshot.as_of', 'invalid_timestamp', 'as_of must be canonical UTC ISO with milliseconds.');
  } else if (Number.isFinite(evaluationTime) && Date.parse(snapshot.as_of) > evaluationTime) {
    add(errors, 'snapshot.as_of', 'future_snapshot', 'Snapshot as_of cannot be after the evaluation time.');
  }
  if (typeof snapshot.base_currency !== 'string' || !/^[A-Z]{3}$/.test(snapshot.base_currency)) {
    add(errors, 'snapshot.base_currency', 'invalid_currency', 'base_currency must be a three-letter uppercase currency code.');
  }
  if (typeof snapshot.equity !== 'number' || !Number.isFinite(snapshot.equity) || snapshot.equity <= 0) {
    add(errors, 'snapshot.equity', 'invalid_equity', 'equity must be a finite positive amount in base_currency.');
  }
  if (snapshot.positions_complete !== true) add(errors, 'snapshot.positions_complete', 'incomplete_positions', 'positions_complete must be true; partial exposure snapshots fail closed.');
  if (typeof snapshot.daily_pnl !== 'number' || !Number.isFinite(snapshot.daily_pnl)) {
    add(errors, 'snapshot.daily_pnl', 'invalid_daily_pnl', 'daily_pnl must be a finite session-to-date amount in base_currency.');
  }
  if (!Array.isArray(snapshot.positions) || snapshot.positions.length > MAX_POSITIONS) {
    add(errors, 'snapshot.positions', 'invalid_positions', `positions must be an array with at most ${MAX_POSITIONS} entries.`);
    return;
  }

  const seenIds = new Set();
  for (let i = 0; i < snapshot.positions.length; i += 1) {
    const position = snapshot.positions[i];
    const path = `snapshot.positions[${i}]`;
    if (!isRecord(position)) {
      add(errors, path, 'invalid_position', 'Each position must be an object.');
      continue;
    }
    checkKeys(position, POSITION_KEYS, path, errors);
    if (!validText(position.position_id, 64)) add(errors, `${path}.position_id`, 'invalid_position_id', 'position_id must be a non-empty local identifier of at most 64 characters.');
    else if (seenIds.has(position.position_id)) add(errors, `${path}.position_id`, 'duplicate_position_id', 'position_id values must be unique within the snapshot.');
    else seenIds.add(position.position_id);
    if (!validText(position.instrument, 64)) add(errors, `${path}.instrument`, 'invalid_instrument', 'instrument must be a non-empty canonical identifier of at most 64 characters.');
    if (!validText(position.asset_class, 32)) add(errors, `${path}.asset_class`, 'invalid_asset_class', 'asset_class must be a non-empty identifier of at most 32 characters.');
    if (!['long', 'short'].includes(position.side)) add(errors, `${path}.side`, 'invalid_side', 'side must be long or short.');
    if (typeof position.notional !== 'number' || !Number.isFinite(position.notional) || position.notional <= 0) {
      add(errors, `${path}.notional`, 'invalid_notional', 'notional must be a finite positive amount in base_currency.');
    }
    if (typeof position.assumed_risk_amount !== 'number' || !Number.isFinite(position.assumed_risk_amount) || position.assumed_risk_amount <= 0) {
      add(errors, `${path}.assumed_risk_amount`, 'invalid_assumed_risk', 'assumed_risk_amount must be a finite positive amount in base_currency for every open position.');
    }
    if (position.currency !== snapshot.base_currency) add(errors, `${path}.currency`, 'currency_mismatch', 'Position notionals and assumed risk amounts must already be expressed in snapshot.base_currency; FX conversion is not performed.');
  }
}

function validatePolicy(policy, errors) {
  if (!isRecord(policy)) {
    add(errors, 'policy', 'invalid_object', 'A complete explicit risk policy is required.');
    return;
  }
  checkKeys(policy, POLICY_KEYS, 'policy', errors);
  if (policy.contract_version !== POLICY_VERSION) add(errors, 'policy.contract_version', 'unsupported_contract', `Expected ${POLICY_VERSION}.`);
  if (!validText(policy.policy_id, 100)) add(errors, 'policy.policy_id', 'invalid_policy_id', 'policy_id must be a non-empty identifier of at most 100 characters.');
  if (!Number.isSafeInteger(policy.max_snapshot_age_ms) || policy.max_snapshot_age_ms < 1 || policy.max_snapshot_age_ms > 8_640_000_000_000_000) {
    add(errors, 'policy.max_snapshot_age_ms', 'invalid_snapshot_age_limit', 'max_snapshot_age_ms must be a positive safe integer within the JavaScript Date range; no default is applied.');
  }
  for (const key of FRACTION_LIMITS) {
    if (typeof policy[key] !== 'number' || !Number.isFinite(policy[key]) || policy[key] < 0) {
      add(errors, `policy.${key}`, 'invalid_limit', `${key} must be a finite non-negative fraction of equity; no default is applied.`);
    }
  }
}

function failureResult(base, status, errors) {
  return {
    ...base,
    status,
    metrics: null,
    checks: [],
    breaches: [],
    validation_errors: errors
  };
}

function evaluateRiskLimits(snapshot, policy, options = {}) {
  const errors = [];
  if (!isRecord(options)) {
    add(errors, 'options', 'invalid_options', 'options must be an object.');
  } else {
    checkKeys(options, new Set(['asOf']), 'options', errors);
  }
  const asOfInput = isRecord(options) && options.asOf !== undefined ? options.asOf : new Date();
  const evaluationDate = new Date(asOfInput);
  if (!Number.isFinite(evaluationDate.getTime())) add(errors, 'options.asOf', 'invalid_timestamp', 'asOf must be a valid evaluation timestamp.');
  const evaluationTime = evaluationDate.getTime();
  validateSnapshot(snapshot, evaluationTime, errors);
  validatePolicy(policy, errors);

  const base = {
    contract_version: EVALUATION_VERSION,
    evaluator_id: 'dda.exposure-risk.v1',
    evaluation_type: 'hypothetical_exposure_limits',
    decision_scope: 'configured_limits_only',
    is_trade_approval: false,
    data_mode: isRecord(snapshot) && typeof snapshot.data_mode === 'string' ? snapshot.data_mode : 'unknown',
    snapshot_as_of: isRecord(snapshot) && isUtcTimestamp(snapshot.as_of) ? snapshot.as_of : null,
    evaluation_as_of: Number.isFinite(evaluationTime) ? evaluationDate.toISOString() : null,
    policy_id: isRecord(policy) && typeof policy.policy_id === 'string' ? policy.policy_id : null,
    base_currency: isRecord(snapshot) && typeof snapshot.base_currency === 'string' ? snapshot.base_currency : null,
    execution_enabled: false,
    order_recommendation: null
  };

  if (errors.length > 0) return failureResult(base, 'invalid_input', errors);

  const snapshotAgeMs = evaluationTime - Date.parse(snapshot.as_of);
  if (snapshotAgeMs > policy.max_snapshot_age_ms) {
    return failureResult(base, 'stale_snapshot', [{
      path: 'snapshot.as_of',
      code: 'stale_snapshot',
      message: `Snapshot age ${snapshotAgeMs} ms exceeds the configured max_snapshot_age_ms.`
    }]);
  }

  const positions = [...snapshot.positions].sort((a, b) => a.position_id.localeCompare(b.position_id));
  let grossExposure = 0;
  let netExposure = 0;
  let totalOpenRisk = 0;
  let largestPositionRisk = 0;
  const instrumentGross = new Map();
  const assetClassGross = new Map();

  for (const position of positions) {
    const signedNotional = position.side === 'long' ? position.notional : -position.notional;
    grossExposure += position.notional;
    netExposure += signedNotional;
    totalOpenRisk += position.assumed_risk_amount;
    largestPositionRisk = Math.max(largestPositionRisk, position.assumed_risk_amount);
    instrumentGross.set(position.instrument, (instrumentGross.get(position.instrument) || 0) + position.notional);
    assetClassGross.set(position.asset_class, (assetClassGross.get(position.asset_class) || 0) + position.notional);
  }

  const derivedAmounts = [grossExposure, netExposure, totalOpenRisk, largestPositionRisk, ...instrumentGross.values(), ...assetClassGross.values()];
  if (derivedAmounts.some(value => !Number.isFinite(value))) {
    return failureResult(base, 'invalid_input', [{ path: 'snapshot.positions', code: 'aggregate_overflow', message: 'Aggregated exposure or assumed-risk amounts overflowed finite numeric range.' }]);
  }

  const equity = snapshot.equity;
  const metrics = {
    gross_exposure_amount: grossExposure,
    gross_exposure_fraction: grossExposure / equity,
    net_exposure_amount: netExposure,
    net_exposure_fraction: netExposure / equity,
    absolute_net_exposure_fraction: Math.abs(netExposure) / equity,
    instrument_gross_exposure_fraction: Object.fromEntries([...instrumentGross.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => [key, value / equity])),
    asset_class_gross_exposure_fraction: Object.fromEntries([...assetClassGross.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => [key, value / equity])),
    largest_position_assumed_risk_fraction: largestPositionRisk / equity,
    total_assumed_open_risk_amount: totalOpenRisk,
    total_assumed_open_risk_fraction: totalOpenRisk / equity,
    daily_loss_amount: Math.max(0, -snapshot.daily_pnl),
    daily_loss_fraction: Math.max(0, -snapshot.daily_pnl) / equity,
    snapshot_age_ms: snapshotAgeMs
  };

  const metricFractions = [
    metrics.gross_exposure_fraction, metrics.net_exposure_fraction,
    metrics.absolute_net_exposure_fraction, metrics.largest_position_assumed_risk_fraction,
    metrics.total_assumed_open_risk_fraction, metrics.daily_loss_fraction,
    ...Object.values(metrics.instrument_gross_exposure_fraction),
    ...Object.values(metrics.asset_class_gross_exposure_fraction)
  ];
  if (metricFractions.some(value => !Number.isFinite(value))) {
    return failureResult(base, 'invalid_input', [{ path: 'snapshot.equity', code: 'computed_fraction_overflow', message: 'A calculated fraction of equity is outside the finite numeric range.' }]);
  }

  const checks = [];
  function check(metricName, scope, subject, observed, limit, unit = 'fraction_of_equity') {
    checks.push({
      metric: metricName,
      scope,
      subject,
      observed,
      limit,
      unit,
      status: observed > limit ? 'limit_exceeded' : 'within_limit'
    });
  }
  check('gross_exposure_fraction', 'portfolio', null, metrics.gross_exposure_fraction, policy.max_gross_exposure_fraction);
  check('absolute_net_exposure_fraction', 'portfolio', null, metrics.absolute_net_exposure_fraction, policy.max_abs_net_exposure_fraction);
  for (const [instrument, observed] of Object.entries(metrics.instrument_gross_exposure_fraction)) {
    check('instrument_gross_exposure_fraction', 'instrument', instrument, observed, policy.max_instrument_exposure_fraction);
  }
  for (const [assetClass, observed] of Object.entries(metrics.asset_class_gross_exposure_fraction)) {
    check('asset_class_gross_exposure_fraction', 'asset_class', assetClass, observed, policy.max_asset_class_exposure_fraction);
  }
  for (const position of positions) {
    check('position_assumed_risk_fraction', 'position', position.position_id, position.assumed_risk_amount / equity, policy.max_single_position_risk_fraction);
  }
  check('total_assumed_open_risk_fraction', 'portfolio', null, metrics.total_assumed_open_risk_fraction, policy.max_total_open_risk_fraction);
  check('daily_loss_fraction', 'portfolio', null, metrics.daily_loss_fraction, policy.max_daily_loss_fraction);

  const breaches = checks.filter(item => item.status === 'limit_exceeded');
  return {
    ...base,
    status: breaches.length === 0 ? 'within_configured_limits' : 'limits_exceeded',
    metrics,
    checks,
    breaches,
    validation_errors: [],
    limitations: [
      'This is a hypothetical arithmetic check against the supplied policy only; within-limit status is not a trade approval or guarantee of safety.',
      'Notional and assumed-risk amounts must already be expressed in base_currency; this module performs no FX conversion, contract-multiplier lookup, margin calculation, or stop-loss risk calculation.',
      'assumed_risk_amount is an input assumption, not a guaranteed maximum loss; gaps, liquidity, leverage, basis, fees, and model error can increase losses.',
      'The caller attests that positions_complete is true and supplies session-to-date daily_pnl; the module does not verify account or broker data.',
      'Instrument exposure aggregates only exact canonical instrument identifiers; aliases and correlated exposures require an upstream approved mapping.',
      'No signal, position size, order, broker connection, or execution instruction is generated.'
    ]
  };
}

module.exports = {
  SNAPSHOT_VERSION,
  POLICY_VERSION,
  EVALUATION_VERSION,
  MAX_POSITIONS,
  evaluateRiskLimits
};
