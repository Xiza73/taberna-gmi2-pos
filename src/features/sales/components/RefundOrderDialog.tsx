import { type FormEvent, useState } from 'react';
import { AlertTriangle, Info } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { cn } from '@/utils/cn';
import { formatCents } from '@/features/cashbox/lib/formatters';
import type {
  PosOrderItemResponse,
  PosOrderResponse,
  RefundPosOrderInput,
} from '@/types/posOrder';
import { useRefundPosOrder } from '../hooks/useRefundPosOrder';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Orden a devolver. */
  order: PosOrderResponse;
  /** Callback que dispara cuando el back confirmó la devolución. */
  onRefunded: () => void;
}

type RefundMode = 'total' | 'partial';

/**
 * Modal para registrar una devolución (total o parcial) de una venta
 * POS. Solo super_admin (el back valida; el botón se oculta para otros
 * roles en SaleDetailModal).
 *
 * Modo Total: restaura todo el stock y deja la orden en status
 * `refunded`. Modo Parcial: el cajero selecciona qué cantidad devolver
 * por item; restaura solo ese stock y el status NO cambia.
 */
export function RefundOrderDialog({
  open,
  onOpenChange,
  order,
  onRefunded,
}: Props) {
  const refundMutation = useRefundPosOrder();
  const items = order.items ?? [];

  const [mode, setMode] = useState<RefundMode>('total');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setMode('total');
    setQuantities({});
    setReason('');
    setError(null);
    refundMutation.reset();
  }

  function handleOpenChange(next: boolean) {
    if (refundMutation.isPending) return;
    onOpenChange(next);
    if (!next) {
      setTimeout(reset, 200);
    }
  }

  function handleQuantityChange(itemId: string, value: string) {
    // Coerce to non-negative integer; empty / NaN treated as 0.
    const n = value === '' ? 0 : Math.floor(Number(value));
    if (Number.isNaN(n) || n < 0) {
      setQuantities((prev) => ({ ...prev, [itemId]: 0 }));
      return;
    }
    setQuantities((prev) => ({ ...prev, [itemId]: n }));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const trimmedReason = reason.trim();
    if (!trimmedReason) {
      setError('Ingresa el motivo de la devolución.');
      return;
    }
    if (trimmedReason.length > 500) {
      setError('El motivo no puede superar 500 caracteres.');
      return;
    }

    let payload: RefundPosOrderInput;

    if (mode === 'total') {
      // Total: omitir items para que el back devuelva todo.
      payload = { reason: trimmedReason };
    } else {
      // Parcial: validar cada cantidad + que al menos una sea > 0.
      const refundItems: RefundPosOrderInput['items'] = [];
      for (const item of items) {
        const qty = quantities[item.id] ?? 0;
        if (qty < 0) {
          setError('Las cantidades no pueden ser negativas.');
          return;
        }
        if (qty > item.quantity) {
          setError(
            `La cantidad a devolver de "${item.productName}" supera la cantidad vendida (${item.quantity}).`,
          );
          return;
        }
        if (qty > 0) {
          refundItems.push({ orderItemId: item.id, quantity: qty });
        }
      }
      if (refundItems.length === 0) {
        setError('Selecciona al menos una cantidad mayor a 0.');
        return;
      }
      payload = { items: refundItems, reason: trimmedReason };
    }

    try {
      await refundMutation.mutateAsync({ id: order.id, input: payload });
      onRefunded();
    } catch {
      // El toast de error lo maneja el hook.
    }
  }

  return (
    <Modal open={open} onOpenChange={handleOpenChange}>
      <ModalContent
        title="Devolver venta"
        description={`${order.orderNumber} · ${formatCents(order.total)}`}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <ModeToggle
            value={mode}
            onChange={setMode}
            disabled={refundMutation.isPending}
          />

          {mode === 'total' ? <TotalWarning /> : null}

          {mode === 'partial' ? (
            <PartialItemsList
              items={items}
              quantities={quantities}
              onChange={handleQuantityChange}
              disabled={refundMutation.isPending}
            />
          ) : null}

          <div className="space-y-1.5">
            <label
              htmlFor="refund-reason"
              className="block text-sm text-foreground"
            >
              Motivo de la devolución
            </label>
            <textarea
              id="refund-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Ej: producto defectuoso, cliente cambió de opinión, error de carga, etc."
              disabled={refundMutation.isPending}
              className="w-full rounded-sm border border-border bg-input-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring resize-none disabled:opacity-50"
              required
            />
            <p className="text-xs text-muted-foreground">
              Esta nota queda en el registro de auditoría junto con tu nombre.
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

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => handleOpenChange(false)}
              disabled={refundMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="destructive"
              size="md"
              loading={refundMutation.isPending}
              disabled={refundMutation.isPending}
            >
              {refundMutation.isPending ? 'Procesando…' : 'Confirmar devolución'}
            </Button>
          </div>
        </form>
      </ModalContent>
    </Modal>
  );
}

