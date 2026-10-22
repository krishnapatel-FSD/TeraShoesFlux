// Theme colours for code that can't read CSS variables: the three.js scene, canvas drawing and
// generated assets. Same values as src/styles/design-tokens.css (prototype values, unchanged).

export const THEME = {
  ink: "#101216",
  white: "#ffffff",
} as const;

/** The 3D scene's own colours (lights, contact shadow, tennis ball), from the prototype. */
export const SCENE = {
  keyLight: "#ffffff",
  fillLight: "#ffffff",
  hemiSky: "#ffffff",
  hemiGround: "#d8dce2",
  /** Contact shadow gradient: ink at 45%, 16% and 0%. */
  shadowStops: ["rgba(16,18,22,.45)", "rgba(16,18,22,.16)", "rgba(16,18,22,0)"],
  ball: { felt: "#d2ee3a", sheen: "#f6ffb0", seam: "#f4f6ee" },
  /**
   * A7 props' default colours, from the palette above. Provisional: the latest shared prototype
   * (OD-1) has the real designs, and each colourway can pass its own (OD-7).
   */
  racket: { frame: "#101216", strings: "#f4f6ee", grip: "#ffffff" },
  shuttlecock: { cork: "#ffffff", feathers: "#f4f6ee", band: "#101216" },
  paddle: { rubber: "#101216", back: "#ffffff", handle: "#f4f6ee" },
} as const;
