import React from 'react';
import { useCart } from '../hooks/useCart.js';
import { ShoppingBag, Star, AlertTriangle } from 'lucide-react';

export function ProductCard({ product, isErrorDemo = false }) {
  const { addToCart } = useCart();

  const handleAdd = () => {
    addToCart(product);
  };

  return (
    <div className={`group relative flex flex-col rounded-2xl border transition-all duration-300 hover:shadow-xl overflow-hidden ${
      isErrorDemo
        ? 'border-amber-300 bg-amber-50/40 dark:border-amber-700/60 dark:bg-amber-950/20'
        : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
    }`}>
      {/* Category or Badge */}
      <div className="absolute top-3 left-3 z-10 flex gap-2">
        {isErrorDemo ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-2.5 py-0.5 text-xs font-semibold text-white shadow-sm">
            <AlertTriangle className="w-3 h-3" /> Rollback Demo
          </span>
        ) : (
          <span className="rounded-full bg-slate-900/80 backdrop-blur-sm px-2.5 py-0.5 text-xs font-medium text-white capitalize shadow-sm">
            {product.category || 'General'}
          </span>
        )}
      </div>

      {/* Product Image Container */}
      <div className="relative aspect-square w-full overflow-hidden bg-white p-6 flex items-center justify-center">
        <img
          src={product.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80'}
          alt={product.title}
          className="max-h-full max-w-full object-contain transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
      </div>

      {/* Product Details */}
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1 text-xs text-amber-500 font-medium">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>{product.rating?.rate || '4.5'}</span>
            <span className="text-slate-400">({product.rating?.count || 100})</span>
          </div>
          <span className="text-xs text-slate-400">ID: {product.id}</span>
        </div>

        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 line-clamp-2 min-h-[2.5rem]">
          {product.title}
        </h3>

        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
          {product.description}
        </p>

        <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
          <div>
            <span className="text-xs text-slate-400 block">Price</span>
            <span className="text-lg font-bold text-slate-900 dark:text-white">
              ${Number(product.price).toFixed(2)}
            </span>
          </div>

          <button
            data-testid={`add-to-cart-${product.id}`}
            onClick={handleAdd}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all active:scale-95 shadow-sm ${
              isErrorDemo
                ? 'bg-amber-600 hover:bg-amber-700 text-white focus:ring-amber-500'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white focus:ring-indigo-500'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Add to Cart</span>
          </button>
        </div>
      </div>
    </div>
  );
}
