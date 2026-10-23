'use strict';

const { analyzeMarketSeriesV2, ANALYSIS_CONTRACT_VERSION } = require('./market-analysis-v2');
const { evaluateRiskLimits } = require('./risk-management');
const { SIGNAL_RULE_ID, REQUIRED_TREND_METRICS, classifyTrend } = require('./trend-rule-v1');
const { calculateNetRewardRisk } = require('./cost-model-v1');

const RECOMMENDATION_CONTRACT_VERSION = 'dda.order-recommendation.v2';
const LEVELS_CONTRACT_VERSION = 'dda.signal-levels.v1';
const LEVELS_MODEL_ID = 'dda.autotrader.atr-levels.v1';
const ATR_PERIOD = 14;
const STOP_ATR_MULTIPLE = 1.5;
const TARGET_R_MULTIPLE = 2;
const CANDIDATE_KEYS = new Set(['notional', 'assumed_risk_amount', 'currency']);
const INTERNAL_CANDIDATE_POSITION_ID = 'dda-order-recommendation-candidate-v1';
const EVIDENCE_KEYS = REQUIRED_TREND_METRICS;
const LIMITATIONS = [
  'This v1 rule is a transparent technical screening heuristic, not a validated or profitable strategy and not a forecast.',
  'Only historical or synthetic market series and simulation-mode risk snapshots are accepted; provider snapshots and live data are rejected.',
  'The caller supplies candidate notional and assumed risk; portfolio risk checks do not derive a maximum loss from the ATR stop, and no stop is guaranteed to cap loss.',
  'A separate, unvalidated ATR level heuristic references the last completed close, places a theoretical stop at 1.5 × Wilder ATR(14), and one target at 2R; it is not part of the directional trend rule.',
  'Net reward-to-risk is calculated only when the caller supplies a complete, currency-compatible, unverified cost/contract/horizon context; otherwise net_ratio remains null.',
  'A historical close is a reference only, not an executable quote. No order type, expiry, or time-in-force is generated.',
  'Passing configured exposure limits is not trade approval and does not guarantee safety; correlations, gaps, liquidity, market sessions, contract specifications, and data quality are not assessed.'
];

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function validationError(path, code, message) {
  return { path, code, message };
}

function notDefinedProposalLevels(currency = null) {
  const reason = 'No directional candidate exists; the ATR level heuristic is not applied.';
  const level = {
    status: 'not_defined_by_rule',
    price: null,
    currency,
    timestamp: null,
    basis: 'not_defined',
    method_id: null,
    executable: false,
    reason
  };
  return {
    contract_version: LEVELS_CONTRACT_VERSION,
    status: 'not_defined_by_rule',
    method: null,
    entry: { ...level },
    stop_loss: { ...level },
    targets: [],
    reward_to_risk: {
      status: 'not_defined_by_rule',
      unit: 'ratio',
      gross_ratio: null,
      net_ratio: null,
      method: null,
      cost_model_id: null,
      net_status: 'not_defined_by_rule',
      net_reason: 'No candidate levels exist.',
      cost_model_reference: null,
      cost_assumptions: null,
      net_validation_errors: [],
      by_target: [],
      reason: 'Reward-to-risk is undefined because no candidate levels exist.'
    },
    executable: false,
    reason
  };
}

function riskSummary(evaluation) {
  if (!evaluation) return null;
  return {
    status: evaluation.status,
    policy_id: evaluation.policy_id,
    snapshot_as_of: evaluation.snapshot_as_of,
    breach_count: Array.isArray(evaluation.breaches) ? evaluation.breaches.length : 0,
    breaches: (evaluation.breaches || []).map(item => ({
      metric: item.metric,
      scope: item.scope,
      observed: item.observed,
      limit: item.limit,
      unit: item.unit
    })),
    validation_errors: (evaluation.validation_errors || []).map(item => ({ path: item.path, code: item.code }))
  };
}

function blankSignal(status, instrument = null, dataCutoff = null, reason = null) {
  return {
    status,
    recommendation: 'WAIT',
    direction: 'none',
    rule_id: SIGNAL_RULE_ID,
    instrument,
    data_cutoff: dataCutoff,
    market_data: null,
    entry_conditions: [],
    invalidation_conditions: [],
    proposal_levels: notDefinedProposalLevels(),
    stop_logic: { status: 'not_computed', reason: 'No stop model is defined by this module.' },
    target_logic: { status: 'not_computed', reason: 'No target model is defined by this module.' },
    reward_to_risk: null,
    confidence: { status: 'not_scored', value: null },
    supporting_evidence: [],
    reason
  };
}

