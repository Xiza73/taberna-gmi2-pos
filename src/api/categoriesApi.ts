import type { Category } from '@/types/category';
import { apiClient } from './client';

export const categoriesApi = {
  /** GET /categories — público; devuelve flat array de categorías activas. */
  list(): Promise<Category[]> {
    return apiClient.get<Category[]>('/categories');
  },
};
