import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { SCENE } from "@/styles/theme";
import type { PropKit } from "./racketKit";

// A7: a procedural badminton shuttlecock, 2 units tall along +Y with the cork at the bottom: a
// rounded cork, an open feather skirt with 16 shafts, and two thread bands. No asset files.

export interface ShuttlecockColours {
  cork?: string;
  feathers?: string;
  band?: string;
}

const FEATHERS = 16;
/** The skirt: from the top of the cork (radius R0 at y Y0) out to the rim (radius R1 at y Y1). */
const Y0 = -0.5;
const Y1 = 1;
const R0 = 0.34;
const R1 = 0.95;

const skirtRadius = (y: number) => R0 + ((R1 - R0) * (y - Y0)) / (Y1 - Y0);

function corkGeometry() {
  // Lower hemisphere plus a short collar the skirt sits in.
  const dome = new THREE.SphereGeometry(
    0.42,
    32,
    16,
    0,
    Math.PI * 2,
    Math.PI / 2,
    Math.PI / 2,
  );
  dome.translate(0, -0.6, 0);
  const collar = new THREE.CylinderGeometry(R0 + 0.02, 0.42, 0.12, 32);
  collar.translate(0, -0.54, 0);
  const merged = mergeGeometries([dome, collar])!;
  dome.dispose();
  collar.dispose();
  return merged;
}

function skirtGeometry() {
  // A scalloped cone: one tip per feather at the rim.
  const g = new THREE.CylinderGeometry(R1, R0, Y1 - Y0, FEATHERS * 4, 1, true);
  g.translate(0, (Y0 + Y1) / 2, 0);
  const pos = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    if (pos.getY(i) < Y1 - 1e-4) continue;
    const angle = Math.atan2(pos.getZ(i), pos.getX(i));
    const dip = 0.12 * (1 - Math.abs(Math.cos((angle * FEATHERS) / 2)));
    pos.setY(i, Y1 - dip);
  }
  g.computeVertexNormals();
  return g;
}

function shaftsGeometry() {
  const parts = Array.from({ length: FEATHERS }, (_, i) => {
    const angle = (i / FEATHERS) * Math.PI * 2;
    const from = new THREE.Vector3(
      Math.cos(angle) * R0,
      Y0,
      Math.sin(angle) * R0,
    );
    const to = new THREE.Vector3(
      Math.cos(angle) * R1,
      Y1,
      Math.sin(angle) * R1,
    );
    const length = from.distanceTo(to);
    const g = new THREE.CylinderGeometry(0.008, 0.012, length, 4);
    g.applyQuaternion(
      new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        to.clone().sub(from).normalize(),
      ),
    );
    g.translate(...from.clone().add(to).multiplyScalar(0.5).toArray());
    return g;
  });
  const merged = mergeGeometries(parts)!;
  parts.forEach((g) => g.dispose());
  return merged;
}

function bandsGeometry() {
  const parts = [0.05, 0.35].map((y) => {
    const g = new THREE.TorusGeometry(skirtRadius(y), 0.012, 6, 64);
    g.rotateX(Math.PI / 2);
    g.translate(0, y, 0);
    return g;
  });
  const merged = mergeGeometries(parts)!;
  parts.forEach((g) => g.dispose());
  return merged;
}

/** Shared resources for shuttlecocks in the given colours (defaults in SCENE.shuttlecock). */
export function createShuttlecocks(colours: ShuttlecockColours = {}): PropKit {
  const feathers = colours.feathers ?? SCENE.shuttlecock.feathers;
  const corkMat = new THREE.MeshStandardMaterial({
    color: colours.cork ?? SCENE.shuttlecock.cork,
    roughness: 0.8,
  });
  const skirtMat = new THREE.MeshStandardMaterial({
    color: feathers,
    roughness: 0.7,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.92,
  });
  const shaftMat = new THREE.MeshStandardMaterial({
    color: feathers,
    roughness: 0.6,
  });
  const bandMat = new THREE.MeshStandardMaterial({
    color: colours.band ?? SCENE.shuttlecock.band,
    roughness: 0.6,
  });
  const geos = {
    cork: corkGeometry(),
    skirt: skirtGeometry(),
    shafts: shaftsGeometry(),
    bands: bandsGeometry(),
  };

  return {
    create() {
      const shuttle = new THREE.Group();
      shuttle.name = "shuttlecock";
      shuttle.add(
        new THREE.Mesh(geos.cork, corkMat),
        new THREE.Mesh(geos.skirt, skirtMat),
        new THREE.Mesh(geos.shafts, shaftMat),
        new THREE.Mesh(geos.bands, bandMat),
      );
      return shuttle;
    },
    dispose() {
      Object.values(geos).forEach((g) => g.dispose());
      [corkMat, skirtMat, shaftMat, bandMat].forEach((m) => m.dispose());
    },
  };
}
