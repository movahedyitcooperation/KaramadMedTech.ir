export interface Category {
  id: string;
  slug: string;
  name: string;
  icon: string;
  parentId: string | null;
  sortOrder: number;
  isActive: boolean;
}
