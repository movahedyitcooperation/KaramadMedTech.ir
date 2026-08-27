import { BrandMesh } from "@/components/shop/BrandMesh";

/** Thin wrapper kept for call-site stability; the texture now lives in BrandMesh. */
export function HeroBackground() {
  return <BrandMesh strength="hero" />;
}
