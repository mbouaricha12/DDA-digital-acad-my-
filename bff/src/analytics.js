'use strict';

function analyticsConfigFromEnv(env = process.env) {
  return {
    apiKey: env.POSTHOG_API_KEY || null,
    host: String(env.POSTHOG_HOST || 'https://us.i.posthog.com').replace(/\/+$/, '')
  };
}

// Single server-side choke point for billing analytics, mirroring the
// client-side one in dist/dda-analytics.js: a missing key, a network failure,
// or PostHog itself being down must never break a billing webhook — this
// never throws, it only reports whether the event was actually sent.
async function trackServerEvent(event, distinctId, properties = {}, { config = analyticsConfigFromEnv(), fetchImpl = fetch } = {}) {
  if (!config.apiKey || !distinctId) return false;
  try {
    const response = await fetchImpl(`${config.host}/capture/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: config.apiKey, event, distinct_id: distinctId, properties })
    });
    return response.ok;
  } catch {
    return false;
  }
}

module.exports = { analyticsConfigFromEnv, trackServerEvent };
