'use strict';

const crypto = require('node:crypto');

/* ==========================================================================
   MEMBER / PREMIUM RESOURCES — library catalogue metadata (final pre-launch
   audit, 2026-11) + its "administration totalement autonome" follow-up.

   Mirrors bff/src/entitlements-store.js's two-class pattern exactly
   (MemoryResourcesStore for tests/local dev, PostgrestResourcesStore for
   production) so an Owner can add/edit/publish/unpublish/delete a resource
   through the admin UI (GET/POST/PATCH/DELETE /v1/admin/resources — see
   bff/src/app.js) WITHOUT a code change or redeploy. This module holds
   ONLY metadata; the actual file bytes are a separate concern, uploaded by
   the Owner straight from the admin UI (desktop or phone) and stored in a
   private Supabase Storage bucket — see bff/src/resources-storage.js's
   header for why that is a separate module and how it stays protected.

   A resource is created here with no file at all (file: null) -- the
   admin UI then calls POST /v1/admin/resources/:id/file to attach one.
   Publishing a resource with no file is allowed at the metadata layer
   (this store does not know about storage) but GET /v1/resources/:id/
   download in app.js refuses honestly (404 resource_file_missing) rather
   than serve nothing silently.
   ========================================================================== */

const VALID_MEMBERSHIP = ['free', 'premium'];
const VALID_STATUS = ['draft', 'published'];

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
  // `file` is deliberately NOT required here -- it is attached afterward
  // via the file-upload route, never at metadata-creation time.
  ['name', 'category', 'membershipRequired'].forEach(key => { if (!partial || key in data) required(key); });
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
  if ('file' in data) out.file = data.file ? String(data.file).trim() : null;
  if ('mimeType' in data) out.mimeType = data.mimeType ? String(data.mimeType).trim() : null;
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
    const row = { id: crypto.randomUUID(), status: 'draft', order: 0, level: '', tags: [], file: null, mimeType: null, coverImage: null, type: 'pdf', ...clean, created_at: now, updated_at: now };
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

module.exports = { MemoryResourcesStore, PostgrestResourcesStore, VALID_MEMBERSHIP, VALID_STATUS };
