/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable eslint-comments/no-unlimited-disable */
/* eslint-disable */
import type * as AdminTypes from './admin.types.js';

export type SetupShopQueryVariables = AdminTypes.Exact<{ [key: string]: never; }>;


export type SetupShopQuery = { shop: Pick<AdminTypes.Shop, 'name' | 'currencyCode'>, locations: { nodes: Array<Pick<AdminTypes.Location, 'id' | 'name'>> }, publications: { nodes: Array<Pick<AdminTypes.Publication, 'id' | 'name'>> } };

export type SetupDefinitionQueryVariables = AdminTypes.Exact<{
  type: AdminTypes.Scalars['String']['input'];
}>;


export type SetupDefinitionQuery = { metaobjectDefinitionByType?: AdminTypes.Maybe<Pick<AdminTypes.MetaobjectDefinition, 'id'>> };

export type SetupDefinitionCreateMutationVariables = AdminTypes.Exact<{
  definition: AdminTypes.MetaobjectDefinitionCreateInput;
}>;


export type SetupDefinitionCreateMutation = { metaobjectDefinitionCreate?: AdminTypes.Maybe<{ metaobjectDefinition?: AdminTypes.Maybe<Pick<AdminTypes.MetaobjectDefinition, 'id'>>, userErrors: Array<Pick<AdminTypes.MetaobjectUserError, 'field' | 'message'>> }> };

export type SetupMetaobjectUpsertMutationVariables = AdminTypes.Exact<{
  handle: AdminTypes.MetaobjectHandleInput;
  metaobject: AdminTypes.MetaobjectUpsertInput;
}>;


export type SetupMetaobjectUpsertMutation = { metaobjectUpsert?: AdminTypes.Maybe<{ metaobject?: AdminTypes.Maybe<Pick<AdminTypes.Metaobject, 'id'>>, userErrors: Array<Pick<AdminTypes.MetaobjectUserError, 'field' | 'message'>> }> };

export type SetupProductSetMutationVariables = AdminTypes.Exact<{
  identifier?: AdminTypes.InputMaybe<AdminTypes.ProductSetIdentifiers>;
  input: AdminTypes.ProductSetInput;
}>;


export type SetupProductSetMutation = { productSet?: AdminTypes.Maybe<{ product?: AdminTypes.Maybe<(
      Pick<AdminTypes.Product, 'id'>
      & { variantsCount?: AdminTypes.Maybe<Pick<AdminTypes.Count, 'count'>> }
    )>, userErrors: Array<Pick<AdminTypes.ProductSetUserError, 'field' | 'message'>> }> };

export type SetupPublishMutationVariables = AdminTypes.Exact<{
  id: AdminTypes.Scalars['ID']['input'];
  input: Array<AdminTypes.PublicationInput> | AdminTypes.PublicationInput;
}>;


export type SetupPublishMutation = { publishablePublish?: AdminTypes.Maybe<{ userErrors: Array<Pick<AdminTypes.UserError, 'field' | 'message'>> }> };

export type SetupWebhookMutationVariables = AdminTypes.Exact<{
  topic: AdminTypes.WebhookSubscriptionTopic;
  webhookSubscription: AdminTypes.WebhookSubscriptionInput;
}>;


export type SetupWebhookMutation = { webhookSubscriptionCreate?: AdminTypes.Maybe<{ webhookSubscription?: AdminTypes.Maybe<Pick<AdminTypes.WebhookSubscription, 'id'>>, userErrors: Array<Pick<AdminTypes.UserError, 'field' | 'message'>> }> };

export type UploadProductMediaQueryVariables = AdminTypes.Exact<{
  handle: AdminTypes.Scalars['String']['input'];
}>;


export type UploadProductMediaQuery = { productByIdentifier?: AdminTypes.Maybe<(
    Pick<AdminTypes.Product, 'id'>
    & { media: { nodes: Array<Pick<AdminTypes.ExternalVideo, 'id' | 'alt'> | Pick<AdminTypes.MediaImage, 'id' | 'alt'> | Pick<AdminTypes.Model3d, 'id' | 'alt'> | Pick<AdminTypes.Video, 'id' | 'alt'>> }, variants: { nodes: Array<(
        Pick<AdminTypes.ProductVariant, 'id'>
        & { selectedOptions: Array<Pick<AdminTypes.SelectedOption, 'name' | 'value'>> }
      )> } }
  )> };

