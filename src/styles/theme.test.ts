import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { colourwayToken } from "@/lib/tokens";
import { THEME } from "./theme";

const css = readFileSync("src/styles/design-tokens.css", "utf8");
const cssVar = (name: string) =>
  css.match(new RegExp(`\\s${name}:\\s*([^;]+);`))?.[1]?.trim();
const initial = (name: string) =>
  css.match(
    new RegExp(`@property ${name} \\{[^}]*initial-value: ([^;]+);`),
  )?.[1];

describe("theme", () => {
  it("starts on the Lime colourway from the tokens", () => {
    const lime = colourwayToken("lime");
    expect([cssVar("--hl"), initial("--hl")]).toEqual([
      lime.highlight,
      lime.highlight,
    ]);
    expect([cssVar("--on-hl"), initial("--on-hl")]).toEqual([
      lime.onHighlight,
      lime.onHighlight,
    ]);
    expect([cssVar("--hero-ink"), initial("--hero-ink")]).toEqual([
      lime.heroInk,
      lime.heroInk,
    ]);
  });

  it("keeps the CSS and TypeScript halves in step", () => {
    expect(cssVar("--ink")).toBe(THEME.ink);
    expect(cssVar("--white")).toBe(THEME.white);
  });
});
