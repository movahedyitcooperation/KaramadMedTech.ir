import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ProductCard } from "@/components/shop/ProductCard";
import { ProductGallery } from "@/components/shop/ProductGallery";
import { ProductPurchasePanel } from "@/components/shop/ProductPurchasePanel";
import { ProductTabs } from "@/components/shop/ProductTabs";
import { ShareButton } from "@/components/shop/ShareButton";
import { HighlightCard } from "@/components/ui/HighlightCard";
import { ScreenTransition } from "@/components/ui/ScreenTransition";
import { formatRating, stars } from "@/lib/format";
import { getAllCategories } from "@/lib/db/categories";
import { getProductBySlug, getRelatedProducts } from "@/lib/db/products";
import { getContactSetting } from "@/lib/db/settings";
import { fa } from "@/lib/i18n/fa";
import { absoluteUrl, breadcrumbJsonLd, buildProductJsonLd } from "@/lib/seo/jsonld";
import { resolveDepartmentForCategory } from "@/lib/utils/department";
import { telHref, waHref } from "@/lib/utils/links";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};

  const title = fa.meta.productTitle(product.name);
  const description = product.shortDesc || product.description[0] || fa.meta.homeDesc;
  return {
    title,
    description,
    alternates: { canonical: `/product/${product.slug}` },
    openGraph: {
      title,
      description,
      type: "website",
      siteName: fa.brand.fullName,
      images: product.images.map((img) => ({ url: img.url, alt: img.alt })),
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [allCategories, contact] = await Promise.all([getAllCategories(), getContactSetting()]);

  const category = allCategories.find((c) => c.id === product.categoryId) ?? null;
  // Needs the resolved category slug, so it can't join the Promise.all above.
  const related = await getRelatedProducts(product, category?.slug ?? null, 6);
  const department = category ? resolveDepartmentForCategory(category, allCategories) : null;
  const outOfStock = product.stock === 0;

  return (
    <ScreenTransition screenKey={`product:${product.slug}`}>
      <div className="mx-auto max-w-[1280px] px-5 pt-6 pb-20 lg:px-8">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(
              buildProductJsonLd(product, absoluteUrl(`/product/${product.slug}`)),
            ),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(
              breadcrumbJsonLd([
                { name: fa.pdp.home, path: "/" },
                ...(category
                  ? [
                      {
                        name: category.name,
                        path: `/category/${category.slug}`,
                      },
                    ]
                  : []),
                { name: product.name, path: `/product/${product.slug}` },
              ]),
            ),
          }}
        />

        <div className="flex flex-wrap items-center justify-between gap-5 pt-3.5 pb-6">
          <nav
            aria-label={fa.pdp.breadcrumbAria}
            className="flex flex-wrap items-center gap-2.5 text-13 text-ink/72"
          >
            <Link href="/" className="transition-colors hover:text-emerald-live">
              {fa.pdp.home}
            </Link>
            <span>/</span>
            {category && (
              <>
                <Link
                  href={`/category/${category.slug}`}
                  className="font-semibold transition-colors hover:text-emerald-live"
                  style={{ color: department?.deep }}
                >
                  {category.name}
                </Link>
                <span>/</span>
              </>
            )}
            <span className="font-semibold text-ink">{product.name}</span>
          </nav>
          <ShareButton productName={product.name} />
        </div>

        <div className="grid items-start gap-11 lg:grid-cols-2">
          <ProductGallery images={product.images} productName={product.name} />

          <div className="flex flex-col gap-5.5">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <span dir="ltr" className="text-13 font-bold tracking-[0.03em] text-ink/70">
                  {product.brand}
                </span>
                <span
                  className={`rounded-2 px-2.75 py-1.25 text-13 font-bold text-surface ${
                    outOfStock ? "bg-ink/72" : "bg-emerald-live-deep"
                  }`}
                >
                  {outOfStock ? fa.pdp.outOfStock : fa.pdp.inStock}
                </span>
              </div>
              <h1 className="mt-3 text-h1 leading-[1.5] font-extrabold tracking-[-0.012em] text-pretty">
                {product.name}
              </h1>
              {product.shortDesc && (
                <p className="mt-3.5 max-w-[52ch] text-base leading-[1.9] text-ink/72">
                  {product.shortDesc}
                </p>
              )}
            </div>

            <ProductPurchasePanel product={product} contact={contact} />

            {/* The one place on this page where the site speaks rather than
             * lists: the key specs, the expert rating, and the two channels
             * that actually reach a human. */}
            <HighlightCard className="flex flex-col gap-4.5">
              <div className="flex flex-wrap items-baseline justify-between gap-4">
                <strong className="text-base font-bold">{fa.pdp.keySpecs}</strong>
                <span className="flex items-center gap-2 text-13 text-bone/72">
                  <span aria-hidden="true" className="tracking-[0.06em]">
                    {stars(product.ratingAvg)}
                  </span>
                  <span>{fa.pdp.ratingLine(formatRating(product.ratingAvg))}</span>
                </span>
              </div>

              <dl className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-3 text-14">
                {product.specs.slice(0, 4).map((spec, i) => (
                  <div key={i} className="contents">
                    <dt className="leading-[1.7] text-bone/70">{spec.key}</dt>
                    <dd className="m-0 leading-[1.7] font-semibold">{spec.value}</dd>
                  </div>
                ))}
              </dl>

              <div className="flex flex-wrap gap-2.5 border-t border-bone/16 pt-4.5">
                <a
                  href={telHref(contact.phone)}
                  className="rounded-4 bg-bone px-5 py-3 text-14 font-bold text-ink"
                >
                  {fa.pdp.consultPhone}
                </a>
                <a
                  href={waHref(contact)}
                  className="rounded-4 border border-bone/34 px-5 py-3 text-14 text-bone"
                >
                  {fa.pdp.askWhatsapp}
                </a>
              </div>

              <div className="text-12 leading-[1.8] text-bone/65">
                {fa.pdp.sku}{" "}
                <span dir="ltr" className="inline-block font-semibold tracking-[0.03em]">
                  {product.sku}
                </span>
              </div>
            </HighlightCard>
          </div>
        </div>

        <ProductTabs product={product} contact={contact} />

        {related.length > 0 && (
          <section aria-label={fa.pdp.relatedHeading} className="mt-16">
            <h2 className="mb-5.5 text-2xl font-extrabold tracking-[-0.01em]">
              {fa.pdp.relatedHeading}
            </h2>
            <div className="km-scroll relative grid snap-x snap-mandatory grid-flow-col auto-cols-[minmax(232px,1fr)] gap-4.5 overflow-x-auto pb-2.5">
              {related.map((item) => (
                <div key={item.id} className="grid snap-start">
                  <ProductCard product={item} variant="mini" />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </ScreenTransition>
  );
}