export type UploadStagedTargetsMutationVariables = AdminTypes.Exact<{
  input: Array<AdminTypes.StagedUploadInput> | AdminTypes.StagedUploadInput;
}>;


export type UploadStagedTargetsMutation = { stagedUploadsCreate?: AdminTypes.Maybe<{ stagedTargets?: AdminTypes.Maybe<Array<(
      Pick<AdminTypes.StagedMediaUploadTarget, 'url' | 'resourceUrl'>
      & { parameters: Array<Pick<AdminTypes.StagedUploadParameter, 'name' | 'value'>> }
    )>>, userErrors: Array<Pick<AdminTypes.UserError, 'field' | 'message'>> }> };

export type UploadAddMediaMutationVariables = AdminTypes.Exact<{
  product: AdminTypes.ProductUpdateInput;
  media?: AdminTypes.InputMaybe<Array<AdminTypes.CreateMediaInput> | AdminTypes.CreateMediaInput>;
}>;


export type UploadAddMediaMutation = { productUpdate?: AdminTypes.Maybe<{ product?: AdminTypes.Maybe<{ media: { nodes: Array<Pick<AdminTypes.ExternalVideo, 'id' | 'alt'> | Pick<AdminTypes.MediaImage, 'id' | 'alt'> | Pick<AdminTypes.Model3d, 'id' | 'alt'> | Pick<AdminTypes.Video, 'id' | 'alt'>> } }>, userErrors: Array<Pick<AdminTypes.UserError, 'field' | 'message'>> }> };

export type UploadReplaceFilesMutationVariables = AdminTypes.Exact<{
  files: Array<AdminTypes.FileUpdateInput> | AdminTypes.FileUpdateInput;
}>;


export type UploadReplaceFilesMutation = { fileUpdate?: AdminTypes.Maybe<{ files?: AdminTypes.Maybe<Array<Pick<AdminTypes.ExternalVideo, 'id'> | Pick<AdminTypes.GenericFile, 'id'> | Pick<AdminTypes.MediaImage, 'id'> | Pick<AdminTypes.Model3d, 'id'> | Pick<AdminTypes.Video, 'id'>>>, userErrors: Array<Pick<AdminTypes.FilesUserError, 'field' | 'message'>> }> };

export type UploadMediaStatusQueryVariables = AdminTypes.Exact<{
  ids: Array<AdminTypes.Scalars['ID']['input']> | AdminTypes.Scalars['ID']['input'];
}>;


export type UploadMediaStatusQuery = { nodes: Array<AdminTypes.Maybe<Pick<AdminTypes.MediaImage, 'id' | 'status'>>> };

export type UploadVariantImagesMutationVariables = AdminTypes.Exact<{
  productId: AdminTypes.Scalars['ID']['input'];
  variants: Array<AdminTypes.ProductVariantsBulkInput> | AdminTypes.ProductVariantsBulkInput;
}>;


export type UploadVariantImagesMutation = { productVariantsBulkUpdate?: AdminTypes.Maybe<{ userErrors: Array<Pick<AdminTypes.ProductVariantsBulkUpdateUserError, 'field' | 'message'>> }> };

interface GeneratedQueryTypes {
  "#graphql\n  query SetupShop {\n    shop {\n      name\n      currencyCode\n    }\n    locations(first: 1) {\n      nodes {\n        id\n        name\n      }\n    }\n    publications(first: 25) {\n      nodes {\n        id\n        name\n      }\n    }\n  }\n": {return: SetupShopQuery, variables: SetupShopQueryVariables},
  "#graphql\n  query SetupDefinition($type: String!) {\n    metaobjectDefinitionByType(type: $type) {\n      id\n    }\n  }\n": {return: SetupDefinitionQuery, variables: SetupDefinitionQueryVariables},
  "#graphql\n  query UploadProductMedia($handle: String!) {\n    productByIdentifier(identifier: { handle: $handle }) {\n      id\n      media(first: 100) {\n        nodes {\n          id\n          alt\n        }\n      }\n      variants(first: 250) {\n        nodes {\n          id\n          selectedOptions {\n            name\n            value\n          }\n        }\n      }\n    }\n  }\n": {return: UploadProductMediaQuery, variables: UploadProductMediaQueryVariables},
  "#graphql\n  query UploadMediaStatus($ids: [ID!]!) {\n    nodes(ids: $ids) {\n      ... on MediaImage {\n        id\n        status\n      }\n    }\n  }\n": {return: UploadMediaStatusQuery, variables: UploadMediaStatusQueryVariables},
}