function summarizeEvidence(metrics) {
  return EVIDENCE_KEYS.map(name => {
    const item = metrics[name];
    return {
      metric: name,
      value: item.value,
      unit: item.unit,
      window_end: item.window?.end || null,
      method: item.method
    };
  });
}

function marketDataProvenance(series) {
  return {
    data_mode: series.data_mode,
    source_id: series.source.id,
    source_kind: series.source.kind,
    timeframe: series.timeframe
  };
}

function notComputableProposalLevels(currency, timestamp, reason) {
  const level = {
    status: 'not_computable', price: null, currency: currency || null,
    timestamp: timestamp || null, basis: 'atr_model', method_id: LEVELS_MODEL_ID,
    executable: false, reason
  };
  const rewardToRisk = {
    status: 'not_computable', unit: 'ratio', gross_ratio: null, net_ratio: null,
    method: LEVELS_MODEL_ID, cost_model_id: null, net_status: 'not_computable',
    net_reason: 'Net ratio is unavailable because ATR levels could not be calculated.',
    cost_model_reference: null, cost_assumptions: null, net_validation_errors: [],
    by_target: [], reason: 'Gross and net reward-to-risk are unavailable because positive, correctly ordered ATR levels could not be calculated.'
  };
  return {
    contract_version: LEVELS_CONTRACT_VERSION, status: 'not_computable', method: null,
    entry: { ...level }, stop_loss: { ...level }, targets: [], reward_to_risk: rewardToRisk,
    executable: false, reason
  };
}

