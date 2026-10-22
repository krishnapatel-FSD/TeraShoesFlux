// A5 gate: no hard-coded colours outside the theme. Scans src/ for colour literals (#hex, rgb(),
// rgba(), hsl(), 0xRRGGBB) and fails if any appear outside the theme files.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

/** Files allowed to define colours: the theme and the colourway tokens it reads. */
const THEME_FILES = new Set([
  "src/styles/design-tokens.css",
  "src/styles/theme.ts",
]);
const SKIP = [/\.test\.tsx?$/, /^src\/lib\/shopify\/types\//, /\.svg$/];
const COLOUR =
  /#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3}(?:[0-9a-fA-F]{2})?)?\b(?![\w-])|\b(?:rgba?|hsla?)\(|\b0x[0-9a-fA-F]{6}\b/g;

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory()
      ? files(p)
      : /\.(css|tsx?|mts)$/.test(p)
        ? [p]
        : [];
  });
}

const problems: string[] = [];
for (const file of files("src")) {
  const rel = relative(".", file).replaceAll("\\", "/");
  if (THEME_FILES.has(rel) || SKIP.some((r) => r.test(rel))) continue;
  readFileSync(file, "utf8")
    .split("\n")
    .forEach((line, i) => {
      // Ignore comments and id selectors/URL fragments that look like short hex (e.g. "#add").
      const code = line.replace(/\/\/.*$|\/\*.*?\*\//g, "");
      for (const m of code.matchAll(COLOUR)) {
        if (m[0].startsWith("#") && !/^#[0-9a-fA-F]+$/.test(m[0])) continue;
        const before = code.slice(0, m.index);
        // "#faq", "#add-btn" and similar ids are not colours: require a colour-like context.
        if (
          m[0].startsWith("#") &&
          /["'`(]#?$|querySelector|href|getElementById/.test(
            before.slice(-20),
          ) &&
          /[g-z]/i.test(code.slice(m.index! + 1, m.index! + 8))
        )
          continue;
        problems.push(`${rel}:${i + 1}  ${m[0]}  ${line.trim().slice(0, 100)}`);
      }
    });
}

if (problems.length) {
  console.error(
    `Hard-coded colours outside the theme (move them to src/styles/design-tokens.css or theme.ts):\n${problems.join("\n")}`,
  );
  process.exit(1);
}
console.log("No hard-coded colours outside the theme.");
