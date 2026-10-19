import React from 'react';
import { useCart } from '../hooks/useCart.js';
import { X, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';

export function CartDrawer() {
  const { cart, isCartOpen, setIsCartOpen, removeFromCart, clearCart } = useCart();

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={() => setIsCartOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-slate-900 shadow-2xl flex flex-col">
          {/* Drawer Header */}
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Your Cart ({cart.totalCount})
              </h2>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {cart.items.length === 0 ? (
              <div className="py-16 text-center">
                <ShoppingBag className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700 mb-3" />
                <p className="text-base font-semibold text-slate-700 dark:text-slate-300">
                  Your cart is empty
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Add products to see instant optimistic updates in action.
                </p>
              </div>
            ) : (
              cart.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 rounded-xl border border-slate-100 p-3.5 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/30"
                >
                  <img
                    src={item.product?.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100'}
                    alt={item.product?.title || 'Product'}
                    className="h-16 w-16 object-contain rounded-lg bg-white p-1"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">
                      {item.product?.title || `Product ID ${item.productId}`}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Qty: {item.quantity} × ${Number(item.product?.price || 0).toFixed(2)}
                    </p>
                    <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                      ${(Number(item.product?.price || 0) * item.quantity).toFixed(2)}
                    </p>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Drawer Footer */}
          {cart.items.length > 0 && (
            <div className="border-t border-slate-200 p-6 space-y-4 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
              <div className="flex items-center justify-between text-base font-bold text-slate-900 dark:text-white">
                <span>Subtotal:</span>
                <span>${Number(cart.totalPrice).toFixed(2)}</span>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={clearCart}
                  className="flex-1 rounded-xl border border-slate-300 py-3 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
                >
                  Clear Cart
                </button>
                <button
                  onClick={() => alert('Checkout simulation successful!')}
                  className="flex-2 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-xs font-semibold text-white hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all"
                >
                  <span>Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
