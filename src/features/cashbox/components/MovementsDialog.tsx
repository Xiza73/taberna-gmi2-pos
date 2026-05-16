import { type FormEvent, useState } from 'react';
import { ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { cn } from '@/utils/cn';
import type {
  CashMovementResponse,
  CashMovementType,
} from '@/types/cashRegister';
import { useCashMovements } from '../hooks/useCashMovements';
import { useCreateCashMovement } from '../hooks/useCreateCashMovement';
import {
  computeAmountHint,
  formatCents,
  formatTime,
  parseCurrencyInput,
} from '../lib/formatters';

const OFFLINE_TOOLTIP = 'Requiere conexión a internet';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Modal combinado para gestionar movimientos del turno. Dos secciones
 * en un solo dialog:
 *
 * 1. Lista de movimientos registrados (recent first, hora local).
 * 2. Form para registrar uno nuevo (tipo + monto + motivo).
 *
 * Tras submit exitoso el form se limpia, la lista se actualiza vía
 * invalidación, y el dialog **queda abierto** para permitir registrar
 * varios en sesión. Cerrar manualmente con "Listo" o el botón de cierre
 * del modal.
 */
export function MovementsDialog({ open, onOpenChange }: Props) {
  const { data: movements, isLoading } = useCashMovements(open);
  const createMutation = useCreateCashMovement();
  const isOnline = useOnlineStatus();

  const [type, setType] = useState<CashMovementType>('cash_in');
  const [amountInput, setAmountInput] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  function resetForm() {
    setType('cash_in');
    setAmountInput('');
    setReason('');
    setError(null);
  }

  function resetAll() {
    resetForm();
    createMutation.reset();
  }

  function handleOpenChange(next: boolean) {
    if (createMutation.isPending) return;
    onOpenChange(next);
    if (!next) {
      // Reset diferido para no flashear durante la animación de cerrado.
      setTimeout(resetAll, 200);
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const trimmedAmount = amountInput.trim();
    if (!trimmedAmount) {
      setError('Ingresa el monto del movimiento.');
      return;
    }

    const cents = parseCurrencyInput(trimmedAmount);
    if (Number.isNaN(cents) || cents <= 0) {
      setError('Monto inválido. Debe ser mayor a 0.');
      return;
    }

    const trimmedReason = reason.trim();
    if (!trimmedReason) {
      setError('Ingresa el motivo del movimiento.');
      return;
    }

    if (trimmedReason.length > 500) {
      setError('El motivo no puede superar 500 caracteres.');
      return;
    }

    try {
      await createMutation.mutateAsync({
        type,
        amount: cents,
        reason: trimmedReason,
      });
      // Form limpia para permitir cargar otro movimiento sin reabrir.
      resetForm();
    } catch {
      // El toast de error lo maneja el hook.
    }
  }

  // Sort recent first — el back podría devolver en cualquier orden.
  const sortedMovements = movements
    ? [...movements].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
    : [];

  return (
    <Modal open={open} onOpenChange={handleOpenChange}>
      <ModalContent
        title="Movimientos del turno"
        description="Registra ingresos o egresos de efectivo durante el turno."
        maxWidth="max-w-lg"
      >
        <div className="space-y-5">
          <section className="space-y-2">
            <h4 className="text-xs uppercase tracking-wide text-muted-foreground">
              Movimientos registrados
            </h4>
            <MovementsList
              movements={sortedMovements}
              isLoading={isLoading}
            />
          </section>

          <div className="border-t border-border" />

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <h4 className="text-xs uppercase tracking-wide text-muted-foreground">
              Registrar nuevo movimiento
            </h4>

            <TypeToggle
              value={type}
              onChange={setType}
              disabled={createMutation.isPending}
            />

            <Input
              label="Monto (en soles)"
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              disabled={createMutation.isPending}
              hint={computeAmountHint(amountInput, 'Cantidad del movimiento')}
              required
            />

            <div className="space-y-1.5">
              <label
                htmlFor="movement-reason"
                className="block text-sm text-foreground"
              >
                Motivo
              </label>
              <textarea
                id="movement-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
                maxLength={500}
                placeholder="Ej: reposición, pago a proveedor, vuelto cliente, etc."
                disabled={createMutation.isPending}
                className="w-full rounded-sm border border-border bg-input-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring resize-none disabled:opacity-50"
                required
              />
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
              >
                {error}
              </div>
            )}

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => handleOpenChange(false)}
                disabled={createMutation.isPending}
              >
                Listo
              </Button>
              <Button
                type="submit"
                size="md"
                loading={createMutation.isPending}
                disabled={createMutation.isPending || !isOnline}
                title={isOnline ? undefined : OFFLINE_TOOLTIP}
              >
                {createMutation.isPending ? 'Registrando…' : 'Registrar'}
              </Button>
            </div>
          </form>
        </div>
      </ModalContent>
    </Modal>
  );
}

