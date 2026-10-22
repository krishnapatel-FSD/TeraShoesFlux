// A9: uploads the rendered product photos (`pnpm assets:images --upload`) to the Flux 01 product.
// Safe to re-run: a photo whose alt text is already on the product replaces that image in place.
// Each colour's variants get its side view as their variant image.
//
// The Admin API app also needs write_files (staged uploads) on top of the scopes setup.mts uses.
import { readFileSync } from "node:fs";
import { basename } from "node:path";
import { adminClient, run, userErrors } from "./admin.mts";
import { storeConfig } from "./store-config.mts";

interface UploadPhoto {
  colourway: { id: string; name: string };
  view: string;
  file: string;
  alt: string;
  size: number;
}

const PRODUCT_MEDIA = `#graphql
  query UploadProductMedia($handle: String!) {
    productByIdentifier(identifier: { handle: $handle }) {
      id
      media(first: 100) {
        nodes {
          id
          alt
        }
      }
      variants(first: 250) {
        nodes {
          id
          selectedOptions {
            name
            value
          }
        }
      }
    }
  }
`;

const STAGED_UPLOADS = `#graphql
  mutation UploadStagedTargets($input: [StagedUploadInput!]!) {
    stagedUploadsCreate(input: $input) {
      stagedTargets {
        url
        resourceUrl
        parameters {
          name
          value
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const ADD_MEDIA = `#graphql
  mutation UploadAddMedia($product: ProductUpdateInput!, $media: [CreateMediaInput!]) {
    productUpdate(product: $product, media: $media) {
      product {
        media(first: 100) {
          nodes {
            id
            alt
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const REPLACE_FILES = `#graphql
  mutation UploadReplaceFiles($files: [FileUpdateInput!]!) {
    fileUpdate(files: $files) {
      files {
        id
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const MEDIA_STATUS = `#graphql
  query UploadMediaStatus($ids: [ID!]!) {
    nodes(ids: $ids) {
      ... on MediaImage {
        id
        status
      }
    }
  }
`;

const VARIANT_IMAGES = `#graphql
  mutation UploadVariantImages($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
    productVariantsBulkUpdate(productId: $productId, variants: $variants) {
      userErrors {
        field
        message
      }
    }
  }
`;

export async function uploadPhotos(photos: UploadPhoto[]) {
  const admin = await adminClient();
  const { handle } = storeConfig.product;

  const { productByIdentifier: product } = await run(
    "Find the product",
    admin.request(PRODUCT_MEDIA, { variables: { handle } }),
  );
  if (!product)
    throw new Error(
      `No product "${handle}" in the store. Run \`pnpm shopify:setup\` first.`,
    );
  const mediaByAlt = new Map(
    product.media.nodes.map((m) => [m.alt ?? "", m.id]),
  );

  // 1. Stage each file and send it to Shopify's upload target.
  const staged = await run(
    "Stage uploads",
    admin.request(STAGED_UPLOADS, {
      variables: {
        input: photos.map((p) => ({
          resource: "IMAGE" as const,
          filename: basename(p.file),
          mimeType: "image/png",
          httpMethod: "POST" as const,
          fileSize: String(p.size),
        })),
      },
    }),
  );
  userErrors("Stage uploads", staged.stagedUploadsCreate?.userErrors);
  const targets = staged.stagedUploadsCreate?.stagedTargets ?? [];
  const sources: string[] = [];
  for (const [i, p] of photos.entries()) {
    const t = targets[i];
    if (!t?.url || !t.resourceUrl)
      throw new Error(`No upload target for ${p.file}`);
    const form = new FormData();
    t.parameters.forEach(({ name, value }) => form.append(name, value));
    form.append(
      "file",
      new Blob([readFileSync(p.file)], { type: "image/png" }),
      basename(p.file),
    );
    const res = await fetch(t.url, { method: "POST", body: form });
    if (!res.ok) throw new Error(`Upload of ${p.file} failed (${res.status})`);
    sources.push(t.resourceUrl);
  }

  // 2. Replace photos already on the product (matched by alt text); add the rest.
  const replace = photos.flatMap((p, i) =>
    mediaByAlt.has(p.alt)
      ? [
          {
            id: mediaByAlt.get(p.alt)!,
            originalSource: sources[i]!,
            alt: p.alt,
          },
        ]
      : [],
  );
  const add = photos.flatMap((p, i) =>
    mediaByAlt.has(p.alt)
      ? []
      : [
          {
            originalSource: sources[i]!,
            alt: p.alt,
            mediaContentType: "IMAGE" as const,
          },
        ],
  );
  if (replace.length) {
    const res = await run(
      "Replace photos",
      admin.request(REPLACE_FILES, { variables: { files: replace } }),
    );
    userErrors("Replace photos", res.fileUpdate?.userErrors);
  }
  if (add.length) {
    const res = await run(
      "Add photos",
      admin.request(ADD_MEDIA, {
        variables: { product: { id: product.id }, media: add },
      }),
    );
    userErrors("Add photos", res.productUpdate?.userErrors);
    res.productUpdate?.product?.media.nodes.forEach((m) =>
      mediaByAlt.set(m.alt ?? "", m.id),
    );
  }
  console.log(
    `Uploaded ${photos.length} photos (${replace.length} replaced, ${add.length} added).`,
  );

  // 3. Wait for Shopify to process them, then use each colour's side view as its variant image.
  const ids = photos
    .map((p) => mediaByAlt.get(p.alt))
    .filter((id): id is string => !!id);
  for (let tries = 0; ; tries++) {
    const { nodes } = await run(
      "Check photo status",
      admin.request(MEDIA_STATUS, { variables: { ids } }),
    );
    const statuses = nodes.map((n) =>
      n && "status" in n ? n.status : undefined,
    );
    if (statuses.includes("FAILED"))
      throw new Error("Shopify could not process a photo.");
    if (statuses.every((s) => s === "READY")) break;
    if (tries >= 30)
      throw new Error(
        "Photos are still processing; re-run later to set variant images.",
      );
    await new Promise((r) => setTimeout(r, 2000));
  }
  const variants = product.variants.nodes.flatMap((v) => {
    const colour = v.selectedOptions.find((o) => o.name === "Colour")?.value;
    const side = photos.find(
      (p) => p.colourway.name === colour && p.view === "side",
    );
    const mediaId = side && mediaByAlt.get(side.alt);
    return mediaId ? [{ id: v.id, mediaId }] : [];
  });
  if (variants.length) {
    const res = await run(
      "Set variant images",
      admin.request(VARIANT_IMAGES, {
        variables: { productId: product.id, variants },
      }),
    );
    userErrors("Set variant images", res.productVariantsBulkUpdate?.userErrors);
    console.log(`Set the variant image on ${variants.length} variants.`);
  }
}
