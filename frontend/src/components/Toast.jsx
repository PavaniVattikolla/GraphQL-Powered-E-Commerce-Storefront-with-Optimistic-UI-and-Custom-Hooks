import React, { useEffect } from 'react';
import { useCart } from '../hooks/useCart.js';
import { AlertCircle, CheckCircle, X } from 'lucide-react';

export function Toast() {
  const { toast, closeToast } = useCart();

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      closeToast();
    }, 6000);
    return () => clearTimeout(timer);
  }, [toast, closeToast]);

  if (!toast) return null;

  const isError = toast.type === 'error';

  return (
    <div
      {...(isError ? { 'data-testid': 'error-toast' } : {})}
      className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-xl border transition-all animate-slide-up ${
        isError
          ? 'bg-red-50 text-red-900 border-red-200 dark:bg-red-950 dark:text-red-200 dark:border-red-800'
          : 'bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-800'
      }`}
      role="alert"
    >
      <div className="flex-shrink-0">
        {isError ? (
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
        ) : (
          <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        )}
      </div>

      <div className="flex-1 text-sm font-medium pr-2">
        <p className="font-semibold">{isError ? 'Action Failed' : 'Success'}</p>
        <p className="text-xs opacity-90">{toast.message}</p>
      </div>

      <button
        onClick={closeToast}
        className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-1 rounded transition-colors"
        aria-label="Close notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
