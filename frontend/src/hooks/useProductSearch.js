import { useState, useEffect, useRef } from 'react';
import { graphqlFetch } from '../api/graphqlClient.js';
import { PRODUCT_SEARCH_QUERY } from '../api/queries.js';

// Ephemeral in-memory search cache as documented in ADR
const searchCache = new Map();

export function useProductSearch(debouncedQuery) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const activeRequestIdRef = useRef(0);

  useEffect(() => {
    const trimmed = (debouncedQuery || '').trim();

    if (!trimmed) {
      setResults([]);
      setLoading(false);
      setError(null);
      return;
    }

    const cacheKey = trimmed.toLowerCase();
    if (searchCache.has(cacheKey)) {
      setResults(searchCache.get(cacheKey));
      setLoading(false);
      setError(null);
      return;
    }

    const currentRequestId = ++activeRequestIdRef.current;
    setLoading(true);
    setError(null);

    graphqlFetch(PRODUCT_SEARCH_QUERY, { query: trimmed })
      .then((res) => {
        if (currentRequestId === activeRequestIdRef.current) {
          const items = res.data?.productSearch || [];
          searchCache.set(cacheKey, items);
          setResults(items);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (currentRequestId === activeRequestIdRef.current) {
          setError(err.message || 'Product search failed');
          setLoading(false);
        }
      });
  }, [debouncedQuery]);

  return { results, loading, error };
}
