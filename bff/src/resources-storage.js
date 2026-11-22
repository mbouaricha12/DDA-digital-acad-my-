'use strict';

/* ==========================================================================
   RESOURCE FILE STORAGE — "rendre l'administration des ressources
   totalement autonome" (2026-11). Replaces the previous "drop the file
   under bff/resources-storage/ by hand and push" step: an Owner now
   uploads a file directly from the admin UI (desktop or phone) and it is
   stored in a private Supabase Storage bucket, never under dist/ and never
   given a permanent public URL. The BFF (service role) is the only thing
   that can read or write this bucket; a learner's download still goes
   through GET /v1/resources/:id/download (bff/src/app.js), which performs
   the exact same hasActivePremium() check as every other Premium route
   before asking this module for the bytes.

   Storage key is deterministic — always `resources/<resource id>`, no
   extension, no original filename in the path. That is what makes
   "remplacer le fichier sans perdre les informations de la ressource"
   trivial: replacing a file is just re-uploading to the same key; the
   metadata row (name, description, category, status...) never moves.
   The human-readable filename is kept in dda_resources.file_name purely
   for the Content-Disposition header on download.
   ========================================================================== */

const BUCKET = 'dda-resources';

const ALLOWED_TYPES = Object.freeze({
  'application/pdf': 'pdf',
  'application/zip': 'zip',
  'application/x-zip-compressed': 'zip',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'text/csv': 'csv',
  'text/plain': 'txt',
  'image/png': 'png',
  'image/jpeg': 'jpg'
});

function unsupportedTypeError(mimeType) {
  return Object.assign(new Error(`Unsupported file type: ${mimeType}. Allowed: ${[...new Set(Object.values(ALLOWED_TYPES))].join(', ')}.`), { code: 'unsupported_file_type', status: 415 });
}

function tooLargeError(maxBytes) {
  return Object.assign(new Error(`File exceeds the ${Math.round(maxBytes / 1024 / 1024)} MB limit.`), { code: 'file_too_large', status: 413 });
}

function validateUpload(mimeType, size, { maxBytes }) {
  const normalizedType = String(mimeType || '').split(';', 1)[0].trim().toLowerCase();
  if (!ALLOWED_TYPES[normalizedType]) throw unsupportedTypeError(normalizedType || '(none)');
  if (size > maxBytes) throw tooLargeError(maxBytes);
  return normalizedType;
}

// Never accepts a caller-supplied storage path — the resource id (already
// validated as a UUID by the caller) is the only variable component, so a
// path-traversal payload has nothing to attach to.
function storageKey(resourceId) { return `resources/${resourceId}`; }

class MemoryFileStorage {
  constructor() { this.files = new Map(); }
  async upload(resourceId, buffer, mimeType) { this.files.set(storageKey(resourceId), { buffer, mimeType }); }
  async download(resourceId) { return this.files.get(storageKey(resourceId)) || null; }
  async remove(resourceId) { this.files.delete(storageKey(resourceId)); }
}

class SupabaseStorageAdapter {
  constructor({ supabaseUrl, serviceRoleKey, fetchImpl = fetch }) {
    if (!supabaseUrl || !serviceRoleKey) throw new Error('Supabase storage adapter requires URL and service role key');
    this.base = `${String(supabaseUrl).replace(/\/$/, '')}/storage/v1`;
    this.key = serviceRoleKey;
    this.fetch = fetchImpl;
    this.bucketEnsured = false;
  }

  authHeaders(extra = {}) {
    return { apikey: this.key, Authorization: `Bearer ${this.key}`, ...extra };
  }

  async ensureBucket() {
    if (this.bucketEnsured) return;
    const response = await this.fetch(`${this.base}/bucket`, {
      method: 'POST',
      headers: this.authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ id: BUCKET, name: BUCKET, public: false })
    });
    // 409/400 both mean "already exists" across Supabase Storage versions — idempotent either way.
    if (response.ok || response.status === 409 || response.status === 400) { this.bucketEnsured = true; return; }
    throw new Error(`could not provision storage bucket (${response.status})`);
  }

  async upload(resourceId, buffer, mimeType) {
    await this.ensureBucket();
    const response = await this.fetch(`${this.base}/object/${BUCKET}/${storageKey(resourceId)}`, {
      method: 'POST',
      headers: this.authHeaders({ 'Content-Type': mimeType, 'x-upsert': 'true' }),
      body: buffer
    });
    if (!response.ok) throw new Error(`resource file upload failed (${response.status})`);
  }

  async download(resourceId) {
    const response = await this.fetch(`${this.base}/object/${BUCKET}/${storageKey(resourceId)}`, { headers: this.authHeaders() });
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`resource file download failed (${response.status})`);
    const mimeType = response.headers.get('content-type') || 'application/octet-stream';
    const buffer = Buffer.from(await response.arrayBuffer());
    return { buffer, mimeType };
  }

  async remove(resourceId) {
    await this.fetch(`${this.base}/object/${BUCKET}/${storageKey(resourceId)}`, { method: 'DELETE', headers: this.authHeaders() }).catch(() => {});
  }
}

module.exports = { MemoryFileStorage, SupabaseStorageAdapter, validateUpload, ALLOWED_TYPES, unsupportedTypeError, tooLargeError };