function buildAtrProposalLevels(direction, series, analysis, candidateExposure, costContext) {
  const latestBar = series.bars.at(-1);
  const currency = series.instrument.currency;
  const timestamp = latestBar?.timestamp || analysis.data_as_of || null;
  const atrMetric = analysis.metrics?.volatility_atr_14;
  const atr = atrMetric?.status === 'computed' ? atrMetric.value : null;
  if (typeof atr !== 'number' || !Number.isFinite(atr) || atr <= 0 || !latestBar || !Number.isFinite(latestBar.close) || latestBar.close <= 0) {
    return notComputableProposalLevels(currency, timestamp, 'Wilder ATR(14) or the last completed-bar close is unavailable or non-positive; no level is invented.');
  }

  const entry = latestBar.close;
  const riskDistance = STOP_ATR_MULTIPLE * atr;
  const stop = direction === 'long' ? entry - riskDistance : entry + riskDistance;
  const target = direction === 'long' ? entry + TARGET_R_MULTIPLE * riskDistance : entry - TARGET_R_MULTIPLE * riskDistance;
  if (![entry, stop, target, riskDistance].every(Number.isFinite) || stop <= 0 || target <= 0 || riskDistance <= 0) {
    return notComputableProposalLevels(currency, timestamp, 'ATR-based stop or target is non-finite or not a positive price; levels and ratios are withheld.');
  }
  const correctlyOrdered = direction === 'long' ? target > entry && entry > stop : stop > entry && entry > target;
  if (!correctlyOrdered) return notComputableProposalLevels(currency, timestamp, 'ATR levels do not satisfy the required side-specific price ordering.');

  const grossRatio = Math.abs(target - entry) / Math.abs(entry - stop);
  if (!Number.isFinite(grossRatio) || grossRatio <= 0) return notComputableProposalLevels(currency, timestamp, 'Gross reward-to-risk denominator is not positive or finite.');
  const net = calculateNetRewardRisk({
    side: direction, entryPrice: entry, stopPrice: stop, targetPrice: target,
    notional: candidateExposure?.notional, instrumentCurrency: currency,
    exposureCurrency: candidateExposure?.currency, costContext
  });
  const targetId = 'target_1';
  const rewardToRisk = {
    status: 'computed', unit: 'ratio', gross_ratio: grossRatio,
    net_ratio: net.status === 'computed' ? net.net_ratio : null,
    method: `${LEVELS_MODEL_ID}: gross reward/risk from one 2R target and a 1.5 × ATR(14) stop.`,
    cost_model_id: net.model_id, net_status: net.status, net_reason: net.reason,
    cost_model_reference: net.reference, cost_assumptions: net.assumptions,
    net_validation_errors: net.validation_errors,
    by_target: [{
      target_id: targetId, status: 'computed', gross_ratio: grossRatio,
      net_ratio: net.status === 'computed' ? net.net_ratio : null,
      net_reward_amount: net.breakdown?.net_reward_amount ?? null,
      net_risk_amount: net.breakdown?.net_risk_amount ?? null,
      currency: net.breakdown?.currency ?? null
    }],
    reason: 'Gross ratio is theoretical and derived from the ATR-level formula. Net ratio, if present, is a scenario under explicit caller-supplied costs and is not a forecast.'
  };
  const model = {
    model_id: LEVELS_MODEL_ID, atr_period: ATR_PERIOD, atr_method: atrMetric.method,
    atr_value: atr, atr_unit: atrMetric.unit, timeframe: series.timeframe,
    stop_atr_multiple: STOP_ATR_MULTIPLE, target_r_multiple: TARGET_R_MULTIPLE,
    entry_basis: 'last_completed_bar_close_reference'
  };
  const entryLevel = {
    status: 'computed', price: entry, currency, timestamp,
    basis: 'completed_bar_close_reference', method_id: LEVELS_MODEL_ID,
    executable: false, reason: 'Last completed-bar close used as a theoretical reference only; not an executable quote.'
  };
  const stopLevel = {
    status: 'computed', price: stop, currency, timestamp,
    basis: 'atr_model', method_id: LEVELS_MODEL_ID,
    executable: false, reason: `Theoretical stop at ${STOP_ATR_MULTIPLE} × Wilder ATR(${ATR_PERIOD}) from the reference close; not a guaranteed maximum loss.`
  };
  const targetLevel = {
    target_id: targetId, status: 'computed', price: target, currency, timestamp,
    basis: 'atr_model', method_id: LEVELS_MODEL_ID,
    executable: false, reason: `One theoretical target at ${TARGET_R_MULTIPLE}R from the ATR stop distance; not a forecast or instruction.`
  };
  return {
    contract_version: LEVELS_CONTRACT_VERSION, status: 'computed', method: model,
    entry: entryLevel, stop_loss: stopLevel, targets: [targetLevel],
    reward_to_risk: rewardToRisk, executable: false,
    reason: 'Theoretical ATR levels from supplied historical or synthetic completed bars. The level model is separate from the trend rule and has not been validated as a profitable strategy.'
  };
}

function readTrendValues(analysis) {
  const metrics = analysis.metrics || {};
  for (const name of REQUIRED_TREND_METRICS) {
    const item = metrics[name];
    if (!item || item.status !== 'computed' || typeof item.value !== 'number' || !Number.isFinite(item.value)) {
      return { ready: false, missing: name };
    }
  }
  return {
    ready: true,
    metrics,
    values: Object.fromEntries(REQUIRED_TREND_METRICS.map(name => [name, metrics[name].value]))
  };
}

