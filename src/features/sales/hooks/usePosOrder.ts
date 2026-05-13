import { useQuery } from '@tanstack/react-query';
import { posOrdersApi } from '@/api/posOrdersApi';
import { posOrderKeys } from './usePosOrders';

/**
 * Detalle de una venta POS (incluye items + events). Si `id` es null la
 * query queda deshabilitada — usado por el modal de detalle que sólo
 * fetchea cuando se seleccionó una orden.
 */
export function usePosOrder(id: string | null) {
  return useQuery({
    queryKey: posOrderKeys.detail(id ?? ''),
    queryFn: () => posOrdersApi.get(id as string),
    enabled: id !== null,
    staleTime: 15_000,
  });
}
