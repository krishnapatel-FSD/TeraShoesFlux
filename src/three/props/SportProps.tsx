"use client";

import type { ThreeElements } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import { createPaddles, type PaddleColours } from "./paddleKit";
import { createRackets, type PropKit, type RacketColours } from "./racketKit";
import { createShuttlecocks, type ShuttlecockColours } from "./shuttlecockKit";

// A7: the prototype's other props as React Three Fiber components, each with its own colour props,
// e.g. `<Racket frame={hl} position={[1, 0, 0]} scale={0.4} />`. Each is 2 units long. Not on the
// page yet: their placement per colourway waits on the latest shared prototype (OD-1, OD-7).

type ObjectProps = Omit<ThreeElements["primitive"], "object">;

/** One prop from the kit; the kit is disposed when its colours change or on unmount. */
function useProp(kit: PropKit) {
  const object = useMemo(() => kit.create(), [kit]);
  useEffect(() => () => kit.dispose(), [kit]);
  return object;
}

export function Racket({
  frame,
  strings,
  grip,
  ...props
}: ObjectProps & RacketColours) {
  const kit = useMemo(
    () => createRackets({ frame, strings, grip }),
    [frame, strings, grip],
  );
  return <primitive object={useProp(kit)} {...props} />;
}

export function Shuttlecock({
  cork,
  feathers,
  band,
  ...props
}: ObjectProps & ShuttlecockColours) {
  const kit = useMemo(
    () => createShuttlecocks({ cork, feathers, band }),
    [cork, feathers, band],
  );
  return <primitive object={useProp(kit)} {...props} />;
}

export function Paddle({
  rubber,
  back,
  handle,
  ...props
}: ObjectProps & PaddleColours) {
  const kit = useMemo(
    () => createPaddles({ rubber, back, handle }),
    [rubber, back, handle],
  );
  return <primitive object={useProp(kit)} {...props} />;
}
