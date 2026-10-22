/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable eslint-comments/no-unlimited-disable */
/* eslint-disable */
import type * as StorefrontTypes from './storefront.types.js';

export type CatalogueQueryVariables = StorefrontTypes.Exact<{
  handle: StorefrontTypes.Scalars['String']['input'];
}>;


export type CatalogueQuery = { product?: StorefrontTypes.Maybe<(
    Pick<StorefrontTypes.Product, 'id'>
    & { options: Array<(
      Pick<StorefrontTypes.ProductOption, 'name'>
      & { optionValues: Array<Pick<StorefrontTypes.ProductOptionValue, 'name'>> }
    )>, variants: { nodes: Array<(
        Pick<StorefrontTypes.ProductVariant, 'id' | 'availableForSale'>
        & { selectedOptions: Array<Pick<StorefrontTypes.SelectedOption, 'name' | 'value'>>, price: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>, compareAtPrice?: StorefrontTypes.Maybe<Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>> }
      )> } }
  )>, colourways: { nodes: Array<(
      Pick<StorefrontTypes.Metaobject, 'handle'>
      & { fields: Array<Pick<StorefrontTypes.MetaobjectField, 'key' | 'value'>> }
    )> }, content: { nodes: Array<{ fields: Array<Pick<StorefrontTypes.MetaobjectField, 'key' | 'value'>> }> }, faq: { nodes: Array<{ fields: Array<Pick<StorefrontTypes.MetaobjectField, 'key' | 'value'>> }> } };

export type CartFieldsFragment = (
  Pick<StorefrontTypes.Cart, 'id' | 'checkoutUrl'>
  & { lines: { nodes: Array<(
      Pick<StorefrontTypes.CartLine, 'id' | 'quantity'>
      & { attributes: Array<Pick<StorefrontTypes.Attribute, 'key' | 'value'>>, merchandise: (
        Pick<StorefrontTypes.ProductVariant, 'id'>
        & { selectedOptions: Array<Pick<StorefrontTypes.SelectedOption, 'name' | 'value'>> }
      ) }
    ) | (
      Pick<StorefrontTypes.ComponentizableCartLine, 'id' | 'quantity'>
      & { attributes: Array<Pick<StorefrontTypes.Attribute, 'key' | 'value'>>, merchandise: (
        Pick<StorefrontTypes.ProductVariant, 'id'>
        & { selectedOptions: Array<Pick<StorefrontTypes.SelectedOption, 'name' | 'value'>> }
      ) }
    )> } }
);

export type CartQueryVariables = StorefrontTypes.Exact<{
  id: StorefrontTypes.Scalars['ID']['input'];
}>;


export type CartQuery = { cart?: StorefrontTypes.Maybe<(
    Pick<StorefrontTypes.Cart, 'id' | 'checkoutUrl'>
    & { lines: { nodes: Array<(
        Pick<StorefrontTypes.CartLine, 'id' | 'quantity'>
        & { attributes: Array<Pick<StorefrontTypes.Attribute, 'key' | 'value'>>, merchandise: (
          Pick<StorefrontTypes.ProductVariant, 'id'>
          & { selectedOptions: Array<Pick<StorefrontTypes.SelectedOption, 'name' | 'value'>> }
        ) }
      ) | (
        Pick<StorefrontTypes.ComponentizableCartLine, 'id' | 'quantity'>
        & { attributes: Array<Pick<StorefrontTypes.Attribute, 'key' | 'value'>>, merchandise: (
          Pick<StorefrontTypes.ProductVariant, 'id'>
          & { selectedOptions: Array<Pick<StorefrontTypes.SelectedOption, 'name' | 'value'>> }
        ) }
      )> } }
  )> };

export type CartCreateMutationVariables = StorefrontTypes.Exact<{
  lines?: StorefrontTypes.InputMaybe<Array<StorefrontTypes.CartLineInput> | StorefrontTypes.CartLineInput>;
}>;


export type CartCreateMutation = { cartCreate?: StorefrontTypes.Maybe<{ cart?: StorefrontTypes.Maybe<(
      Pick<StorefrontTypes.Cart, 'id' | 'checkoutUrl'>
      & { lines: { nodes: Array<(
          Pick<StorefrontTypes.CartLine, 'id' | 'quantity'>
          & { attributes: Array<Pick<StorefrontTypes.Attribute, 'key' | 'value'>>, merchandise: (
            Pick<StorefrontTypes.ProductVariant, 'id'>
            & { selectedOptions: Array<Pick<StorefrontTypes.SelectedOption, 'name' | 'value'>> }
          ) }
        ) | (
          Pick<StorefrontTypes.ComponentizableCartLine, 'id' | 'quantity'>
          & { attributes: Array<Pick<StorefrontTypes.Attribute, 'key' | 'value'>>, merchandise: (
            Pick<StorefrontTypes.ProductVariant, 'id'>
            & { selectedOptions: Array<Pick<StorefrontTypes.SelectedOption, 'name' | 'value'>> }
          ) }
        )> } }
    )>, userErrors: Array<Pick<StorefrontTypes.CartUserError, 'message'>> }> };

