import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { categoriesApi } from '@/api/categoriesApi';
import type { Category } from '@/types/category';

export const categoriesKeys = {
  all: ['categories'] as const,
  list: () => [...categoriesKeys.all, 'list'] as const,
};

/**
 * Hook global de categorías. El back devuelve un FLAT array; expone también
 * `topLevel` ya filtrado (parentId === null) y ordenado por sortOrder.
 */
export function useCategories() {
  const query = useQuery({
    queryKey: categoriesKeys.list(),
    queryFn: categoriesApi.list,
    staleTime: 5 * 60_000,
  });

  const topLevel = useMemo<Category[]>(() => {
    if (!query.data) return [];
    return [...query.data]
      .filter((c) => c.parentId === null && c.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [query.data]);

  return { ...query, topLevel };
}
