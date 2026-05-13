import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { posOrdersApi } from '@/api/posOrdersApi';
import { ApiError } from '@/api/errors';
import type { RefundPosOrderInput } from '@/types/posOrder';
import { posOrderKeys } from './usePosOrders';

interface RefundArgs {
  id: string;
  input: RefundPosOrderInput;
}

/**
 * Mutation para devolver una venta POS (total o parcial). En éxito
 * invalida todas las queries de `posOrders` (list + detail) para que
 * la fila refleje el nuevo status (si fue total) y el detalle vuelva
 * con el evento de devolución cargado.
 */
export function useRefundPosOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: RefundArgs) => posOrdersApi.refund(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: posOrderKeys.all });
      toast.success('Devolución registrada');
    },
    onError: (e: unknown) => {
      const msg =
        e instanceof ApiError
          ? e.message
          : 'No se pudo registrar la devolución';
      toast.error(msg);
    },
  });
}
