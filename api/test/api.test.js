import assert from 'node:assert/strict';
import { resolvers, encodeCursor, decodeCursor } from '../src/resolvers.js';
import { resetProductCache } from '../src/data.js';

async function runTests() {
  console.log('--- Running API Resolver & Logic Tests ---');

  // 1. Cursor encoding/decoding test
  const cur4 = encodeCursor(4);
  assert.equal(decodeCursor(cur4), 4, 'Cursor decoding should recover index');
  console.log('✔ Cursor encode/decode passed');

  // 2. Cursor pagination test: first 5
  resetProductCache();
  const page1 = await resolvers.Query.products(null, { first: 5 });
  assert.equal(page1.edges.length, 5, 'Page 1 should have 5 edges');
  assert.ok(page1.pageInfo.hasNextPage, 'Page 1 should have next page');
  assert.ok(page1.pageInfo.endCursor, 'Page 1 should have endCursor');
  const firstId = page1.edges[0].node.id;
  const fifthId = page1.edges[4].node.id;
  console.log(`✔ Page 1 fetched products ${firstId} to ${fifthId}, endCursor=${page1.pageInfo.endCursor}`);

  // 3. Cursor pagination test: next 5 using endCursor
  const page2 = await resolvers.Query.products(null, { first: 5, after: page1.pageInfo.endCursor });
  assert.equal(page2.edges.length, 5, 'Page 2 should have 5 edges');
  const sixthId = page2.edges[0].node.id;
  assert.notEqual(sixthId, fifthId, 'Page 2 first product must not equal Page 1 last product');
  console.log(`✔ Page 2 fetched products ${sixthId} to ${page2.edges[4].node.id}`);

  // 4. Search query test
  const searchResults = await resolvers.Query.productSearch(null, { query: 'backpack' });
  assert.ok(searchResults.length > 0, 'Should find at least 1 backpack');
  console.log(`✔ Search for "backpack" returned ${searchResults.length} items`);

  // 5. Batch productsByIds test
  const batch = await resolvers.Query.productsByIds(null, { ids: ['1', '2', '3'] });
  assert.equal(batch.length, 3, 'Batch should return 3 items');
  assert.equal(batch[0].id, '1');
  assert.equal(batch[1].id, '2');
  assert.equal(batch[2].id, '3');
  console.log('✔ Batch query productsByIds returned all 3 products matching IDs');

  // 6. Cart mutations test
  await resolvers.Mutation.clearCart();
  const cartAfterAdd1 = await resolvers.Mutation.addToCart(null, { productId: '1' });
  assert.equal(cartAfterAdd1.totalCount, 1, 'Cart totalCount should be 1');
  assert.equal(cartAfterAdd1.items.length, 1);
  console.log('✔ addToCart(productId: 1) succeeded');

  // 7. Cart error test on product '999'
  let errorCaught = false;
  try {
    await resolvers.Mutation.addToCart(null, { productId: '999' });
  } catch (err) {
    errorCaught = true;
    assert.ok(err.message.includes('999'), 'Error message should mention 999');
  }
  assert.ok(errorCaught, 'addToCart with productId 999 MUST throw an error');
  console.log('✔ addToCart(productId: 999) correctly threw an error');

  console.log('All API tests passed successfully!');
}

runTests().catch((err) => {
  console.error('API Tests failed:', err);
  process.exit(1);
});
