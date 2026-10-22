"use client";

import type { ThreeElements } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import { createTennisBalls, type TennisBallColours } from "./tennisBallKit";

type TennisBallProps = Omit<ThreeElements["primitive"], "object"> &
  TennisBallColours;

/**
 * A7: one procedural tennis ball as a React Three Fiber component, e.g.
 * `<TennisBall felt={SCENE.ball.felt} seam={THEME.white} position={[1, 0, 0]} scale={0.3} />`.
 * The hero stage builds its six balls with `createTennisBalls` directly (shared resources).
 */
export function TennisBall({ felt, sheen, seam, ...props }: TennisBallProps) {
  const kit = useMemo(
    () => createTennisBalls({ felt, sheen, seam }),
    [felt, sheen, seam],
  );
  const ball = useMemo(() => kit.create(), [kit]);
  useEffect(() => () => kit.dispose(), [kit]);
  return <primitive object={ball} {...props} />;
}
