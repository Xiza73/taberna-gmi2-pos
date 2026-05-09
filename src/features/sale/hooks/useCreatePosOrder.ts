import { useMutation, useQueryClient } from '@tanstack/react-query';
import { posOrdersApi } from '@/api/posOrdersApi';
import { productsKeys } from '@/features/catalog';

/**
 * Mutation para crear venta POS. Después del éxito invalida la cache de
 * productos para reflejar stock actualizado en el grid.
 */
export function useCreatePosOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: posOrdersApi.create,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: productsKeys.all });
    },
  });
}
