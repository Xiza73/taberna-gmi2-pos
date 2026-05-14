import { useQuery } from '@tanstack/react-query';
import { db, type PendingPosOrder } from '@/db';

/**
 * Lectura reactiva de la cola de ventas offline desde IndexedDB.
 * Se invalida manualmente desde los hooks de sync o desde acciones de
 * descarte. `staleTime: Infinity` evita refetch automático — Dexie es
 * la fuente de verdad y los cambios se notifican vía invalidate.
 */

export const pendingSalesKeys = {
  all: ['pendingSales'] as const,
};

interface UsePendingSalesReturn {
  pending: PendingPosOrder[];
  count: number;
  failedCount: number;
  isLoading: boolean;
}

export function usePendingSales(): UsePendingSalesReturn {
  const query = useQuery({
    queryKey: pendingSalesKeys.all,
    queryFn: async () => {
      // FIFO: las consumimos en orden de creación.
      const rows = await db.pendingOrders.orderBy('createdAt').toArray();
      return rows;
    },
    staleTime: Infinity,
  });

  const pending = query.data ?? [];
  const failedCount = pending.reduce(
    (acc, row) => (row.lastError !== null ? acc + 1 : acc),
    0,
  );

  return {
    pending,
    count: pending.length,
    failedCount,
    isLoading: query.isLoading,
  };
}
