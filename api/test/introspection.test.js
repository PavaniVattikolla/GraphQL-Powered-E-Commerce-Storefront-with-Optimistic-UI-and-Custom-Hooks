import http from 'node:http';
import assert from 'node:assert/strict';
import { createYoga, createSchema } from 'graphql-yoga';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolvers } from '../src/resolvers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const typeDefs = fs.readFileSync(path.resolve(__dirname, '../schema.graphql'), 'utf-8');

const yoga = createYoga({
  schema: createSchema({ typeDefs, resolvers }),
  graphqlEndpoint: '/graphql'
});

const server = http.createServer(yoga);

server.listen(4001, async () => {
  try {
    const introspectionQuery = `
      query IntrospectionQuery {
        __schema {
          queryType { name }
          mutationType { name }
          types { name }
        }
      }
    `;

    const res = await fetch('http://localhost:4001/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ query: introspectionQuery })
    });

    assert.equal(res.status, 200, 'Introspection query should return HTTP 200');
    const json = await res.json();
    assert.ok(json.data, 'Response should contain data');
    assert.ok(json.data.__schema, 'Response should contain __schema');
    assert.equal(json.data.__schema.queryType.name, 'Query');
    assert.equal(json.data.__schema.mutationType.name, 'Mutation');

    console.log('✔ Introspection query test passed with 200 OK and valid __schema!');
  } catch (err) {
    console.error('Introspection test failed:', err);
    process.exitCode = 1;
  } finally {
    server.close();
  }
});
