import { GraphQLError } from 'graphql';
import { getProducts } from './data.js';

// In-memory cart store
const cartState = {
  id: 'cart-1',
  items: [] // { id: string, productId: string, quantity: number }
};

// Helper: base64 cursor encoding and decoding
export function encodeCursor(index) {
  return Buffer.from(`product:${index}`, 'utf-8').toString('base64');
}

export function decodeCursor(cursor) {
  if (!cursor) return -1;
  try {
    const str = Buffer.from(cursor, 'base64').toString('utf-8');
    const match = str.match(/^product:(\d+)$/);
    if (match) {
      return parseInt(match[1], 10);
    }
  } catch (err) {
    // ignore
  }
  return -1;
}

function calculateCart(cart, allProducts) {
  let totalCount = 0;
  let totalPrice = 0;

  const items = cart.items.map((item) => {
    const product = allProducts.find((p) => String(p.id) === String(item.productId)) || null;
    const price = product ? product.price : 0;
    totalCount += item.quantity;
    totalPrice += price * item.quantity;

    return {
      id: item.id,
      productId: String(item.productId),
      product,
      quantity: item.quantity
    };
  });

  return {
    id: cart.id,
    items,
    totalCount,
    totalPrice: parseFloat(totalPrice.toFixed(2))
  };
}

export const resolvers = {
  Query: {
    products: async (_, { first, after }) => {
      const allProducts = await getProducts();
      let startIndex = 0;

      if (after) {
        const decodedIndex = decodeCursor(after);
        if (decodedIndex >= 0) {
          startIndex = decodedIndex + 1;
        } else {
          // Fallback: check if after matches an item ID directly
          const itemIndex = allProducts.findIndex((p) => String(p.id) === String(after));
          if (itemIndex >= 0) {
            startIndex = itemIndex + 1;
          }
        }
      }

      const limit = Math.max(1, first);
      const sliced = allProducts.slice(startIndex, startIndex + limit);

      const edges = sliced.map((product, idx) => ({
        cursor: encodeCursor(startIndex + idx),
        node: product
      }));

      const hasNextPage = startIndex + limit < allProducts.length;
      const endCursor = edges.length > 0 ? edges[edges.length - 1].cursor : null;

      return {
        edges,
        pageInfo: {
          endCursor,
          hasNextPage
        }
      };
    },

    product: async (_, { id }) => {
      const allProducts = await getProducts();
      return allProducts.find((p) => String(p.id) === String(id)) || null;
    },

    productSearch: async (_, { query }) => {
      if (!query || !query.trim()) {
        return [];
      }
      const q = query.trim().toLowerCase();
      const allProducts = await getProducts();
      return allProducts.filter((product) => {
        const titleMatch = product.title && product.title.toLowerCase().includes(q);
        const descMatch = product.description && product.description.toLowerCase().includes(q);
        const catMatch = product.category && product.category.toLowerCase().includes(q);
        return titleMatch || descMatch || catMatch;
      });
    },

    productsByIds: async (_, { ids }) => {
      const allProducts = await getProducts();
      return ids.map((id) => allProducts.find((p) => String(p.id) === String(id)) || null);
    },

    categories: async (_, { names }) => {
      const allProducts = await getProducts();
      return names.map((name) => {
        const prods = allProducts.filter(
          (p) => p.category && p.category.toLowerCase() === name.toLowerCase()
        );
        return {
          name,
          products: prods
        };
      });
    },

    cart: async () => {
      const allProducts = await getProducts();
      return calculateCart(cartState, allProducts);
    }
  },

  Mutation: {
    addToCart: async (_, { productId }) => {
      // Contract Requirement 6: Failure Condition for productId === '999'
      if (String(productId) === '999') {
        throw new GraphQLError('Product with ID 999 is unavailable or out of stock.');
      }

      const allProducts = await getProducts();
      const product = allProducts.find((p) => String(p.id) === String(productId));
      if (!product) {
        throw new GraphQLError(`Product with ID ${productId} not found.`);
      }

      const existingItem = cartState.items.find(
        (item) => String(item.productId) === String(productId)
      );

      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        cartState.items.push({
          id: `item-${productId}-${Date.now()}`,
          productId: String(productId),
          quantity: 1
        });
      }

      return calculateCart(cartState, allProducts);
    },

    removeFromCart: async (_, { itemId }) => {
      const allProducts = await getProducts();
      const index = cartState.items.findIndex(
        (item) => String(item.id) === String(itemId) || String(item.productId) === String(itemId)
      );

      if (index !== -1) {
        cartState.items.splice(index, 1);
      }

      return calculateCart(cartState, allProducts);
    },

    clearCart: async () => {
      cartState.items = [];
      const allProducts = await getProducts();
      return calculateCart(cartState, allProducts);
    }
  },

  CartItem: {
    product: async (item) => {
      if (item.product) return item.product;
      const allProducts = await getProducts();
      return allProducts.find((p) => String(p.id) === String(item.productId)) || null;
    }
  }
};
