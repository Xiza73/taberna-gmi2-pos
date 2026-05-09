import { CheckCircle2, Plus, ExternalLink, Mail } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal, ModalContent } from '@/components/ui/Modal';
import type { PosOrderResponse } from '@/types/posOrder';
import { formatPEN } from '@/utils/format';
import { PAYMENT_METHOD_LABELS } from '../lib/labels';

interface Props {
  order: PosOrderResponse | null;
  onNewSale: () => void;
}

/**
 * Pantalla post-venta. Confirma orderNumber + total + método. Si el método
 * fue MercadoPago, ofrece copiar el `paymentUrl` para que el cliente lo
 * abra (no lo abrimos automáticamente — el cajero decide si compartirlo
 * por WhatsApp, escanearlo, etc.).
 *
 * No tiene botón de cerrar — el flow obliga a tocar "Nueva venta" para
 * limpiar el cart y volver al grid.
 */
export function SaleSuccessOverlay({ order, onNewSale }: Props) {
  return (
    <Modal open={order !== null} onOpenChange={() => {}}>
      <ModalContent
        title="Venta registrada"
        maxWidth="max-w-md"
        hideCloseButton
      >
        {order && (
          <div className="space-y-5">
            <div className="flex flex-col items-center text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-400 mb-3">
                <CheckCircle2 size={28} />
              </div>
              <p
                className="text-sm tracking-wider uppercase text-muted-foreground"
              >
                Pedido
              </p>
              <p
                className="text-2xl tabular-nums"
                style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}
              >
                {order.orderNumber}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <Row label="Total" value={formatPEN(order.total)} mono />
              <Row label="Método" value={PAYMENT_METHOD_LABELS[order.paymentMethod]} />
            </div>

            {order.customerEmail && (
              <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                <Mail size={12} />
                <span>Comprobante enviado a {order.customerEmail}</span>
              </div>
            )}

            {order.paymentUrl && (
              <a
                href={order.paymentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <Button type="button" variant="outline" width="full" size="md">
                  <ExternalLink size={14} />
                  Abrir link de pago MercadoPago
                </Button>
              </a>
            )}

            <Button
              type="button"
              size="touch"
              width="full"
              onClick={onNewSale}
              autoFocus
            >
              <Plus size={18} />
              Nueva venta
            </Button>
          </div>
        )}
      </ModalContent>
    </Modal>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-md border border-border bg-muted/30 px-3 py-2">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">
        {label}
      </p>
      <p className={mono ? 'text-base tabular-nums' : 'text-sm'} style={{ fontWeight: 500 }}>
        {value}
      </p>
    </div>
  );
}
