import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { posOrdersApi } from '@/api/posOrdersApi';
import { db } from '@/db';
import { productsKeys } from '@/features/catalog';
import { pendingSalesKeys } from '@/features/offline-sync/hooks/usePendingSales';
import { posOrderKeys } from '@/features/sales';
import type { CreatePosOrderInput, PosOrderResponse } from '@/types/posOrder';

/**
 * Resultado de la mutation. Diferenciamos por `kind`:
 *  - `synced`: la venta se creó en el back, devolvemos la orden completa.
 *  - `queued`: el navegador estaba offline; se guardó en IndexedDB y se
 *    sincronizará automáticamente cuando vuelva la conexión.
 */
export type CreatePosOrderResult =
  | { kind: 'synced'; order: PosOrderResponse }
  | { kind: 'queued'; localId: string };

/**
 * Mutation para crear venta POS. Si hay conexión, hace POST normal.
 * Si no hay, encola en IndexedDB y resuelve `queued` para que el caller
 * cierre el modal y limpie el cart como si hubiera sido exitoso.
 *
 * En éxito online: invalida productos (stock cambia) + listas POS.
 * En éxito offline (queued): invalida la cola para refrescar el badge.
 */
export function useCreatePosOrder() {
  const queryClient = useQueryClient();
  return useMutation<CreatePosOrderResult, Error, CreatePosOrderInput>({
    mutationFn: async (input) => {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        const localId = crypto.randomUUID();
        await db.pendingOrders.add({
          localId,
          payload: input as unknown as Record<string, unknown>,
          createdAt: Date.now(),
          attempts: 0,
          lastError: null,
        });
        return { kind: 'queued', localId };
      }
      const order = await posOrdersApi.create(input);
      return { kind: 'synced', order };
    },
    onSuccess: (result) => {
      if (result.kind === 'queued') {
        toast.success(
          'Venta guardada sin conexión. Se sincronizará cuando vuelvas a estar en línea.',
        );
        void queryClient.invalidateQueries({ queryKey: pendingSalesKeys.all });
      } else {
        void queryClient.invalidateQueries({ queryKey: productsKeys.all });
        void queryClient.invalidateQueries({ queryKey: posOrderKeys.all });
      }
    },
  });
}
