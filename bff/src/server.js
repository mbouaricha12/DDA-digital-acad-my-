'use strict';

const http = require('node:http');
const { createBff, configFromEnv } = require('./app');
const { SupabaseAuthAdapter } = require('./supabase-auth');
const { PostgrestSessionStore } = require('./session-store');
const { PostgrestBusinessStore } = require('./business-store');
const { PostgrestBillingStore } = require('./billing-store');
const { chariowConfigFromEnv, handleChariowPulse } = require('./chariow');

const config = configFromEnv();
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_PUBLISHABLE_KEY || !process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.SESSION_ENCRYPTION_KEY) {
  console.error('BFF startup refused: set SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, SUPABASE_SERVICE_ROLE_KEY and SESSION_ENCRYPTION_KEY.');
  process.exit(1);
}

const auth = new SupabaseAuthAdapter({
  supabaseUrl: process.env.SUPABASE_URL,
  publishableKey: process.env.SUPABASE_PUBLISHABLE_KEY,
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY
});
const sessions = new PostgrestSessionStore({ supabaseUrl: process.env.SUPABASE_URL, serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY });
const businessStore = new PostgrestBusinessStore({ supabaseUrl: process.env.SUPABASE_URL, serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY });
const billingStore = new PostgrestBillingStore({ supabaseUrl: process.env.SUPABASE_URL, serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY });
const chariowConfig = chariowConfigFromEnv();
const academyHandler = createBff({ config, auth, sessions, businessStore, billingStore, entitlements: billingStore, logger: (event, fields) => console.info(JSON.stringify({ event, ...fields })) });
const handler = async (req, res) => {
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
          await billingStore.markProcessed(event.deliveryId, 'processed');
        }
      });
      res.writeHead(result.status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
      return res.end(result.body ? JSON.stringify(result.body) : '');
    } catch (error) {
      console.error(JSON.stringify({ event: 'chariow_webhook_failed', error: error.message }));
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
      return res.end(JSON.stringify({ error: 'billing_webhook_failed' }));
    }
  }
  return academyHandler(req, res);
};

http.createServer(handler).listen(config.port, '0.0.0.0', () => {
  console.log(`DDA BFF listening on http://0.0.0.0:${config.port}`);
});
