'use strict';

const crypto = require('node:crypto');

function randomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('base64url');
}

function sha256(value) {
  return crypto.createHash('sha256').update(String(value), 'utf8').digest('hex');
}

function timingSafeEqualText(a, b) {
  const left = Buffer.from(String(a || ''));
  const right = Buffer.from(String(b || ''));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function parseCookies(header = '') {
  const cookies = {};
  for (const part of header.split(';')) {
    const index = part.indexOf('=');
    if (index === -1) continue;
    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    if (key) cookies[key] = decodeURIComponent(value);
  }
  return cookies;
}

function serializeCookie(name, value, options = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`];
  parts.push(`Path=${options.path || '/'}`);
  if (options.maxAge !== undefined) parts.push(`Max-Age=${Math.max(0, Math.floor(options.maxAge))}`);
  if (options.expires) parts.push(`Expires=${new Date(options.expires).toUTCString()}`);
  if (options.httpOnly) parts.push('HttpOnly');
  if (options.secure) parts.push('Secure');
  parts.push(`SameSite=${options.sameSite || 'Lax'}`);
  if (options.domain) parts.push(`Domain=${options.domain}`);
  return parts.join('; ');
}

function encrypt(value, key) {
  if (!value) return null;
  if (!key) throw new Error('SESSION_ENCRYPTION_KEY is required to encrypt provider tokens');
  const keyBytes = Buffer.isBuffer(key) ? key : Buffer.from(String(key), 'base64url');
  if (keyBytes.length !== 32) throw new Error('SESSION_ENCRYPTION_KEY must decode to 32 bytes');
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', keyBytes, iv);
  const ciphertext = Buffer.concat([cipher.update(String(value), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ciphertext]).toString('base64url');
}

function decrypt(value, key) {
  if (!value) return null;
  if (!key) throw new Error('SESSION_ENCRYPTION_KEY is required to decrypt provider tokens');
  const keyBytes = Buffer.isBuffer(key) ? key : Buffer.from(String(key), 'base64url');
  if (keyBytes.length !== 32) throw new Error('SESSION_ENCRYPTION_KEY must decode to 32 bytes');
  const packed = Buffer.from(value, 'base64url');
  const decipher = crypto.createDecipheriv('aes-256-gcm', keyBytes, packed.subarray(0, 12));
  decipher.setAuthTag(packed.subarray(12, 28));
  return Buffer.concat([decipher.update(packed.subarray(28)), decipher.final()]).toString('utf8');
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

module.exports = {
  randomToken,
  sha256,
  timingSafeEqualText,
  parseCookies,
  serializeCookie,
  encrypt,
  decrypt,
  normalizeEmail
};
