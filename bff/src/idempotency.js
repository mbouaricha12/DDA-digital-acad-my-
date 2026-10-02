'use strict';

const { createHash } = require('node:crypto');

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonicalize(value[key])]));
  return value;
}

function payloadHash(value) {
  return createHash('sha256').update(JSON.stringify(canonicalize(value))).digest('hex');
}

function validateClientMutationId(value) {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

class MemoryMutationStore {
  constructor() { this.rows = new Map(); }
  key(ownerId, endpoint, clientMutationId) { return `${ownerId}\0${endpoint}\0${clientMutationId}`; }
  async get(ownerId, endpoint, clientMutationId) { return this.rows.get(this.key(ownerId, endpoint, clientMutationId)) || null; }
  async put(row) {
    const key = this.key(row.owner_id, row.endpoint, row.client_mutation_id);
    const existing = this.rows.get(key);
    if (existing) {
      if (existing.payload_hash !== row.payload_hash) throw Object.assign(new Error('clientMutationId was reused with a different payload'), { status: 409, code: 'mutation_conflict' });
      return existing;
    }
    this.rows.set(key, row);
    return row;
  }
}

async function executeIdempotentMutation({ store, ownerId, endpoint, clientMutationId, payload, execute }) {
  if (!store || !validateClientMutationId(clientMutationId)) throw Object.assign(new Error('A valid clientMutationId is required.'), { status: 400, code: 'invalid_client_mutation_id' });
  const hash = payloadHash(payload);
  const previous = await store.get(ownerId, endpoint, clientMutationId);
  if (previous) {
    if (previous.payload_hash !== hash) throw Object.assign(new Error('clientMutationId was reused with a different payload'), { status: 409, code: 'mutation_conflict' });
    return { replayed: true, status: previous.response_status, body: previous.response_body };
  }
  const result = await execute();
  const saved = await store.put({ owner_id: ownerId, endpoint, client_mutation_id: clientMutationId, payload_hash: hash, response_status: result.status, response_body: result.body, created_at: new Date().toISOString() });
  return { replayed: false, status: saved.response_status, body: saved.response_body };
}

module.exports = { canonicalize, payloadHash, validateClientMutationId, MemoryMutationStore, executeIdempotentMutation };
