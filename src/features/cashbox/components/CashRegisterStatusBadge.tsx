import { useEffect, useState } from 'react';
import { ArrowDownUp, Wallet, WalletCards } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useCurrentCashRegister } from '../hooks/useCurrentCashRegister';
import { formatCents, formatElapsed } from '../lib/formatters';
import { CloseCashRegisterDialog } from './CloseCashRegisterDialog';
import { MovementsDialog } from './MovementsDialog';
import { OpenCashRegisterDialog } from './OpenCashRegisterDialog';

type DialogState = 'open' | 'close' | 'movements' | null;

/**
 * Badge en el header del POS que muestra el estado de la caja:
 * - Loading: skeleton chico
 * - Sin caja abierta: chip neutro "Sin caja" → click abre OpenDialog
 * - Caja abierta: chip verde con monto inicial + tiempo abierta → click
 *   abre CloseDialog
 *
 * El componente es el dueño del estado de qué dialog está abierto. El
 * tiempo abierta se re-renderiza cada minuto.
 */
export function CashRegisterStatusBadge() {
  const { data: current, isLoading, isError } = useCurrentCashRegister();
  const [dialog, setDialog] = useState<DialogState>(null);
  const [now, setNow] = useState<number>(() => Date.now());

  // Re-render del tiempo abierta cada 60s mientras hay caja abierta.
  useEffect(() => {
    if (!current) return;
    const id = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, [current]);

  if (isLoading) {
    return (
      <span
        aria-label="Cargando estado de caja"
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-muted/40 text-muted-foreground text-xs"
      >
        <Wallet size={12} className="opacity-50" />
        <span className="hidden sm:inline-block w-16 h-3 bg-muted-foreground/20 rounded-sm animate-pulse" />
      </span>
    );
  }

  // Si la query falla por algo distinto a 404 (404 → null), mostramos
  // un estado degradado pero clickeable para que el cajero pueda
  // intentar abrir caja igual.
  if (isError && !current) {
    return (
      <button
        type="button"
        onClick={() => setDialog('open')}
        aria-label="Abrir caja registradora"
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-amber-500/10 text-amber-400 text-xs hover:bg-amber-500/20 transition-colors"
      >
        <Wallet size={12} />
        <span className="hidden sm:inline">Sin caja</span>
      </button>
    );
  }

  if (!current) {
    return (
      <>
        <button
          type="button"
          onClick={() => setDialog('open')}
          aria-label="Abrir caja registradora"
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm',
            'bg-muted/40 text-muted-foreground text-xs',
            'hover:bg-muted/70 hover:text-foreground transition-colors',
          )}
        >
          <Wallet size={12} />
          <span className="hidden sm:inline">Sin caja</span>
        </button>
        <OpenCashRegisterDialog
          open={dialog === 'open'}
          onOpenChange={(o) => setDialog(o ? 'open' : null)}
        />
      </>
    );
  }

  const elapsed = formatElapsed(current.openedAt, now);

  return (
    <>
      <div className="inline-flex items-center gap-1">
        <button
          type="button"
          onClick={() => setDialog('close')}
          aria-label={`Cerrar caja registradora — abierta hace ${elapsed}`}
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm',
            'bg-emerald-500/10 text-emerald-400 text-xs',
            'hover:bg-emerald-500/20 transition-colors',
          )}
        >
          <WalletCards size={12} />
          <span className="hidden sm:inline tabular-nums">
            Caja {formatCents(current.initialAmount)} · {elapsed}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setDialog('movements')}
          aria-label="Registrar o ver movimientos del turno"
          title="Movimientos del turno"
          className={cn(
            'inline-flex items-center justify-center px-1.5 py-1 rounded-sm',
            'bg-emerald-500/10 text-emerald-400',
            'hover:bg-emerald-500/20 transition-colors',
          )}
        >
          <ArrowDownUp size={12} />
        </button>
      </div>
      <CloseCashRegisterDialog
        open={dialog === 'close'}
        onOpenChange={(o) => setDialog(o ? 'close' : null)}
        current={current}
      />
      <MovementsDialog
        open={dialog === 'movements'}
        onOpenChange={(o) => setDialog(o ? 'movements' : null)}
      />
    </>
  );
}
