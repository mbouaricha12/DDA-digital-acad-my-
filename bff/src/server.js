'use strict';

const http = require('node:http');
const { createBff, configFromEnv } = require('./app');
const { SupabaseAuthAdapter } = require('./supabase-auth');
const { PostgrestSessionStore } = require('./session-store');
const { PostgrestBusinessStore } = require('./business-store');

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
const handler = createBff({ config, auth, sessions, businessStore, logger: (event, fields) => console.info(JSON.stringify({ event, ...fields })) });

http.createServer(handler).listen(config.port, '0.0.0.0', () => {
  console.log(`DDA BFF listening on http://0.0.0.0:${config.port}`);
});
