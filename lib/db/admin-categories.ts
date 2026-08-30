import { redirect } from "next/navigation";
import { AdminApiError, adminApiFetch } from "@/lib/api/admin-client";
import { mapCategoryRead } from "@/lib/api/mappers";
import type { ApiCategoryRead } from "@/lib/api/types";
import type { Category } from "@/lib/types/category";

async function withAuthRedirect<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof AdminApiError && err.status === 401) {
      redirect("/admin/login");
    }
    throw err;
  }
}

export async function getAdminCategoryList(): Promise<Category[]> {
  return withAuthRedirect(async () => {
    const raw = await adminApiFetch<ApiCategoryRead[]>("/admin/categories/");
    return raw.map(mapCategoryRead);
  });
}

export async function getAdminCategoryById(id: string): Promise<Category | null> {
  return withAuthRedirect(async () => {
    try {
      const raw = await adminApiFetch<ApiCategoryRead>(`/admin/categories/${encodeURIComponent(id)}`);
      return mapCategoryRead(raw);
    } catch (err) {
      if (err instanceof AdminApiError && err.status === 404) return null;
      throw err;
    }
  });
}

export interface CategoryWithDepth extends Category {
  depth: number;
}

/** Flat list -> indentable tree order (parents immediately followed by their
 * children, each tagged with its nesting depth) for the admin list page's
 * table. Matches the real data's 2-level shape but works for any depth. */
export async function getAdminCategoryTree(): Promise<CategoryWithDepth[]> {
  const all = await getAdminCategoryList();
  const byParent = new Map<string | null, Category[]>();
  for (const c of all) {
    const key = c.parentId;
    byParent.set(key, [...(byParent.get(key) ?? []), c]);
  }
  const ordered: CategoryWithDepth[] = [];
  function walk(parentId: string | null, depth: number) {
    for (const c of (byParent.get(parentId) ?? []).sort((a, b) => a.sortOrder - b.sortOrder)) {
      ordered.push({ ...c, depth });
      walk(c.id, depth + 1);
    }
  }
  walk(null, 0);
  return ordered;
}
