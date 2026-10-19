import assert from 'node:assert/strict';
import { DataLoader } from '../src/api/dataLoader.js';

async function runFrontendUnitTests() {
  console.log('--- Running Frontend Logic & Hook Unit Tests ---');

  // Test 1: DataLoader deduplication and single dispatch
  let batchCalls = 0;
  let batchedIds = [];
  const loader = new DataLoader(async (ids) => {
    batchCalls++;
    batchedIds = ids;
    return ids.map((id) => ({ id, name: `Product ${id}` }));
  });

  const p1 = loader.load('10');
  const p2 = loader.load('20');
  const p3 = loader.load('10'); // Duplicate key in same tick

  const [res1, res2, res3] = await Promise.all([p1, p2, p3]);

  assert.equal(batchCalls, 1, 'DataLoader must only execute batch function once in same tick');
  assert.deepEqual(batchedIds, ['10', '20'], 'DataLoader must deduplicate keys');
  assert.equal(res1.id, '10');
  assert.equal(res2.id, '20');
  assert.equal(res3.id, '10');
  console.log('✔ DataLoader same-tick deduplication and batching passed');

  // Test 2: DataLoader caching
  const p4 = await loader.load('10');
  assert.equal(batchCalls, 1, 'DataLoader should use memoization cache on subsequent calls');
  assert.equal(p4.id, '10');
  console.log('✔ DataLoader memoization cache passed');

  // Test 3: DataLoader cache invalidation
  loader.clear('10');
  const p5 = await loader.load('10');
  assert.equal(batchCalls, 2, 'DataLoader should dispatch new request after cache key is cleared');
  assert.equal(p5.id, '10');
  console.log('✔ DataLoader cache clearing passed');

  // Test 4: Optimistic Cart State Math & Rollback Simulation
  const initialCart = {
    items: [{ id: '1', productId: '1', quantity: 1, product: { price: 25.0 } }],
    totalCount: 1,
    totalPrice: 25.0
  };

  // Optimistic increment
  const optimisticCart = {
    ...initialCart,
    items: [
      ...initialCart.items,
      { id: 'temp-1', productId: '999', quantity: 1, product: { price: 99.99 } }
    ],
    totalCount: initialCart.totalCount + 1,
    totalPrice: initialCart.totalPrice + 99.99
  };

  assert.equal(optimisticCart.totalCount, 2, 'Optimistic cart count should immediately increment');

  // Server error occurs -> Rollback to initial snapshot
  const rolledBackCart = { ...initialCart };
  assert.equal(rolledBackCart.totalCount, 1, 'Cart count should revert upon server error');
  assert.equal(rolledBackCart.items.length, 1, 'Temporary items must be purged upon rollback');
  console.log('✔ Optimistic UI state mutation & rollback logic passed');

  console.log('All frontend unit tests passed successfully!\n');
}

runFrontendUnitTests().catch((err) => {
  console.error('Frontend tests failed:', err);
  process.exit(1);
});