export type CartLinesAddMutationVariables = StorefrontTypes.Exact<{
  cartId: StorefrontTypes.Scalars['ID']['input'];
  lines: Array<StorefrontTypes.CartLineInput> | StorefrontTypes.CartLineInput;
}>;


export type CartLinesAddMutation = { cartLinesAdd?: StorefrontTypes.Maybe<{ cart?: StorefrontTypes.Maybe<(
      Pick<StorefrontTypes.Cart, 'id' | 'checkoutUrl'>
      & { lines: { nodes: Array<(
          Pick<StorefrontTypes.CartLine, 'id' | 'quantity'>
          & { attributes: Array<Pick<StorefrontTypes.Attribute, 'key' | 'value'>>, merchandise: (
            Pick<StorefrontTypes.ProductVariant, 'id'>
            & { selectedOptions: Array<Pick<StorefrontTypes.SelectedOption, 'name' | 'value'>> }
          ) }
        ) | (
          Pick<StorefrontTypes.ComponentizableCartLine, 'id' | 'quantity'>
          & { attributes: Array<Pick<StorefrontTypes.Attribute, 'key' | 'value'>>, merchandise: (
            Pick<StorefrontTypes.ProductVariant, 'id'>
            & { selectedOptions: Array<Pick<StorefrontTypes.SelectedOption, 'name' | 'value'>> }
          ) }
        )> } }
    )>, userErrors: Array<Pick<StorefrontTypes.CartUserError, 'message'>> }> };

export type CartLinesUpdateMutationVariables = StorefrontTypes.Exact<{
  cartId: StorefrontTypes.Scalars['ID']['input'];
  lines: Array<StorefrontTypes.CartLineUpdateInput> | StorefrontTypes.CartLineUpdateInput;
}>;


export type CartLinesUpdateMutation = { cartLinesUpdate?: StorefrontTypes.Maybe<{ cart?: StorefrontTypes.Maybe<(
      Pick<StorefrontTypes.Cart, 'id' | 'checkoutUrl'>
      & { lines: { nodes: Array<(
          Pick<StorefrontTypes.CartLine, 'id' | 'quantity'>
          & { attributes: Array<Pick<StorefrontTypes.Attribute, 'key' | 'value'>>, merchandise: (
            Pick<StorefrontTypes.ProductVariant, 'id'>
            & { selectedOptions: Array<Pick<StorefrontTypes.SelectedOption, 'name' | 'value'>> }
          ) }
        ) | (
          Pick<StorefrontTypes.ComponentizableCartLine, 'id' | 'quantity'>
          & { attributes: Array<Pick<StorefrontTypes.Attribute, 'key' | 'value'>>, merchandise: (
            Pick<StorefrontTypes.ProductVariant, 'id'>
            & { selectedOptions: Array<Pick<StorefrontTypes.SelectedOption, 'name' | 'value'>> }
          ) }
        )> } }
    )>, userErrors: Array<Pick<StorefrontTypes.CartUserError, 'message'>> }> };

export type CartLinesRemoveMutationVariables = StorefrontTypes.Exact<{
  cartId: StorefrontTypes.Scalars['ID']['input'];
  lineIds: Array<StorefrontTypes.Scalars['ID']['input']> | StorefrontTypes.Scalars['ID']['input'];
}>;


export type CartLinesRemoveMutation = { cartLinesRemove?: StorefrontTypes.Maybe<{ cart?: StorefrontTypes.Maybe<(
      Pick<StorefrontTypes.Cart, 'id' | 'checkoutUrl'>
      & { lines: { nodes: Array<(
          Pick<StorefrontTypes.CartLine, 'id' | 'quantity'>
          & { attributes: Array<Pick<StorefrontTypes.Attribute, 'key' | 'value'>>, merchandise: (
            Pick<StorefrontTypes.ProductVariant, 'id'>
            & { selectedOptions: Array<Pick<StorefrontTypes.SelectedOption, 'name' | 'value'>> }
          ) }
        ) | (
          Pick<StorefrontTypes.ComponentizableCartLine, 'id' | 'quantity'>
          & { attributes: Array<Pick<StorefrontTypes.Attribute, 'key' | 'value'>>, merchandise: (
            Pick<StorefrontTypes.ProductVariant, 'id'>
            & { selectedOptions: Array<Pick<StorefrontTypes.SelectedOption, 'name' | 'value'>> }
          ) }
        )> } }
    )>, userErrors: Array<Pick<StorefrontTypes.CartUserError, 'message'>> }> };

