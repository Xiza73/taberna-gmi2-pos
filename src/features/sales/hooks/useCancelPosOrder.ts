import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { posOrdersApi } from '@/api/posOrdersApi';
import { ApiError } from '@/api/errors';
import type { CancelPosOrderInput } from '@/types/posOrder';
import { posOrderKeys } from './usePosOrders';

interface CancelArgs {
  id: string;
  input: CancelPosOrderInput;
}

/**
 * Mutation para anular una venta POS. En éxito invalida todas las
 * queries de `posOrders` (list + detail) para que la fila refleje el
 * nuevo status y el detalle vuelva con el evento de anulación cargado.
 */
export function useCancelPosOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: CancelArgs) => posOrdersApi.cancel(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: posOrderKeys.all });
      toast.success('Venta anulada');
    },
    onError: (e: unknown) => {
      const msg =
        e instanceof ApiError ? e.message : 'No se pudo anular la venta';
      toast.error(msg);
    },
  });
}
