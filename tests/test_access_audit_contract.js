'use strict';

const assert = require('node:assert/strict');
const { MemoryAccessAuditStore, normalizeEvent } = require('../bff/src/access-audit-store');

(async () => {
  const store = new MemoryAccessAuditStore();
  const event = await store.record({
    actorUserId: 'user-1',
    eventName: 'admin_access_granted',
    resourceType: 'admin_route',
    requestId: 'req_123',
    metadata: { route: '/v1/admin/overview', method: 'GET', role: 'admin' }
  });
  assert.equal(event.metadata.route, '/v1/admin/overview');
  assert.equal(store.list().length, 1);
  assert.throws(() => normalizeEvent({ actorUserId: 'user-1', eventName: 'journal_read', resourceType: 'admin_route', requestId: 'req_124' }), /Unsupported audit event/);
  assert.throws(() => normalizeEvent({ actorUserId: 'user-1', eventName: 'admin_access_granted', resourceType: 'admin_route', requestId: 'req_125', metadata: { note: 'free text must never enter audit' } }), () => true);
  assert.throws(() => normalizeEvent({ actorUserId: 'user-1', eventName: 'admin_access_granted', resourceType: 'admin_route', requestId: 'req_126', metadata: { route: 'https://evil.example' } }), /Audit route is invalid/);
  console.log('Access audit contract: PASS');
})().catch(error => { console.error(error); process.exitCode = 1; });
