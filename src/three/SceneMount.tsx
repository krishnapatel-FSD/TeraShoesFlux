"use client";

import dynamic from "next/dynamic";
import {
  Component,
  useEffect,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import { SceneFallback } from "./SceneFallback";

// WebGL only runs in the browser, so the scene is never server-rendered.
const Scene = dynamic(() => import("./Scene").then((m) => m.Scene), {
  ssr: false,
});

let webglSupport: boolean | undefined;
function hasWebGL(): boolean {
  if (webglSupport === undefined) {
    try {
      const canvas = document.createElement("canvas");
      webglSupport = !!(
        canvas.getContext("webgl2") ?? canvas.getContext("webgl")
      );
    } catch {
      webglSupport = false;
    }
  }
  return webglSupport;
}

/** The prototype's message in the hero loader when there is no 3D. */
function showUnavailable() {
  const span = document.querySelector("#loader span");
  if (span) span.textContent = "3D view unavailable on this device";
}

// Without WebGL the hero shows a recording of the scene instead (B8). If the scene crashes, the page
// stays complete without 3D.
export function SceneMount() {
  const webgl = useSyncExternalStore(
    () => () => {},
    hasWebGL,
    () => false,
  );
  useEffect(() => {
    if (!hasWebGL()) showUnavailable();
  }, []);
  if (!webgl) return <SceneFallback />;
  return (
    <SceneErrorBoundary>
      <Scene />
    </SceneErrorBoundary>
  );
}

class SceneErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    console.warn("3D scene disabled:", error);
    showUnavailable();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}
