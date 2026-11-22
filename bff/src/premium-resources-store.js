'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

/* ==========================================================================
   MEMBER / PREMIUM RESOURCES — library catalogue (final pre-launch audit,
   2026-11) + its follow-up ("passage à l'implémentation concrète").

   This mirrors bff/src/entitlements-store.js's own two-class pattern
   exactly (MemoryXStore for tests/local dev, PostgrestXStore for
   production) so an Owner can add/edit/publish/unpublish/delete a
   resource through the admin UI (GET/POST/PATCH/DELETE
   /v1/admin/resources — see bff/src/app.js) WITHOUT a code change or
   redeploy. Metadata lives in Supabase (dda_resources,
   supabase/migrations/0012_resources.sql); the actual file bytes live
   outside dist/, under DEFAULT_STORAGE_DIR, and are only ever streamed by
   the authenticated GET /v1/resources/:id/download route after the exact
   same hasActivePremium() check every other Premium route already uses —
   never a public, permanent static URL.

   Adding a real resource today needs: (1) create its metadata row through
   the admin UI, (2) commit the matching file under bff/resources-storage/
   with the exact file name entered in the admin form, and push. No other
   code change, no redeploy beyond that push (which the file commit already
   requires) -- see the admin UI's own inline help text.
   ========================================================================== */

const VALID_MEMBERSHIP = ['free', 'premium'];
const VALID_STATUS = ['draft', 'published'];
const DEFAULT_STORAGE_DIR = path.join(__dirname, '..', 'resources-storage');

function validationError(field, message) {
  return Object.assign(new Error(message), { code: 'invalid_resource', status: 400, field });
}

function notFoundError() {
  return Object.assign(new Error('No such resource.'), { code: 'resource_not_found', status: 404 });
}

function normalizeInput(data, { partial = false } = {}) {
  const out = {};
  const required = (key) => {
    if (partial && !(key in data)) return;
    const value = typeof data[key] === 'string' ? data[key].trim() : data[key];
    if (!value) throw validationError(key, `${key} is required.`);
  };
  ['name', 'category', 'membershipRequired', 'file'].forEach(key => { if (!partial || key in data) required(key); });
  if ('name' in data) out.name = String(data.name).trim();
  if ('description' in data) out.description = String(data.description || '').trim();
  if ('category' in data) out.category = String(data.category).trim();
  if ('level' in data) out.level = String(data.level || '').trim();
  if ('tags' in data) out.tags = Array.isArray(data.tags) ? data.tags.map(String) : [];
  if ('membershipRequired' in data) {
    if (!VALID_MEMBERSHIP.includes(data.membershipRequired)) throw validationError('membershipRequired', 'membershipRequired must be "free" or "premium".');
    out.membershipRequired = data.membershipRequired;
  }
  if ('type' in data) out.type = String(data.type || 'pdf').trim();
  if ('file' in data) out.file = String(data.file).trim();
  if ('mimeType' in data) out.mimeType = String(data.mimeType || 'application/octet-stream').trim();
  if ('coverImage' in data) out.coverImage = data.coverImage ? String(data.coverImage).trim() : null;
  if ('status' in data) {
    if (!VALID_STATUS.includes(data.status)) throw validationError('status', 'status must be "draft" or "published".');
    out.status = data.status;
  }
  if ('order' in data) out.order = Number.isFinite(Number(data.order)) ? Number(data.order) : 0;
  return out;
}

class MemoryResourcesStore {
  constructor() { this.rows = new Map(); }

  async listAll() {
    return [...this.rows.values()].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }

  async listPublished() {
    return (await this.listAll()).filter(row => row.status === 'published');
  }

  async get(id) { return this.rows.get(id) || null; }

  async create(data) {
    const clean = normalizeInput(data);
    const now = new Date().toISOString();
    const row = { id: crypto.randomUUID(), status: 'draft', order: 0, level: '', tags: [], mimeType: 'application/octet-stream', coverImage: null, type: 'pdf', ...clean, created_at: now, updated_at: now };
    this.rows.set(row.id, row);
    return row;
  }

  async update(id, patch) {
    const existing = this.rows.get(id);
    if (!existing) throw notFoundError();
    const clean = normalizeInput(patch, { partial: true });
    const row = { ...existing, ...clean, updated_at: new Date().toISOString() };
    this.rows.set(id, row);
    return row;
  }

