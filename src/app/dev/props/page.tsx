import { notFound } from "next/navigation";
import { PropsStudio } from "./PropsStudio";

// Dev-only page showing the A7 props under the site's studio lighting. Not in production builds.
export default function PropsPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <PropsStudio />;
}
