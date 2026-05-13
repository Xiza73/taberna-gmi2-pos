import { ChevronRight, Inbox } from 'lucide-react';
import { cn } from '@/utils/cn';
import { formatCents, formatTime } from '@/features/cashbox/lib/formatters';
import type { PosOrderResponse } from '@/types/posOrder';
import {
  ORDER_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  getStatusChipClasses,
} from '../lib/labels';

interface Props {
  orders: PosOrderResponse[];
  isLoading: boolean;
  onSelect: (id: string) => void;
}

/**
 * Renderiza la lista de ventas. Cada fila es un botón tap-friendly
 * (touch target ≥ 64px para tablet) que abre el modal de detalle.
 *
 * Estados:
 * - isLoading + sin datos → skeleton de 5 filas
 * - data vacía            → empty state con borde dashed
 * - data presente         → filas con info comprimida en 2 líneas
 */
export function SalesList({ orders, isLoading, onSelect }: Props) {
  if (isLoading && orders.length === 0) {
    return <SalesListSkeleton />;
  }

  if (orders.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border py-10 px-6 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
        <Inbox size={20} className="text-muted-foreground/60" />
        Sin ventas para los filtros seleccionados.
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border/60 rounded-md border border-border overflow-hidden bg-card/30">
      {orders.map((order) => (
        <li key={order.id}>
          <SaleRow order={order} onSelect={onSelect} />
        </li>
      ))}
    </ul>
  );
}

interface SaleRowProps {
  order: PosOrderResponse;
  onSelect: (id: string) => void;
}

function SaleRow({ order, onSelect }: SaleRowProps) {
  const itemsCount =
    typeof order.items === 'undefined' ? null : order.items.length;
  return (
    <button
      type="button"
      onClick={() => onSelect(order.id)}
      className={cn(
        'w-full text-left px-4 py-3 transition-colors',
        'hover:bg-muted/40 focus-visible:bg-muted/50 outline-none',
        'focus-visible:ring-[3px] focus-visible:ring-ring/30',
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="text-sm tabular-nums truncate"
            style={{ fontWeight: 500 }}
          >
            {order.orderNumber}
          </span>
          <span className="text-xs text-muted-foreground tabular-nums shrink-0">
            · {formatTime(order.createdAt)}
          </span>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span
            className={cn(
              'inline-flex items-center px-2 py-0.5 rounded-sm text-[11px] uppercase tracking-wide',
              getStatusChipClasses(order.status),
            )}
          >
            {ORDER_STATUS_LABELS[order.status]}
          </span>
          <span className="text-sm tabular-nums" style={{ fontWeight: 600 }}>
            {formatCents(order.total)}
          </span>
          <ChevronRight size={16} className="text-muted-foreground" />
        </div>
      </div>

      <div className="mt-1 text-xs text-muted-foreground truncate">
        {itemsCount !== null ? `${itemsCount} items · ` : ''}
        {order.customerName} · {PAYMENT_METHOD_LABELS[order.paymentMethod]}
      </div>
    </button>
  );
}

function SalesListSkeleton() {
  return (
    <ul className="divide-y divide-border/60 rounded-md border border-border overflow-hidden bg-card/30">
      {Array.from({ length: 5 }).map((_, i) => (
        <li key={i} className="px-4 py-3 space-y-2">
          <div className="flex items-center justify-between gap-3">
            <div className="h-4 w-32 bg-muted/40 rounded-sm animate-pulse" />
            <div className="flex items-center gap-3">
              <div className="h-4 w-16 bg-muted/40 rounded-sm animate-pulse" />
              <div className="h-4 w-20 bg-muted/40 rounded-sm animate-pulse" />
            </div>
          </div>
          <div className="h-3 w-48 bg-muted/30 rounded-sm animate-pulse" />
        </li>
      ))}
    </ul>
  );
}