interface GeneratedMutationTypes {
  "#graphql\n  mutation SetupDefinitionCreate($definition: MetaobjectDefinitionCreateInput!) {\n    metaobjectDefinitionCreate(definition: $definition) {\n      metaobjectDefinition {\n        id\n      }\n      userErrors {\n        field\n        message\n      }\n    }\n  }\n": {return: SetupDefinitionCreateMutation, variables: SetupDefinitionCreateMutationVariables},
  "#graphql\n  mutation SetupMetaobjectUpsert($handle: MetaobjectHandleInput!, $metaobject: MetaobjectUpsertInput!) {\n    metaobjectUpsert(handle: $handle, metaobject: $metaobject) {\n      metaobject {\n        id\n      }\n      userErrors {\n        field\n        message\n      }\n    }\n  }\n": {return: SetupMetaobjectUpsertMutation, variables: SetupMetaobjectUpsertMutationVariables},
  "#graphql\n  mutation SetupProductSet($identifier: ProductSetIdentifiers, $input: ProductSetInput!) {\n    productSet(synchronous: true, identifier: $identifier, input: $input) {\n      product {\n        id\n        variantsCount {\n          count\n        }\n      }\n      userErrors {\n        field\n        message\n      }\n    }\n  }\n": {return: SetupProductSetMutation, variables: SetupProductSetMutationVariables},
  "#graphql\n  mutation SetupPublish($id: ID!, $input: [PublicationInput!]!) {\n    publishablePublish(id: $id, input: $input) {\n      userErrors {\n        field\n        message\n      }\n    }\n  }\n": {return: SetupPublishMutation, variables: SetupPublishMutationVariables},
  "#graphql\n  mutation SetupWebhook($topic: WebhookSubscriptionTopic!, $webhookSubscription: WebhookSubscriptionInput!) {\n    webhookSubscriptionCreate(topic: $topic, webhookSubscription: $webhookSubscription) {\n      webhookSubscription {\n        id\n      }\n      userErrors {\n        field\n        message\n      }\n    }\n  }\n": {return: SetupWebhookMutation, variables: SetupWebhookMutationVariables},
  "#graphql\n  mutation UploadStagedTargets($input: [StagedUploadInput!]!) {\n    stagedUploadsCreate(input: $input) {\n      stagedTargets {\n        url\n        resourceUrl\n        parameters {\n          name\n          value\n        }\n      }\n      userErrors {\n        field\n        message\n      }\n    }\n  }\n": {return: UploadStagedTargetsMutation, variables: UploadStagedTargetsMutationVariables},
  "#graphql\n  mutation UploadAddMedia($product: ProductUpdateInput!, $media: [CreateMediaInput!]) {\n    productUpdate(product: $product, media: $media) {\n      product {\n        media(first: 100) {\n          nodes {\n            id\n            alt\n          }\n        }\n      }\n      userErrors {\n        field\n        message\n      }\n    }\n  }\n": {return: UploadAddMediaMutation, variables: UploadAddMediaMutationVariables},
  "#graphql\n  mutation UploadReplaceFiles($files: [FileUpdateInput!]!) {\n    fileUpdate(files: $files) {\n      files {\n        id\n      }\n      userErrors {\n        field\n        message\n      }\n    }\n  }\n": {return: UploadReplaceFilesMutation, variables: UploadReplaceFilesMutationVariables},
  "#graphql\n  mutation UploadVariantImages($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {\n    productVariantsBulkUpdate(productId: $productId, variants: $variants) {\n      userErrors {\n        field\n        message\n      }\n    }\n  }\n": {return: UploadVariantImagesMutation, variables: UploadVariantImagesMutationVariables},
}
declare module '@shopify/admin-api-client' {
  type InputMaybe<T> = AdminTypes.InputMaybe<T>;
  interface AdminQueries extends GeneratedQueryTypes {}
  interface AdminMutations extends GeneratedMutationTypes {}
}
