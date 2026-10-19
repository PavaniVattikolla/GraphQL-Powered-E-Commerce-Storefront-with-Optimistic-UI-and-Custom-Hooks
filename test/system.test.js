import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { createYoga, createSchema } from 'graphql-yoga';
import { resolvers } from '../api/src/resolvers.js';
import { DataLoader } from '../frontend/src/api/dataLoader.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

async function runSystemVerification() {
  console.log('====================================================');
  console.log('   FULL SYSTEM & CORE REQUIREMENTS VERIFICATION    ');
  console.log('====================================================\n');

  // Requirement 9: ADR File Check
  console.log('Checking Requirement 9: Architecture Decision Record...');
  const adrPath = path.join(rootDir, 'docs', 'adr-caching-strategy.md');
  assert.ok(fs.existsSync(adrPath), 'docs/adr-caching-strategy.md must exist');
  const adrContent = fs.readFileSync(adrPath, 'utf-8');
  assert.ok(adrContent.includes('caching'), 'ADR must discuss caching');
  assert.ok(adrContent.includes('DataLoader'), 'ADR must discuss DataLoader');
  console.log('✔ Requirement 9 Passed: docs/adr-caching-strategy.md verified\n');

  // Requirement 10: .env.example Check
  console.log('Checking Requirement 10: .env.example documentation...');
  const envExamplePath = path.join(rootDir, '.env.example');
  assert.ok(fs.existsSync(envExamplePath), '.env.example must exist');
  const envContent = fs.readFileSync(envExamplePath, 'utf-8');
  assert.ok(envContent.includes('API_PORT='), '.env.example must define API_PORT');
  assert.ok(envContent.includes('FRONTEND_PORT='), '.env.example must define FRONTEND_PORT');
  assert.ok(envContent.includes('VITE_API_URL='), '.env.example must define VITE_API_URL');
  console.log('✔ Requirement 10 Passed: .env.example key-value definitions verified\n');

  // Requirement 1: docker-compose.yml Check
  console.log('Checking Requirement 1: docker-compose.yml configuration...');
  const dockerComposePath = path.join(rootDir, 'docker-compose.yml');
  assert.ok(fs.existsSync(dockerComposePath), 'docker-compose.yml must exist');
  const dockerComposeContent = fs.readFileSync(dockerComposePath, 'utf-8');
  assert.ok(dockerComposeContent.includes('frontend:'), 'docker-compose.yml must define frontend service');
  assert.ok(dockerComposeContent.includes('api:'), 'docker-compose.yml must define api service');
  assert.ok(dockerComposeContent.includes('condition: service_healthy'), 'frontend must depend on api service_healthy');
  assert.ok(dockerComposeContent.includes('/graphql'), 'api healthcheck must target /graphql');
  console.log('✔ Requirement 1 Passed: docker-compose.yml structure & healthchecks verified\n');

  // Start in-process Yoga Server on Port 4099 for API verification
  const schemaPath = path.join(rootDir, 'api', 'schema.graphql');
  const typeDefs = fs.readFileSync(schemaPath, 'utf-8');
  const schema = createSchema({ typeDefs, resolvers });
  const yoga = createYoga({ schema, graphqlEndpoint: '/graphql', maskedErrors: false });
  const server = http.createServer(yoga);

  await new Promise((resolve) => server.listen(4099, resolve));
  const graphqlEndpoint = 'http://localhost:4099/graphql';

  try {
    // Requirement 2: Introspection Query
    console.log('Checking Requirement 2: GraphQL Introspection Query...');
    const introspectionQuery = `
      query IntrospectionQuery {
        __schema {
          queryType { name }
          mutationType { name }
        }
      }
    `;
    const introRes = await fetch(graphqlEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: introspectionQuery })
    });
    assert.equal(introRes.status, 200, 'Introspection query should return HTTP 200');
    const introData = await introRes.json();
    assert.equal(introData.data.__schema.queryType.name, 'Query');
    assert.equal(introData.data.__schema.mutationType.name, 'Mutation');
    console.log('✔ Requirement 2 Passed: Introspection returned 200 OK with valid schema\n');

    // Requirement 3: Cursor-Based Pagination
    console.log('Checking Requirement 3: Cursor-Based Pagination...');
    const page1Query = `
      query Page1 {
        products(first: 5) {
          edges {
            cursor
            node { id title }
          }
          pageInfo {
            endCursor
            hasNextPage
          }
        }
      }
    `;
    const page1Res = await fetch(graphqlEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: page1Query })
    });
    const page1Json = await page1Res.json();
    const conn1 = page1Json.data.products;
    assert.equal(conn1.edges.length, 5, 'Page 1 must contain 5 products');
    assert.ok(conn1.pageInfo.hasNextPage, 'Page 1 hasNextPage must be true');
    assert.ok(conn1.pageInfo.endCursor, 'Page 1 must return endCursor');
    const endCursor1 = conn1.pageInfo.endCursor;

    // Fetch page 2 using endCursor
    const page2Query = `
      query Page2($after: String!) {
        products(first: 5, after: $after) {
          edges {
            cursor
            node { id title }
          }
          pageInfo {
            endCursor
            hasNextPage
          }
        }
      }
    `;
    const page2Res = await fetch(graphqlEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: page2Query, variables: { after: endCursor1 } })
    });
    const page2Json = await page2Res.json();
    const conn2 = page2Json.data.products;
    assert.equal(conn2.edges.length, 5, 'Page 2 must contain 5 products');
    assert.notEqual(conn2.edges[0].node.id, conn1.edges[4].node.id, 'Page 2 must not repeat last item of page 1');
    console.log(`✔ Requirement 3 Passed: Cursor pagination successfully retrieved next 5 items using endCursor "${endCursor1}"\n`);

    // Requirement 6: Failure Condition for productId 999
    console.log('Checking Requirement 6: Failure condition for product 999...');
    const add999Mutation = `
      mutation Add999 {
        addToCart(productId: "999") {
          totalCount
        }
      }
    `;
    const errRes = await fetch(graphqlEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: add999Mutation })
    });
    const errJson = await errRes.json();
    assert.ok(errJson.errors && errJson.errors.length > 0, 'Must return errors for productId 999');
    assert.ok(errJson.errors[0].message.includes('999'), 'Error message must specify 999');
    console.log('✔ Requirement 6 Passed: addToCart(productId: "999") returned GraphQL error\n');

    // Requirement 7: Product Search
    console.log('Checking Requirement 7: Product Search...');
    const searchQuery = `
      query Search {
        productSearch(query: "shoe") {
          id
          title
        }
      }
    `;
    const searchRes = await fetch(graphqlEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: searchQuery })
    });
    const searchJson = await searchRes.json();
    assert.ok(Array.isArray(searchJson.data.productSearch), 'Search must return array');
    console.log('✔ Requirement 7 Passed: productSearch query executed successfully\n');

    // Requirement 8: DataLoader Pattern
    console.log('Checking Requirement 8: DataLoader batching in same event-loop tick...');
    let batchCallCount = 0;
    let receivedBatchIds = [];

    const testLoader = new DataLoader(async (ids) => {
      batchCallCount++;
      receivedBatchIds = ids;
      const res = await fetch(graphqlEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `query BatchTest($ids: [ID!]!) { productsByIds(ids: $ids) { id title } }`,
          variables: { ids }
        })
      });
      const data = await res.json();
      return data.data.productsByIds;
    });

    // Request 3 products concurrently in same tick
    const p1 = testLoader.load('1');
    const p2 = testLoader.load('2');
    const p3 = testLoader.load('3');

    const [r1, r2, r3] = await Promise.all([p1, p2, p3]);

    assert.equal(batchCallCount, 1, 'DataLoader must only execute batch function ONCE for same-tick requests');
    assert.deepEqual(receivedBatchIds, ['1', '2', '3'], 'DataLoader must pass all 3 IDs in single batch');
    assert.equal(r1.id, '1');
    assert.equal(r2.id, '2');
    assert.equal(r3.id, '3');
    console.log('✔ Requirement 8 Passed: DataLoader batched 3 calls into 1 network request with variables { ids: ["1", "2", "3"] }\n');

    // Requirement 4 & 5 Check on Frontend Source Files
    console.log('Checking Frontend Contracts (data-testid attributes)...');
    const appSource = fs.readFileSync(path.join(rootDir, 'frontend', 'src', 'App.jsx'), 'utf-8');
    const headerSource = fs.readFileSync(path.join(rootDir, 'frontend', 'src', 'components', 'Header.jsx'), 'utf-8');
    const searchSource = fs.readFileSync(path.join(rootDir, 'frontend', 'src', 'components', 'SearchBar.jsx'), 'utf-8');
    const listSource = fs.readFileSync(path.join(rootDir, 'frontend', 'src', 'components', 'ProductList.jsx'), 'utf-8');
    const cardSource = fs.readFileSync(path.join(rootDir, 'frontend', 'src', 'components', 'ProductCard.jsx'), 'utf-8');
    const toastSource = fs.readFileSync(path.join(rootDir, 'frontend', 'src', 'components', 'Toast.jsx'), 'utf-8');
    const dataLoaderSource = fs.readFileSync(path.join(rootDir, 'frontend', 'src', 'api', 'dataLoader.js'), 'utf-8');

    assert.ok(headerSource.includes('data-testid="cart-count"'), 'Header must have data-testid="cart-count"');
    assert.ok(searchSource.includes('data-testid="search-input"'), 'SearchBar must have data-testid="search-input"');
    assert.ok(listSource.includes('data-testid="product-list"'), 'ProductList must have data-testid="product-list"');
    assert.ok(listSource.includes('data-testid="next-page-button"'), 'ProductList must have data-testid="next-page-button"');
    assert.ok(cardSource.includes('data-testid={`add-to-cart-${product.id}`}'), 'ProductCard must have data-testid="add-to-cart-<id>"');
    assert.ok(toastSource.includes('data-testid\': \'error-toast\''), 'Toast must render data-testid="error-toast" on error');
    assert.ok(dataLoaderSource.includes('window.triggerBatchFetch'), 'DataLoader must expose window.triggerBatchFetch');
    console.log('✔ Frontend DOM testid Contracts Passed!\n');

    console.log('====================================================');
    console.log('   🎉 ALL 10 CORE REQUIREMENTS VERIFIED 100%!       ');
    console.log('====================================================');
  } finally {
    server.close();
  }
}

runSystemVerification().catch((err) => {
  console.error('System verification failed:', err);
  process.exit(1);
});
