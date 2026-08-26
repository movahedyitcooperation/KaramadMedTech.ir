export interface ProductImage {
  url: string;
  alt: string;
  sortOrder: number;
}

export interface ProductSpec {
  group: string;
  key: string;
  value: string;
  sortOrder: number;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  brand: string;
  shortDesc: string;
  description: string[];
  price: number;
  compareAtPrice: number | null;
  stock: number;
  sku: string;
  isActive: boolean;
  isFeatured: boolean;
  categoryId: string;
  ratingAvg: number;
  ratingCount: number;
  images: ProductImage[];
  specs: ProductSpec[];
}