interface TypeToggleProps {
  value: CashMovementType;
  onChange: (next: CashMovementType) => void;
  disabled?: boolean;
}

function TypeToggle({ value, onChange, disabled = false }: TypeToggleProps) {
  return (
    <div role="radiogroup" aria-label="Tipo de movimiento" className="grid grid-cols-2 gap-2">
      <ToggleOption
        selected={value === 'cash_in'}
        onClick={() => onChange('cash_in')}
        disabled={disabled}
        icon={<ArrowUpCircle size={16} className="shrink-0" />}
        label="Ingreso"
        accent="emerald"
      />
      <ToggleOption
        selected={value === 'cash_out'}
        onClick={() => onChange('cash_out')}
        disabled={disabled}
        icon={<ArrowDownCircle size={16} className="shrink-0" />}
        label="Egreso"
        accent="amber"
      />
    </div>
  );
}

interface ToggleOptionProps {
  selected: boolean;
  onClick: () => void;
  disabled: boolean;
  icon: React.ReactNode;
  label: string;
  accent: 'emerald' | 'amber';
}

function ToggleOption({ selected, onClick, disabled, icon, label, accent }: ToggleOptionProps) {
  const accentClasses =
    accent === 'emerald'
      ? selected
        ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400'
        : 'border-border text-muted-foreground hover:bg-muted/40'
      : selected
        ? 'border-amber-500/50 bg-amber-500/10 text-amber-400'
        : 'border-border text-muted-foreground hover:bg-muted/40';
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-md border px-3 py-2.5 text-sm transition-colors',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        accentClasses,
      )}
    >
      {icon}
      <span style={{ fontWeight: selected ? 500 : 400 }}>{label}</span>
    </button>
  );
}

interface MovementsListProps {
  movements: CashMovementResponse[];
  isLoading: boolean;
}

function MovementsList({ movements, isLoading }: MovementsListProps) {
  if (isLoading) {
    return (
      <div className="text-sm text-muted-foreground py-3 text-center">
        Cargando movimientos…
      </div>
    );
  }

  if (movements.length === 0) {
    return (
      <div className="text-sm text-muted-foreground py-4 text-center border border-dashed border-border rounded-md">
        Sin movimientos registrados en este turno.
      </div>
    );
  }

  return (
    <ul className="space-y-0 max-h-44 overflow-y-auto pr-1 -mr-1">
      {movements.map((m) => (
        <MovementRow key={m.id} movement={m} />
      ))}
    </ul>
  );
}

function MovementRow({ movement }: { movement: CashMovementResponse }) {
  const isIn = movement.type === 'cash_in';
  const Icon = isIn ? ArrowUpCircle : ArrowDownCircle;
  const colorClass = isIn ? 'text-emerald-400' : 'text-amber-400';
  const sign = isIn ? '+' : '−';
  return (
    <li className="flex items-center gap-3 py-2 border-b border-border/40 last:border-b-0">
      <Icon size={16} className={cn('shrink-0', colorClass)} />
      <div className="flex-1 min-w-0">
        <div className={cn('text-sm tabular-nums', colorClass)} style={{ fontWeight: 500 }}>
          {sign} {formatCents(movement.amount)}
        </div>
        <div className="text-xs text-muted-foreground truncate" title={movement.reason}>
          {movement.reason}
        </div>
      </div>
      <div className="text-xs text-muted-foreground tabular-nums shrink-0">
        {formatTime(movement.createdAt)}
      </div>
    </li>
  );
}
