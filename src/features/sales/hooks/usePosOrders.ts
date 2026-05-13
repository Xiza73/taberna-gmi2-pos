import { useQuery } from '@tanstack/react-query';
import { posOrdersApi } from '@/api/posOrdersApi';
import type { PosOrderFilters } from '@/types/posOrder';

export const posOrderKeys = {
  all: ['posOrders'] as const,
  list: (filters: PosOrderFilters) => ['posOrders', 'list', filters] as const,
  detail: (id: string) => ['posOrders', 'detail', id] as const,
};

/**
 * Listado paginado de ventas POS/WhatsApp con filtros aplicados.
 * `placeholderData` mantiene la página previa visible mientras se
 * resuelve la nueva query (evita "flash" al cambiar página o filtro).
 */
export function usePosOrders(filters: PosOrderFilters) {
  return useQuery({
    queryKey: posOrderKeys.list(filters),
    queryFn: () => posOrdersApi.list(filters),
    staleTime: 15_000,
    placeholderData: (prev) => prev,
  });
}
