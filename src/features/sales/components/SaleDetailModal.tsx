import { useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { cn } from '@/utils/cn';
import { formatCents, formatTime } from '@/features/cashbox/lib/formatters';
import { formatDateTime } from '@/utils/format';
import type {
  PosOrderEventResponse,
  PosOrderItemResponse,
  PosOrderResponse,
} from '@/types/posOrder';
import { usePosOrder } from '../hooks/usePosOrder';
import {
  CUSTOMER_DOC_TYPE_LABELS,
  ORDER_CHANNEL_LABELS,
  ORDER_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  getStatusChipClasses,
} from '../lib/labels';
import { CancelOrderDialog } from './CancelOrderDialog';

interface Props {
  /** ID de la orden a mostrar. Si es null el modal está cerrado. */
  id: string | null;
  onOpenChange: (open: boolean) => void;
}

/**
 * Modal de detalle de venta (read-only en slice 3a). Las acciones de
 * anular / devolver llegan en slices 3b y 3c.
 */
export function SaleDetailModal({ id, onOpenChange }: Props) {
  const open = id !== null;
  const { data, isLoading, isError } = usePosOrder(id);
  const [showCancel, setShowCancel] = useState(false);

  function handleCancelled() {
    // Cerramos ambos: el dialog de cancelación y el detalle. La lista
    // refresca por la invalidación del hook y el cajero ve la fila ya
    // como "Anulado".
    setShowCancel(false);
    onOpenChange(false);
  }

  return (
    <>
      <Modal open={open} onOpenChange={onOpenChange}>
        <ModalContent
          title={data ? data.orderNumber : 'Detalle de venta'}
          description={
            data
              ? `${ORDER_CHANNEL_LABELS[data.channel]} · ${formatDateTime(data.createdAt)}`
              : 'Cargando información de la venta…'
          }
          maxWidth="max-w-2xl"
        >
          {isLoading ? (
            <DetailLoading />
          ) : isError || !data ? (
            <DetailError />
          ) : (
            <DetailBody
              order={data}
              onClose={() => onOpenChange(false)}
              onRequestCancel={() => setShowCancel(true)}
            />
          )}
        </ModalContent>
      </Modal>
      {data && (
        <CancelOrderDialog
          open={showCancel}
          onOpenChange={setShowCancel}
          order={data}
          onCancelled={handleCancelled}
        />
      )}
    </>
  );
}

function DetailLoading() {
  return (
    <div className="py-10 flex flex-col items-center gap-2 text-sm text-muted-foreground">
      <Loader2 size={20} className="animate-spin" />
      Cargando venta…
    </div>
  );
}

function DetailError() {
  return (
    <div className="py-8 flex flex-col items-center gap-2 text-sm text-destructive">
      <AlertTriangle size={20} />
      No se pudo cargar la venta. Intenta de nuevo.
    </div>
  );
}

interface DetailBodyProps {
  order: PosOrderResponse;
  onClose: () => void;
  onRequestCancel: () => void;
}

function DetailBody({ order, onClose, onRequestCancel }: DetailBodyProps) {
  const items = order.items ?? [];
  const events = order.events ?? [];
  const hasDocument = order.customerDocType && order.customerDocNumber;
  const hasCoupon =
    order.couponCode !== null && (order.couponDiscount ?? order.discount) > 0;

  return (
    <div className="space-y-5">
      <section className="flex flex-wrap items-center gap-2">
        <span
          className={cn(
            'inline-flex items-center px-2 py-0.5 rounded-sm text-[11px] uppercase tracking-wide',
            getStatusChipClasses(order.status),
          )}
        >
          {ORDER_STATUS_LABELS[order.status]}
        </span>
        <span className="text-xs text-muted-foreground">
          Pago: {PAYMENT_METHOD_LABELS[order.paymentMethod]}
        </span>
      </section>

      <section className="rounded-md border border-border bg-muted/30 p-3 space-y-1 text-sm">
        <h4 className="text-xs uppercase tracking-wide text-muted-foreground mb-1.5">
          Cliente
        </h4>
        <p className="text-foreground" style={{ fontWeight: 500 }}>
          {order.customerName}
        </p>
        {(order.customerEmail || order.customerPhone) && (
          <p className="text-xs text-muted-foreground">
            {[order.customerEmail, order.customerPhone]
              .filter(Boolean)
              .join(' · ')}
          </p>
        )}
        {hasDocument && (
          <p className="text-xs text-muted-foreground">
            {CUSTOMER_DOC_TYPE_LABELS[order.customerDocType!]} ·{' '}
            <span className="tabular-nums">{order.customerDocNumber}</span>
          </p>
        )}
      </section>

      <section className="space-y-2">
        <h4 className="text-xs uppercase tracking-wide text-muted-foreground">
          Productos
        </h4>
        <ItemsTable items={items} />
      </section>

      <section className="rounded-md border border-border bg-muted/30 p-3 space-y-1.5 text-sm">
        <TotalsRow label="Subtotal" value={formatCents(order.subtotal)} />
        {hasCoupon && (
          <TotalsRow
            label={`Descuento${order.couponCode ? ` (${order.couponCode})` : ''}`}
            value={`− ${formatCents(order.discount)}`}
            muted
          />
        )}
        {order.shippingCost > 0 && (
          <TotalsRow
            label="Envío"
            value={`+ ${formatCents(order.shippingCost)}`}
            muted
          />
        )}
        <div className="border-t border-border pt-2 mt-1">
          <TotalsRow
            label="Total"
            value={formatCents(order.total)}
            emphasized
          />
        </div>
      </section>

      {order.notes && (
        <section className="space-y-1.5">
          <h4 className="text-xs uppercase tracking-wide text-muted-foreground">
            Notas
          </h4>
          <p className="rounded-md bg-muted/30 border border-border px-3 py-2 text-sm text-muted-foreground whitespace-pre-wrap">
            {order.notes}
          </p>
        </section>
      )}

      <section className="space-y-2">
        <h4 className="text-xs uppercase tracking-wide text-muted-foreground">
          Historial
        </h4>
        <Timeline events={events} />
      </section>

      <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-2 pt-1">
        <div className="flex gap-2">
          {order.status === 'paid' && (
            <Button
              type="button"
              variant="destructive"
              size="md"
              onClick={onRequestCancel}
            >
              Anular venta
            </Button>
          )}
        </div>
        <Button type="button" variant="outline" size="md" onClick={onClose}>
          Cerrar
        </Button>
      </div>
    </div>
  );
}

function ItemsTable({ items }: { items: PosOrderItemResponse[] }) {
  if (items.length === 0) {
    return (
      <p className="text-xs text-muted-foreground py-2">
        Sin productos en esta venta.
      </p>
    );
  }
  return (
    <div className="rounded-md border border-border overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted/40">
          <tr className="text-xs uppercase tracking-wide text-muted-foreground">
            <th className="text-left px-3 py-2" style={{ fontWeight: 500 }}>
              Producto
            </th>
            <th className="text-right px-3 py-2 w-16" style={{ fontWeight: 500 }}>
              Cant.
            </th>
            <th className="text-right px-3 py-2 w-24" style={{ fontWeight: 500 }}>
              P. Unit.
            </th>
            <th className="text-right px-3 py-2 w-28" style={{ fontWeight: 500 }}>
              Subtotal
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {items.map((item) => (
            <tr key={item.id}>
              <td className="px-3 py-2 text-foreground">{item.productName}</td>
              <td className="px-3 py-2 text-right tabular-nums">
                {item.quantity}
              </td>
              <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">
                {formatCents(item.unitPrice)}
              </td>
              <td
                className="px-3 py-2 text-right tabular-nums"
                style={{ fontWeight: 500 }}
              >
                {formatCents(item.subtotal)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface TotalsRowProps {
  label: string;
  value: string;
  emphasized?: boolean;
  muted?: boolean;
}

function TotalsRow({
  label,
  value,
  emphasized = false,
  muted = false,
}: TotalsRowProps) {
  return (
    <div className="flex items-center justify-between">
      <span
        className={cn(
          muted ? 'text-muted-foreground/80' : 'text-muted-foreground',
          emphasized && 'text-foreground',
        )}
        style={{ fontWeight: emphasized ? 600 : 400 }}
      >
        {label}
      </span>
      <span
        className={cn(
          'tabular-nums',
          emphasized ? 'text-foreground text-base' : 'text-foreground/90',
        )}
        style={{ fontWeight: emphasized ? 600 : 500 }}
      >
        {value}
      </span>
    </div>
  );
}

function Timeline({ events }: { events: PosOrderEventResponse[] }) {
  if (events.length === 0) {
    return (
      <p className="text-xs text-muted-foreground py-2">
        Sin eventos registrados.
      </p>
    );
  }
  const sorted = [...events].sort(
    (a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
  return (
    <ul className="space-y-2 max-h-44 overflow-y-auto pr-1 -mr-1">
      {sorted.map((event) => (
        <li
          key={event.id}
          className="flex items-start gap-3 text-sm border-l-2 border-border pl-3"
        >
          <div className="flex-1 min-w-0">
            <p className="text-foreground/90 leading-snug">
              {event.description}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {event.staffName ? `${event.staffName} · ` : ''}
              <span className="tabular-nums">{formatTime(event.createdAt)}</span>
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
