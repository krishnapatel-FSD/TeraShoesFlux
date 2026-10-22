"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, useSyncExternalStore } from "react";
import type { PerspectiveCamera } from "three";
import {
  isLowPowerMode,
  reportFrame,
  startPowerWatch,
  subscribeLowPower,
} from "@/motion/lowPower";
import { heroRecorder } from "@/motion/probe";
import { select } from "@/state/actions";
import { getState } from "@/state/store";
import { createStage, type Stage } from "./stage";
import { S } from "./stageState";

// The prototype's single full-screen canvas (#gl): fixed above the page and never catching
// pointer events. The stage docks the shoe into the hero, tour, product viewer and shop.
export function Scene() {
  const lowPower = useSyncExternalStore(
    subscribeLowPower,
    isLowPowerMode,
    () => false,
  );
  return (
    <Canvas
      id="gl"
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: 4,
        pointerEvents: "none",
        display: "block",
      }}
      // Low-power mode (B7): pixel ratio 1, and frames on demand from FrameCap at 30 fps.
      dpr={lowPower ? 1 : [1, 2]}
      frameloop={lowPower ? "demand" : "always"}
      camera={{ fov: 30, near: 0.1, far: 100, position: [0, 0, 10] }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
    >
      <StageRunner />
      {lowPower && <FrameCap fps={30} />}
    </Canvas>
  );
}

function StageRunner() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  const setFrameloop = useThree((s) => s.setFrameloop);
  const stage = useRef<Stage | null>(null);
  /** Set by a recording session: only its own `frame` calls advance the scene. */
  const recording = useRef(false);

  useEffect(() => {
    const s = createStage(gl, scene, camera as PerspectiveCamera);
    stage.current = s;
    const rec = heroRecorder();
    if (rec) {
      let time = 0;
      rec.ready = () =>
        S.intro === 1 && Object.keys(getState().thumbs).length > 0;
      rec.pause = () => {
        recording.current = true;
        setFrameloop("never");
      };
      rec.frame = (dt) => {
        time += dt;
        s.update(dt, time);
        gl.render(scene, camera);
        return gl.domElement.toDataURL("image/png");
      };
      rec.select = (id) => select(id, false);
      rec.pose = (a, anchor) => {
        S.a = a;
        S.drag = S.dragV = 0;
        for (let i = 0; i < 60; i++) s.update(0, time); // let the rim light settle
        gl.render(scene, camera);
        const src = gl.domElement;
        const k = src.width / innerWidth;
        const r = document.querySelector(anchor)!.getBoundingClientRect();
        const out = document.createElement("canvas");
        out.width = Math.round(r.width * k);
        out.height = Math.round(r.height * k);
        out
          .getContext("2d")!
          .drawImage(
            src,
            r.left * k,
            r.top * k,
            out.width,
            out.height,
            0,
            0,
            out.width,
            out.height,
          );
        return out.toDataURL("image/png");
      };
      rec.thumbs = () => getState().thumbs;
    }
    return () => {
      stage.current = null;
      s.dispose();
    };
  }, [gl, scene, camera, setFrameloop]);

  useEffect(() => startPowerWatch(), []);

  useFrame((state, delta) => {
    if (recording.current) return;
    reportFrame(delta * 1000);
    stage.current?.update(Math.min(0.05, delta), state.clock.elapsedTime);
  });
  return null;
}

/** Requests a frame at a fixed rate (with frameloop="demand"). */
function FrameCap({ fps }: { fps: number }) {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    const id = setInterval(() => invalidate(), 1000 / fps);
    return () => clearInterval(id);
  }, [invalidate, fps]);
  return null;
}
