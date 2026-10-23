import type { Metadata } from "next";
import {
  Anton,
  Archivo,
  Hanken_Grotesk,
  JetBrains_Mono,
} from "next/font/google";
import { SmoothScroll } from "@/motion/SmoothScroll";
import "./globals.css";

// Archivo keeps its width axis: the hero word is condensed (wdth 62), display headings expanded (wdth 125).
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  axes: ["wdth"],
});
// Anton: the footer's big word only.
const anton = Anton({
  variable: "--font-anton",
  subsets: ["latin"],
  weight: "400",
});
const hanken = Hanken_Grotesk({
  variable: "--font-hanken",
  subsets: ["latin"],
});
const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TeraShoes Flux 01",
  description:
    "A knit trainer on poured foam. 268 g, 8 mm drop, rated for 800 km.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${archivo.variable} ${anton.variable} ${hanken.variable} ${jetbrains.variable}`}
    >
      <body>
        <SmoothScroll />
        {children}
      </body>
    </html>
  );
}
