// WCAG 2.x contrast, used by the colourway contrast check (A4) and its tests.

export const AA_NORMAL = 4.5;
export const AA_LARGE = 3;

const channel = (v: number) =>
  v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;

export function relativeLuminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) =>
    channel(c / 255),
  );
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort(
    (x, y) => y - x,
  );
  return (hi! + 0.05) / (lo! + 0.05);
}

/** Mixes `a` into `b` by `amount` in sRGB, matching CSS `color-mix(in srgb, a amount, b)`. */
export function mixSrgb(a: string, b: string, amount: number): string {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const out = [16, 8, 0].map((s) =>
    Math.round(((pa >> s) & 255) * amount + ((pb >> s) & 255) * (1 - amount)),
  );
  return "#" + out.map((c) => c.toString(16).padStart(2, "0")).join("");
}
