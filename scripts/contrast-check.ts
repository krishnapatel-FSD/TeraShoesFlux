// A4 gate: every colourway's text colours must pass WCAG AA (4.5:1) on their backgrounds.
// Pairs below AA fail the build unless tokens/colourways.json records a waiver with a reason
// (today: the prototype's own values, awaiting the product owner's decision OD-8).
import {
  checkContrast,
  COLOURWAY_TOKENS,
  CONTRAST_WAIVERS,
} from "../src/lib/tokens";

const results = COLOURWAY_TOKENS.flatMap((t) => checkContrast(t));

console.table(
  results.map((r) => ({
    colourway: r.colourway,
    pair: r.pair,
    ratio: r.ratio.toFixed(2),
    AA: r.pass ? "pass" : r.waived ? "waived" : "FAIL",
  })),
);

const failures = results.filter((r) => !r.pass && !r.waived);
const stale = CONTRAST_WAIVERS.filter((w) =>
  results.some(
    (r) => r.colourway === w.colourway && r.pair === w.pair && r.pass,
  ),
);
const waived = results.filter((r) => !r.pass && r.waived).length;

if (stale.length) {
  console.error(
    `\nRemove these waivers, the pairs now pass: ${stale.map((w) => `${w.colourway} (${w.pair})`).join(", ")}`,
  );
}
if (failures.length) {
  console.error(
    `\n${failures.length} pair(s) below 4.5:1 without a waiver: ${failures.map((r) => `${r.colourway} (${r.pair})`).join(", ")}`,
  );
}
if (failures.length || stale.length) process.exit(1);
console.log(
  waived
    ? `\nAll pairs pass WCAG AA except ${waived} waived (see contrastWaivers in tokens/colourways.json).`
    : "\nAll pairs pass WCAG AA.",
);
