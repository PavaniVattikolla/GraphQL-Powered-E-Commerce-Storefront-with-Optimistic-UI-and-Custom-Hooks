import { graphqlFetch } from './graphqlClient.js';
import { PRODUCTS_BY_IDS_QUERY } from './queries.js';

export class DataLoader {
  constructor(batchFn) {
    if (typeof batchFn !== 'function') {
      throw new Error('DataLoader must be constructed with a batch loading function');
    }
    this.batchFn = batchFn;
    this.queue = [];
    this.scheduled = false;
    this.cache = new Map();
  }

  load(key) {
    const stringKey = String(key);

    if (this.cache.has(stringKey)) {
      return this.cache.get(stringKey);
    }

    const promise = new Promise((resolve, reject) => {
      this.queue.push({ key: stringKey, resolve, reject });

      if (!this.scheduled) {
        this.scheduled = true;
        // Schedule batch dispatch in the microtask queue (same event-loop tick)
        queueMicrotask(() => this.dispatch());
      }
    });

    this.cache.set(stringKey, promise);
    return promise;
  }

  loadMany(keys) {
    return Promise.all(keys.map((key) => this.load(key)));
  }

  async dispatch() {
    const activeQueue = this.queue;
    this.queue = [];
    this.scheduled = false;

    if (activeQueue.length === 0) return;

    // Deduplicate keys while preserving order
    const uniqueKeys = Array.from(new Set(activeQueue.map((item) => item.key)));

    try {
      const results = await this.batchFn(uniqueKeys);

      // Distribute each resolved product back to the matching promise caller
      activeQueue.forEach(({ key, resolve }) => {
        const index = uniqueKeys.indexOf(key);
        const product = results && results[index] !== undefined ? results[index] : null;
        resolve(product);
      });
    } catch (err) {
      activeQueue.forEach(({ reject }) => {
        reject(err);
      });
    }
  }

  clear(key) {
    this.cache.delete(String(key));
    return this;
  }

  clearAll() {
    this.cache.clear();
    return this;
  }
}

// Global Product DataLoader instance
export const productLoader = new DataLoader(async (ids) => {
  const response = await graphqlFetch(PRODUCTS_BY_IDS_QUERY, { ids });
  return response.data?.productsByIds || [];
});

// Verification Hook on window object as per Contract Specification 8
if (typeof window !== 'undefined') {
  window.productLoader = productLoader;
  window.triggerBatchFetch = async (customIds) => {
    productLoader.clearAll();
    const ids = Array.isArray(customIds) && customIds.length > 0 ? customIds : ['1', '2', '3'];
    const promises = ids.map((id) => productLoader.load(id));
    return await Promise.all(promises);
  };
}
