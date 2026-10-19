import React from 'react';
import { Search, X, Loader2 } from 'lucide-react';

export function SearchBar({ searchTerm, setSearchTerm, isSearching }) {
  return (
    <div className="relative w-full max-w-xl mx-auto">
      <div className="relative flex items-center">
        <div className="pointer-events-none absolute left-4 text-slate-400">
          <Search className="w-5 h-5" />
        </div>

        <input
          type="text"
          data-testid="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search products (e.g. jacket, gold, backpack, ssd)..."
          className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-12 pr-12 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:focus:border-indigo-400 dark:focus:ring-indigo-400/20 transition-all"
        />

        <div className="absolute right-4 flex items-center gap-1.5">
          {isSearching && (
            <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
          )}

          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
