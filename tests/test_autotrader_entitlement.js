'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { AUTOTRADER_ANALYSIS_ENTITLEMENT, ENTITLEMENTS, normalizeEntitlements } = require('../bff/src/entitlement-catalog');

const root = path.resolve(__dirname, '..');
const contract = JSON.parse(fs.readFileSync(path.join(root, 'contracts/autotrader/analysis-entitlement-v1.json'), 'utf8'));
const migrationSql = fs.readFileSync(path.join(root, 'supabase/migrations/0006_autotrader_analysis_entitlement.sql'), 'utf8');
const billingSql = fs.readFileSync(path.join(root, 'supabase/migrations/0004_chariow_billing.sql'), 'utf8');
assert.equal(contract.contractVersion, 'dda.autotrader.analysis-entitlement.v1');
assert.equal(contract.entitlement.key, AUTOTRADER_ANALYSIS_ENTITLEMENT);
assert.equal(contract.sourcesOfTruth.commercialState.startsWith('Chariow'), true);
assert.equal(contract.sourcesOfTruth.authorizationState.includes('dda_billing_memberships'), true);
assert.equal(contract.grantPolicy.genericPremiumGrantsAutoTrader, false);
assert.equal(contract.grantPolicy.defaultProductIds.length, 0);
assert.equal(contract.recurringBilling.enabled, false);
assert.equal(contract.quotas.partOfEntitlement, false);
assert.equal(contract.entitlement.protectedRoutes.includes('POST /v1/autotrader/analyze'), true);
assert.match(migrationSql, /autotrader\.analysis/);
assert.match(billingSql, /create table if not exists public\.dda_billing_memberships/);
assert.equal(ENTITLEMENTS.includes(AUTOTRADER_ANALYSIS_ENTITLEMENT), false, 'generic Academy entitlements must remain distinct');
assert.deepEqual(normalizeEntitlements(['premium_track', AUTOTRADER_ANALYSIS_ENTITLEMENT, 'premium_track', 'made_up']), ['premium_track', AUTOTRADER_ANALYSIS_ENTITLEMENT]);
console.log('AutoTrader entitlement contract: PASS');