interface GeneratedQueryTypes {
  "#graphql\n  query Catalogue($handle: String!) @inContext(country: IN) {\n    product(handle: $handle) {\n      id\n      options {\n        name\n        optionValues {\n          name\n        }\n      }\n      variants(first: 250) {\n        nodes {\n          id\n          availableForSale\n          selectedOptions {\n            name\n            value\n          }\n          price {\n            amount\n            currencyCode\n          }\n          compareAtPrice {\n            amount\n            currencyCode\n          }\n        }\n      }\n    }\n    colourways: metaobjects(type: \"colourway\", first: 50) {\n      nodes {\n        handle\n        fields {\n          key\n          value\n        }\n      }\n    }\n    content: metaobjects(type: \"site_content\", first: 1) {\n      nodes {\n        fields {\n          key\n          value\n        }\n      }\n    }\n    faq: metaobjects(type: \"faq_item\", first: 50) {\n      nodes {\n        fields {\n          key\n          value\n        }\n      }\n    }\n  }\n": {return: CatalogueQuery, variables: CatalogueQueryVariables},
  "#graphql\n  query Cart($id: ID!) @inContext(country: IN) {\n    cart(id: $id) {\n      ...CartFields\n    }\n  }\n  #graphql\n  fragment CartFields on Cart {\n    id\n    checkoutUrl\n    lines(first: 100) {\n      nodes {\n        id\n        quantity\n        attributes {\n          key\n          value\n        }\n        merchandise {\n          ... on ProductVariant {\n            id\n            selectedOptions {\n              name\n              value\n            }\n          }\n        }\n      }\n    }\n  }\n\n": {return: CartQuery, variables: CartQueryVariables},
}

interface GeneratedMutationTypes {
  "#graphql\n  mutation CartCreate($lines: [CartLineInput!]) @inContext(country: IN) {\n    cartCreate(input: { lines: $lines, buyerIdentity: { countryCode: IN } }) {\n      cart {\n        ...CartFields\n      }\n      userErrors {\n        message\n      }\n    }\n  }\n  #graphql\n  fragment CartFields on Cart {\n    id\n    checkoutUrl\n    lines(first: 100) {\n      nodes {\n        id\n        quantity\n        attributes {\n          key\n          value\n        }\n        merchandise {\n          ... on ProductVariant {\n            id\n            selectedOptions {\n              name\n              value\n            }\n          }\n        }\n      }\n    }\n  }\n\n": {return: CartCreateMutation, variables: CartCreateMutationVariables},
  "#graphql\n  mutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) @inContext(country: IN) {\n    cartLinesAdd(cartId: $cartId, lines: $lines) {\n      cart {\n        ...CartFields\n      }\n      userErrors {\n        message\n      }\n    }\n  }\n  #graphql\n  fragment CartFields on Cart {\n    id\n    checkoutUrl\n    lines(first: 100) {\n      nodes {\n        id\n        quantity\n        attributes {\n          key\n          value\n        }\n        merchandise {\n          ... on ProductVariant {\n            id\n            selectedOptions {\n              name\n              value\n            }\n          }\n        }\n      }\n    }\n  }\n\n": {return: CartLinesAddMutation, variables: CartLinesAddMutationVariables},
  "#graphql\n  mutation CartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) @inContext(country: IN) {\n    cartLinesUpdate(cartId: $cartId, lines: $lines) {\n      cart {\n        ...CartFields\n      }\n      userErrors {\n        message\n      }\n    }\n  }\n  #graphql\n  fragment CartFields on Cart {\n    id\n    checkoutUrl\n    lines(first: 100) {\n      nodes {\n        id\n        quantity\n        attributes {\n          key\n          value\n        }\n        merchandise {\n          ... on ProductVariant {\n            id\n            selectedOptions {\n              name\n              value\n            }\n          }\n        }\n      }\n    }\n  }\n\n": {return: CartLinesUpdateMutation, variables: CartLinesUpdateMutationVariables},
  "#graphql\n  mutation CartLinesRemove($cartId: ID!, $lineIds: [ID!]!) @inContext(country: IN) {\n    cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {\n      cart {\n        ...CartFields\n      }\n      userErrors {\n        message\n      }\n    }\n  }\n  #graphql\n  fragment CartFields on Cart {\n    id\n    checkoutUrl\n    lines(first: 100) {\n      nodes {\n        id\n        quantity\n        attributes {\n          key\n          value\n        }\n        merchandise {\n          ... on ProductVariant {\n            id\n            selectedOptions {\n              name\n              value\n            }\n          }\n        }\n      }\n    }\n  }\n\n": {return: CartLinesRemoveMutation, variables: CartLinesRemoveMutationVariables},
}
declare module '@shopify/storefront-api-client' {
  type InputMaybe<T> = StorefrontTypes.InputMaybe<T>;
  interface StorefrontQueries extends GeneratedQueryTypes {}
  interface StorefrontMutations extends GeneratedMutationTypes {}
}
