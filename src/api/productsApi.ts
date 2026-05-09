import type { Paginated } from '@/types/api';
import type { Product, ProductsQuery } from '@/types/product';
import { apiClient } from './client';

export const productsApi = {
  /** GET /products — endpoint público; devuelve paginado. */
  list(query: ProductsQuery = {}): Promise<Paginated<Product>> {
    return apiClient.get<Paginated<Product>>('/products', { query });
  },
  bySlug(slug: string): Promise<Product> {
    return apiClient.get<Product>(`/products/${slug}`);
  },
};
