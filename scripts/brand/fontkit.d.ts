// Minimal types for the parts of fontkit the logo script uses (the package ships none).
declare module "fontkit" {
  interface Path {
    scale(x: number, y: number): Path;
    translate(x: number, y: number): Path;
    toSVG(): string;
  }
  interface Glyph {
    path: Path;
  }
  interface GlyphRun {
    glyphs: Glyph[];
    positions: { xAdvance: number }[];
  }
  export interface Font {
    familyName: string;
    unitsPerEm: number;
    capHeight: number;
    hasGlyphForCodePoint(codePoint: number): boolean;
    getVariation(settings: Record<string, number>): Font;
    layout(text: string): GlyphRun;
  }
  export function openSync(path: string): Font;
  export function create(buffer: Buffer): Font;
}

declare module "wawoff2" {
  export function decompress(data: Uint8Array): Promise<Uint8Array>;
}
