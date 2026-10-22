// Storefront API operations. Each `#graphql` string is typed by `pnpm codegen`.
// Data model: docs/Backend_Schema.md. Country IN sets INR prices and India availability.

export const PRODUCT_HANDLE = "flux-01";

export const CATALOGUE_QUERY = `#graphql
  query Catalogue($handle: String!) @inContext(country: IN) {
    product(handle: $handle) {
      id
      options {
        name
        optionValues {
          name
        }
      }
      variants(first: 250) {
        nodes {
          id
          availableForSale
          selectedOptions {
            name
            value
          }
          price {
            amount
            currencyCode
          }
          compareAtPrice {
            amount
            currencyCode
          }
        }
      }
    }
    colourways: metaobjects(type: "colourway", first: 50) {
      nodes {
        handle
        fields {
          key
          value
        }
      }
    }
    content: metaobjects(type: "site_content", first: 1) {
      nodes {
        fields {
          key
          value
        }
      }
    }
    faq: metaobjects(type: "faq_item", first: 50) {
      nodes {
        fields {
          key
          value
        }
      }
    }
  }
`;

const CART_FIELDS = `#graphql
  fragment CartFields on Cart {
    id
    checkoutUrl
    lines(first: 100) {
      nodes {
        id
        quantity
        attributes {
          key
          value
        }
        merchandise {
          ... on ProductVariant {
            id
            selectedOptions {
              name
              value
            }
          }
        }
      }
    }
  }
`;

export const CART_QUERY = `#graphql
  query Cart($id: ID!) @inContext(country: IN) {
    cart(id: $id) {
      ...CartFields
    }
  }
  ${CART_FIELDS}
`;

export const CART_CREATE = `#graphql
  mutation CartCreate($lines: [CartLineInput!]) @inContext(country: IN) {
    cartCreate(input: { lines: $lines, buyerIdentity: { countryCode: IN } }) {
      cart {
        ...CartFields
      }
      userErrors {
        message
      }
    }
  }
  ${CART_FIELDS}
`;

export const CART_LINES_ADD = `#graphql
  mutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) @inContext(country: IN) {
    cartLinesAdd(cartId: $cartId, lines: $lines) {
      cart {
        ...CartFields
      }
      userErrors {
        message
      }
    }
  }
  ${CART_FIELDS}
`;

export const CART_LINES_UPDATE = `#graphql
  mutation CartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) @inContext(country: IN) {
    cartLinesUpdate(cartId: $cartId, lines: $lines) {
      cart {
        ...CartFields
      }
      userErrors {
        message
      }
    }
  }
  ${CART_FIELDS}
`;

export const CART_LINES_REMOVE = `#graphql
  mutation CartLinesRemove($cartId: ID!, $lineIds: [ID!]!) @inContext(country: IN) {
    cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
      cart {
        ...CartFields
      }
      userErrors {
        message
      }
    }
  }
  ${CART_FIELDS}
`;
