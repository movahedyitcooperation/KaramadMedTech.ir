import { mockCategories } from "@/lib/mock/categories";
import type { Category } from "@/lib/types/category";

export async function getAllCategories(): Promise<Category[]> {
  return mockCategories.filter((c) => c.isActive);
}

export async function getTopLevelCategories(): Promise<Category[]> {
  const all = await getAllCategories();
  return all.filter((c) => c.parentId === null).sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const all = await getAllCategories();
  return all.find((c) => c.slug === slug) ?? null;
}

export async function getCategoryById(id: string): Promise<Category | null> {
  const all = await getAllCategories();
  return all.find((c) => c.id === id) ?? null;
}

export async function getSubcategories(parentId: string): Promise<Category[]> {
  const all = await getAllCategories();
  return all.filter((c) => c.parentId === parentId).sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function getCategoryTree(): Promise<Array<Category & { children: Category[] }>> {
  const top = await getTopLevelCategories();
  const all = await getAllCategories();
  return top.map((parent) => ({
    ...parent,
    children: all
      .filter((c) => c.parentId === parent.id)
      .sort((a, b) => a.sortOrder - b.sortOrder),
  }));
}

/** Returns the chain from the top-level ancestor down to the category matching `slug`. */
export async function getCategoryBreadcrumb(slug: string): Promise<Category[]> {
  const all = await getAllCategories();
  const target = all.find((c) => c.slug === slug);
  if (!target) return [];

  const chain: Category[] = [target];
  let current = target;
  while (current.parentId) {
    const parent = all.find((c) => c.id === current.parentId);
    if (!parent) break;
    chain.unshift(parent);
    current = parent;
  }
  return chain;
}

/** All category ids that belong to the subtree rooted at `slug` (the category itself plus any descendants). */
export async function getCategoryIdsInSubtree(slug: string): Promise<string[]> {
  const all = await getAllCategories();
  const root = all.find((c) => c.slug === slug);
  if (!root) return [];

  const ids = [root.id];
  const children = all.filter((c) => c.parentId === root.id);
  ids.push(...children.map((c) => c.id));
  return ids;
}
