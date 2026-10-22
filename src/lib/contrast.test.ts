import { describe, expect, it } from "vitest";
import { contrastRatio, mixSrgb } from "./contrast";

describe("contrast helpers", () => {
  it("matches the WCAG reference values", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 5);
    expect(contrastRatio("#ffffff", "#ffffff")).toBeCloseTo(1, 5);
    // Prototype Lime hero: white on #34d27b (UI_UX §2.3).
    expect(contrastRatio("#ffffff", "#34d27b")).toBeCloseTo(1.97, 2);
  });

  it("mixes like CSS color-mix in srgb", () => {
    expect(mixSrgb("#000000", "#ffffff", 0.5)).toBe("#808080");
    expect(mixSrgb("#ff0000", "#0000ff", 1)).toBe("#ff0000");
  });
});
