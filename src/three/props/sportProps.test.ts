import * as THREE from "three";
import { describe, expect, it } from "vitest";
import { SCENE } from "@/styles/theme";
import { createPaddles } from "./paddleKit";
import { createRackets, type PropKit } from "./racketKit";
import { createShuttlecocks } from "./shuttlecockKit";

const colours = (group: THREE.Group) =>
  new Set(
    (group.children as THREE.Mesh[]).map((m) =>
      (m.material as THREE.MeshStandardMaterial).color.getHexString(),
    ),
  );
const hex = (c: string) => new THREE.Color(c).getHexString();
const longestSide = (group: THREE.Group) => {
  const size = new THREE.Box3()
    .setFromObject(group)
    .getSize(new THREE.Vector3());
  return Math.max(size.x, size.y, size.z);
};

const kits: [
  string,
  (c?: Record<string, string>) => PropKit,
  Record<string, string>,
][] = [
  ["racket", createRackets, SCENE.racket],
  ["shuttlecock", createShuttlecocks, SCENE.shuttlecock],
  ["paddle", createPaddles, SCENE.paddle],
];

describe.each(kits)("%s prop", (name, make, defaults) => {
  it("defaults to the theme's colours", () => {
    const kit = make();
    const prop = kit.create();
    expect(prop.name).toBe(name);
    expect(colours(prop)).toEqual(new Set(Object.values(defaults).map(hex)));
    kit.dispose();
  });

  it("takes its own colours", () => {
    const custom = Object.fromEntries(
      Object.keys(defaults).map((k, i) => [
        k,
        ["#ff6a2c", "#2fb8d0", "#ffb020"][i]!,
      ]),
    );
    const kit = make(custom);
    expect(colours(kit.create())).toEqual(
      new Set(Object.values(custom).map(hex)),
    );
    kit.dispose();
  });

  it("is 2 units long, like the tennis ball is 2 across", () => {
    const kit = make();
    expect(longestSide(kit.create())).toBeCloseTo(2, 1);
    kit.dispose();
  });

  it("shares geometry and materials between props of one kit", () => {
    const kit = make();
    const a = kit.create().children[0] as THREE.Mesh;
    const b = kit.create().children[0] as THREE.Mesh;
    expect(a.geometry).toBe(b.geometry);
    expect(a.material).toBe(b.material);
    kit.dispose();
  });
});
