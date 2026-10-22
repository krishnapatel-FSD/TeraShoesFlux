// A2/A8 gate: runs the Khronos glTF Validator on every .glb/.gltf under the given paths and
// checks each file against its size and triangle budget. Exits 1 on any failure.
//   pnpm assets:validate [paths…]   (default: public/3d)
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import validator from "gltf-validator";
import { MeshoptDecoder } from "meshoptimizer";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { budgetFor } from "./budgets.mts";

function findGlbs(path: string): string[] {
  if (statSync(path).isFile()) return /.(glb|gltf)$/.test(path) ? [path] : [];
  return readdirSync(path).flatMap((f) => findGlbs(join(path, f)));
}

async function countTriangles(file: string): Promise<number> {
  await MeshoptDecoder.ready;
  const io = new NodeIO()
    .registerExtensions(ALL_EXTENSIONS)
    .registerDependencies({ "meshopt.decoder": MeshoptDecoder });
  const doc = await io.read(file);
  let tris = 0;
  for (const mesh of doc.getRoot().listMeshes()) {
    for (const prim of mesh.listPrimitives()) {
      const count =
        prim.getIndices()?.getCount() ??
        prim.getAttribute("POSITION")?.getCount() ??
        0;
      tris += count / 3;
    }
  }
  return tris;
}

const roots = process.argv.slice(2);
const files = (roots.length ? roots : ["public/3d"]).flatMap(findGlbs);
if (!files.length) {
  console.log("No .glb files found.");
  process.exit(0);
}

let failed = false;
for (const file of files) {
  const bytes = readFileSync(file);
  let totalBytes = bytes.length;
  const report = await validator.validateBytes(new Uint8Array(bytes), {
    uri: file,
    maxIssues: 50,
    // .gltf files reference .bin and image files next to them; their size counts toward the budget.
    externalResourceFunction: async (uri: string) => {
      const data = readFileSync(join(dirname(file), decodeURIComponent(uri)));
      totalBytes += data.length;
      return new Uint8Array(data);
    },
  });
  const { numErrors, numWarnings, messages } = report.issues;
  const tris = await countTriangles(file);
  const budget = budgetFor(file);
  const overSize = budget ? totalBytes > budget.maxBytes : false;
  const overTris = budget?.maxTriangles ? tris > budget.maxTriangles : false;
  const ok = numErrors === 0 && !overSize && !overTris;
  failed ||= !ok;

  const mb = (totalBytes / 1024 / 1024).toFixed(2);
  const limit = budget
    ? ` (budget ${(budget.maxBytes / 1024 / 1024).toFixed(0)} MB${budget.maxTriangles ? `, ${budget.maxTriangles} tris` : ""})`
    : " (no budget)";
  console.log(
    `${ok ? "PASS" : "FAIL"} ${relative(".", file)}: ${mb} MB, ${tris} triangles${limit}`,
  );
  console.log(`     validator: ${numErrors} errors, ${numWarnings} warnings`);
  for (const m of messages.filter(
    (m: { severity: number }) => m.severity === 0,
  )) {
    console.log(`     ✗ ${m.code}: ${m.message} ${m.pointer ?? ""}`);
  }
}
// exitCode rather than process.exit(): exiting while the WASM decoders still hold handles trips a libuv assertion on Windows.
process.exitCode = failed ? 1 : 0;
