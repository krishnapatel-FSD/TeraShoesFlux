import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

// A6: the site's studio environment (createStudioEnvironment in shoeAssets.ts) as an
// equirectangular HDR image, so the Blender reference render (`pnpm assets:lighting`) is lit by
// exactly the light the site's reflections come from. It renders the same RoomEnvironment the
// same way PMREM does (a cube from the origin, linear, no tone mapping), then unwraps the cube in
// Blender's environment-texture layout: Z up, +X at the centre of the image.

const UNWRAP = /* glsl */ `
  uniform samplerCube cube;
  varying vec2 vUv;
  void main() {
    const float PI = 3.141592653589793;
    float theta = PI * (1.0 - vUv.y);         // 0 straight up … π straight down
    float phi = PI - 2.0 * PI * vUv.x;        // +X at u = 0.5
    vec3 b = vec3(sin(theta) * cos(phi), sin(theta) * sin(phi), cos(theta)); // Blender, Z up
    vec3 t = vec3(b.x, b.z, -b.y);            // the same direction in three.js / glTF, Y up
    gl_FragColor = vec4(textureCube(cube, t).rgb, 1.0);
  }
`;

/**
 * Renders the studio environment `width` × `width / 2` and returns it as Radiance RGBE bytes,
 * bottom row first.
 */
export function studioEquirectRGBE(
  renderer: THREE.WebGLRenderer,
  width = 2048,
): Uint8Array {
  const height = width / 2;
  const room = new RoomEnvironment();
  const cubeTarget = new THREE.WebGLCubeRenderTarget(1024, {
    type: THREE.HalfFloatType,
  });
  new THREE.CubeCamera(0.1, 100, cubeTarget).update(renderer, room);

  const target = new THREE.WebGLRenderTarget(width, height, {
    type: THREE.FloatType,
  });
  const quad = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 2),
    new THREE.ShaderMaterial({
      uniforms: { cube: { value: cubeTarget.texture } },
      vertexShader:
        "varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }",
      fragmentShader: UNWRAP,
    }),
  );
  const scene = new THREE.Scene().add(quad);
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  renderer.setRenderTarget(target);
  renderer.render(scene, camera);
  const linear = new Float32Array(width * height * 4);
  renderer.readRenderTargetPixels(target, 0, 0, width, height, linear);
  renderer.setRenderTarget(null);

  room.dispose();
  cubeTarget.dispose();
  target.dispose();
  quad.geometry.dispose();
  (quad.material as THREE.Material).dispose();

  // Radiance RGBE: a shared exponent per pixel.
  const out = new Uint8Array(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    const r = linear[i * 4]!;
    const g = linear[i * 4 + 1]!;
    const b = linear[i * 4 + 2]!;
    const v = Math.max(r, g, b);
    if (v < 1e-32) continue;
    const e = Math.ceil(Math.log2(v));
    const scale = 256 / 2 ** e;
    out[i * 4] = Math.min(255, Math.floor(r * scale));
    out[i * 4 + 1] = Math.min(255, Math.floor(g * scale));
    out[i * 4 + 2] = Math.min(255, Math.floor(b * scale));
    out[i * 4 + 3] = e + 128;
  }
  return out;
}
