// Loads Flux 01 into the Shopify store (C2, C8): content definitions, editable copy, the product
// with its colour × size variants, prices and stock, and publishes it to the Headless channel.
// Safe to re-run: everything is created or updated by handle.
//
//   pnpm shopify:setup                         # needs every value in store-config.mts confirmed
//   pnpm shopify:setup --allow-placeholders    # development store only: prototype numbers
//   pnpm shopify:setup --webhook-url https://<preview>/api/revalidate
//
// Needs the Admin API credentials described in admin.mts (an app with write_products,
// write_inventory, read_locations, write_metaobject_definitions, write_metaobjects,
// write_publications).
import { adminClient, run, userErrors } from "./admin.mts";
import {
  PLACEHOLDERS,
  storeConfig,
  type ColourwayConfig,
} from "./store-config.mts";

const args = process.argv.slice(2);
const allowPlaceholders = args.includes("--allow-placeholders");
const webhookFlag = args.indexOf("--webhook-url");
const webhookUrl = webhookFlag >= 0 ? args[webhookFlag + 1] : undefined;

/* ---------- Resolve the config (refuse unconfirmed values) ---------- */
const missing: string[] = [];
const pick = <T,>(value: T | null, label: string, placeholder: T): T => {
  if (value !== null) return value;
  missing.push(label);
  return placeholder;
};
const sizeSystem = pick(
  storeConfig.sizeSystem,
  "sizeSystem",
  PLACEHOLDERS.sizeSystem,
);
const sizes = pick(storeConfig.sizes, "sizes", PLACEHOLDERS.sizes);
const widths = pick(storeConfig.widths, "widths", PLACEHOLDERS.widths);
const stockPerSize = pick(
  storeConfig.stockPerSize,
  "stockPerSize",
  PLACEHOLDERS.stockPerSize,
);
const shipping = {
  freeShippingThreshold: pick(
    storeConfig.shipping.freeShippingThreshold,
    "shipping.freeShippingThreshold",
    PLACEHOLDERS.shipping.freeShippingThreshold,
  ),
  standard: pick(
    storeConfig.shipping.standard,
    "shipping.standard",
    PLACEHOLDERS.shipping.standard,
  ),
  express: pick(
    storeConfig.shipping.express,
    "shipping.express",
    PLACEHOLDERS.shipping.express,
  ),
};
const colourways = storeConfig.colourways.map((c: ColourwayConfig) => {
  const [price, was] = PLACEHOLDERS.prices[c.id] ?? [0, null];
  return {
    ...c,
    price: pick(c.price, `colourways.${c.id}.price`, price),
    compareAtPrice: c.price === null ? was : c.compareAtPrice,
  };
});
if (missing.length) {
  console.warn(
    `Not confirmed yet in scripts/shopify/store-config.mts:\n  ${missing.join("\n  ")}`,
  );
  if (!allowPlaceholders) {
    console.error(
      "\nConfirm them, or re-run with --allow-placeholders on a development store.",
    );
    process.exit(1);
  }
  console.warn(
    "Using the prototype's numbers as placeholders (--allow-placeholders).\n",
  );
}
const hasWidths = widths.length > 1;

/* ---------- Admin API ---------- */
const admin = await adminClient();

const SHOP_QUERY = `#graphql
  query SetupShop {
    shop {
      name
      currencyCode
    }
    locations(first: 1) {
      nodes {
        id
        name
      }
    }
    publications(first: 25) {
      nodes {
        id
        name
      }
    }
  }
`;

const DEFINITION_QUERY = `#graphql
  query SetupDefinition($type: String!) {
    metaobjectDefinitionByType(type: $type) {
      id
    }
  }
`;

