export const PRODUCTS_QUERY = `
  query GetProducts($first: Int!, $after: String) {
    products(first: $first, after: $after) {
      edges {
        cursor
        node {
          id
          title
          price
          description
          category
          image
          rating {
            rate
            count
          }
        }
      }
      pageInfo {
        endCursor
        hasNextPage
      }
    }
  }
`;

export const PRODUCT_SEARCH_QUERY = `
  query ProductSearch($query: String!) {
    productSearch(query: $query) {
      id
      title
      price
      description
      category
      image
      rating {
        rate
        count
      }
    }
  }
`;

export const PRODUCTS_BY_IDS_QUERY = `
  query ProductsByIds($ids: [ID!]!) {
    productsByIds(ids: $ids) {
      id
      title
      price
      description
      category
      image
      rating {
        rate
        count
      }
    }
  }
`;

export const CART_QUERY = `
  query GetCart {
    cart {
      id
      items {
        id
        productId
        quantity
        product {
          id
          title
          price
          image
        }
      }
      totalCount
      totalPrice
    }
  }
`;

export const ADD_TO_CART_MUTATION = `
  mutation AddToCart($productId: ID!) {
    addToCart(productId: $productId) {
      id
      items {
        id
        productId
        quantity
        product {
          id
          title
          price
          image
        }
      }
      totalCount
      totalPrice
    }
  }
`;

export const REMOVE_FROM_CART_MUTATION = `
  mutation RemoveFromCart($itemId: ID!) {
    removeFromCart(itemId: $itemId) {
      id
      items {
        id
        productId
        quantity
        product {
          id
          title
          price
          image
        }
      }
      totalCount
      totalPrice
    }
  }
`;

export const CLEAR_CART_MUTATION = `
  mutation ClearCart {
    clearCart {
      id
      items {
        id
        productId
        quantity
      }
      totalCount
      totalPrice
    }
  }
`;
