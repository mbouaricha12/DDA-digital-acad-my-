'use strict';

const ACADEMY_ENTITLEMENTS = Object.freeze([
  'premium_track',
  'resources_premium',
  'certificate_preview',
  'advanced_modules'
]);
const AUTOTRADER_ANALYSIS_ENTITLEMENT = 'autotrader.analysis';
const ALL_ENTITLEMENTS = Object.freeze([
  ...ACADEMY_ENTITLEMENTS,
  AUTOTRADER_ANALYSIS_ENTITLEMENT
]);
const ALLOWED_ENTITLEMENTS = new Set(ALL_ENTITLEMENTS);

function isKnownEntitlement(value) {
  return typeof value === 'string' && ALLOWED_ENTITLEMENTS.has(value);
}

function normalizeEntitlements(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter(isKnownEntitlement))];
}

module.exports = {
  ENTITLEMENTS: ACADEMY_ENTITLEMENTS,
  ACADEMY_ENTITLEMENTS,
  AUTOTRADER_ANALYSIS_ENTITLEMENT,
  ALL_ENTITLEMENTS,
  isKnownEntitlement,
  normalizeEntitlements
};