function signalCard(direction, series, analysis, metrics, candidateExposure = null, costContext = null) {
  const isLong = direction === 'long';
  const instrument = series.instrument.symbol;
  const dataCutoff = analysis.data_as_of;
  const conditions = isLong
    ? [
        'Last close is above SMA(20).',
        'SMA(20) is above SMA(50).',
        'EMA(20) is above EMA(50).',
        'MACD(12,26) is above zero.',
        'MACD histogram is above zero.'
      ]
    : [
        'Last close is below SMA(20).',
        'SMA(20) is below SMA(50).',
        'EMA(20) is below EMA(50).',
        'MACD(12,26) is below zero.',
        'MACD histogram is below zero.'
      ];
  const invalidation = isLong
    ? [
        'A later completed bar closes at or below SMA(20).',
        'SMA(20) is at or below SMA(50), EMA(20) is at or below EMA(50), or MACD histogram is at or below zero.'
      ]
    : [
        'A later completed bar closes at or above SMA(20).',
        'SMA(20) is at or above SMA(50), EMA(20) is at or above EMA(50), or MACD histogram is at or above zero.'
      ];
  const proposalLevels = buildAtrProposalLevels(direction, series, analysis, candidateExposure, costContext);
  const levelsComputed = proposalLevels.status === 'computed';
  return {
    status: `${direction}_candidate`,
    recommendation: direction === 'long' ? 'LONG_CANDIDATE' : 'SHORT_CANDIDATE',
    direction,
    rule_id: SIGNAL_RULE_ID,
    instrument,
    data_cutoff: dataCutoff,
    market_data: marketDataProvenance(series),
    entry_conditions: conditions,
    invalidation_conditions: invalidation,
    proposal_levels: proposalLevels,
    stop_logic: { status: levelsComputed ? 'computed' : 'not_computed', reason: levelsComputed ? `Theoretical ${STOP_ATR_MULTIPLE} × ATR(${ATR_PERIOD}) stop; not a guaranteed maximum loss or order instruction.` : proposalLevels.reason },
    target_logic: { status: levelsComputed ? 'computed' : 'not_computed', reason: levelsComputed ? `One theoretical ${TARGET_R_MULTIPLE}R target; not an order instruction.` : proposalLevels.reason },
    reward_to_risk: proposalLevels.reward_to_risk,
    confidence: { status: 'not_scored', value: null },
    supporting_evidence: summarizeEvidence(metrics),
    reason: 'All v1 trend-confirmation conditions are met on the supplied completed-bar series; the separate ATR levels are hypothetical references only and are not validated signals.'
  };
}

function validateCandidate(candidate, baseCurrency) {
  const errors = [];
  if (!isRecord(candidate)) {
    return [validationError('candidate_exposure', 'invalid_object', 'A caller-supplied hypothetical candidate exposure is required when a trend setup is present.')];
  }
  for (const key of Object.keys(candidate)) {
    if (!CANDIDATE_KEYS.has(key)) errors.push(validationError(`candidate_exposure.${key}`, 'unexpected_property', 'Candidate exposure contains an unsupported property.'));
  }
  if (typeof candidate.notional !== 'number' || !Number.isFinite(candidate.notional) || candidate.notional <= 0) {
    errors.push(validationError('candidate_exposure.notional', 'invalid_notional', 'Caller-supplied candidate notional must be finite and positive.'));
  }
  if (typeof candidate.assumed_risk_amount !== 'number' || !Number.isFinite(candidate.assumed_risk_amount) || candidate.assumed_risk_amount <= 0) {
    errors.push(validationError('candidate_exposure.assumed_risk_amount', 'invalid_assumed_risk', 'Caller-supplied assumed risk must be finite and positive; it is not a guaranteed maximum loss.'));
  }
  if (candidate.currency !== baseCurrency) errors.push(validationError('candidate_exposure.currency', 'currency_mismatch', 'Candidate exposure must already be in the simulation snapshot base currency; no FX conversion is performed.'));
  return errors;
}

function baseResult(status, signal, errors = [], riskCheck = { baseline: null, projected: null }) {
  return {
    contract_version: RECOMMENDATION_CONTRACT_VERSION,
    mode: 'analysis',
    status,
    rule_id: SIGNAL_RULE_ID,
    analysis_contract_version: ANALYSIS_CONTRACT_VERSION,
    signal_card: signal,
    order_recommendation: null,
    order_plan: null,
    plan_checks: [],
    risk_check: riskCheck,
    simulation: { data_mode: 'simulation', status: 'not_run' },
    manual_execution_notice: 'This module cannot submit or execute a transaction. Any candidate remains unsubmitted; the user may independently review, change, ignore, or act on it outside this module.',
    transaction_request_disposition: null,
    execution_enabled: false,
    is_trade_approval: false,
    validation_errors: errors,
    limitations: LIMITATIONS
  };
}

