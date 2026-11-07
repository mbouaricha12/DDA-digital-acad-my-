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

  console.log('RESULT: supabase-auth adapter preserves immutable partner ref across profile edits — PASS');

  // P0 auth reliability audit (2026-11): the adapter must surface GoTrue's
  // error_code, not just the HTTP status, because an unconfirmed email and
  // a wrong password are both plain 400s from /auth/v1/token — the status
  // alone cannot tell them apart. Bodies below are GoTrue's real documented
  // shape for each case.
  const errorFetch = async (url, options) => {
    if (url.includes('/auth/v1/token') && JSON.parse(options.body).password === 'wrong') {
      return { ok: false, status: 400, text: async () => JSON.stringify({ error: 'invalid_grant', error_code: 'invalid_credentials', error_description: 'Invalid login credentials', msg: 'Invalid login credentials' }) };
    }
    if (url.includes('/auth/v1/token') && JSON.parse(options.body).password === 'unconfirmed') {
      return { ok: false, status: 400, text: async () => JSON.stringify({ error_code: 'email_not_confirmed', msg: 'Email not confirmed' }) };
    }
    throw new Error(`unexpected request: ${options.method} ${url}`);
  };
  const auth2 = new SupabaseAuthAdapter({ supabaseUrl: 'https://project.supabase.co', publishableKey: 'pub', serviceRoleKey: 'service', fetchImpl: errorFetch });

  let threw = null;
  try { await auth2.login({ email: 'A@Example.com ', password: 'wrong' }); } catch (error) { threw = error; }
  assert.ok(threw, 'a wrong password rejects');
  assert.equal(threw.status, 400);
  assert.equal(threw.code, 'invalid_credentials', 'the adapter must surface error_code, not collapse it');

  threw = null;
  try { await auth2.login({ email: 'a@example.com', password: 'unconfirmed' }); } catch (error) { threw = error; }
  assert.ok(threw, 'an unconfirmed account rejects');
  assert.equal(threw.status, 400, 'GoTrue reports both cases as plain 400 — only error_code tells them apart');
  assert.equal(threw.code, 'email_not_confirmed', 'the caller must be able to tell this apart from a wrong password at the same HTTP status');

  console.log('RESULT: supabase-auth adapter surfaces error_code so email_not_confirmed is never collapsed into invalid_credentials — PASS');
})();