const DEFINITION_CREATE = `#graphql
  mutation SetupDefinitionCreate($definition: MetaobjectDefinitionCreateInput!) {
    metaobjectDefinitionCreate(definition: $definition) {
      metaobjectDefinition {
        id
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const METAOBJECT_UPSERT = `#graphql
  mutation SetupMetaobjectUpsert($handle: MetaobjectHandleInput!, $metaobject: MetaobjectUpsertInput!) {
    metaobjectUpsert(handle: $handle, metaobject: $metaobject) {
      metaobject {
        id
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const PRODUCT_SET = `#graphql
  mutation SetupProductSet($identifier: ProductSetIdentifiers, $input: ProductSetInput!) {
    productSet(synchronous: true, identifier: $identifier, input: $input) {
      product {
        id
        variantsCount {
          count
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const PUBLISH = `#graphql
  mutation SetupPublish($id: ID!, $input: [PublicationInput!]!) {
    publishablePublish(id: $id, input: $input) {
      userErrors {
        field
        message
      }
    }
  }
`;

const WEBHOOK_CREATE = `#graphql
  mutation SetupWebhook($topic: WebhookSubscriptionTopic!, $webhookSubscription: WebhookSubscriptionInput!) {
    webhookSubscriptionCreate(topic: $topic, webhookSubscription: $webhookSubscription) {
      webhookSubscription {
        id
      }
      userErrors {
        field
        message
      }
    }
  }
`;

/* ---------- 1. Shop, location, Headless publication ---------- */
const shop = await run("Read shop", admin.request(SHOP_QUERY));
const location = shop.locations.nodes[0];
if (!location) throw new Error("The store has no location to hold stock.");
if (shop.shop.currencyCode !== "INR") {
  console.warn(
    `Warning: the store currency is ${shop.shop.currencyCode}, not INR (Settings → General → Store currency).`,
  );
}
const headless = shop.publications.nodes.find((p) => /headless/i.test(p.name));
console.log(
  `Store: ${shop.shop.name} (${shop.shop.currencyCode}), stock at "${location.name}"`,
);

/* ---------- 2. Content definitions, readable by the storefront ---------- */
type FieldDef = { key: string; name: string; type: string };
const definitions: { type: string; name: string; fields: FieldDef[] }[] = [
  {
    type: "colourway",
    name: "Colourway",
    fields: [
      { key: "note", name: "Note", type: "single_line_text_field" },
      { key: "badge", name: "Badge", type: "single_line_text_field" },
      {
        key: "family",
        name: "Filter families",
        type: "single_line_text_field",
      },
      { key: "rank", name: "Featured order", type: "number_integer" },
    ],
  },
  {
    type: "site_content",
    name: "Site content",
    fields: [
      { key: "hero_word", name: "Hero word", type: "single_line_text_field" },
      { key: "hero_title", name: "Hero title", type: "single_line_text_field" },
      { key: "hero_body", name: "Hero text", type: "multi_line_text_field" },
      {
        key: "band_words",
        name: "Band words",
        type: "list.single_line_text_field",
      },
      {
        key: "size_system",
        name: "Size system",
        type: "single_line_text_field",
      },
      {
        key: "free_shipping_threshold",
        name: "Free shipping over (₹)",
        type: "number_decimal",
      },
      {
        key: "standard_shipping",
        name: "Standard shipping (₹)",
        type: "number_decimal",
      },
      {
        key: "express_shipping",
        name: "Express shipping (₹)",
        type: "number_decimal",
      },
    ],
  },
  {
    type: "faq_item",
    name: "FAQ item",
    fields: [
      { key: "question", name: "Question", type: "single_line_text_field" },
      { key: "answer", name: "Answer", type: "multi_line_text_field" },
      { key: "order", name: "Order", type: "number_integer" },
    ],
  },
];
for (const d of definitions) {
  const existing = await run(
    `Read ${d.type}`,
    admin.request(DEFINITION_QUERY, { variables: { type: d.type } }),
  );
  if (existing.metaobjectDefinitionByType) {
    console.log(`Definition "${d.type}" exists`);
    continue;
  }
  const created = await run(
    `Create ${d.type}`,
    admin.request(DEFINITION_CREATE, {
      variables: {
        definition: {
          type: d.type,
          name: d.name,
          access: { storefront: "PUBLIC_READ" },
          fieldDefinitions: d.fields,
        },
      },
    }),
  );
  userErrors(
    `Create ${d.type}`,
    created.metaobjectDefinitionCreate?.userErrors,
  );
  console.log(`Definition "${d.type}" created`);
}

/* ---------- 3. Editable content ---------- */
async function upsert(
  type: string,
  handle: string,
  fields: Record<string, string>,
) {
  const res = await run(
    `Save ${type}/${handle}`,
    admin.request(METAOBJECT_UPSERT, {
      variables: {
        handle: { type, handle },
        metaobject: {
          fields: Object.entries(fields).map(([key, value]) => ({
            key,
            value,
          })),
        },
      },
    }),
  );
  userErrors(`Save ${type}/${handle}`, res.metaobjectUpsert?.userErrors);
}

const c = storeConfig.content;
await upsert("site_content", "main", {
  hero_word: c.heroWord,
  hero_title: c.heroTitle,
  hero_body: c.heroBody,
  band_words: JSON.stringify(c.bandWords),
  size_system: sizeSystem,
  free_shipping_threshold: String(shipping.freeShippingThreshold),
  standard_shipping: String(shipping.standard),
  express_shipping: String(shipping.express),
});
for (const [i, [question, answer]] of c.faq.entries()) {
  await upsert("faq_item", `faq-${i + 1}`, {
    question,
    answer,
    order: String(i + 1),
  });
}
for (const cw of colourways) {
  await upsert("colourway", cw.id, {
    note: cw.note,
    badge: cw.badge,
    family: cw.family,
    rank: String(cw.rank),
  });
}
console.log(
  `Content saved: site content, ${c.faq.length} FAQ items, ${colourways.length} colourways`,
);

/* ---------- 4. Product, variants, prices and stock ---------- */
const widthValues = hasWidths ? widths : [""];
const variants = colourways.flatMap((cw) =>
  sizes.flatMap((size) =>
    widthValues.map((width) => ({
      optionValues: [
        { optionName: "Colour", name: cw.name },
        { optionName: "Size", name: size },
        ...(hasWidths ? [{ optionName: "Width", name: width }] : []),
      ],
      price: String(cw.price),
      compareAtPrice:
        cw.compareAtPrice === null ? null : String(cw.compareAtPrice),
      inventoryPolicy: "DENY" as const,
      inventoryItem: {
        tracked: true,
        sku: [
          "FLX01",
          cw.id.toUpperCase(),
          size,
          ...(hasWidths ? [width.slice(0, 1)] : []),
        ].join("-"),
      },
      inventoryQuantities: [
        {
          locationId: location.id,
          name: "available",
          quantity: cw.soldOut.includes(size) ? 0 : stockPerSize,
        },
      ],
    })),
  ),
);
const productOptions = [
  { name: "Colour", values: colourways.map((cw) => ({ name: cw.name })) },
  { name: "Size", values: sizes.map((name) => ({ name })) },
  ...(hasWidths
    ? [{ name: "Width", values: widths.map((name) => ({ name })) }]
    : []),
];
const p = storeConfig.product;
const set = await run(
  "Save product",
  admin.request(PRODUCT_SET, {
    variables: {
      identifier: { handle: p.handle },
      input: {
        handle: p.handle,
        title: p.title,
        productType: p.productType,
        vendor: p.vendor,
        status: "ACTIVE",
        productOptions,
        variants,
      },
    },
  }),
);
userErrors("Save product", set.productSet?.userErrors);
const product = set.productSet?.product;
if (!product) throw new Error("Save product returned no product");
console.log(
  `Product "${p.title}" saved with ${product.variantsCount?.count ?? variants.length} variants`,
);

/* ---------- 5. Publish to the Headless storefront ---------- */
if (headless) {
  const pub = await run(
    "Publish",
    admin.request(PUBLISH, {
      variables: { id: product.id, input: [{ publicationId: headless.id }] },
    }),
  );
  userErrors("Publish", pub.publishablePublish?.userErrors);
  console.log(`Published to "${headless.name}"`);
} else {
  console.warn(
    'No "Headless" sales channel found: install it, then re-run so the storefront can see the product.',
  );
}

/* ---------- 6. Webhooks that refresh the site ---------- */
if (webhookUrl) {
  const topics = [
    "PRODUCTS_CREATE",
    "PRODUCTS_UPDATE",
    "PRODUCTS_DELETE",
    "INVENTORY_LEVELS_UPDATE",
    "METAOBJECTS_CREATE",
    "METAOBJECTS_UPDATE",
    "METAOBJECTS_DELETE",
  ] as const;
  for (const topic of topics) {
    const res = await run(
      `Webhook ${topic}`,
      admin.request(WEBHOOK_CREATE, {
        variables: { topic, webhookSubscription: { uri: webhookUrl } },
      }),
    );
    const errs = res.webhookSubscriptionCreate?.userErrors ?? [];
    if (errs.some((e) => /taken|already/i.test(e.message)))
      console.log(`Webhook ${topic} exists`);
    else userErrors(`Webhook ${topic}`, errs);
  }
  console.log(`Webhooks point at ${webhookUrl}`);
}

console.log("\nDone.");
