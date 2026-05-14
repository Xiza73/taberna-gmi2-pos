import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Clock, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { db, type PendingPosOrder } from '@/db';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { cn } from '@/utils/cn';
import type { CreatePosOrderInput } from '@/types/posOrder';
import { pendingSalesKeys, usePendingSales } from '../hooks/usePendingSales';
import {
  useSyncPendingSales,
  type SyncResult,
} from '../hooks/useSyncPendingSales';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Diálogo para inspeccionar la cola offline, retriggerar el sync manual
 * y descartar ventas que el back rechazó (4xx). El listado se ordena
 * FIFO (más vieja arriba), igual que el worker.
 */
export function PendingOrdersDialog({ open, onOpenChange }: Props) {
  const { pending, count, failedCount } = usePendingSales();
  const { syncNow, isSyncing } = useSyncPendingSales();
  const isOnline = useOnlineStatus();

  const description =
    count === 0
      ? 'No hay ventas en cola.'
      : failedCount > 0
        ? `${count} en cola · ${failedCount} con error`
        : `${count} en cola`;

  async function handleSync() {
    const result = await syncNow();
    notifySyncResult(result);
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent
        title="Ventas pendientes de sincronización"
        description={description}
        maxWidth="max-w-xl"
      >
        <div className="space-y-4">
          {count === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              Cuando registres una venta sin conexión, aparecerá acá hasta
              que se sincronice con el backend.
            </p>
          ) : (
            <ul className="space-y-2 max-h-[50vh] overflow-y-auto">
              {pending.map((row) => (
                <PendingOrderRow key={row.localId} row={row} />
              ))}
            </ul>
          )}

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => onOpenChange(false)}
            >
              Cerrar
            </Button>
            <Button
              type="button"
              size="md"
              onClick={() => void handleSync()}
              loading={isSyncing}
              disabled={isSyncing || !isOnline || count === 0}
              title={
                !isOnline
                  ? 'Requiere conexión'
                  : count === 0
                    ? 'No hay ventas para sincronizar'
                    : undefined
              }
            >
              {isSyncing ? 'Sincronizando…' : 'Sincronizar ahora'}
            </Button>
          </div>
        </div>
      </ModalContent>
    </Modal>
  );
}

interface RowProps {
  row: PendingPosOrder;
}

function PendingOrderRow({ row }: RowProps) {
  const queryClient = useQueryClient();
  const [discarding, setDiscarding] = useState<boolean>(false);
  const failed = row.lastError !== null;

  const created = new Date(row.createdAt);
  const time = created.toLocaleTimeString('es-PE', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const itemCount = countItems(row.payload);

  async function handleDiscard() {
    const confirmed = window.confirm(
      '¿Estás seguro? La venta se elimina sin sincronizar.',
    );
    if (!confirmed) return;
    setDiscarding(true);
    try {
      await db.pendingOrders.delete(row.localId);
      await queryClient.invalidateQueries({ queryKey: pendingSalesKeys.all });
      toast.success('Venta pendiente descartada.');
    } finally {
      setDiscarding(false);
    }
  }

  return (
    <li
      className={cn(
        'rounded-md border px-3 py-2.5 bg-card/40',
        failed ? 'border-destructive/40' : 'border-border',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2 text-sm">
            <Clock size={12} className="text-muted-foreground shrink-0" />
            <span className="tabular-nums">{time}</span>
            <span className="text-muted-foreground">·</span>
            <span>
              {itemCount === 1 ? '1 item' : `${itemCount} items`}
            </span>
          </div>
          <StatusBadge row={row} />
          {failed && row.lastError && (
            <p className="text-xs text-destructive flex items-start gap-1.5 mt-1">
              <AlertCircle size={12} className="mt-0.5 shrink-0" />
              <span className="break-words">{row.lastError}</span>
            </p>
          )}
        </div>
        {failed && (
          <button
            type="button"
            onClick={() => void handleDiscard()}
            disabled={discarding}
            className={cn(
              'inline-flex items-center gap-1 text-xs text-muted-foreground',
              'hover:text-destructive transition-colors px-2 py-1 rounded-sm',
              'disabled:opacity-50 disabled:cursor-not-allowed',
            )}
          >
            <Trash2 size={12} />
            Descartar
          </button>
        )}
      </div>
    </li>
  );
}

function StatusBadge({ row }: { row: PendingPosOrder }) {
  const failed = row.lastError !== null;
  if (failed) {
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded-sm bg-destructive/10 text-destructive text-[10px] uppercase tracking-wider">
        Falló · {row.attempts} intento{row.attempts === 1 ? '' : 's'}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded-sm bg-muted text-muted-foreground text-[10px] uppercase tracking-wider">
      En cola
    </span>
  );
}

function countItems(payload: Record<string, unknown>): number {
  // Tipamos a CreatePosOrderInput porque al guardar lo era. Si en el
  // futuro el shape cambia, defensivo: items podría no estar.
  const input = payload as unknown as Partial<CreatePosOrderInput>;
  if (!Array.isArray(input.items)) return 0;
  return input.items.reduce((sum, item) => sum + (item.quantity ?? 0), 0);
}

function notifySyncResult(result: SyncResult): void {
  if (result.stoppedReason === 'aborted') {
    toast.info('Ya hay un sync en curso.');
    return;
  }
  if (result.syncedCount > 0) {
    toast.success(
      result.syncedCount === 1
        ? '1 venta sincronizada correctamente.'
        : `${result.syncedCount} ventas sincronizadas correctamente.`,
    );
  }
  if (result.stoppedReason === 'rejected_by_back') {
    toast.error(
      'El backend rechazó una venta. Revisa el detalle en la cola.',
    );
  } else if (result.stoppedReason === 'network_error') {
    toast.error('Se interrumpió la conexión. Reintenta cuando vuelvas a estar en línea.');
  } else if (result.syncedCount === 0 && result.failedCount === 0) {
    toast.info('No había ventas para sincronizar.');
  }
}
