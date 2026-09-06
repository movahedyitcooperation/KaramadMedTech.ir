import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CategoryFiltersPanel } from "@/components/shop/CategoryFiltersPanel";
import { DepartmentMark } from "@/components/shop/DepartmentMark";
import { FiltersSheetProvider, FiltersSheetTrigger } from "@/components/shop/FiltersSheetContext";
import { ProductCard } from "@/components/shop/ProductCard";
import { SortDropdown } from "@/components/shop/SortDropdown";
import { Panel } from "@/components/ui/Panel";
import { Pagination } from "@/components/ui/Pagination";
import { ScreenTransition } from "@/components/ui/ScreenTransition";
import { getAllCategories, getCategoryBySlug } from "@/lib/db/categories";
import { getProductsByCategory } from "@/lib/db/products";
import { getContactSetting } from "@/lib/db/settings";
import { fa } from "@/lib/i18n/fa";
import { breadcrumbJsonLd } from "@/lib/seo/jsonld";
import type { Category } from "@/lib/types/category";
import { resolveDepartment } from "@/lib/utils/department";
import { buildListingHref, parseListingParams } from "@/lib/utils/listing-params";
import { telHref } from "@/lib/utils/links";

const PAGE_SIZE = 9;

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}


export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return {};
  const title = fa.meta.categoryTitle(category.name);
  const description = `${category.name} — ${fa.meta.homeDesc}`;
  return {
    title,
    description,
    alternates: { canonical: `/category/${category.slug}` },
    openGraph: {
      title,
      description,
      type: "website",
      siteName: fa.brand.fullName,
    },
  };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params;
  const sp = await searchParams;
  const filters = parseListingParams(sp, { pageSize: PAGE_SIZE, includeFacets: true });

  const [category, allCategories] = await Promise.all([
    getCategoryBySlug(slug),
    getAllCategories(),
  ]);
  if (!category) notFound();

  // The listing can be a department or one of its sub-categories; the sidebar
  // and the department mark always belong to the top-level ancestor, so a
  // sub-category page still reads as part of its department.
  const root: Category = category.parentId
    ? (allCategories.find((c) => c.id === category.parentId) ?? category)
    : category;
  const children = allCategories
    .filter((c) => c.parentId === root.id)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  // One request carries the page AND every sidebar count: brands, each
  // sub-category, and the department total. This replaced a brand query plus
  // one COUNT per sub-category — an N+1 that grew with the tree.
  const [result, contact] = await Promise.all([
    getProductsByCategory(slug, filters),
    getContactSetting(),
  ]);

  const facets = result.facets;
  const subcategoryCounts = new Map(
    (facets?.subcategories ?? []).map((s) => [s.value, s.count])
  );
  // The department total is the sum of its sub-category counts under the same
  // filters — the facet is already scoped to this department, so there is
  // nothing further to ask the database for.
  const rootCount = (facets?.subcategories ?? []).reduce((sum, s) => sum + s.count, 0);

  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize));
  const department = resolveDepartment(root.slug);

  return (
    // Keyed on the category, not the URL: changing a filter or a page stays
    // within one screen and must not replay the crossfade.
    <ScreenTransition screenKey={`category:${category.slug}`}>
      <FiltersSheetProvider>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(
              breadcrumbJsonLd([
                { name: fa.category.home, path: "/" },
                ...(root.id !== category.id
                  ? [{ name: root.name, path: `/category/${root.slug}` }]
                  : []),
                { name: category.name, path: `/category/${category.slug}` },
              ]),
            ),
          }}
        />

        <div className="mx-auto max-w-[1280px] px-5 pt-6 pb-20 lg:px-8">
          <nav
            aria-label={fa.category.breadcrumbAria}
            className="flex flex-wrap items-center gap-2.5 pt-3.5 pb-5.5 text-13 text-ink/72"
          >
            <Link href="/" className="transition-colors hover:text-emerald-live">
              {fa.category.home}
            </Link>
            <span>/</span>
            {root.id !== category.id && (
              <>
                <Link
                  href={`/category/${root.slug}`}
                  className="font-semibold transition-colors hover:text-emerald-live"
                  style={{ color: department?.deep }}
                >
                  {root.name}
                </Link>
                <span>/</span>
              </>
            )}
            <span className="font-bold" style={{ color: department?.deep }}>
              {category.name}
            </span>
          </nav>

          <div className="mb-7 flex flex-wrap items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-3.5">
                <DepartmentMark department={department} label="" size={40} />
                <h1 className="text-h1-flat font-extrabold tracking-[-0.015em]">{category.name}</h1>
              </div>
              <p aria-live="polite" className="mt-3 text-15 leading-[1.75] text-ink/70">
                {/* Re-keyed on the total so the count settles in again whenever
                 * a filter changes it, rather than blinking to a new number. */}
                <span key={`rc-${result.total}`} className="km-note inline-block">
                  {fa.category.resultCount(result.total)}
                </span>
                {/* Reached from the search page's department facet: say so,
                 * and offer the way back out to the full result set. */}
                {filters.q && (
                  <>
                    {" · "}
                    <span>{fa.category.withinSearch(filters.q)}</span>{" "}
                    <Link
                      href={`/search?q=${encodeURIComponent(filters.q)}`}
                      className="text-emerald underline-offset-4 hover:underline"
                    >
                      {fa.category.clearScope}
                    </Link>
                  </>
                )}
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <FiltersSheetTrigger />
              <SortDropdown />
            </div>
          </div>

          <div className="grid items-start gap-9 lg:grid-cols-[268px_1fr]">
            <CategoryFiltersPanel
              scopeHeading={fa.category.subHeading}
              scopeLinks={[
                {
                  href: `/category/${root.slug}`,
                  name: fa.category.allOf(root.name),
                  count: rootCount,
                  active: category.slug === root.slug,
                },
                ...children.map((c) => ({
                  href: `/category/${c.slug}`,
                  name: c.name,
                  count: subcategoryCounts.get(c.slug) ?? 0,
                  active: c.slug === category.slug,
                })),
              ]}
              departmentSlug={root.slug}
              brands={(facets?.brands ?? []).map((b) => ({ name: b.value, count: b.count }))}
              total={result.total}
            />

            <div>
              {result.total === 0 ? (
                <Panel
                  title={fa.category.emptyTitle}
                  body={fa.category.emptyBody}
                  tone={department?.deep}
                  actions={
                    <>
                      <Link
                        href={`/category/${category.slug}`}
                        className="rounded-4 bg-ink px-6 py-3.5 text-15 font-semibold text-surface transition-colors hover:bg-emerald"
                      >
                        {fa.category.clear}
                      </Link>
                      <a
                        href={telHref(contact.phone)}
                        className="rounded-4 border border-ink/20 px-6 py-3.5 text-15 text-ink"
                      >
                        {fa.category.emptyCall}
                      </a>
                    </>
                  }
                />
              ) : (
                <>
                  <div className="km-stagger grid grid-cols-1 gap-4.5 sm:grid-cols-2 lg:grid-cols-3">
                    {result.items.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                  {totalPages > 1 && (
                    <div className="mt-9">
                      <Pagination
                        page={result.page}
                        totalPages={totalPages}
                        buildHref={(page) => buildListingHref(`/category/${slug}`, sp, {}, page)}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </FiltersSheetProvider>
    </ScreenTransition>
  );
}
