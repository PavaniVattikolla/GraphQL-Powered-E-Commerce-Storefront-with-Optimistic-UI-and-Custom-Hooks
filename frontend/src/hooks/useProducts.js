import { useState, useEffect, useCallback, useRef } from 'react';
import { graphqlFetch } from '../api/graphqlClient.js';
import { PRODUCTS_QUERY } from '../api/queries.js';

export function useProducts(first = 6) {
  const [products, setProducts] = useState([]);
  const [pageInfo, setPageInfo] = useState({ endCursor: null, hasNextPage: true });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchProducts = useCallback(
    async (cursor = null, isInitial = false) => {
      setLoading(true);
      setError(null);
      try {
        const response = await graphqlFetch(PRODUCTS_QUERY, {
          first,
          after: cursor
        });

        if (!isMountedRef.current) return;

        const connection = response.data?.products;
        const edges = connection?.edges || [];
        const incomingPageInfo = connection?.pageInfo || { endCursor: null, hasNextPage: false };

        const newProducts = edges.map((edge) => edge.node);

        setProducts((prev) => {
          if (isInitial || !cursor) {
            return newProducts;
          }
          // Deduplicate based on item ID
          const existingIds = new Set(prev.map((p) => String(p.id)));
          const uniqueNew = newProducts.filter((p) => !existingIds.has(String(p.id)));
          return [...prev, ...uniqueNew];
        });

        setPageInfo(incomingPageInfo);
      } catch (err) {
        if (isMountedRef.current) {
          setError(err.message || 'Failed to fetch products');
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    },
    [first]
  );

  useEffect(() => {
    fetchProducts(null, true);
  }, [fetchProducts]);

  const fetchNextPage = useCallback(() => {
    if (pageInfo.hasNextPage && !loading) {
      fetchProducts(pageInfo.endCursor, false);
    }
  }, [pageInfo, loading, fetchProducts]);

  return {
    products,
    pageInfo,
    loading,
    error,
    fetchNextPage,
    hasNextPage: pageInfo.hasNextPage,
    refetch: () => fetchProducts(null, true)
  };
}
