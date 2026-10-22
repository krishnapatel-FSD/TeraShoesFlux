import { describe, expect, it } from "vitest";
import { PRODUCTS } from "@/data/catalogue";
import {
  checkContrast,
  COLOURWAY_TOKENS,
  colourwayToken,
  tokenFileSchema,
} from "./tokens";

describe("colourway tokens", () => {
  it("drive the catalogue colours, unchanged from the prototype", () => {
    const lime = PRODUCTS.find((p) => p.id === "lime")!;
    expect(lime).toMatchObject({
      a: "#8ee03c",
      b: "#e8ffc2",
      hl: "#34d27b",
      on: "#0b1f12",
      hi: "#ffffff",
      tex: "diffuseLime.jpg",
    });
    expect(PRODUCTS.find((p) => p.id === "coral")).toMatchObject({
      gltf: 1,
      tex: undefined,
    });
    expect(PRODUCTS.map((p) => p.id)).toEqual(
      COLOURWAY_TOKENS.map((t) => t.id),
    );
  });

  it("rejects duplicate ids and bad colours", () => {
    const lime = colourwayToken("lime");
    expect(() =>
      tokenFileSchema.parse({
        version: 1,
        colourways: [lime, lime],
        contrastWaivers: [],
      }),
    ).toThrow();
    expect(() =>
      tokenFileSchema.parse({
        version: 1,
        colourways: [{ ...lime, highlight: "green" }],
        contrastWaivers: [],
      }),
    ).toThrow();
  });

  it("fails every pair below AA that has no waiver", () => {
    const failing = COLOURWAY_TOKENS.flatMap((t) => checkContrast(t)).filter(
      (r) => !r.pass && !r.waived,
    );
    expect(failing).toEqual([]);
    const noWaivers = COLOURWAY_TOKENS.flatMap((t) =>
      checkContrast(t, []),
    ).filter((r) => !r.pass);
    expect(noWaivers.length).toBe(5);
  });
});
