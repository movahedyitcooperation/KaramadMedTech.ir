export interface CartLine {
  productId: string;
  slug: string;
  name: string;
  image: string;
  unitPrice: number;
  qty: number;
  stock: number;
}

export interface Cart {
  id: string;
  items: CartLine[];
}
