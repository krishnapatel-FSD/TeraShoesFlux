import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { SCENE } from "@/styles/theme";

// A7: a procedural tennis racket, 2 units long along +Y with the head at the top: an oval frame,
// strung mains and crosses, a V-shaped throat and an octagonal grip. No asset files.

export interface RacketColours {
  frame?: string;
  strings?: string;
  grip?: string;
}

export interface PropKit {
  /** A new prop sharing this kit's geometry and materials. */
  create(): THREE.Group;
  dispose(): void;
}

/** The head: an ellipse centred at y = HEAD_Y, half-width A, half-height B. */
const HEAD_Y = 0.55;
const A = 0.3;
const B = 0.42;
const FRAME = 0.032;

function frameGeometry() {
  const pts = Array.from({ length: 96 }, (_, i) => {
    const t = (i / 96) * Math.PI * 2;
    return new THREE.Vector3(A * Math.cos(t), HEAD_Y + B * Math.sin(t), 0);
  });
  return new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3(pts, true),
    192,
    FRAME,
    10,
    true,
  );
}

/** Mains (vertical) and crosses (horizontal), clipped to the inside of the frame. */
function stringsGeometry() {
  const parts: THREE.BufferGeometry[] = [];
  const add = (length: number, x: number, y: number, horizontal: boolean) => {
    const g = new THREE.CylinderGeometry(0.005, 0.005, length, 4);
    if (horizontal) g.rotateZ(Math.PI / 2);
    g.translate(x, y, 0);
    parts.push(g);
  };
  const a = A - FRAME / 2;
  const b = B - FRAME / 2;
  for (let i = 1; i < 16; i++) {
    const x = -a + (2 * a * i) / 16;
    add(2 * b * Math.sqrt(1 - (x / a) ** 2), x, HEAD_Y, false);
  }
  for (let i = 1; i < 20; i++) {
    const y = -b + (2 * b * i) / 20;
    add(2 * a * Math.sqrt(1 - (y / b) ** 2), 0, HEAD_Y + y, true);
  }
  const merged = mergeGeometries(parts)!;
  parts.forEach((g) => g.dispose());
  return merged;
}

/** Two arms from the bottom of the head down into the handle. */
function throatGeometry() {
  const arm = (side: number) =>
    new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(side * A * 0.62, HEAD_Y - B * 0.78, 0),
        new THREE.Vector3(side * 0.07, -0.05, 0),
        new THREE.Vector3(0, -0.22, 0),
      ]),
      24,
      FRAME * 0.9,
      8,
      false,
    );
  const left = arm(-1);
  const right = arm(1);
  const merged = mergeGeometries([left, right])!;
  left.dispose();
  right.dispose();
  return merged;
}

function gripGeometry() {
  const handle = new THREE.CylinderGeometry(0.062, 0.056, 0.72, 8);
  handle.translate(0, -0.58, 0);
  const cap = new THREE.CylinderGeometry(0.07, 0.07, 0.05, 8);
  cap.translate(0, -0.96, 0);
  const merged = mergeGeometries([handle, cap])!;
  handle.dispose();
  cap.dispose();
  return merged;
}

/** Shared resources for rackets in the given colours (defaults in SCENE.racket). */
export function createRackets(colours: RacketColours = {}): PropKit {
  const frameMat = new THREE.MeshStandardMaterial({
    color: colours.frame ?? SCENE.racket.frame,
    roughness: 0.35,
    metalness: 0.2,
  });
  const stringsMat = new THREE.MeshStandardMaterial({
    color: colours.strings ?? SCENE.racket.strings,
    roughness: 0.5,
  });
  const gripMat = new THREE.MeshStandardMaterial({
    color: colours.grip ?? SCENE.racket.grip,
    roughness: 0.85,
  });
  const geos = {
    frame: frameGeometry(),
    strings: stringsGeometry(),
    throat: throatGeometry(),
    grip: gripGeometry(),
  };

  return {
    create() {
      const racket = new THREE.Group();
      racket.name = "racket";
      racket.add(
        new THREE.Mesh(geos.frame, frameMat),
        new THREE.Mesh(geos.strings, stringsMat),
        new THREE.Mesh(geos.throat, frameMat),
        new THREE.Mesh(geos.grip, gripMat),
      );
      return racket;
    },
    dispose() {
      Object.values(geos).forEach((g) => g.dispose());
      [frameMat, stringsMat, gripMat].forEach((m) => m.dispose());
    },
  };
}
