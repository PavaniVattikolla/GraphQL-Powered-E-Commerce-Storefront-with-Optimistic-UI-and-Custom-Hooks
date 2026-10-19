import React, { useState } from 'react';
import { CartProvider } from './context/CartContext.jsx';
import { Header } from './components/Header.jsx';
import { SearchBar } from './components/SearchBar.jsx';
import { ProductList } from './components/ProductList.jsx';
import { ProductCard } from './components/ProductCard.jsx';
import { CartDrawer } from './components/CartDrawer.jsx';
import { Toast } from './components/Toast.jsx';
import { useProducts } from './hooks/useProducts.js';
import { useDebounce } from './hooks/useDebounce.js';
import { useProductSearch } from './hooks/useProductSearch.js';
// Import dataLoader to register window.triggerBatchFetch
import './api/dataLoader.js';
import { Sparkles, Zap, RefreshCw, Database } from 'lucide-react';

function StorefrontContent() {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 350);

  const { products, loading, error, hasNextPage, fetchNextPage } = useProducts(6);
  const { results: searchResults, loading: searchLoading } = useProductSearch(debouncedSearch);

  const isSearchActive = Boolean(debouncedSearch.trim());

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex flex-col">
      <Header />

      <main className="flex-1 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 w-full space-y-10">
        {/* Hero Section & Architecture Highlights */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 px-6 py-12 text-white shadow-2xl sm:px-12 sm:py-16">
          <div className="relative z-10 max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-xs font-semibold backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Full-Stack GraphQL Implementation</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">
              High-Performance E-Commerce Storefront
            </h1>
            <p className="text-sm sm:text-base text-indigo-100/90 leading-relaxed">
              Engineered with a custom lightweight GraphQL client, Relay-style cursor-based pagination,
              instant optimistic UI updates with automatic rollback, event-loop DataLoader batching, and debounced search.
            </p>

            {/* Feature Pills */}
            <div className="pt-2 flex flex-wrap gap-2.5 text-xs font-medium">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-1.5 backdrop-blur-sm">
                <Zap className="w-3.5 h-3.5 text-amber-300" /> Optimistic UI Updates
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-1.5 backdrop-blur-sm">
                <RefreshCw className="w-3.5 h-3.5 text-cyan-300" /> Cursor Pagination
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-1.5 backdrop-blur-sm">
                <Database className="w-3.5 h-3.5 text-emerald-300" /> DataLoader Batching
              </span>
            </div>
          </div>
        </section>

        {/* Debounced Search Section */}
        <section className="space-y-4">
          <SearchBar
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            isSearching={searchLoading}
          />
        </section>

        {/* Main Products or Search Results */}
        {isSearchActive ? (
          <section className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Search Results for "{debouncedSearch}"
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Debounced live search results ({searchResults.length} items found)
                </p>
              </div>
              <button
                onClick={() => setSearchTerm('')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
              >
                Clear Search
              </button>
            </div>

            {searchLoading ? (
              <div className="py-16 text-center text-slate-400">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent" />
                <p className="mt-3 text-sm font-medium">Searching catalog...</p>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 py-16 text-center dark:border-slate-800">
                <p className="text-base font-medium text-slate-600 dark:text-slate-400">
                  No products matched "{debouncedSearch}"
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {searchResults.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </section>
        ) : (
          <section className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Product Catalog
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Showing {products.length} paginated items (cursor-based pagination)
                </p>
              </div>
            </div>

            <ProductList
              products={products}
              loading={loading}
              error={error}
              hasNextPage={hasNextPage}
              fetchNextPage={fetchNextPage}
            />
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
        <p>GraphQL-Powered E-Commerce Storefront • Engineered with First-Principles Optimistic UI</p>
      </footer>

      {/* Cart Slide-Over Drawer */}
      <CartDrawer />

      {/* Toast Notification for Success / Error Rollback */}
      <Toast />
    </div>
  );
}

export default function App() {
  return (
    <CartProvider>
      <StorefrontContent />
    </CartProvider>
  );
}
