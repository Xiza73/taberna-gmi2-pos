/**
 * Product — espejo del `ProductResponseDto` del back.
 * Mantenelo alineado con `backend/docs/modules/products.md`.
 */
export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  /** Cents PEN. */
  price: number;
  /** Cents PEN, null si no hay precio anterior tachado. */
  compareAtPrice: number | null;
  sku: string | null;
  stock: number;
  images: string[];
  categoryId: string;
  isActive: boolean;
  averageRating: number | null;
  totalReviews: number;
  createdAt: string;
  updatedAt: string;
}

export type ProductSortBy = 'newest' | 'price' | 'price_desc' | 'name' | 'rating';

export interface ProductsQuery {
  page?: number;
  limit?: number;
  categoryId?: string;
  search?: string;
  sortBy?: ProductSortBy;
}
