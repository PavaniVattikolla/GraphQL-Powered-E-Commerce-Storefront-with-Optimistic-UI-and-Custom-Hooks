# Architecture Decision Record (ADR): Frontend Caching Strategy

## Status
Accepted

## Context
In building a modern, high-performance e-commerce storefront with a custom, lightweight GraphQL client (without heavyweight libraries like Apollo Client, Relay, or URQL), we need an explicit and robust caching strategy. E-commerce applications feature distinct read-heavy data paths (such as product browsing, catalog navigation, and category details) and transactional, write-heavy data paths (such as shopping cart updates, stock reservations, and checkout mutations).

Our primary goals are:
1. **Low Latency & High Responsiveness**: Eliminate redundant network requests for identical product queries and batch related lookups.
2. **Deterministic Optimistic UI**: Enable instant client updates for user actions (e.g., adding/removing items from cart) while maintaining a reliable rollback mechanism if the server returns an error.
3. **Low Complexity & Predictability**: Implement caching from first principles without introducing stale-while-revalidate edge cases or cache normalization synchronization bugs.
4. **Resilience & Fault Tolerance**: Allow the client to degrade gracefully when network conditions fluctuate.

---

## Decision

We adopt a **Multi-Tiered Hybrid Caching Strategy** combining:
1. **In-Memory Request Batching & Key-Value DataLoader Cache** for relational and entity lookups.
2. **Page-Level Accumulative Query State** for cursor-based product pagination.
3. **Snapshot-Based Optimistic Rollback State** for transactional cart mutations.
4. **Time-Based Cache-Control & HTTP Storing** for static assets and metadata.

### 1. Request Batching & DataLoader Entity Cache
For fetching individual items and resolving N+1 queries (e.g. `productsByIds(ids: [ID!]!)` or category lookups):
- We implement a custom `DataLoader` pattern.
- **Event-Loop Tick Batching**: Calls to `loader.load(id)` scheduled during the same JavaScript event loop tick are queued and dispatched as a single batched GraphQL query.
- **Per-Session Memoization Cache**: The `DataLoader` maintains an internal `Map<ID, Promise<Product>>`. Once an entity with an ID is loaded, subsequent calls within the session resolve instantly from memory, avoiding duplicate network queries.
- **Cache Clearing/Busting**: An explicit `loader.clear(id)` and `loader.clearAll()` API is provided for cache invalidation when entity mutations occur.

### 2. Accumulative Pagination State (Cursor-Based)
For catalog browsing (`products(first: Int!, after: String)`):
- Cursor pagination data is stored in accumulative array state (`edges` and `pageInfo`).
- Subsequent page fetches (`Load More`) append new edges to the current collection rather than replacing it.
- **Cursor Stability**: Each page is uniquely identified by the `endCursor`. Because cursors are opaque and stable pointers, newly added or deleted items don't shift offsets or cause item duplication.
- Caching is maintained at the component/hook level (`useProducts`), and can be cached by cursor key (`${first}:${after}`) to allow instant navigation across visited page segments.

### 3. Snapshot-Based Optimistic UI with Transactional Rollback
For mutations (`addToCart`, `removeFromCart`):
- Instead of waiting for a round-trip network response, the client updates the UI instantly:
  1. **Pre-mutation Snapshot**: A deep clone of the current cart state is captured.
  2. **Optimistic State Injection**: A temporary item with a generated ID (`temp-${Date.now()}`) and incremented cart count is immediately applied to the React state.
  3. **Network Dispatch**: The mutation request is sent asynchronously.
  4. **Reconciliation on Success**: The temporary item is replaced with the authoritative server-returned `Cart` entity.
  5. **Rollback on Failure**: If the server responds with a GraphQL or network error (such as product `999` failing with out-of-stock), the state is instantly reverted to the pre-mutation snapshot, and an error notification is triggered via `data-testid="error-toast"`.

### 4. Search Query Debouncing & Ephemeral Caching
For live search queries (`productSearch(query: String!)`):
- Queries are debounced by 300ms using `useDebounce`.
- A simple LRU/Map memoization cache maps normalized search query strings (`query.trim().toLowerCase()`) to their search results, preventing re-querying when users backspace or retype previously queried search terms.

---

## Invalidation Strategy

1. **Entity-Specific Invalidation**:
   - When a cart mutation succeeds or product status changes, affected cache keys are explicitly purged from the DataLoader via `clear(id)`.
2. **Cart State Authority**:
   - The server response of `addToCart` and `removeFromCart` returns the entire updated `Cart` object (`items`, `totalCount`, `totalPrice`). This server response serves as the single source of truth and replaces any optimistic state cleanly without complex partial cache patching.
3. **Search Invalidation**:
   - Search results are ephemeral and retained only during the session. If catalog mutations occur, the search cache is invalidated on demand.

---

## Trade-offs and Alternatives Considered

| Dimension | Our Approach (Custom Multi-Tiered) | Normalized Cache (Apollo / Relay InMemoryCache) | No Caching (Pure Network Fetches) |
|---|---|---|---|
| **Bundle Size** | Minimal (~2 KB, zero third-party client dependencies) | Heavy (~40-60 KB minified + gzipped) | 0 KB |
| **Complexity** | Low, easily debuggable, predictable mental model | High, complex normalization, dangling references | None |
| **Optimistic Rollback** | Clean snapshot rollback, zero ghost updates | Requires manual cache updates or optimisticResponse configuration | No optimistic UI possible |
| **Batching Efficiency** | Custom DataLoader batches identical tick requests to 1 HTTP call | Automatic via batching links | Causes N+1 network waterfall |
| **Cache Invalidation** | Explicit and deterministic | Complex normalization cascades and cache evictions | Not applicable |

---

## Consequences

### Positive
- **Instant UI Response**: Users see immediate feedback on cart changes without latency.
- **Zero N+1 Network Inefficiencies**: Batched DataLoader consolidates requests in the same event-loop tick into a single `productsByIds` call.
- **Guaranteed Consistency**: Rollback on failure ensures client state never gets out of sync with the backend.
- **Lightweight Architecture**: No dependencies on heavy GraphQL client libraries, fitting the requirement of building from scratch.

### Negative / Mitigations
- In-memory cache is per-session and resets upon page refresh.
  - *Mitigation*: Can optionally hydrate cart state from `localStorage` if persistent cross-session cart is desired.
- Large catalogs require careful memory management in long-running single-page sessions.
  - *Mitigation*: Limit search memoization map to the 50 most recent queries.
