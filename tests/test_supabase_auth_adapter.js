'use strict';
// Partner attribution ("ref") is written once at signup and must survive
// later profile edits. GoTrue's admin update replaces user_metadata
// wholesale, so updateUser() has to fetch-then-merge — this test guards
// that behavior directly against the adapter, not through a route fake.

const assert = require('node:assert/strict');
const { SupabaseAuthAdapter } = require('../bff/src/supabase-auth');

function makeFetch(calls) {
  return async (url, options) => {
    calls.push({ url, options });
    if (options.method === 'POST' && url.endsWith('/auth/v1/signup')) {
      return { ok: true, text: async () => JSON.stringify({ user: { id: 'user-1' } }) };
    }
    if (options.method === 'GET' && url.includes('/auth/v1/admin/users/user-1')) {
      return { ok: true, text: async () => JSON.stringify({ id: 'user-1', email: 'a@example.com', email_confirmed_at: null, user_metadata: { display_name: 'Old Name', ref: 'partner-01' } }) };
    }
    if (options.method === 'PUT' && url.includes('/auth/v1/admin/users/user-1')) {
      const sentBody = JSON.parse(options.body);
      return { ok: true, text: async () => JSON.stringify({ id: 'user-1', email: 'a@example.com', email_confirmed_at: null, user_metadata: sentBody.user_metadata }) };
    }
    throw new Error(`unexpected request: ${options.method} ${url}`);
  };
}

(async () => {
  const calls = [];
  const auth = new SupabaseAuthAdapter({ supabaseUrl: 'https://project.supabase.co', publishableKey: 'pub', serviceRoleKey: 'service', fetchImpl: makeFetch(calls) });

  await auth.register({ email: 'a@example.com', password: 'x'.repeat(12), display_name: 'A', ref: 'partner-01' });
  const signupCall = calls.find(c => c.url.endsWith('/auth/v1/signup'));
  assert.equal(JSON.parse(signupCall.options.body).data.ref, 'partner-01', 'register() forwards ref into the signup payload');

  const updated = await auth.updateUser('user-1', { display_name: 'New Name' });
  assert.equal(updated.display_name, 'New Name', 'the requested field is updated');
  assert.equal(updated.ref, 'partner-01', 'updateUser() must preserve the immutable partner ref — a display_name edit never erases it');
  const putCall = calls.find(c => c.options.method === 'PUT');
  assert.equal(JSON.parse(putCall.options.body).user_metadata.ref, 'partner-01', 'the merged write sent to GoTrue itself carries the preserved ref, not just the response');

  const googleAuth = new SupabaseAuthAdapter({
    supabaseUrl: 'https://project.supabase.co',
    publishableKey: 'pub',
    serviceRoleKey: 'service',
    fetchImpl: async () => ({
      ok: true,
      text: async () => JSON.stringify({
        id: 'google-user-1',
        email: 'aicha.kone@example.com',
        email_confirmed_at: '2026-11-08T12:00:00Z',
        user_metadata: { full_name: 'Aïcha Koné', name: 'Aïcha Koné', avatar_url: 'https://example.com/avatar.png' }
      })
    })
  });
  const googleUser = await googleAuth.getUser('google-user-1');
  assert.equal(googleUser.display_name, 'Aïcha Koné', 'Google full_name must become the canonical display_name exposed to the frontend');

  const nameOnlyAuth = new SupabaseAuthAdapter({
    supabaseUrl: 'https://project.supabase.co',
    publishableKey: 'pub',
    serviceRoleKey: 'service',
    fetchImpl: async () => ({
      ok: true,
      text: async () => JSON.stringify({ id: 'google-user-2', email: 'name@example.com', user_metadata: { name: 'Nom Google' } })
    })
  });
  const nameOnlyUser = await nameOnlyAuth.getUser('google-user-2');
  assert.equal(nameOnlyUser.display_name, 'Nom Google', 'Google name must be accepted when full_name is absent');

  console.log('RESULT: supabase-auth preserves partner ref and normalizes Google full_name/name — PASS');
})();