function generateOrderRecommendation(input = {}) {
  if (!isRecord(input)) {
    return baseResult('blocked', blankSignal('blocked', null, null, 'Input must be an object.'), [validationError('input', 'invalid_object', 'Recommendation input must be an object.')]);
  }
  const inputErrors = [];
  const allowedInputKeys = new Set(['marketSeries', 'riskSnapshot', 'riskPolicy', 'candidateExposure', 'options']);
  for (const key of Object.keys(input)) {
    if (!allowedInputKeys.has(key)) inputErrors.push(validationError(key, 'unexpected_property', 'Input contains an unsupported property.'));
  }
  const { marketSeries, riskSnapshot, riskPolicy, candidateExposure, options = {} } = input;
  const costContext = isRecord(options) ? options.costContext : null;
  if (!isRecord(options)) {
    inputErrors.push(validationError('options', 'invalid_options', 'options must be an object.'));
  } else {
    for (const key of Object.keys(options)) {
      if (!['asOf', 'costContext'].includes(key)) inputErrors.push(validationError(`options.${key}`, 'unexpected_property', 'Only asOf and costContext are supported.'));
    }
  }
  const asOfInput = isRecord(options) && options.asOf !== undefined ? options.asOf : new Date();
  const asOf = new Date(asOfInput);
  if (!Number.isFinite(asOf.getTime())) inputErrors.push(validationError('options.asOf', 'invalid_timestamp', 'asOf must be a valid evaluation timestamp.'));

  if (!isRecord(marketSeries) || !['historical', 'synthetic'].includes(marketSeries.data_mode)) {
    inputErrors.push(validationError('marketSeries.data_mode', 'unsupported_market_mode', 'Recommendations v1 accepts historical or synthetic series only; provider snapshots and live data are not supported.'));
  }
  if (inputErrors.length > 0) return baseResult('blocked', blankSignal('blocked', marketSeries?.instrument?.symbol || null, null, 'Input validation failed.'), inputErrors);

  const analysis = analyzeMarketSeriesV2(marketSeries, { asOf });
  if (analysis.status !== 'analysis_complete') {
    return baseResult('blocked', blankSignal('blocked', marketSeries.instrument?.symbol || null, analysis.data_as_of, `Market analysis status is ${analysis.status}.`), analysis.validation_errors || []);
  }

  const latestBar = marketSeries.bars.at(-1);
  const analysisReady = readTrendValues(analysis);
  const baselineEvaluation = evaluateRiskLimits(riskSnapshot, riskPolicy, { asOf });
  const baselineSummary = riskSummary(baselineEvaluation);
  const riskCheck = { baseline: baselineSummary, projected: null };

  if (riskSnapshot?.data_mode !== 'simulation') {
    const error = validationError('riskSnapshot.data_mode', 'unsupported_risk_mode', 'Order recommendations v1 accept simulation-mode risk snapshots only.');
    return baseResult('blocked', blankSignal('blocked', marketSeries.instrument.symbol, analysis.data_as_of, error.message), [error], riskCheck);
  }
  if (!riskSnapshot || typeof riskSnapshot.as_of !== 'string' || Date.parse(riskSnapshot.as_of) < Date.parse(latestBar.timestamp)) {
    const error = validationError('riskSnapshot.as_of', 'risk_snapshot_precedes_market_data', 'The simulation risk snapshot must be timestamped at or after the latest analyzed bar.');
    return baseResult('blocked', blankSignal('blocked', marketSeries.instrument.symbol, analysis.data_as_of, error.message), [error], riskCheck);
  }
  if (baselineEvaluation.status !== 'within_configured_limits') {
    return baseResult('blocked', blankSignal('blocked', marketSeries.instrument.symbol, analysis.data_as_of, 'Baseline simulation risk is invalid, stale, or outside configured limits; no candidate is generated.'), [], riskCheck);
  }

  if (!analysisReady.ready) {
    const signal = blankSignal('insufficient_data', marketSeries.instrument.symbol, analysis.data_as_of, `Required trend metric ${analysisReady.missing} is not computable.`);
    signal.market_data = marketDataProvenance(marketSeries);
    signal.supporting_evidence = Object.entries(analysis.metrics || {}).filter(([, item]) => item && item.status === 'computed' && typeof item.value === 'number' && Number.isFinite(item.value)).map(([metric, item]) => ({ metric, value: item.value, unit: item.unit, window_end: item.window?.end || null }));
    return baseResult('insufficient_data', signal, [], riskCheck);
  }

  const direction = classifyTrend(analysisReady.values);
  if (direction === 'none') {
    const signal = blankSignal('no_setup', marketSeries.instrument.symbol, analysis.data_as_of, 'The v1 trend-confirmation conditions do not align in one direction.');
    signal.market_data = marketDataProvenance(marketSeries);
    signal.supporting_evidence = summarizeEvidence(analysisReady.metrics);
    return baseResult('no_setup', signal, [], riskCheck);
  }

  const candidateErrors = validateCandidate(candidateExposure, riskSnapshot.base_currency);
  if (candidateErrors.length > 0) {
    return baseResult('blocked', signalCard(direction, marketSeries, analysis, analysisReady.metrics), candidateErrors, riskCheck);
  }
  if (!Array.isArray(riskSnapshot.positions)) {
    const error = validationError('riskSnapshot.positions', 'invalid_positions', 'A complete simulation positions array is required.');
    return baseResult('blocked', signalCard(direction, marketSeries, analysis, analysisReady.metrics), [error], riskCheck);
  }
  if (riskSnapshot.positions.some(position => isRecord(position) && position.position_id === INTERNAL_CANDIDATE_POSITION_ID)) {
    const error = validationError('riskSnapshot.positions', 'reserved_candidate_id_collision', 'The simulation snapshot contains the evaluator-reserved candidate alias; no projection was evaluated.');
    return baseResult('blocked', signalCard(direction, marketSeries, analysis, analysisReady.metrics), [error], riskCheck);
  }

  const candidatePosition = {
    position_id: INTERNAL_CANDIDATE_POSITION_ID,
    instrument: marketSeries.instrument.symbol,
    asset_class: marketSeries.instrument.asset_class,
    side: direction,
    notional: candidateExposure.notional,
    assumed_risk_amount: candidateExposure.assumed_risk_amount,
    currency: candidateExposure.currency
  };
  const projectedSnapshot = { ...riskSnapshot, positions: [...riskSnapshot.positions, candidatePosition] };
  const projectedEvaluation = evaluateRiskLimits(projectedSnapshot, riskPolicy, { asOf });
  riskCheck.projected = riskSummary(projectedEvaluation);
  if (projectedEvaluation.status !== 'within_configured_limits') {
    return baseResult('blocked', signalCard(direction, marketSeries, analysis, analysisReady.metrics), [], riskCheck);
  }

  const card = signalCard(direction, marketSeries, analysis, analysisReady.metrics, candidateExposure, costContext);
  const recommendation = {
    proposal_status: 'proposed_unsubmitted',
    order_ready: false,
    instrument: marketSeries.instrument.symbol,
    side: direction,
    data_mode: 'simulation',
    rule_id: SIGNAL_RULE_ID,
    data_cutoff: analysis.data_as_of,
    reference_close: {
      value: latestBar.close,
      currency: marketSeries.instrument.currency,
      timestamp: latestBar.timestamp,
      executable: false,
      basis: 'historical_or_synthetic_bar_close'
    },
    caller_supplied_exposure: {
      notional: candidateExposure.notional,
      assumed_risk_amount: candidateExposure.assumed_risk_amount,
      currency: candidateExposure.currency,
      source: 'caller_supplied_hypothetical'
    },
    order_fields: {
      quantity: null,
      order_type: null,
      entry: null,
      stop_loss: null,
      target: null,
      time_in_force: null,
      estimated_costs: null,
      maximum_modeled_loss: null
    },
    risk_check_status: 'within_configured_limits',
    required_manual_review: [
      'No order plan is produced. The trend rule defines direction only; ATR levels are a separate unvalidated heuristic, historical/synthetic references, and never executable instructions.',
      'Portfolio risk checks use caller-supplied assumed_risk_amount; it is not derived from the ATR stop and does not represent a guaranteed maximum loss.',
      'Any net R/R depends on caller-supplied, unverified costs, contract multiplier, currency, and the same explicit holding horizon for target and stop; missing or incompatible inputs leave net_ratio null.',
      'Independently verify instrument identity, current bid/ask, market session, liquidity, contract specifications, fees, margin, and event risk before any decision outside this module.'
    ]
  };
  const result = baseResult('candidate_generated', card, [], riskCheck);
  result.order_recommendation = recommendation;
  result.simulation = {
    data_mode: 'simulation',
    status: 'projected_exposure_within_configured_limits',
    candidate_exposure_is_caller_supplied: true
  };
  return result;
}

module.exports = {
  RECOMMENDATION_CONTRACT_VERSION,
  SIGNAL_RULE_ID,
  generateOrderRecommendation
};
