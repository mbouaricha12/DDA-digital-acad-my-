'use strict';

// Shared-storage rate limiter for unauthenticated auth routes (register, verify-email,
// login, password-reset). The BFF runs as Vercel serverless functions (see bff/api/index.js):
// invocations do not share process memory, so an in-memory Map would reset per cold start
// and not be shared across concurrent instances — the counter has to live in Postgres.
class PostgrestRateLimiter {
  constructor({ supabaseUrl, serviceRoleKey, fetchImpl = fetch, logger = () => {} }) {
    if (!supabaseUrl || !serviceRoleKey) throw new Error('Rate limiter requires a Supabase URL and service role key');
    this.base = `${String(supabaseUrl).replace(/\/$/, '')}/rest/v1`;
    this.key = serviceRoleKey;
    this.fetch = fetchImpl;
    this.logger = logger;
  }

  // Returns true when the call may proceed. Fails open (returns true) if the shared store
  // is unreachable or errors: for this pilot's scale and risk profile, an outage in the rate
  // limiter's own storage must not take down registration/login for every legitimate learner.
  async allow(bucketKey, { windowSeconds, limit }) {
    try {
      const response = await this.fetch(`${this.base}/rpc/dda_rate_limit_hit`, {
        method: 'POST',
        headers: { apikey: this.key, Authorization: `Bearer ${this.key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ p_key: bucketKey, p_window_seconds: windowSeconds, p_limit: limit })
      });
      if (!response.ok) throw new Error(`rate limiter store error ${response.status}`);
      const result = await response.json();
      return result === true;
    } catch (error) {
      this.logger('rate_limit_store_failed', { bucketKey, error: error.message });
      return true;
    }
  }
}

// Rate limiting must never lock out two different legitimate learners who share an IP
// (shared mobile/CGNAT networks, campus or office VPNs are common in DDA's audience) — so
// every check below is scoped to IP *and* to the request's own identifier (email), never to
// IP alone. A request is allowed only if BOTH buckets are still within their limit.
const RULES = {
  register: { windowSeconds: 3600, limit: 5 },
  'verify-email': { windowSeconds: 3600, limit: 10 },
  login: { windowSeconds: 900, limit: 10 },
  'password-reset-request': { windowSeconds: 3600, limit: 5 },
  'password-reset-confirm': { windowSeconds: 3600, limit: 10 }
};

const LOGIN_PER_EMAIL = { windowSeconds: 900, limit: 5 };

async function checkAuthRateLimit(limiter, route, { ip, email }) {
  if (!limiter) return true;
  const rule = RULES[route];
  if (!rule) return true;
  const ipAllowed = await limiter.allow(`${route}:ip:${ip}`, rule);
  if (!ipAllowed) return false;
  if (route === 'login' && email) {
    return limiter.allow(`login:email:${email}`, LOGIN_PER_EMAIL);
  }
  if (email) {
    return limiter.allow(`${route}:email:${email}`, rule);
  }
  return true;
}

module.exports = { PostgrestRateLimiter, checkAuthRateLimit, RULES };
