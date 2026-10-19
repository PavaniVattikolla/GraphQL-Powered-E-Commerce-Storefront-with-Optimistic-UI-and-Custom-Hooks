import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createYoga, createSchema } from 'graphql-yoga';
import { resolvers } from './resolvers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load schema.graphql
const schemaPath = path.resolve(__dirname, '../schema.graphql');
const typeDefs = fs.readFileSync(schemaPath, 'utf-8');

const schema = createSchema({
  typeDefs,
  resolvers
});

const yoga = createYoga({
  schema,
  graphqlEndpoint: '/graphql',
  cors: {
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS', 'HEAD'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
  },
  graphiql: true,
  healthCheckEndpoint: '/health',
  maskedErrors: false
});

const server = http.createServer((req, res) => {
  // Direct healthcheck handling for / or /health
  if (req.url === '/' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', service: 'ecommerce-graphql-api' }));
    return;
  }
  return yoga(req, res);
});

const PORT = parseInt(process.env.API_PORT || '4000', 10);
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 GraphQL API Server running at http://0.0.0.0:${PORT}/graphql`);
});
