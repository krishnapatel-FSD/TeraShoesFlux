// A8: the hero character (B5) built with MakeHuman (MPFB2) and Quaternius animations.
//
//   1. MakeHuman asset packs installed in MPFB: system assets, Shirts 01, Pants 03, Shoes 02
//   2. Quaternius Universal Animation Library in assets-src/quaternius/
//   3. pnpm assets:character    → public/3d/character/character.glb (restart `pnpm dev` to show it)
//
// Blender (character_mpfb.py) generates the athletic character, attaches tennis clothes, retargets
// the ready stance and swing animations from Quaternius, and creates the racket socket; gltf-transform
// then compresses it (Meshopt geometry; WebP textures, colour at 1024 px and detail maps at 512 px)
// and the result is checked against A8's budget: under 2 MB, with both clips.
//   pnpm assets:character --dummy   builds the test dummy (character_dummy.py) into
//                                   e2e/fixtures/character-dummy.glb instead
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import {
  dedup,
  meshopt,
  prune,
  textureCompress,
} from "@gltf-transform/functions";
import { MeshoptEncoder } from "meshoptimizer";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import sharp from "sharp";
import { BUDGETS } from "./budgets.mts";

const dummy = process.argv.includes("--dummy");
const BLENDER =
  process.env.BLENDER ??
  "C:/Program Files/Blender Foundation/Blender 5.2/blender.exe";
const blender = (script: string, ...args: string[]) =>
  execFileSync(
    BLENDER,
    ["-b", "--factory-startup", "-P", script, "--", ...args],
    { stdio: ["ignore", "ignore", "inherit"] },
  );

const work = join(tmpdir(), "terashoes-character");
rmSync(work, { recursive: true, force: true });
mkdirSync(work, { recursive: true });

const raw = join(work, "raw.glb");
if (dummy) {
  blender("scripts/assets/character_dummy.py", work);
  blender("scripts/assets/character_build.py", work, raw);
} else {
  const ualGlb = resolve(
    "assets-src/quaternius/Universal Animation Library[Standard]/Universal Animation Library[Standard]/Unreal-Godot/UAL1_Standard.glb",
  );
  if (!existsSync(ualGlb)) {
    console.error(`Missing Quaternius animation library at ${ualGlb}`);
    process.exit(1);
  }
  const previewDir = resolve("assets-out/character-preview");
  blender("scripts/assets/character_mpfb.py", ualGlb, raw, previewDir);
}

const output = dummy
  ? resolve("e2e/fixtures/character-dummy.glb")
  : resolve("public/3d/character/character.glb");
await MeshoptEncoder.ready;
const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ "meshopt.encoder": MeshoptEncoder });
const doc = await io.read(raw);
// Mixamo's materials use gloss maps (bright = shiny), which arrive in glTF's roughness slot
// (bright = rough), plus a specular map: the clothes come out like shiny plastic. A small figure in
// the hero needs neither, so every material becomes plainly matte.
doc
  .getRoot()
  .listExtensionsUsed()
  .filter((e) => e.extensionName === "KHR_materials_specular")
  .forEach((e) => e.dispose());
for (const m of doc.getRoot().listMaterials()) {
  m.setMetallicRoughnessTexture(null)
    .setMetallicFactor(0)
    .setRoughnessFactor(0.75);
  const name = m.getName().toLowerCase();
  if (
    name.includes("hair") ||
    name.includes("eyebrow") ||
    name.includes("eyelash")
  ) {
    m.setAlphaMode("MASK");
    m.setAlphaCutoff(0.5);
  } else {
    m.setAlphaMode("OPAQUE");
    m.setAlpha(1.0);
  }
}
await doc.transform(
  dedup(),
  prune(),
  // The character is at most about half the hero's height on screen: colour textures keep 1024 px,
  // the detail maps (normal, specular, gloss) drop to 512 px, where their difference can't be seen.
  textureCompress({
    encoder: sharp,
    targetFormat: "webp",
    slots: /^baseColor/,
    resize: [1024, 1024],
    quality: 80,
  }),
  textureCompress({
    encoder: sharp,
    targetFormat: "webp",
    slots: /^(?!baseColor)/,
    resize: [512, 512],
    quality: 80,
  }),
  meshopt({ encoder: MeshoptEncoder, level: "medium" }),
);
mkdirSync(dirname(output), { recursive: true });
await io.write(output, doc);

const clips = doc
  .getRoot()
  .listAnimations()
  .map((a) => a.getName());
const bytes = statSync(output).size;
const budget = BUDGETS.character!.maxBytes;
console.log(
  `Wrote ${output}: ${(bytes / 1024 / 1024).toFixed(2)} MB (budget ${budget / 1024 / 1024} MB), clips: ${clips.join(", ")}`,
);
const missing = ["idle", "swing"].filter((c) => !clips.includes(c));
if (missing.length || bytes > budget) {
  console.error(
    missing.length
      ? `Missing clips: ${missing.join(", ")}`
      : "Over the 2 MB budget: try a lower-poly character or smaller textures",
  );
  process.exit(1);
}