  async remove(id) {
    if (!this.rows.has(id)) throw notFoundError();
    this.rows.delete(id);
  }
}

class PostgrestResourcesStore {
  constructor({ supabaseUrl, serviceRoleKey, fetchImpl = fetch }) {
    if (!supabaseUrl || !serviceRoleKey) throw new Error('Supabase resources store requires URL and service role key');
    this.base = `${String(supabaseUrl).replace(/\/$/, '')}/rest/v1/dda_resources`;
    this.key = serviceRoleKey;
    this.fetch = fetchImpl;
  }

  async request(query = '', options = {}) {
    const response = await this.fetch(`${this.base}${query}`, {
      ...options,
      headers: { apikey: this.key, Authorization: `Bearer ${this.key}`, 'Content-Type': 'application/json', Prefer: 'return=representation', ...(options.headers || {}) }
    });
    if (!response.ok) {
      if (response.status === 406 || response.status === 409) throw notFoundError();
      throw new Error(`resources store error ${response.status}`);
    }
    const text = await response.text();
    return text ? JSON.parse(text) : [];
  }

  static toRow(record) {
    if (!record) return record;
    return {
      id: record.id, name: record.name, description: record.description, category: record.category,
      level: record.level, tags: record.tags || [], membershipRequired: record.membership_required,
      type: record.type, file: record.file_name, mimeType: record.mime_type, coverImage: record.cover_image_url,
      status: record.status, order: record.display_order, created_at: record.created_at, updated_at: record.updated_at
    };
  }

  static toColumns(clean) {
    const map = { name: 'name', description: 'description', category: 'category', level: 'level', tags: 'tags', membershipRequired: 'membership_required', type: 'type', file: 'file_name', mimeType: 'mime_type', coverImage: 'cover_image_url', status: 'status', order: 'display_order' };
    const out = {};
    Object.entries(clean).forEach(([key, value]) => { if (map[key]) out[map[key]] = value; });
    return out;
  }

  async listAll() {
    const rows = await this.request('?select=*&order=display_order.asc', { method: 'GET' });
    return rows.map(PostgrestResourcesStore.toRow);
  }

  async listPublished() {
    const rows = await this.request('?status=eq.published&select=*&order=display_order.asc', { method: 'GET' });
    return rows.map(PostgrestResourcesStore.toRow);
  }

  async get(id) {
    const rows = await this.request(`?id=eq.${encodeURIComponent(id)}&select=*&limit=1`, { method: 'GET' });
    return rows[0] ? PostgrestResourcesStore.toRow(rows[0]) : null;
  }

  async create(data) {
    const clean = normalizeInput(data);
    const now = new Date().toISOString();
    const rows = await this.request('', { method: 'POST', body: JSON.stringify({ ...PostgrestResourcesStore.toColumns(clean), status: clean.status || 'draft', display_order: clean.order ?? 0, created_at: now, updated_at: now }) });
    return PostgrestResourcesStore.toRow(rows[0]);
  }

  async update(id, patch) {
    const clean = normalizeInput(patch, { partial: true });
    const rows = await this.request(`?id=eq.${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify({ ...PostgrestResourcesStore.toColumns(clean), updated_at: new Date().toISOString() }) });
    if (!rows.length) throw notFoundError();
    return PostgrestResourcesStore.toRow(rows[0]);
  }

  async remove(id) {
    const rows = await this.request(`?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (!rows.length) throw notFoundError();
  }
}

// Streams the file to `res` only after the caller has already verified the
// requester's membership for this exact resource -- this does not itself
// re-check entitlement, by design (the route handler owns that decision).
function streamResourceFile(resource, res, { storageDir = DEFAULT_STORAGE_DIR, fsImpl = fs } = {}) {
  const filePath = path.join(storageDir, resource.file);
  if (!filePath.startsWith(storageDir)) return false; // defends resource.file against path traversal
  if (!fsImpl.existsSync(filePath)) return false;
  res.setHeader('Content-Type', resource.mimeType || 'application/octet-stream');
  res.setHeader('Content-Disposition', `attachment; filename="${resource.file.replace(/[^\w.\-]/g, '_')}"`);
  fsImpl.createReadStream(filePath).pipe(res);
  return true;
}

module.exports = { MemoryResourcesStore, PostgrestResourcesStore, streamResourceFile, DEFAULT_STORAGE_DIR, VALID_MEMBERSHIP, VALID_STATUS };
