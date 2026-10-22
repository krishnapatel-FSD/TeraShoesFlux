// A2 export step: turns a shoe glTF/GLB into the web-ready model the site loads.
//   - welds, dedups and prunes, then Meshopt-compresses geometry (three's GLTFLoader decodes it)
//   - optionally drops material variants and colour textures (when a recolour shader supplies colour)
//   - optionally re-encodes textures as WebP (EXT_texture_webp), at full size or resized
// Usage: pnpm assets:shoe <input.gltf|glb> <output.glb|gltf> [--texture-quality 88] [--texture-size 1024] [--strip-colour]
import { NodeIO, type Document } from "@gltf-transform/core";
import {
  ALL_EXTENSIONS,
  KHRMaterialsVariants,
} from "@gltf-transform/extensions";
import {
  dedup,
  meshopt,
  prune,
  textureCompress,
  weld,
} from "@gltf-transform/functions";
import { MeshoptEncoder } from "meshoptimizer";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { pathToFileURL } from "node:url";
import sharp from "sharp";

export interface OptimizeOptions {
  /** Re-encode textures as WebP at this quality (0–100), keeping their size unless textureSize is set. */
  textureQuality?: number;
  /** Resize textures to this size and re-encode them as WebP. Omit both to keep the originals. */
  textureSize?: number;
  /** Remove material variants and base-colour textures. */
  stripColour?: boolean;
}

export async function optimizeShoe(
  input: string,
  output: string,
  options: OptimizeOptions = {},
) {
  await MeshoptEncoder.ready;
  const io = new NodeIO()
    .registerExtensions(ALL_EXTENSIONS)
    .registerDependencies({ "meshopt.encoder": MeshoptEncoder });
  const doc: Document = await io.read(input);
  const root = doc.getRoot();

  if (options.stripColour) {
    root
      .listExtensionsUsed()
      .filter((e) => e.extensionName === KHRMaterialsVariants.EXTENSION_NAME)
      .forEach((e) => e.dispose());
    for (const material of root.listMaterials()) {
      material.setBaseColorTexture(null).setBaseColorFactor([1, 1, 1, 1]);
    }
  }

  await doc.transform(
    weld(),
    dedup(),
    prune(),
    ...(options.textureSize || options.textureQuality
      ? [
          textureCompress({
            encoder: sharp,
            targetFormat: "webp",
            ...(options.textureSize
              ? { resize: [options.textureSize, options.textureSize] }
              : {}),
            quality: options.textureQuality ?? 90,
          }),
        ]
      : []),
    meshopt({ encoder: MeshoptEncoder, level: "medium" }),
  );

  mkdirSync(dirname(output), { recursive: true });
  await io.write(output, doc);
}

if (import.meta.url === pathToFileURL(process.argv[1]!).href) {
  const [input, output] = process.argv.slice(2);
  const sizeFlag = process.argv.indexOf("--texture-size");
  if (!input || !output) {
    console.error(
      "Usage: pnpm assets:shoe <input.gltf|glb> <output.glb|gltf> [--texture-quality 88] [--texture-size 1024] [--strip-colour]",
    );
    process.exit(1);
  }
  const qualityFlag = process.argv.indexOf("--texture-quality");
  await optimizeShoe(input, output, {
    textureQuality:
      qualityFlag > 0 ? Number(process.argv[qualityFlag + 1]) : undefined,
    textureSize: sizeFlag > 0 ? Number(process.argv[sizeFlag + 1]) : undefined,
    stripColour: process.argv.includes("--strip-colour"),
  });
  console.log(`Wrote ${output}`);
}
