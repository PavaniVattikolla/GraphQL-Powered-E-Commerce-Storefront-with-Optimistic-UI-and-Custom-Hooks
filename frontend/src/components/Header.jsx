import React, { useState } from 'react';
import { useCart } from '../hooks/useCart.js';
import { ShoppingCart, Layers, Check } from 'lucide-react';

export function Header() {
  const { cartCount, setIsCartOpen } = useCart();
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchSuccess, setBatchSuccess] = useState(false);

  const handleRunDataLoader = async () => {
    if (typeof window.triggerBatchFetch === 'function') {
      setBatchLoading(true);
      try {
        const results = await window.triggerBatchFetch();
        console.log('[Header] triggerBatchFetch results:', results);
        setBatchSuccess(true);
        setTimeout(() => setBatchSuccess(false), 3000);
      } catch (err) {
        console.error('Batch fetch error:', err);
      } finally {
        setBatchLoading(false);
      }
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo & Project Title */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold text-lg shadow-md shadow-indigo-600/30">
            G
          </div>
          <div>
            <span className="text-base font-bold text-slate-900 dark:text-white block leading-tight">
              NovaStore
            </span>
            <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
              GraphQL + Optimistic UI
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {/* DataLoader Batch Fetch Trigger */}
          <button
            onClick={handleRunDataLoader}
            disabled={batchLoading}
            title="Runs DataLoader test: window.triggerBatchFetch() batches 3 requests into 1 GraphQL query"
            className={`hidden sm:inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold border transition-all ${
              batchSuccess
                ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200'
            }`}
          >
            {batchSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>DataLoader: 3 Items Batched!</span>
              </>
            ) : (
              <>
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                <span>{batchLoading ? 'Batching...' : 'Test DataLoader'}</span>
              </>
            )}
          </button>

          {/* Cart Button with Cart Counter */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative flex items-center gap-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 px-4 py-2 text-slate-800 dark:text-slate-100 transition-colors"
            aria-label="Open shopping cart"
          >
            <ShoppingCart className="w-5 h-5" />
            <span className="text-sm font-semibold hidden md:inline">Cart</span>

            {/* Cart Counter requirement: data-testid="cart-count" */}
            <span
              data-testid="cart-count"
              className="inline-flex items-center justify-center min-w-[1.4rem] h-5.5 px-1.5 rounded-full bg-indigo-600 text-xs font-bold text-white shadow-sm"
            >
              {cartCount}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
