import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { productsApi } from '@/api/productsApi';
import type { ProductsQuery } from '@/types/product';

export const productsKeys = {
  all: ['products'] as const,
  list: (query: ProductsQuery) => [...productsKeys.all, 'list', query] as const,
};

export function useProducts(query: ProductsQuery) {
  return useQuery({
    queryKey: productsKeys.list(query),
    queryFn: () => productsApi.list(query),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}
