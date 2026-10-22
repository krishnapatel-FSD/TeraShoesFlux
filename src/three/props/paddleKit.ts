import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { SCENE } from "@/styles/theme";
import type { PropKit } from "./racketKit";

// A7: a procedural table-tennis paddle, 2 units long along +Y with the blade at the top: a round
// blade with a rubber face on each side (front faces +Z) and a flared handle. No asset files.

export interface PaddleColours {
  /** Front rubber. */
  rubber?: string;
  /** Back rubber. */
  back?: string;
  /** Handle and blade edge. */
  handle?: string;
}

const BLADE_Y = 0.36;
const BLADE_R = 0.62;
const CORE = 0.05;
const RUBBER = 0.02;

/** A disc in the XY plane, `depth` thick along Z, centred at z. */
function disc(radius: number, depth: number, z: number) {
  const g = new THREE.CylinderGeometry(radius, radius, depth, 48);
  g.rotateX(Math.PI / 2);
  g.translate(0, BLADE_Y, z);
  return g;
}

function handleGeometry() {
  // Flared towards the end, slightly flattened like a real grip.
  const handle = new THREE.CylinderGeometry(0.11, 0.085, 0.74, 10);
  handle.scale(1, 1, 0.62);
  handle.translate(0, -0.6, 0);
  const neck = new THREE.CylinderGeometry(0.085, 0.13, 0.16, 10);
  neck.scale(1, 1, 0.62);
  neck.translate(0, BLADE_Y - BLADE_R + 0.02, 0);
  const merged = mergeGeometries([handle, neck])!;
  handle.dispose();
  neck.dispose();
  return merged;
}

/** Shared resources for paddles in the given colours (defaults in SCENE.paddle). */
export function createPaddles(colours: PaddleColours = {}): PropKit {
  const front = new THREE.MeshStandardMaterial({
    color: colours.rubber ?? SCENE.paddle.rubber,
    roughness: 0.55,
  });
  const back = new THREE.MeshStandardMaterial({
    color: colours.back ?? SCENE.paddle.back,
    roughness: 0.55,
  });
  const wood = new THREE.MeshStandardMaterial({
    color: colours.handle ?? SCENE.paddle.handle,
    roughness: 0.75,
  });
  const geos = {
    core: disc(BLADE_R, CORE, 0),
    front: disc(BLADE_R - 0.01, RUBBER, CORE / 2 + RUBBER / 2),
    back: disc(BLADE_R - 0.01, RUBBER, -CORE / 2 - RUBBER / 2),
    handle: handleGeometry(),
  };

  return {
    create() {
      const paddle = new THREE.Group();
      paddle.name = "paddle";
      paddle.add(
        new THREE.Mesh(geos.core, wood),
        new THREE.Mesh(geos.front, front),
        new THREE.Mesh(geos.back, back),
        new THREE.Mesh(geos.handle, wood),
      );
      return paddle;
    },
    dispose() {
      Object.values(geos).forEach((g) => g.dispose());
      [front, back, wood].forEach((m) => m.dispose());
    },
  };
}
