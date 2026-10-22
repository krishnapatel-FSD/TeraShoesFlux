import * as THREE from "three";
import { describe, expect, it } from "vitest";
import { SCENE } from "@/styles/theme";
import { createTennisBalls } from "./tennisBallKit";

const colourOf = (m: THREE.Mesh) =>
  (m.material as THREE.MeshStandardMaterial).color.getHexString();
const hex = (c: string) => new THREE.Color(c).getHexString();

describe("tennis ball prop", () => {
  it("defaults to the prototype's ball colours", () => {
    const kit = createTennisBalls();
    const [felt, seam] = kit.create().children as THREE.Mesh[];
    expect(colourOf(felt!)).toBe(hex(SCENE.ball.felt));
    expect(colourOf(seam!)).toBe(hex(SCENE.ball.seam));
    expect(
      (felt!.material as THREE.MeshPhysicalMaterial).sheenColor.getHexString(),
    ).toBe(hex(SCENE.ball.sheen));
    kit.dispose();
  });

  it("takes its own colours", () => {
    const kit = createTennisBalls({
      felt: "#ff6a2c",
      sheen: "#ffe0d0",
      seam: "#101216",
    });
    const [felt, seam] = kit.create().children as THREE.Mesh[];
    expect(colourOf(felt!)).toBe(hex("#ff6a2c"));
    expect(colourOf(seam!)).toBe(hex("#101216"));
    kit.dispose();
  });

  it("shares geometry and materials between balls of one kit", () => {
    const kit = createTennisBalls();
    const a = kit.create().children[0] as THREE.Mesh;
    const b = kit.create().children[0] as THREE.Mesh;
    expect(a.geometry).toBe(b.geometry);
    expect(a.material).toBe(b.material);
    kit.dispose();
  });
});
