'use strict';

// Shared handler construction — used by both the local dev server
// (src/server.js, which wraps this in http.createServer().listen()) and the
// Vercel serverless entry point (api/index.js, which exports this directly,
// since a serverless function never calls .listen() itself). Keeping this in
// one place means the two runtimes can never drift apart on routing, config
// validation or store wiring.
const { createBff, configFromEnv, validateRuntimeConfig } = require('./app');
const { SupabaseAuthAdapter } = require('./supabase-auth');
const { PostgrestSessionStore } = require('./session-store');
const { PostgrestBusinessStore } = require('./business-store');
const { PostgrestBillingStore } = require('./billing-store');
const { PostgrestBrvmPublicationStore } = require('./brvm-publication-store');
const { PostgrestAdminRolesStore } = require('./admin-roles-store');
const { chariowConfigFromEnv, handleChariowPulse } = require('./chariow');

function buildHandler(env = process.env) {
  const config = configFromEnv(env);
  const configIssues = validateRuntimeConfig(config, env);
  if (configIssues.length) {
    throw new Error(`BFF startup refused: ${configIssues.join('; ')}.`);
  }

  const auth = new SupabaseAuthAdapter({
    supabaseUrl: env.SUPABASE_URL,
    publishableKey: env.SUPABASE_PUBLISHABLE_KEY,
    serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY
  });
  const sessions = new PostgrestSessionStore({ supabaseUrl: env.SUPABASE_URL, serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY });
  const businessStore = new PostgrestBusinessStore({ supabaseUrl: env.SUPABASE_URL, serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY });
  const billingStore = new PostgrestBillingStore({ supabaseUrl: env.SUPABASE_URL, serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY });
  const brvmPublicationStore = new PostgrestBrvmPublicationStore({ supabaseUrl: env.SUPABASE_URL, serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY });
  const adminRoles = new PostgrestAdminRolesStore({ supabaseUrl: env.SUPABASE_URL, serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY });
  const chariowConfig = chariowConfigFromEnv(env);
  const academyHandler = createBff({ config, auth, sessions, businessStore, billingStore, brvmPublicationStore, adminRoles, entitlements: billingStore, logger: (event, fields) => console.info(JSON.stringify({ event, ...fields })) });

  return async function handler(req, res) {
    if (req.method === 'POST' && new URL(req.url, 'http://bff.local').pathname === '/webhooks/chariow') {
      if (!chariowConfig.pulseSecret) {
        res.writeHead(503, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
        return res.end(JSON.stringify({ error: 'billing_webhook_not_configured' }));
      }
      try {
        const result = await handleChariowPulse(req, {
          secret: chariowConfig.pulseSecret,
          config: chariowConfig,
          idempotencyStore: billingStore,
          applyEvent: async event => {
            await billingStore.applyChariowTransition(event);
          }
        });
        res.writeHead(result.status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
        return res.end(result.body ? JSON.stringify(result.body) : '');
      } catch (error) {
        console.error(JSON.stringify({ event: 'chariow_webhook_failed' }));
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
        return res.end(JSON.stringify({ error: 'billing_webhook_failed' }));
      }
    }
    return academyHandler(req, res);
  };
}

module.exports = { buildHandler };
