import { notFound } from "next/navigation";
import { ProductShotStudio } from "./ProductShotStudio";

// Dev-only page that renders product photos for `pnpm assets:images` (A9). Not in production builds.
export default function ProductShotPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <ProductShotStudio />;
}
