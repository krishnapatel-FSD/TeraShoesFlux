import * as THREE from "three";
import { THEME } from "@/styles/theme";

// A3 recolour shader (parked: the site currently follows the prototype, which recolours with one
// texture per colourway; this is for the licensed model and its painted zone mask). The shoe keeps a standard PBR material (normal, AO, roughness and
// lighting stay three.js's own); only the base colour is replaced. The zone mask is bound as
// the material's `map` so three provides its UVs, and its channels are read as data:
//   R = upper, G = stripes/overlays, B = sole, A = detail (zone-relative brightness / 2).

export interface ZoneColours {
  upper: string;
  stripes: string;
  sole: string;
}

export interface ZoneUniforms {
  uUpper: { value: THREE.Color };
  uStripes: { value: THREE.Color };
  uSole: { value: THREE.Color };
}

export function createZoneUniforms(c: ZoneColours): ZoneUniforms {
  return {
    uUpper: { value: new THREE.Color(c.upper) },
    uStripes: { value: new THREE.Color(c.stripes) },
    uSole: { value: new THREE.Color(c.sole) },
  };
}

/** Targets for tweening: the colourway's zone colours in three's working (linear) space. */
export function zoneTargets(c: ZoneColours) {
  return {
    upper: new THREE.Color(c.upper),
    stripes: new THREE.Color(c.stripes),
    sole: new THREE.Color(c.sole),
  };
}

const MAP_FRAGMENT = /* glsl */ `
#ifdef USE_MAP
  vec4 zoneTexel = texture2D( map, vMapUv );
  vec3 zoneColour = uUpper * zoneTexel.r + uStripes * zoneTexel.g + uSole * zoneTexel.b;
  // Antialiased mask edges sum below 1; renormalise so seams don't darken.
  zoneColour /= max( zoneTexel.r + zoneTexel.g + zoneTexel.b, 1e-3 );
  diffuseColor.rgb *= zoneColour * zoneTexel.a * 2.0;
#endif
`;

/**
 * Turns a glTF PBR material into the recolourable shoe material. The returned material
 * shares `uniforms`, so changing their values recolours the shoe with no texture loads.
 */
export function applyZoneRecolour(
  material: THREE.MeshStandardMaterial,
  zones: THREE.Texture,
  uniforms: ZoneUniforms,
): THREE.MeshStandardMaterial {
  zones.colorSpace = THREE.NoColorSpace; // mask data, not colour
  zones.flipY = false; // glTF UV convention
  zones.anisotropy = 8;
  zones.needsUpdate = true;

  const m = material.clone();
  m.map = zones;
  m.color.set(THEME.white);
  m.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "void main() {",
        "uniform vec3 uUpper;\nuniform vec3 uStripes;\nuniform vec3 uSole;\nvoid main() {",
      )
      .replace("#include <map_fragment>", MAP_FRAGMENT);
  };
  m.customProgramCacheKey = () => "flux-zone-recolour";
  m.needsUpdate = true;
  return m;
}
