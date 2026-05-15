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
 * - Backoff exponencial en transient errors (red / 5xx): cada fallo
 *   incrementa `attempts` y setea `nextRetryAt = now + 2^attempts * 1s`,
 *   con cap de 60s. Las filas con `nextRetryAt` en el futuro se
 *   saltean en el loop hasta que pase el tiempo.
 * - Stop on rejected (4xx): sube `attempts`, guarda `lastError` y NO
 *   setea `nextRetryAt` (no reintentar automáticamente). El cajero
 *   debe revisar/descartar manualmente.
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

const MAX_BACKOFF_MS = 60_000; // cap a 1 min entre reintentos
const BASE_BACKOFF_MS = 1_000; // primer reintento al segundo

/**
 * Calcula `nextRetryAt` con exponential backoff capped:
 *   attempts=1 → 1s, 2 → 2s, 3 → 4s, 4 → 8s, … 7+ → 60s.
 */
export function computeNextRetryAt(attempts: number, now: number = Date.now()): number {
  const delay = Math.min(BASE_BACKOFF_MS * 2 ** Math.max(attempts - 1, 0), MAX_BACKOFF_MS);
  return now + delay;
}

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
      const now = Date.now();

      for (const row of queue) {
        // Saltear filas todavía en backoff (próximo reintento en el futuro).
        if (row.nextRetryAt !== null && row.nextRetryAt > now) continue;

        try {
          const payload = row.payload as unknown as CreatePosOrderInput;
          await posOrdersApi.create(payload);
          await db.pendingOrders.delete(row.localId);
          syncedCount++;
          await queryClient.invalidateQueries({
            queryKey: pendingSalesKeys.all,
          });
          await queryClient.invalidateQueries({ queryKey: posOrderKeys.all });
        } catch (err) {
          const message =
            err instanceof Error
              ? err.message
              : 'Error desconocido al sincronizar';

          if (isTransientError(err)) {
            // Red caída o back con problema temporal — agendamos backoff
            // exponencial para esta fila y paramos el loop (las demás
            // filas también esperarían algo similar, mejor reintentar
            // todas juntas en el próximo trigger).
            const nextAttempts = row.attempts + 1;
            await db.pendingOrders.update(row.localId, {
              attempts: nextAttempts,
              lastError: message,
              nextRetryAt: computeNextRetryAt(nextAttempts),
            });
            stoppedReason = 'network_error';
            await queryClient.invalidateQueries({
              queryKey: pendingSalesKeys.all,
            });
            break;
          }

          // 4xx: el back rechazó la venta. Marcamos y paramos. No
          // re-agendamos retry automático — requiere acción del cajero.
          await db.pendingOrders.update(row.localId, {
            attempts: row.attempts + 1,
            lastError: message,
            nextRetryAt: null,
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
