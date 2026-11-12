'use strict';

// PKCE (RFC 7636) helpers for both email-link flows this BFF initiates on a
// learner's behalf: password recovery and signup confirmation. Root cause
// this exists for (P0, 2026-11): GoTrue's classic magic-link flow fully
// authenticates (or fully confirms + authenticates) on the FIRST GET to its
// verification endpoint — any visitor, human or automated, who loads that
// link burns it. Production evidence: the founder's own recovery token in
// auth.users went from issued to empty 12-28 seconds after the e-mail was
// sent — far too fast for a human to have read the e-mail and clicked,
// consistent with a security scanner's sandboxed browser (e.g. a corporate
// email-link scanner) pre-visiting the link and executing its JavaScript.
//
// PKCE defers the sensitive step: the e-mail link only ever yields a
// single-use `code`, which is worthless without the matching `code_verifier`
// — a secret this server generates and NEVER puts in the URL, the e-mail, or
// anywhere a scanner could reach it. Only the browser that actually
// initiated the request (holding this value in an httpOnly cookie — see
// app.js) can complete the exchange.
const crypto = require('node:crypto');

// The verifier must use only RFC 7636's unreserved, URL-safe alphabet
// ([A-Za-z0-9-._~]) and be 43-128 characters long. 32 random bytes,
// base64url-encoded (no padding), yields exactly 43 characters drawn from a
// strict subset of that alphabet — the shortest value the RFC allows, and
// generated server-side so it is never exposed to the browser's URL bar,
// browser history, server access logs, or the e-mail itself.
function generateCodeVerifier() {
  return crypto.randomBytes(32).toString('base64url');
}

// code_challenge = BASE64URL-ENCODE(SHA256(ASCII(code_verifier))), the only
// method this adapter (and GoTrue) is asked to support — "plain" would make
// the challenge identical to the verifier, defeating the entire point.
function computeCodeChallenge(codeVerifier) {
  return crypto.createHash('sha256').update(String(codeVerifier), 'ascii').digest('base64url');
}

module.exports = { generateCodeVerifier, computeCodeChallenge };
