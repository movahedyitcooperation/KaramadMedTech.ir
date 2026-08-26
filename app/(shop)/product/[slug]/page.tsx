import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/shop/Breadcrumb";
import { ProductGallery } from "@/components/shop/ProductGallery";
import { ProductHighlightsCard } from "@/components/shop/ProductHighlightsCard";
import { ProductPurchaseCard } from "@/components/shop/ProductPurchaseCard";
import { ProductTabs } from "@/components/shop/ProductTabs";
import { RelatedProducts } from "@/components/shop/RelatedProducts";
import { ShareButton } from "@/components/shop/ShareButton";
import { Badge } from "@/components/ui/Badge";
import { getCategoryBreadcrumb, getCategoryById } from "@/lib/db/categories";
import { getProductBySlug } from "@/lib/db/products";
import { getContactSetting } from "@/lib/db/settings";
import { fa } from "@/lib/i18n/fa";
import { buildProductJsonLd } from "@/lib/seo/jsonld";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};

  return {
    title: `${product.name} | ${fa.brand.name}`,
    description: product.shortDesc,
    openGraph: {
      title: product.name,
      description: product.shortDesc,
      images: product.images.map((img) => ({ url: img.url })),
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const category = await getCategoryById(product.categoryId);
  const [breadcrumbChain, contact] = await Promise.all([
    category ? getCategoryBreadcrumb(category.slug) : Promise.resolve([]),
    getContactSetting(),
  ]);

  const jsonLd = buildProductJsonLd(product, `/product/${product.slug}`);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mb-2 flex items-center justify-between gap-4">
        <Breadcrumb
          items={[
            ...breadcrumbChain.map((c) => ({ label: c.name, href: `/category/${c.slug}` })),
            { label: product.name },
          ]}
        />
        <ShareButton productName={product.name} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px_320px]">
        <ProductGallery images={product.images} productName={product.name} />
        <ProductPurchaseCard product={product} />
        <ProductHighlightsCard product={product} phone={contact.phone} />
      </div>

      {product.compareAtPrice && (
        <div className="mt-4">
          <Badge variant="coral">تخفیف ویژه</Badge>
        </div>
      )}

      <div className="mt-10">
        <ProductTabs product={product} />
      </div>

      <div className="mt-6">
        <RelatedProducts productId={product.id} />
      </div>
    </div>
  );
}
