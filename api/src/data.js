import { INITIAL_PRODUCTS } from './mockData.js';

let cachedProducts = [...INITIAL_PRODUCTS];
let lastFetchTime = 0;
const CACHE_TTL_MS = 60 * 1000; // 1 minute

export async function getProducts() {
  const now = Date.now();
  if (cachedProducts.length > 0 && now - lastFetchTime < CACHE_TTL_MS) {
    return cachedProducts;
  }

  const apiUrl = process.env.FAKESTORE_API_URL || 'https://fakestoreapi.com';
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);

    const response = await fetch(`${apiUrl}/products`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' }
    });
    clearTimeout(timeout);

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        cachedProducts = data.map((item) => ({
          ...item,
          id: String(item.id),
          price: Number(item.price)
        }));
        lastFetchTime = now;
        return cachedProducts;
      }
    }
  } catch (err) {
    // Graceful fallback to initial mock data on network error or timeout
    // console.warn('Could not fetch from FakeStore API, using bundled mock data.');
  }

  return cachedProducts;
}

export function resetProductCache() {
  cachedProducts = [...INITIAL_PRODUCTS];
  lastFetchTime = 0;
}
