'use strict';

const TABLES = Object.freeze({
  lesson_progress: { table: 'dda_lesson_progress', owner: 'owner_id' },
  journal_entries: { table: 'dda_journal_entries', owner: 'owner_id' },
  journal_plans: { table: 'dda_journal_plans', owner: 'owner_id' },
  preferences: { table: 'dda_preferences', owner: 'owner_id', order: 'updated_at.asc' }
});

class PostgrestBusinessStore {
  constructor({ supabaseUrl, serviceRoleKey, fetchImpl = fetch }) {
    if (!supabaseUrl || !serviceRoleKey) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
    this.base = `${supabaseUrl.replace(/\/$/, '')}/rest/v1`;
    this.key = serviceRoleKey;
    this.fetch = fetchImpl;
  }

  async request(table, query = '', options = {}) {
    const response = await this.fetch(`${this.base}/${table}${query}`, {
      ...options,
      headers: {
        apikey: this.key,
        Authorization: `Bearer ${this.key}`,
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    });
    if (!response.ok) throw new Error(`business store error ${response.status}`);
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  }

  async exportUserData(userId) {
    const result = {};
    for (const [name, spec] of Object.entries(TABLES)) {
      const order = spec.order ? `&order=${spec.order}` : '';
      const query = `?${spec.owner}=eq.${encodeURIComponent(userId)}${order}`;
      result[name] = await this.request(spec.table, query, { method: 'GET' }) || [];
    }
    return result;
  }

  async deleteUserData(userId) {
    for (const spec of Object.values(TABLES)) {
      await this.request(spec.table, `?${spec.owner}=eq.${encodeURIComponent(userId)}`, { method: 'DELETE', headers: { Prefer: 'return=minimal' } });
    }
  }
}

class MemoryBusinessStore {
  constructor(seed = {}) {
    this.data = Object.fromEntries(Object.keys(TABLES).map(name => [name, [...(seed[name] || [])]]));
  }

  async exportUserData(userId) {
    return Object.fromEntries(Object.entries(this.data).map(([name, rows]) => [name, rows.filter(row => row.owner_id === userId)]));
  }

  async deleteUserData(userId) {
    for (const [name, rows] of Object.entries(this.data)) this.data[name] = rows.filter(row => row.owner_id !== userId);
  }
}

module.exports = { TABLES, PostgrestBusinessStore, MemoryBusinessStore };
