import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { graphqlFetch } from '../api/graphqlClient.js';
import { CART_QUERY, ADD_TO_CART_MUTATION, REMOVE_FROM_CART_MUTATION, CLEAR_CART_MUTATION } from '../api/queries.js';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState({
    id: 'cart-1',
    items: [],
    totalCount: 0,
    totalPrice: 0
  });
  const [cartCount, setCartCount] = useState(0);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [toast, setToast] = useState(null); // { id, message, type: 'error' | 'success' }

  // Sync initial cart from server on load
  useEffect(() => {
    graphqlFetch(CART_QUERY)
      .then((res) => {
        const serverCart = res.data?.cart;
        if (serverCart) {
          setCart(serverCart);
          setCartCount(serverCart.totalCount || 0);
        }
      })
      .catch(() => {
        // Safe to ignore initial load error if offline
      });
  }, []);

  const showToast = useCallback((message, type = 'error') => {
    setToast({
      id: Date.now(),
      message,
      type
    });
  }, []);

  const closeToast = useCallback(() => {
    setToast(null);
  }, []);

  // Optimistic Add to Cart with Transactional Rollback
  const addToCart = useCallback(
    async (productOrId) => {
      const productId = String(productOrId?.id !== undefined ? productOrId.id : productOrId);
      const productPrice = typeof productOrId === 'object' && productOrId?.price ? Number(productOrId.price) : 0;

      // 1. Snapshot previous state for rollback
      const snapshotCart = {
        ...cart,
        items: cart.items.map((item) => ({ ...item }))
      };
      const snapshotCount = cartCount;

      // 2. Instant Optimistic UI Update (immediate cart-count and cart items increment)
      setCartCount((prevCount) => prevCount + 1);

      const tempItemId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      setCart((prev) => {
        const existingIdx = prev.items.findIndex((item) => String(item.productId) === productId);
        let updatedItems;

        if (existingIdx >= 0) {
          updatedItems = prev.items.map((item, idx) =>
            idx === existingIdx ? { ...item, quantity: item.quantity + 1 } : item
          );
        } else {
          const fallbackProduct =
            typeof productOrId === 'object' && productOrId?.title
              ? productOrId
              : { id: productId, title: `Product ${productId}`, price: productPrice, image: '' };

          updatedItems = [
            ...prev.items,
            {
              id: tempItemId,
              productId,
              product: fallbackProduct,
              quantity: 1
            }
          ];
        }

        const newCount = prev.totalCount + 1;
        const newPrice = parseFloat((prev.totalPrice + productPrice).toFixed(2));

        return {
          ...prev,
          items: updatedItems,
          totalCount: newCount,
          totalPrice: newPrice
        };
      });

      // 3. Dispatch GraphQL Mutation to Server
      try {
        const response = await graphqlFetch(ADD_TO_CART_MUTATION, { productId });
        const serverCart = response.data?.addToCart;
        if (serverCart) {
          // Reconcile optimistic item with authoritative server state
          setCart(serverCart);
          setCartCount(serverCart.totalCount);
        }
      } catch (err) {
        // 4. Rollback on Failure: revert cart-count and items to pre-mutation snapshot
        console.warn(`[Optimistic UI Rollback] Error adding product ${productId}:`, err.message);
        setCart(snapshotCart);
        setCartCount(snapshotCount);

        // 5. Trigger Error Toast with data-testid="error-toast"
        showToast(err.message || `Failed to add product ${productId} to cart`, 'error');
      }
    },
    [cart, cartCount, showToast]
  );

  // Optimistic Remove from Cart
  const removeFromCart = useCallback(
    async (itemId) => {
      const snapshotCart = {
        ...cart,
        items: cart.items.map((item) => ({ ...item }))
      };
      const snapshotCount = cartCount;

      const targetItem = cart.items.find(
        (item) => String(item.id) === String(itemId) || String(item.productId) === String(itemId)
      );
      const itemQty = targetItem ? targetItem.quantity : 1;
      const itemPrice = targetItem?.product?.price ? targetItem.product.price * itemQty : 0;

      // Optimistic decrement
      setCartCount((prev) => Math.max(0, prev - itemQty));
      setCart((prev) => ({
        ...prev,
        items: prev.items.filter(
          (item) => String(item.id) !== String(itemId) && String(item.productId) !== String(itemId)
        ),
        totalCount: Math.max(0, prev.totalCount - itemQty),
        totalPrice: Math.max(0, parseFloat((prev.totalPrice - itemPrice).toFixed(2)))
      }));

      try {
        const response = await graphqlFetch(REMOVE_FROM_CART_MUTATION, { itemId: String(itemId) });
        const serverCart = response.data?.removeFromCart;
        if (serverCart) {
          setCart(serverCart);
          setCartCount(serverCart.totalCount);
        }
      } catch (err) {
        // Rollback
        setCart(snapshotCart);
        setCartCount(snapshotCount);
        showToast(err.message || 'Failed to remove item from cart', 'error');
      }
    },
    [cart, cartCount, showToast]
  );

  const clearCart = useCallback(async () => {
    try {
      const response = await graphqlFetch(CLEAR_CART_MUTATION);
      const serverCart = response.data?.clearCart;
      if (serverCart) {
        setCart(serverCart);
        setCartCount(0);
      }
    } catch (err) {
      showToast(err.message || 'Failed to clear cart', 'error');
    }
  }, [showToast]);

  const value = {
    cart,
    cartCount,
    isCartOpen,
    setIsCartOpen,
    toast,
    showToast,
    closeToast,
    addToCart,
    removeFromCart,
    clearCart
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
