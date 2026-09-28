'use strict';

const http = require('node:http');
const { createBff, configFromEnv, validateRuntimeConfig } = require('./app');
const { SupabaseAuthAdapter } = require('./supabase-auth');
const { PostgrestSessionStore } = require('./session-store');

const config = configFromEnv();
const configIssues = validateRuntimeConfig(config);
if (configIssues.length) {
  console.error(`BFF startup refused: ${configIssues.join('; ')}.`);
  process.exit(1);
}

const auth = new SupabaseAuthAdapter({
  supabaseUrl: process.env.SUPABASE_URL,
  publishableKey: process.env.SUPABASE_PUBLISHABLE_KEY,
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY
});
const sessions = new PostgrestSessionStore({ supabaseUrl: process.env.SUPABASE_URL, serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY });
const handler = createBff({ config, auth, sessions, logger: (event, fields) => console.info(JSON.stringify({ event, ...fields })) });

http.createServer(handler).listen(config.port, '0.0.0.0', () => {
  console.log(`DDA BFF listening on http://0.0.0.0:${config.port}`);
});
