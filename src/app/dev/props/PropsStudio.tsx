"use client";

import { Canvas, useThree } from "@react-three/fiber";
import { useEffect } from "react";
import type * as THREE from "three";
import { colourwayToken } from "@/lib/tokens";
import { Paddle, Racket, Shuttlecock } from "@/three/props/SportProps";
import { TennisBall } from "@/three/props/TennisBall";
import {
  createStudioEnvironment,
  createStudioLights,
  STUDIO_LIGHTS,
} from "@/three/shoeAssets";

/** The site's studio environment and lights, rim tinted with the first colourway. */
function addStudio(gl: THREE.WebGLRenderer, scene: THREE.Scene) {
  gl.toneMappingExposure = STUDIO_LIGHTS.exposure;
  const env = createStudioEnvironment(gl);
  scene.environment = env.texture;
  const { lights } = createStudioLights(colourwayToken("lime").highlight);
  scene.add(...lights);
  return () => {
    scene.remove(...lights);
    scene.environment = null;
    env.dispose();
  };
}

function Studio() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  useEffect(() => addStudio(gl, scene), [gl, scene]);
  return null;
}

export function PropsStudio() {
  return (
    <Canvas
      id="props"
      style={{ position: "fixed", inset: 0, background: "var(--paper)" }}
      camera={{ fov: 30, position: [0, 0, 12] }}
      gl={{ antialias: true, preserveDrawingBuffer: true }}
    >
      <Studio />
      <TennisBall position={[-4.2, 0, 0]} scale={0.55} />
      <Racket position={[-1.6, 0, 0]} rotation={[0.25, 0.5, -0.35]} />
      <Shuttlecock
        position={[1.3, 0, 0]}
        rotation={[0.35, 0, -0.5]}
        scale={0.85}
      />
      <Paddle position={[3.9, 0, 0]} rotation={[0.2, -0.5, 0.35]} />
    </Canvas>
  );
}
