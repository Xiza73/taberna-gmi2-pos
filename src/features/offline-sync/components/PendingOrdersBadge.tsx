import { useState } from 'react';
import { CloudOff, RefreshCcw } from 'lucide-react';
import { cn } from '@/utils/cn';
import { usePendingSales } from '../hooks/usePendingSales';
import { useSyncPendingSales } from '../hooks/useSyncPendingSales';
import { PendingOrdersDialog } from './PendingOrdersDialog';

/**
 * Chip compacto en el header del POS. Visible solo cuando hay ventas
 * pendientes en cola. Si alguna falló (lastError !== null), muestra un
 * punto rojo para llamar la atención. Click → abre el diálogo de gestión.
 */
export function PendingOrdersBadge() {
  const { count, failedCount } = usePendingSales();
  const { isSyncing } = useSyncPendingSales();
  const [open, setOpen] = useState<boolean>(false);

  if (count === 0) return null;

  const Icon = isSyncing ? RefreshCcw : CloudOff;
  const label = count === 1 ? '1 pendiente' : `${count} pendientes`;
  const tooltip = isSyncing
    ? 'Sincronizando ventas pendientes…'
    : 'Ventas pendientes de sincronización';

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title={tooltip}
        aria-label={tooltip}
        className={cn(
          'relative inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-xs',
          'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors',
        )}
      >
        <Icon size={12} className={cn(isSyncing && 'animate-spin')} />
        <span>{label}</span>
        {failedCount > 0 && (
          <span
            aria-hidden
            className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-destructive ring-2 ring-card"
          />
        )}
      </button>

      <PendingOrdersDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
