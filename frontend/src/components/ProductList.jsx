import React from 'react';
import { ProductCard } from './ProductCard.jsx';
import { Loader2, ArrowDown } from 'lucide-react';

const ERROR_DEMO_PRODUCT = {
  id: '999',
  title: 'Out of Stock Test Product (Simulates Server Error)',
  price: 99.99,
  description: 'Click "Add to Cart" to test instant optimistic UI increment, server failure response, and automatic rollback.',
  category: 'testing',
  image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=500&q=80',
  rating: { rate: 1.0, count: 1 }
};

export function ProductList({ products, loading, error, hasNextPage, fetchNextPage }) {
  if (error && products.length === 0) {
    return (
      <div className="my-12 rounded-2xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-900 dark:bg-red-950/40">
        <p className="text-lg font-semibold text-red-800 dark:text-red-200">Unable to load catalog</p>
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Product List Container */}
      <div
        data-testid="product-list"
        className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        {/* Error Simulation Product Card for automated & manual verification */}
        <ProductCard product={ERROR_DEMO_PRODUCT} isErrorDemo={true} />

        {/* Regular Paginated Products */}
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {/* Pagination Controls */}
      <div className="flex flex-col items-center justify-center pt-6 pb-12">
        {hasNextPage ? (
          <button
            data-testid="next-page-button"
            onClick={fetchNextPage}
            disabled={loading}
            className="group inline-flex items-center gap-3 rounded-2xl bg-indigo-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-indigo-600/25 transition-all hover:bg-indigo-700 hover:shadow-indigo-600/40 active:scale-95 disabled:pointer-events-none disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Loading Next Page...</span>
              </>
            ) : (
              <>
                <span>Load More Products</span>
                <ArrowDown className="w-4 h-4 transition-transform group-hover:translate-y-0.5" />
              </>
            )}
          </button>
        ) : (
          <div className="rounded-xl bg-slate-100 dark:bg-slate-800 px-6 py-3 text-sm font-medium text-slate-500 dark:text-slate-400">
            All available products loaded
          </div>
        )}
      </div>
    </div>
  );
}
