import { Band } from "@/components/layout/Band";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Menu } from "@/components/layout/Menu";
import {
  BagDrawer,
  Scrim,
  SearchPanel,
  Toast,
  ToTop,
} from "@/components/layout/Overlays";
import { Faq } from "@/components/sections/Faq";
import { Hero } from "@/components/sections/Hero";
import { Perks } from "@/components/sections/Perks";
import { ProductSection } from "@/components/sections/ProductSection";
import { ShopGrid } from "@/components/sections/ShopGrid";
import { Tour } from "@/components/sections/Tour";
import { IconSprite } from "@/components/ui/Icons";
import { getCatalogue } from "@/lib/shopify/catalogue";
import { PageMotion } from "@/motion/PageMotion";
import { CatalogueProvider } from "@/state/catalogue";
import { SceneMount } from "@/three/SceneMount";

// The storefront, in the prototype's DOM order (prototype/index.html). The catalogue comes from
// Shopify when .env.local is set up, otherwise from the prototype.
export default async function Home() {
  const catalogue = await getCatalogue();
  return (
    <CatalogueProvider value={catalogue}>
      <IconSprite />
      <div className="progress" id="progress"></div>
      <div id="flood"></div>
      <SceneMount />
      <Header />
      <Menu />
      <main id="top">
        <Hero />
        <Band />
        <Tour />
        <ProductSection />
        <ShopGrid />
        <Perks />
        <Faq />
      </main>
      <Footer />
      <ToTop />
      <Scrim />
      <BagDrawer />
      <SearchPanel />
      <Toast />
      <PageMotion />
    </CatalogueProvider>
  );
}
