import { type FormEvent, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { formatCents } from '@/features/cashbox/lib/formatters';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import type { PosOrderResponse } from '@/types/posOrder';
import { useCancelPosOrder } from '../hooks/useCancelPosOrder';

const OFFLINE_TOOLTIP = 'Requiere conexión a internet';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Orden a anular. Solo se renderiza el contenido si está presente. */
  order: PosOrderResponse;
  /**
   * Callback que dispara cuando el back confirmó la anulación.
   * El parent decide qué hacer (típicamente cerrar este dialog y el
   * detail modal padre para volver al listado actualizado).
   */
  onCancelled: () => void;
}

/**
 * Modal de confirmación para anular una venta POS. Pide motivo
 * obligatorio (max 500 chars) que queda en el registro de auditoría
 * junto con el nombre del staff.
 */
export function CancelOrderDialog({
  open,
  onOpenChange,
  order,
  onCancelled,
}: Props) {
  const cancelMutation = useCancelPosOrder();
  const isOnline = useOnlineStatus();
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setReason('');
    setError(null);
    cancelMutation.reset();
  }

  function handleOpenChange(next: boolean) {
    if (cancelMutation.isPending) return;
    onOpenChange(next);
    if (!next) {
      setTimeout(reset, 200);
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const trimmed = reason.trim();
    if (!trimmed) {
      setError('Ingresa el motivo de la anulación.');
      return;
    }
    if (trimmed.length > 500) {
      setError('El motivo no puede superar 500 caracteres.');
      return;
    }

    try {
      await cancelMutation.mutateAsync({
        id: order.id,
        input: { reason: trimmed },
      });
      onCancelled();
    } catch {
      // El toast de error lo maneja el hook.
    }
  }

  return (
    <Modal open={open} onOpenChange={handleOpenChange}>
      <ModalContent
        title="Anular venta"
        description={`${order.orderNumber} · ${formatCents(order.total)}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive"
          >
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            <p>
              Esto restaura el stock de los productos vendidos. La acción no
              se puede deshacer.
            </p>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="cancel-reason"
              className="block text-sm text-foreground"
            >
              Motivo de la anulación
            </label>
            <textarea
              id="cancel-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Ej: error de carga, cliente se arrepintió, producto en mal estado, etc."
              disabled={cancelMutation.isPending}
              className="w-full rounded-sm border border-border bg-input-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring resize-none disabled:opacity-50"
              autoFocus
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
              disabled={cancelMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="destructive"
              size="md"
              loading={cancelMutation.isPending}
              disabled={cancelMutation.isPending || !isOnline}
              title={isOnline ? undefined : OFFLINE_TOOLTIP}
            >
              {cancelMutation.isPending ? 'Anulando…' : 'Confirmar anular'}
            </Button>
          </div>
        </form>
      </ModalContent>
    </Modal>
  );
}
