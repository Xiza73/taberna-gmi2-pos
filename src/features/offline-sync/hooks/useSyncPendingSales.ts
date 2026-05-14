import { useCallback, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { posOrdersApi } from '@/api/posOrdersApi';
import { ApiError } from '@/api/errors';
import { db } from '@/db';
import { posOrderKeys } from '@/features/sales';
import type { CreatePosOrderInput } from '@/types/posOrder';
import { pendingSalesKeys } from './usePendingSales';

/**
 * Orquestador del worker de sincronización de ventas offline.
 *
 * Reglas:
 * - FIFO: itera por `createdAt` ascendente.
 * - Mutex local (per-tab) via `useRef` — evita ejecuciones concurrentes
 *   dentro del mismo tab. Multi-tab: cada tab corre su propio worker;
 *   asumimos riesgo de doble POST en el caso raro de 2 tabs abiertas
 *   con la misma cuenta y la misma cola (POS típico es 1 tablet/cuenta).
 * - Stop on rejected (4xx): sube `attempts` y guarda `lastError` en la
 *   fila, después corta el loop. La idea es que el cajero resuelva el
 *   problema antes de seguir empujando ventas.
 * - Stop on transient (network / 5xx): no toca la fila, sale del loop.
 *   El próximo trigger (online o manual) reintenta.
 * - Tras cada éxito invalida `posOrderKeys.all` para refrescar listados
 *   de ventas y `pendingSalesKeys.all` para refrescar el badge.
 */

export type SyncStoppedReason =
  | 'completed'
  | 'network_error'
  | 'rejected_by_back'
  | 'aborted';

export interface SyncResult {
  syncedCount: number;
  failedCount: number;
  stoppedReason: SyncStoppedReason;
}

export interface UseSyncPendingSalesReturn {
  syncNow: () => Promise<SyncResult>;
  isSyncing: boolean;
  lastResult: SyncResult | null;
}

const ABORTED_RESULT: SyncResult = {
  syncedCount: 0,
  failedCount: 0,
  stoppedReason: 'aborted',
};

function isTransientError(err: unknown): boolean {
  if (err instanceof ApiError) {
    // status 0 = no respuesta (red), >= 500 = error del back recuperable.
    return err.status === 0 || err.status >= 500;
  }
  // TypeError típico de fetch sin red.
  return true;
}

export function useSyncPendingSales(): UseSyncPendingSalesReturn {
  const queryClient = useQueryClient();
  const isSyncingRef = useRef<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastResult, setLastResult] = useState<SyncResult | null>(null);

  const syncNow = useCallback(async (): Promise<SyncResult> => {
    if (isSyncingRef.current) {
      return ABORTED_RESULT;
    }
    isSyncingRef.current = true;
    setIsSyncing(true);

    let syncedCount = 0;
    let failedCount = 0;
    let stoppedReason: SyncStoppedReason = 'completed';

    try {
      const queue = await db.pendingOrders.orderBy('createdAt').toArray();

      for (const row of queue) {
        try {
          // Re-hidratamos el payload tipado: lo guardamos como
          // `Record<string, unknown>` y al reenviarlo confiamos en que
          // el shape sigue siendo `CreatePosOrderInput` (lo era al crear).
          const payload = row.payload as unknown as CreatePosOrderInput;
          await posOrdersApi.create(payload);
          await db.pendingOrders.delete(row.localId);
          syncedCount++;
          // Refrescamos badge + listas tras cada éxito.
          await queryClient.invalidateQueries({
            queryKey: pendingSalesKeys.all,
          });
          await queryClient.invalidateQueries({ queryKey: posOrderKeys.all });
        } catch (err) {
          if (isTransientError(err)) {
            // Red caída o back con problema temporal — paramos sin
            // tocar la fila para reintentar luego.
            stoppedReason = 'network_error';
            break;
          }
          // 4xx: el back rechazó la venta. Marcamos la fila y paramos.
          const message =
            err instanceof Error
              ? err.message
              : 'Error desconocido al sincronizar';
          await db.pendingOrders.update(row.localId, {
            attempts: row.attempts + 1,
            lastError: message,
          });
          failedCount++;
          stoppedReason = 'rejected_by_back';
          await queryClient.invalidateQueries({
            queryKey: pendingSalesKeys.all,
          });
          break;
        }
      }
    } finally {
      isSyncingRef.current = false;
      setIsSyncing(false);
    }

    const result: SyncResult = { syncedCount, failedCount, stoppedReason };
    setLastResult(result);
    return result;
  }, [queryClient]);

  return { syncNow, isSyncing, lastResult };
}
