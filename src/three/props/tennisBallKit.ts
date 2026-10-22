import * as THREE from "three";
import { SCENE } from "@/styles/theme";

// A7: the prototype's procedural tennis ball: a felt sphere with sheen and a bump map from
// generated noise, plus a seam following the classic two-lobe curve. No asset files.

export interface TennisBallColours {
  /** Felt colour. */
  felt?: string;
  /** Sheen tint on the felt. */
  sheen?: string;
  /** Seam colour. */
  seam?: string;
}

export interface TennisBallKit {
  /** A new ball (radius 1) sharing this kit's geometry, texture and materials. */
  create(): THREE.Group;
  dispose(): void;
}

function seamGeometry() {
  const A = 0.62;
  const B = 0.38;
  const C = 2 * Math.sqrt(A * B);
  const pts = Array.from({ length: 240 }, (_, i) => {
    const t = (i / 240) * Math.PI * 2;
    return new THREE.Vector3(
      A * Math.cos(t) + B * Math.cos(3 * t),
      A * Math.sin(t) - B * Math.sin(3 * t),
      C * Math.sin(2 * t),
    );
  });
  return new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3(pts, true),
    400,
    0.045,
    8,
    true,
  );
}

/** Random grey noise used as the felt bump map (null where there is no 2D canvas, e.g. in tests). */
function feltTexture(): THREE.CanvasTexture | null {
  const felt = document.createElement("canvas");
  felt.width = felt.height = 256;
  const c = felt.getContext("2d");
  if (!c) return null;
  const img = c.createImageData(256, 256);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 110 + Math.random() * 146;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  c.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(felt);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 2);
  return tex;
}

/** Shared resources for a set of tennis balls in the given colours (defaults: the prototype's). */
export function createTennisBalls(
  colours: TennisBallColours = {},
): TennisBallKit {
  const feltTex = feltTexture();
  const ballMat = new THREE.MeshPhysicalMaterial({
    color: colours.felt ?? SCENE.ball.felt,
    roughness: 0.92,
    sheen: 1,
    sheenRoughness: 0.5,
    sheenColor: new THREE.Color(colours.sheen ?? SCENE.ball.sheen),
    bumpMap: feltTex,
    bumpScale: 0.9,
  });
  const seamMat = new THREE.MeshStandardMaterial({
    color: colours.seam ?? SCENE.ball.seam,
    roughness: 0.7,
  });
  const sphereGeo = new THREE.SphereGeometry(1, 64, 48);
  const seamGeo = seamGeometry();

  return {
    create() {
      const ball = new THREE.Group();
      ball.name = "tennis-ball";
      ball.add(
        new THREE.Mesh(sphereGeo, ballMat),
        new THREE.Mesh(seamGeo, seamMat),
      );
      return ball;
    },
    dispose() {
      [sphereGeo, seamGeo].forEach((g) => g.dispose());
      [ballMat, seamMat].forEach((m) => m.dispose());
      feltTex?.dispose();
    },
  };
}
