import type { Category } from "@/lib/types/category";

export type DepartmentKey =
  | "diagnostics"
  | "consumables"
  | "rehab"
  | "homecare"
  | "clinic"
  | "accessories";

export interface Department {
  key: DepartmentKey;
  /** CSS var reference for the tint (e.g. "var(--color-dept-diagnostics)"). */
  tint: string;
  /** CSS var reference for the ≥4.5:1-contrast text/icon-border color. */
  deep: string;
  /** Matches public/images/categories/<key>.webp, the owner-supplied icon
   * asset — always English, since department.ts is the sole translation
   * layer between these keys and the real (Persian-transliterated) slugs. */
  iconSrc: string;
}

const DEPARTMENTS: Record<DepartmentKey, Department> = {
  diagnostics: {
    key: "diagnostics",
    tint: "var(--color-dept-diagnostics)",
    deep: "var(--color-dept-diagnostics-deep)",
    iconSrc: "/images/categories/diagnostics.webp",
  },
  consumables: {
    key: "consumables",
    tint: "var(--color-dept-consumables)",
    deep: "var(--color-dept-consumables-deep)",
    iconSrc: "/images/categories/consumables.webp",
  },
  rehab: {
    key: "rehab",
    tint: "var(--color-dept-rehab)",
    deep: "var(--color-dept-rehab-deep)",
    iconSrc: "/images/categories/rehab.webp",
  },
  homecare: {
    key: "homecare",
    tint: "var(--color-dept-homecare)",
    deep: "var(--color-dept-homecare-deep)",
    iconSrc: "/images/categories/homecare.webp",
  },
  clinic: {
    key: "clinic",
    tint: "var(--color-dept-clinic)",
    deep: "var(--color-dept-clinic-deep)",
    iconSrc: "/images/categories/clinic.webp",
  },
  accessories: {
    key: "accessories",
    tint: "var(--color-dept-accessories)",
    deep: "var(--color-dept-accessories-deep)",
    iconSrc: "/images/categories/accessories.webp",
  },
};

/**
 * The real seeded top-level category slugs (backend/scripts/seed.py) are
 * Persian transliterations, NOT the English department keys above — this
 * map is the ONLY place that translation happens. Verified directly
 * against seed.py; do not guess at new slugs without checking there first.
 */
const SLUG_TO_DEPARTMENT: Record<string, DepartmentKey> = {
  "tajhizat-tashkhisi": "diagnostics",
  "masrafi-behdashti": "consumables",
  "tavanbakhshi-ortopedi": "rehab",
  "moraghebat-dar-manzel": "homecare",
  "tajhizat-matb-clinic": "clinic",
  "lavazem-janebi": "accessories",
};

/** Resolves a top-level category slug to its Department, or null if the
 * slug isn't one of the six known departments (fall back to a neutral
 * treatment — never guess a color). */
export function resolveDepartment(slug: string): Department | null {
  const key = SLUG_TO_DEPARTMENT[slug];
  return key ? DEPARTMENTS[key] : null;
}

/**
 * Resolves a Department for ANY category, including a sub-category, by
 * climbing `parentId` to its top-level ancestor first. The category tree
 * is exactly two levels (backend limitation), so this climbs at most once,
 * but is written generically rather than assuming that depth.
 */
export function resolveDepartmentForCategory(
  category: Pick<Category, "slug" | "parentId">,
  allCategories: Pick<Category, "id" | "slug" | "parentId">[]
): Department | null {
  let current: Pick<Category, "id" | "slug" | "parentId"> | undefined = {
    id: "",
    ...category,
  } as Pick<Category, "id" | "slug" | "parentId">;
  const bySlugOrId = new Map(allCategories.map((c) => [c.id, c]));
  // Walk up parentId until there is none — that's the top-level ancestor.
  while (current?.parentId) {
    const parent = bySlugOrId.get(current.parentId);
    if (!parent) break;
    current = parent;
  }
  return current ? resolveDepartment(current.slug) : null;
}
