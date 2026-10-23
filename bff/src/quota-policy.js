'use strict';

const USER_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const DEFAULT_QUOTA_POLICY = Object.freeze({
  userAnalysesPerMinute: 10,
  userAnalysesPerHour: 50,
  userAnalysesPerDay: 200,
  providerRequestsPerMinute: 10,
  providerRequestsPerDay: 200,
  providerUnitsPerMonth: 5000,
  providerId: null
});

function positiveLimit(env, key, fallback, maximum = 1_000_000_000) {
  if (env[key] === undefined || env[key] === '') return fallback;
  const value = Number(env[key]);
  if (!Number.isSafeInteger(value) || value < 1 || value > maximum) {
    throw new Error(`${key} must be a positive integer no greater than ${maximum}`);
  }
  return value;
}

function quotaPolicyFromEnv(env = process.env) {
  const providerId = String(env.DDA_AUTOTRADER_PROVIDER_ID || '').trim();
  if (providerId && !/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,79}$/.test(providerId)) {
    throw new Error('DDA_AUTOTRADER_PROVIDER_ID has an invalid format');
  }
  const policy = {
    userAnalysesPerMinute: positiveLimit(env, 'DDA_AUTOTRADER_USER_ANALYSES_PER_MINUTE', DEFAULT_QUOTA_POLICY.userAnalysesPerMinute),
    userAnalysesPerHour: positiveLimit(env, 'DDA_AUTOTRADER_USER_ANALYSES_PER_HOUR', DEFAULT_QUOTA_POLICY.userAnalysesPerHour),
    userAnalysesPerDay: positiveLimit(env, 'DDA_AUTOTRADER_USER_ANALYSES_PER_DAY', DEFAULT_QUOTA_POLICY.userAnalysesPerDay),
    providerRequestsPerMinute: positiveLimit(env, 'DDA_AUTOTRADER_PROVIDER_REQUESTS_PER_MINUTE', DEFAULT_QUOTA_POLICY.providerRequestsPerMinute),
    providerRequestsPerDay: positiveLimit(env, 'DDA_AUTOTRADER_PROVIDER_REQUESTS_PER_DAY', DEFAULT_QUOTA_POLICY.providerRequestsPerDay),
    providerUnitsPerMonth: positiveLimit(env, 'DDA_AUTOTRADER_PROVIDER_UNITS_PER_MONTH', DEFAULT_QUOTA_POLICY.providerUnitsPerMonth),
    providerId: providerId || null
  };
  if (policy.userAnalysesPerMinute > policy.userAnalysesPerHour || policy.userAnalysesPerHour > policy.userAnalysesPerDay) {
    throw new Error('user analysis limits must satisfy per-minute <= per-hour <= per-day');
  }
  if (policy.providerRequestsPerMinute > policy.providerRequestsPerDay) {
    throw new Error('provider request limits must satisfy per-minute <= per-day');
  }
  return Object.freeze(policy);
}

function validateProviderQuotaBinding(providerId, policy) {
  if (!providerId) return [];
  if (!policy || policy.providerId !== providerId) {
    return ['DDA_AUTOTRADER_PROVIDER_ID must match the configured market data provider'];
  }
  return [];
}

function utcWindow(asOf, unit) {
  const date = asOf instanceof Date ? new Date(asOf.getTime()) : new Date(asOf);
  if (!Number.isFinite(date.getTime())) throw new Error('quota reservation requires a valid timestamp');
  const start = new Date(date.getTime());
  let end;
  if (unit === 'minute') {
    start.setUTCSeconds(0, 0);
    end = new Date(start.getTime() + 60_000);
  } else if (unit === 'hour') {
    start.setUTCMinutes(0, 0, 0);
    end = new Date(start.getTime() + 60 * 60_000);
  } else if (unit === 'day') {
    start.setUTCHours(0, 0, 0, 0);
    end = new Date(start.getTime() + 24 * 60 * 60_000);
  } else if (unit === 'month') {
    start.setUTCDate(1);
    start.setUTCHours(0, 0, 0, 0);
    end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1));
  } else {
    throw new Error('unsupported quota window');
  }
  return { window_start: start.toISOString(), window_end: end.toISOString() };
}

function reservation(scopeType, scopeId, metric, amount, limitUnits, asOf, unit) {
  return {
    scope_type: scopeType,
    scope_id: scopeId,
    metric,
    ...utcWindow(asOf, unit),
    amount,
    limit_units: limitUnits
  };
}

function userAnalysisReservations(userId, asOf, policy = DEFAULT_QUOTA_POLICY) {
  if (!USER_ID.test(String(userId || ''))) throw new Error('user quota requires an authenticated DDA UUID');
  return [
    reservation('user', userId, 'analysis_request', 1, policy.userAnalysesPerMinute, asOf, 'minute'),
    reservation('user', userId, 'analysis_request', 1, policy.userAnalysesPerHour, asOf, 'hour'),
    reservation('user', userId, 'analysis_request', 1, policy.userAnalysesPerDay, asOf, 'day')
  ];
}

function providerUsageReservations(providerId, units, asOf, policy = DEFAULT_QUOTA_POLICY) {
  if (!policy.providerId || providerId !== policy.providerId) throw Object.assign(new Error('market data provider quota is not configured'), { code: 'provider_not_configured' });
  if (!Number.isSafeInteger(units) || units < 1 || units > 1_000_000_000) throw new Error('provider usage units must be a positive integer');
  return [
    reservation('provider', providerId, 'provider_request', 1, policy.providerRequestsPerMinute, asOf, 'minute'),
    reservation('provider', providerId, 'provider_request', 1, policy.providerRequestsPerDay, asOf, 'day'),
    reservation('provider', providerId, 'provider_units', units, policy.providerUnitsPerMonth, asOf, 'month')
  ];
}

module.exports = {
  DEFAULT_QUOTA_POLICY,
  quotaPolicyFromEnv,
  validateProviderQuotaBinding,
  utcWindow,
  userAnalysisReservations,
  providerUsageReservations
};
