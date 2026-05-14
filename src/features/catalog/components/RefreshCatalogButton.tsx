import { useEffect, useState } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { formatElapsedMs } from '@/features/cashbox/lib/formatters';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { cn } from '@/utils/cn';
import { useCachedProducts } from '../hooks/useCachedProducts';

const TICK_MS = 60_000;
const STALE_THRESHOLD_MS = 10 * 60_000;

/**
 * Control de refresh manual del catálogo cacheado. Muestra el tiempo
 * relativo desde la última sincronización y un botón con el icono
 * `RefreshCw` (gira mientras sincroniza). Si el navegador está offline el
 * botón queda deshabilitado.
 *
 * Se re-renderiza cada minuto para que el "hace Xm" siga vivo sin tocar
 * la query de Dexie.
 */
export function RefreshCatalogButton() {
  const { isSyncing, lastSyncedAt, syncError, refresh } = useCachedProducts();
  const isOnline = useOnlineStatus();
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), TICK_MS);
    return () => window.clearInterval(id);
  }, []);

  const isStale =
    lastSyncedAt !== null && now - lastSyncedAt > STALE_THRESHOLD_MS;
  const disabled = isSyncing || !isOnline;

  const label = isSyncing
    ? 'Sincronizando…'
    : lastSyncedAt === null
      ? 'Refrescar catálogo · sin sincronizar'
      : `Refrescar catálogo · hace ${formatElapsedMs(lastSyncedAt, now)}`;

  const tooltip = !isOnline
    ? 'Requiere conexión'
    : isSyncing
      ? 'Sincronizando catálogo'
      : 'Refrescar catálogo';

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        type="button"
        onClick={() => refresh()}
        disabled={disabled}
        title={tooltip}
        aria-label={tooltip}
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-xs',
          'border border-border bg-card/40 text-muted-foreground',
          'hover:bg-muted hover:text-foreground transition-colors',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-card/40 disabled:hover:text-muted-foreground',
        )}
      >
        <RefreshCw size={12} className={cn(isSyncing && 'animate-spin')} />
        <span>{label}</span>
      </button>

      {isStale && !isSyncing && (
        <span className="inline-flex items-center gap-1 text-xs text-amber-400">
          <AlertTriangle size={12} />
          <span>Catálogo no actualizado</span>
        </span>
      )}

      {syncError && !isSyncing && (
        <span className="text-xs text-destructive">
          No se pudo sincronizar. Reintentá.
        </span>
      )}
    </div>
  );
}
