import { type FormEvent, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { cn } from '@/utils/cn';
import type { CashRegisterResponse } from '@/types/cashRegister';
import { useCloseCashRegister } from '../hooks/useCloseCashRegister';
import { cashRegisterKeys } from '../hooks/useCurrentCashRegister';
import {
  computeAmountHint,
  formatCents,
  formatElapsed,
  parseCurrencyInput,
} from '../lib/formatters';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Caja abierta actual — la pasamos desde el badge para no re-fetchear. */
  current: CashRegisterResponse;
}

/**
 * Modal para cerrar caja con arqueo.
 *
 * Phase A (form): muestra header con monto inicial + tiempo abierta y
 * pide al cajero el monto físicamente contado + notas opcionales.
 *
 * Phase B (resumen post-cierre): muestra el arqueo del back con
 * `expectedAmount`, `closingAmount` y `difference` con coloreado y
 * mensaje según el signo de la diferencia. Único botón "Listo" cierra
 * y resetea el estado del mutation.
 */
export function CloseCashRegisterDialog({ open, onOpenChange, current }: Props) {
  const queryClient = useQueryClient();
  const closeMutation = useCloseCashRegister();
  const [amountInput, setAmountInput] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState<number>(() => Date.now());

  // Re-render del tiempo abierta cada 60s mientras estamos en Phase A.
  const inSummary = closeMutation.isSuccess;
  useEffect(() => {
    if (!open || inSummary) return;
    const id = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, [open, inSummary]);

  function reset() {
    setAmountInput('');
    setNotes('');
    setError(null);
    closeMutation.reset();
  }

  function handleOpenChange(next: boolean) {
    if (closeMutation.isPending) return;
    // Si veníamos de cerrar exitosamente y ahora cerramos el dialog
    // (después de que el cajero vio el arqueo), recién acá limpiamos
    // la cache de "caja abierta" para que el badge pase a "Sin caja".
    if (!next && closeMutation.isSuccess) {
      queryClient.setQueryData(cashRegisterKeys.current, null);
    }
    onOpenChange(next);
    if (!next) {
      // Reset diferido para no flashear durante la animación de cerrado.
      setTimeout(reset, 200);
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const trimmed = amountInput.trim();
    if (!trimmed) {
      setError('Ingresá el monto contado.');
      return;
    }

    const cents = parseCurrencyInput(trimmed);
    if (Number.isNaN(cents)) {
      setError('Monto inválido. Usá números (ej: 150.00).');
      return;
    }

    if (notes.length > 2000) {
      setError('Las notas superan los 2000 caracteres.');
      return;
    }

    try {
      await closeMutation.mutateAsync({
        closingAmount: cents,
        notes: notes.trim() || undefined,
      });
      // El estado pasa a Phase B vía closeMutation.isSuccess.
    } catch {
      // El toast de error lo maneja el hook.
    }
  }

  return (
    <Modal open={open} onOpenChange={handleOpenChange}>
      <ModalContent
        title={inSummary ? 'Caja cerrada' : 'Cerrar caja'}
        description={
          inSummary
            ? 'Resumen del arqueo de tu turno.'
            : 'Contá la plata en caja antes de cerrar tu turno.'
        }
        maxWidth="max-w-md"
        hideCloseButton={inSummary}
      >
        {inSummary && closeMutation.data ? (
          <ArqueoSummary
            data={closeMutation.data}
            onDone={() => handleOpenChange(false)}
          />
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div className="rounded-md border border-border bg-muted/30 p-3 space-y-1.5 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Monto inicial</span>
                <span className="text-foreground tabular-nums" style={{ fontWeight: 500 }}>
                  {formatCents(current.initialAmount)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Tiempo abierta</span>
                <span className="text-foreground tabular-nums">
                  {formatElapsed(current.openedAt, now)}
                </span>
              </div>
            </div>

            <Input
              label="Monto contado físicamente (en soles)"
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              disabled={closeMutation.isPending}
              hint={computeAmountHint(
                amountInput,
                'Contá la plata en caja antes de cerrar',
              )}
              autoFocus
              required
            />

            <div className="space-y-1.5">
              <label htmlFor="close-notes" className="block text-sm text-foreground">
                Notas (opcional)
              </label>
              <textarea
                id="close-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                maxLength={2000}
                placeholder="Observaciones del cierre, motivo de un faltante, etc."
                disabled={closeMutation.isPending}
                className="w-full rounded-sm border border-border bg-input-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring resize-none disabled:opacity-50"
              />
              <p className="text-xs text-muted-foreground">
                Si dudas del monto, agrega una nota explicando el contexto. Las notas quedan en el registro de auditoría.
              </p>
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
              >
                {error}
              </div>
            )}

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => handleOpenChange(false)}
                disabled={closeMutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="destructive"
                size="md"
                loading={closeMutation.isPending}
                disabled={closeMutation.isPending}
              >
                {closeMutation.isPending ? 'Cerrando…' : 'Cerrar caja'}
              </Button>
            </div>
          </form>
        )}
      </ModalContent>
    </Modal>
  );
}

interface ArqueoSummaryProps {
  data: CashRegisterResponse;
  onDone: () => void;
}

function ArqueoSummary({ data, onDone }: ArqueoSummaryProps) {
  const expected = data.expectedAmount ?? 0;
  const closing = data.closingAmount ?? 0;
  const difference = data.difference ?? 0;

  let DiffIcon = CheckCircle2;
  let diffColor = 'text-emerald-400';
  let diffBg = 'border-emerald-500/30 bg-emerald-500/5';
  let diffLabel = 'Cuadra exacto';

  if (difference > 0) {
    DiffIcon = TrendingUp;
    diffColor = 'text-sky-400';
    diffBg = 'border-sky-500/30 bg-sky-500/5';
    diffLabel = `Sobrante de ${formatCents(difference)}`;
  } else if (difference < 0) {
    DiffIcon = AlertTriangle;
    diffColor = 'text-destructive';
    diffBg = 'border-destructive/30 bg-destructive/5';
    diffLabel = `Faltante de ${formatCents(Math.abs(difference))}`;
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-border bg-muted/30 p-4 space-y-2 text-sm">
        <Row label="Monto inicial" value={formatCents(data.initialAmount)} />
        <Row
          label="Ventas en efectivo"
          value={`+ ${formatCents(data.cashSalesAmount)}`}
          muted
        />
        <Row
          label="Ingresos manuales"
          value={`+ ${formatCents(data.cashInAmount)}`}
          muted
        />
        <Row
          label="Egresos manuales"
          value={`− ${formatCents(data.cashOutAmount)}`}
          muted
        />
        <div className="border-t border-border pt-2 mt-1">
          <Row label="Esperado en caja" value={formatCents(expected)} />
        </div>
        <Row
          label="Contado físicamente"
          value={formatCents(closing)}
          emphasized
        />
      </div>

      <div
        role="status"
        className={cn(
          'rounded-md border px-3 py-3 flex items-center gap-2.5 text-sm',
          diffBg,
        )}
      >
        <DiffIcon size={18} className={cn('shrink-0', diffColor)} />
        <div className="min-w-0">
          <p className={cn('tabular-nums', diffColor)} style={{ fontWeight: 600 }}>
            {diffLabel}
          </p>
          {difference !== 0 && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Diferencia: {formatCents(difference)} (contado − esperado)
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-end pt-1">
        <Button type="button" size="md" onClick={onDone}>
          Listo
        </Button>
      </div>
    </div>
  );
}

interface RowProps {
  label: string;
  value: string;
  emphasized?: boolean;
  muted?: boolean;
}

function Row({ label, value, emphasized = false, muted = false }: RowProps) {
  return (
    <div className="flex items-center justify-between">
      <span className={cn(muted ? 'text-muted-foreground/80' : 'text-muted-foreground')}>
        {label}
      </span>
      <span
        className={cn(
          'tabular-nums',
          emphasized && 'text-foreground',
          !emphasized && muted && 'text-foreground/70',
          !emphasized && !muted && 'text-foreground/90',
        )}
        style={{ fontWeight: emphasized ? 600 : muted ? 400 : 500 }}
      >
        {value}
      </span>
    </div>
  );
}
