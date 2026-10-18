'use strict';

function isHttpsUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password;
  } catch { return false; }
}

function validPublishedRow(row, now = new Date()) {
  if (!row || typeof row !== 'object' || Array.isArray(row)) return false;
  for (const field of ['id', 'title', 'source', 'source_url', 'document_url', 'reference_date', 'retrieved_at', 'fresh_until']) {
    if (typeof row[field] !== 'string' || !row[field].trim()) return false;
  }
  const referenceTime = Date.parse(row.reference_date);
  const retrievedTime = Date.parse(row.retrieved_at);
  const freshUntil = Date.parse(row.fresh_until);
  return isHttpsUrl(row.source_url) && isHttpsUrl(row.document_url)
    && Number.isFinite(referenceTime) && Number.isFinite(retrievedTime) && Number.isFinite(freshUntil)
    && retrievedTime >= referenceTime && retrievedTime <= now.getTime() && freshUntil > now.getTime();
}

class PostgrestBrvmPublicationStore {
  constructor({ supabaseUrl, serviceRoleKey, fetchImpl = fetch, clock = () => new Date() }) {
    this.supabaseUrl = supabaseUrl.replace(/\/+$/, '');
    this.serviceRoleKey = serviceRoleKey;
    this.fetchImpl = fetchImpl;
    this.clock = clock;
  }

  async listPublished() {
    const columns = 'id,title,source,source_url,document_url,reference_date,retrieved_at,fresh_until';
    const query = `?select=${encodeURIComponent(columns)}&order=reference_date.desc`;
    const response = await this.fetchImpl(`${this.supabaseUrl}/rest/v1/dda_brvm_publications${query}`, {
      method: 'GET',
      headers: {
        apikey: this.serviceRoleKey,
        Authorization: `Bearer ${this.serviceRoleKey}`,
        Accept: 'application/json'
      }
    });
    const text = await response.text();
    if (!response.ok) throw new Error('brvm_publications_store_failed');
    let rows;
    try { rows = text ? JSON.parse(text) : []; } catch { throw new Error('brvm_publications_store_invalid_json'); }
    if (!Array.isArray(rows)) throw new Error('brvm_publications_store_invalid_shape');
    const now = this.clock();
    return rows.filter(row => validPublishedRow(row, now)).map(row => ({
      id: row.id,
      title: row.title,
      source: row.source,
      sourceUrl: row.source_url,
      documentUrl: row.document_url,
      referenceDate: row.reference_date,
      retrievedAt: row.retrieved_at,
      verificationStatus: 'verified',
      freshnessStatus: 'current',
      redistributionRights: 'authorized'
    }));
  }
}

module.exports = { PostgrestBrvmPublicationStore, validPublishedRow, isHttpsUrl };
