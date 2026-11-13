'use strict';

// Server-owned append-only access audit. The browser never writes to this
// store and the BFF never accepts actor identity from a request body.
const EVENT_NAME = /^(admin_access_granted|admin_access_denied|role_assigned|role_revoked)$/;
const RESOURCE_TYPE = /^(admin_route|admin_role)$/;
const HTTP_METHOD = /^(GET|POST|PATCH|PUT|DELETE)$/;
const ROUTE = /^\/[A-Za-z0-9_./-]{1,160}$/;
const METADATA_KEYS = new Set(['route', 'method', 'role', 'target_user_id', 'granted_role']);

function invalidAuditError(message) {
  return Object.assign(new Error(message), { code: 'invalid_audit_event', status: 500 });
}
function normalizeEvent(input = {}) {
  const eventName = String(input.eventName || '');
  const resourceType = String(input.resourceType || '');
  const actorUserId = String(input.actorUserId || '');
  const requestId = String(input.requestId || '');
  const metadata = input.metadata && typeof input.metadata === 'object' && !Array.isArray(input.metadata) ? input.metadata : {};
  if (!EVENT_NAME.test(eventName)) throw invalidAuditError('Unsupported audit event name.');
  if (!RESOURCE_TYPE.test(resourceType)) throw invalidAuditError('Unsupported audit resource type.');
  if (!actorUserId || actorUserId.length > 128 || !requestId || requestId.length > 80) throw invalidAuditError('Audit actor and request identifiers are required.');
  if (Object.keys(metadata).some(key => !METADATA_KEYS.has(key))) throw invalidAuditError('Audit metadata contains an unsupported field.');
  const safeMetadata = {};
  if (metadata.route !== undefined) {
    if (!ROUTE.test(String(metadata.route))) throw invalidAuditError('Audit route is invalid.');
    safeMetadata.route = String(metadata.route);
  }
  if (metadata.method !== undefined) {
    if (!HTTP_METHOD.test(String(metadata.method))) throw invalidAuditError('Audit method is invalid.');
    safeMetadata.method = String(metadata.method);
  }
  if (metadata.role !== undefined) {
    const role = String(metadata.role);
    if (!/^[a-z_]{1,40}$/.test(role)) throw invalidAuditError('Audit role is invalid.');
    safeMetadata.role = role;
  }
  if (metadata.target_user_id !== undefined) {
    const target = String(metadata.target_user_id);
    if (!target || target.length > 128) throw invalidAuditError('Audit target is invalid.');
    safeMetadata.target_user_id = target;
  }
  if (metadata.granted_role !== undefined) {
    const role = String(metadata.granted_role);
    if (!/^[a-z_]{1,40}$/.test(role)) throw invalidAuditError('Audit granted role is invalid.');
    safeMetadata.granted_role = role;
  }
  return {
    actor_user_id: actorUserId,
    event_name: eventName,
    resource_type: resourceType,
    resource_id: input.resourceId ? String(input.resourceId) : null,
    request_id: requestId,
    metadata: safeMetadata
  };
}

class MemoryAccessAuditStore {
  constructor() { this.events = []; }
  async record(input) {
    const event = { ...normalizeEvent(input), created_at: new Date().toISOString() };
    this.events.push(Object.freeze(event));
    return event;
  }
  list() { return this.events.slice(); }
}

class PostgrestAccessAuditStore {
  constructor({ supabaseUrl, serviceRoleKey, fetchImpl = fetch }) {
    if (!supabaseUrl || !serviceRoleKey) throw new Error('Supabase audit store requires URL and service role key');
    this.base = `${String(supabaseUrl).replace(/\/$/, '')}/rest/v1/audit_events`;
    this.key = serviceRoleKey;
    this.fetch = fetchImpl;
  }
  async record(input) {
    const event = normalizeEvent(input);
    const response = await this.fetch(this.base, {
      method: 'POST',
      headers: {
        apikey: this.key,
        Authorization: `Bearer ${this.key}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation'
      },
      body: JSON.stringify(event)
    });
    if (!response.ok) throw new Error(`access audit store error ${response.status}`);
    const text = await response.text();
    return text ? JSON.parse(text)?.[0] || event : event;
  }
}

module.exports = { EVENT_NAME, RESOURCE_TYPE, normalizeEvent, MemoryAccessAuditStore, PostgrestAccessAuditStore };
