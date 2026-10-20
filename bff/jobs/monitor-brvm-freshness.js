'use strict';

const crypto = require('node:crypto');

const runId = crypto.randomUUID();
const startedAt = new Date();
const endpoint = process.env.BRVM_PUBLICATIONS_URL || '';
const enabled = process.env.BRVM_REVALIDATION_ENABLED === 'true';
const timeoutMs = Number(process.env.BRVM_REVALIDATION_TIMEOUT_MS || 30000);

function log(event, fields = {}) {
  console.log(JSON.stringify({
    event,
    job: 'brvm-freshness-daily',
    run_id: runId,
    occurred_at: new Date().toISOString(),
    ...fields
  }));
}

function isHttpsUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password;
  } catch {
    return false;
  }
}

function validPublication(item, nowMs) {
  if (!item || typeof item !== 'object' || Array.isArray(item)) return false;
  for (const field of ['id', 'title', 'source', 'sourceUrl', 'documentUrl', 'referenceDate', 'retrievedAt']) {
    if (typeof item[field] !== 'string' || !item[field].trim()) return false;
  }
  const referenceMs = Date.parse(item.referenceDate);
  const retrievedMs = Date.parse(item.retrievedAt);
  const freshUntilMs = item.freshUntil ? Date.parse(item.freshUntil) : NaN;
  return isHttpsUrl(item.sourceUrl)
    && isHttpsUrl(item.documentUrl)
    && Number.isFinite(referenceMs)
    && Number.isFinite(retrievedMs)
    && Number.isFinite(freshUntilMs)
    && retrievedMs >= referenceMs
    && retrievedMs <= nowMs
    && freshUntilMs > nowMs
    && item.verificationStatus === 'verified'
    && item.freshnessStatus === 'current'
    && item.redistributionRights === 'authorized';
}

async function main() {
  if (!enabled) {
    log('brvm_freshness_monitor_disabled', {
      reason: 'BRVM_REVALIDATION_ENABLED is not true',
      checked_count: 0
    });
    return;
  }
  if (!endpoint) throw new Error('BRVM_PUBLICATIONS_URL is required when monitoring is enabled');
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1000 || timeoutMs > 120000) {
    throw new Error('BRVM_REVALIDATION_TIMEOUT_MS must be between 1000 and 120000');
  }
  if (!isHttpsUrl(endpoint)) throw new Error('BRVM_PUBLICATIONS_URL must be HTTPS');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  let response;
  try {
    response = await fetch(endpoint, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
      signal: controller.signal
    });
  } finally {
    clearTimeout(timeout);
  }
  const text = await response.text();
  if (!response.ok) throw new Error(`BRVM endpoint returned HTTP ${response.status}`);

  let payload;
  try { payload = text ? JSON.parse(text) : null; } catch { throw new Error('BRVM endpoint returned invalid JSON'); }
  if (!payload || !Array.isArray(payload.items)) throw new Error('BRVM endpoint returned invalid shape');

  const nowMs = Date.now();
  const invalid = payload.items.filter(item => !validPublication(item, nowMs));
  log('brvm_freshness_monitor_completed', {
    endpoint_host: new URL(endpoint).host,
    checked_count: payload.items.length,
    valid_count: payload.items.length - invalid.length,
    invalid_count: invalid.length,
    finished_at: new Date().toISOString()
  });
  if (invalid.length) throw new Error(`BRVM projection contains ${invalid.length} invalid publication(s)`);
}

if (require.main === module) {
  main().catch(error => {
    log('brvm_freshness_monitor_failed', {
      error_code: error.name === 'AbortError' ? 'TIMEOUT' : 'MONITOR_FAILED',
      error: error.message
    });
    process.exitCode = 1;
  });
}

module.exports = { isHttpsUrl, validPublication };