interface ModeToggleProps {
  value: RefundMode;
  onChange: (next: RefundMode) => void;
  disabled?: boolean;
}

function ModeToggle({ value, onChange, disabled = false }: ModeToggleProps) {
  return (
    <div role="radiogroup" aria-label="Tipo de devolución" className="space-y-1.5">
      <p className="text-sm text-foreground">Tipo de devolución</p>
      <div className="grid grid-cols-2 gap-2">
        <ToggleOption
          selected={value === 'total'}
          onClick={() => onChange('total')}
          disabled={disabled}
          label="Total"
          hint="Devuelve todos los productos"
        />
        <ToggleOption
          selected={value === 'partial'}
          onClick={() => onChange('partial')}
          disabled={disabled}
          label="Parcial"
          hint="Selecciona qué devolver"
        />
      </div>
    </div>
  );
}

interface ToggleOptionProps {
  selected: boolean;
  onClick: () => void;
  disabled: boolean;
  label: string;
  hint: string;
}

function ToggleOption({ selected, onClick, disabled, label, hint }: ToggleOptionProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex flex-col items-start gap-0.5 rounded-md border px-3 py-2.5 text-left transition-colors',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        selected
          ? 'border-destructive/40 bg-destructive/5 text-foreground'
          : 'border-border text-muted-foreground hover:bg-muted/40',
      )}
    >
      <span className="text-sm" style={{ fontWeight: selected ? 600 : 500 }}>
        {label}
      </span>
      <span className="text-xs text-muted-foreground">{hint}</span>
    </button>
  );
}

function TotalWarning() {
  return (
    <div
      role="alert"
      className="flex items-start gap-2.5 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive"
    >
      <AlertTriangle size={16} className="shrink-0 mt-0.5" />
      <p>
        Se restaura el stock de <strong>todos</strong> los productos y la venta
        queda en estado <strong>"Devuelto"</strong>.
      </p>
    </div>
  );
}

interface PartialItemsListProps {
  items: PosOrderItemResponse[];
  quantities: Record<string, number>;
  onChange: (itemId: string, value: string) => void;
  disabled: boolean;
}

function PartialItemsList({
  items,
  quantities,
  onChange,
  disabled,
}: PartialItemsListProps) {
  if (items.length === 0) {
    return (
      <p className="text-xs text-muted-foreground py-2">
        Sin productos en esta venta para devolver.
      </p>
    );
  }
  return (
    <div className="space-y-2">
      <p className="text-sm text-foreground">Productos a devolver</p>
      <ul className="space-y-0 max-h-44 overflow-y-auto pr-1 -mr-1 rounded-md border border-border">
        {items.map((item) => (
          <PartialItemRow
            key={item.id}
            item={item}
            value={quantities[item.id] ?? 0}
            onChange={(v) => onChange(item.id, v)}
            disabled={disabled}
          />
        ))}
      </ul>
      <div className="flex items-start gap-2 text-xs text-muted-foreground">
        <Info size={12} className="shrink-0 mt-0.5" />
        <p>
          Solo se restaura el stock de las cantidades indicadas. El status de
          la venta no cambia.
        </p>
      </div>
    </div>
  );
}

interface PartialItemRowProps {
  item: PosOrderItemResponse;
  value: number;
  onChange: (next: string) => void;
  disabled: boolean;
}

function PartialItemRow({ item, value, onChange, disabled }: PartialItemRowProps) {
  return (
    <li className="flex items-center gap-3 px-3 py-2 border-b border-border/40 last:border-b-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground truncate">{item.productName}</p>
        <p className="text-xs text-muted-foreground tabular-nums">
          Vendidas: {item.quantity} · {formatCents(item.unitPrice)} c/u
        </p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <label
          htmlFor={`refund-qty-${item.id}`}
          className="text-xs text-muted-foreground"
        >
          Devolver
        </label>
        <input
          id={`refund-qty-${item.id}`}
          type="number"
          inputMode="numeric"
          min={0}
          max={item.quantity}
          step={1}
          value={value === 0 ? '' : value}
          placeholder="0"
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="w-16 rounded-sm border border-border bg-input-background px-2 py-1 text-sm text-foreground text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring disabled:opacity-50"
        />
        <span className="text-xs text-muted-foreground tabular-nums">
          /{item.quantity}
        </span>
      </div>
    </li>
  );
}
