'use strict';
const assert = require('node:assert/strict');
const { MemoryMutationStore, executeIdempotentMutation, payloadHash } = require('../bff/src/idempotency');

(async () => {
  const store = new MemoryMutationStore();
  const id = '11111111-1111-4111-8111-111111111111';
  let calls = 0;
  const first = await executeIdempotentMutation({ store, ownerId: 'user-a', endpoint: '/v1/me', clientMutationId: id, payload: { display_name: 'A' }, execute: async () => { calls += 1; return { status: 200, body: { display_name: 'A' } }; } });
  const retry = await executeIdempotentMutation({ store, ownerId: 'user-a', endpoint: '/v1/me', clientMutationId: id, payload: { display_name: 'A' }, execute: async () => { calls += 1; return { status: 200, body: { display_name: 'unexpected' } }; } });
  assert.equal(first.replayed, false);
  assert.equal(retry.replayed, true);
  assert.deepEqual(retry.body, { display_name: 'A' });
  assert.equal(calls, 1, 'exact retry executes the mutation once');
  await assert.rejects(() => executeIdempotentMutation({ store, ownerId: 'user-a', endpoint: '/v1/me', clientMutationId: id, payload: { display_name: 'B' }, execute: async () => ({ status: 200, body: {} }) }), error => error.code === 'mutation_conflict' && error.status === 409);
  const otherId = '22222222-2222-4222-8222-222222222222';
  await executeIdempotentMutation({ store, ownerId: 'user-a', endpoint: '/v1/me', clientMutationId: otherId, payload: { display_name: 'B' }, execute: async () => ({ status: 200, body: { display_name: 'B' } }) });
  await executeIdempotentMutation({ store, ownerId: 'user-b', endpoint: '/v1/me', clientMutationId: id, payload: { display_name: 'B' }, execute: async () => ({ status: 200, body: { display_name: 'B' } }) });
  assert.notEqual(payloadHash({ a: 1, b: 2 }), payloadHash({ a: 1, b: 3 }));
  console.log('Client mutation idempotence contract: PASS');
})();
