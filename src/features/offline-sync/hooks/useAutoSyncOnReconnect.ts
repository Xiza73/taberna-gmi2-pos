import { useEffect } from 'react';
import { toast } from 'sonner';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { usePendingSales } from './usePendingSales';
import {
  useSyncPendingSales,
  type SyncResult,
} from './useSyncPendingSales';

/**
 * Monta una vez en `PosLayout`. Dispara el worker de sync cuando:
 *  1. El navegador emite `online`.
 *  2. La app carga estando online y hay ventas pendientes (caso típico
 *     tras un reload posterior a la creación offline).
 *
 * El worker propio se encarga del mutex; este hook solo orquesta
 * triggers y dispara un toast resumen al terminar.
 *
 * Limitación conocida: con varias pestañas abiertas, cada una corre su
 * propio worker y podría duplicar POSTs (IndexedDB es compartido pero el
 * mutex es per-tab). Aceptable para v0: el POS suele correr en una sola
 * tablet con una sola pestaña.
 */
export function useAutoSyncOnReconnect(): void {
  const isOnline = useOnlineStatus();
  const { count } = usePendingSales();
  const { syncNow, isSyncing } = useSyncPendingSales();

  // Trigger: evento `online` del browser.
  useEffect(() => {
    function handleOnline() {
      void runSyncWithToast(syncNow);
    }
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [syncNow]);

  // Trigger: mount con conexión + pendientes (recovery tras reload).
  useEffect(() => {
    if (!isOnline) return;
    if (count === 0) return;
    if (isSyncing) return;
    void runSyncWithToast(syncNow);
    // Queremos que dispare una vez cuando se cumplen las condiciones;
    // el mutex interno cubre re-entradas. `syncNow` es estable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline, count]);
}

async function runSyncWithToast(
  syncNow: () => Promise<SyncResult>,
): Promise<void> {
  const result = await syncNow();
  if (result.stoppedReason === 'aborted') return;
  if (result.syncedCount > 0) {
    toast.success(
      result.syncedCount === 1
        ? '1 venta sincronizada correctamente.'
        : `${result.syncedCount} ventas sincronizadas correctamente.`,
    );
  }
  if (result.stoppedReason === 'rejected_by_back') {
    toast.error(
      'El backend rechazó una venta pendiente. Revisa la cola para resolverla.',
    );
  }
}
