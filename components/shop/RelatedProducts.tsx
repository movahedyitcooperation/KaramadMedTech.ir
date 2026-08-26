import { ProductCarousel } from "@/components/shop/ProductCarousel";
import { fa } from "@/lib/i18n/fa";
import { getRelatedProducts } from "@/lib/db/products";

export async function RelatedProducts({ productId }: { productId: string }) {
  const products = await getRelatedProducts(productId, 4);
  if (products.length === 0) return null;
  return <ProductCarousel title={fa.product.relatedProducts} products={products} />;
}
