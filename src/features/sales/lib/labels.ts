import type { OrderChannel, OrderStatus } from '@/types/posOrder';

export {
  CUSTOMER_DOC_TYPE_LABELS,
  PAYMENT_METHOD_LABELS,
} from '@/features/sale/lib/labels';

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pendiente',
  paid: 'Pagado',
  processing: 'En proceso',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Anulado',
  refunded: 'Devuelto',
};

export const ORDER_CHANNEL_LABELS: Record<OrderChannel, string> = {
  pos: 'POS',
  whatsapp: 'WhatsApp',
};

/**
 * Devuelve clases Tailwind para el chip de estado.
 * - paid    → emerald
 * - cancelled → destructive
 * - refunded  → amber
 * - pending → yellow
 * - resto   → muted
 */
export function getStatusChipClasses(status: OrderStatus): string {
  switch (status) {
    case 'paid':
      return 'bg-emerald-500/10 text-emerald-400';
    case 'cancelled':
      return 'bg-destructive/10 text-destructive';
    case 'refunded':
      return 'bg-amber-500/10 text-amber-400';
    case 'pending':
      return 'bg-yellow-500/10 text-yellow-400';
    default:
      return 'bg-muted/40 text-muted-foreground';
  }
}
