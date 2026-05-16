import { type FormEvent, useState } from 'react';
import {
  AlertTriangle,
  Banknote,
  Check,
  CreditCard,
  Smartphone,
  Wallet,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { ApiError } from '@/api/errors';
import { useCurrentCashRegister } from '@/features/cashbox';
import type { PaymentMethod } from '@/types/posOrder';
import { cn } from '@/utils/cn';
import { formatPEN } from '@/utils/format';
import {
  useCreatePosOrder,
  type CreatePosOrderResult,
} from '../hooks/useCreatePosOrder';
import {
  PAYMENT_METHOD_DESCRIPTIONS,
  PAYMENT_METHOD_LABELS,
  POS_PAYMENT_METHODS,
} from '../lib/labels';
import { selectSubtotal, useSaleStore } from '../store/saleStore';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * Callback con el resultado. Puede ser `synced` (orden creada en el back)
   * o `queued` (sin conexión, se encoló para sync). La page decide la UX.
   */
  onSuccess: (result: CreatePosOrderResult) => void;
}

const PAYMENT_ICONS: Record<PaymentMethod, typeof CreditCard> = {
  cash: Wallet,
  yape_plin: Smartphone,
  bank_transfer: Banknote,
  mercadopago: CreditCard,
};

/**
 * Modal de cobranza. Recoge método de pago + datos del cliente (mínimos:
 * solo nombre) + cupón opcional → POST a `/admin/pos/orders`.
 *
 * La emisión de comprobante (boleta/factura) está pospuesta — se agregará
 * cuando se integre con SUNAT en el back. Si el cajero quiere registrar
 * un DNI/RUC del cliente como dato libre, puede sumarlo a las notas.
 *
 * El customerName es obligatorio (back lo exige); el resto opcional. Si
 * el cliente no quiere dar nombre, podemos sugerir poner "Cliente
 * presencial" o similar — eso lo decidimos en uso real.
 */
export function ChargeModal({ open, onOpenChange, onSuccess }: Props) {
  const items = useSaleStore((s) => s.items);
  const subtotal = useSaleStore(selectSubtotal);
  const create = useCreatePosOrder();
  // Para warning de cash sin caja abierta. El back no bloquea (per spec
  // POS docs: "recomienda tener caja abierta, warning, no bloqueo"), pero
  // el cajero debe saber que esa venta no aparecerá en el arqueo.
  const { data: currentCashRegister } = useCurrentCashRegister();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setPaymentMethod('cash');
    setCustomerName('');
    setCustomerEmail('');
    setCustomerPhone('');
    setCouponCode('');
    setNotes('');
    setError(null);
  }

  function handleClose() {
    if (create.isPending) return;
    onOpenChange(false);
    setTimeout(reset, 200);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!customerName.trim()) {
      setError('Ingresá el nombre del cliente.');
      return;
    }

    try {
      const result = await create.mutateAsync({
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        paymentMethod,
        channel: 'pos',
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
        couponCode: couponCode.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      reset();
      onSuccess(result);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'No se pudo registrar la venta. Intentá de nuevo.',
      );
    }
  }

  return (
    <Modal open={open} onOpenChange={handleClose}>
      <ModalContent
        title="Cobrar venta"
        description={`Total a cobrar: ${formatPEN(subtotal)}`}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {/* Payment method */}
          <div>
            <label className="block text-sm mb-2" style={{ fontWeight: 500 }}>
              Método de pago
            </label>
            <div className="grid grid-cols-2 gap-2">
              {POS_PAYMENT_METHODS.map((method) => {
                const Icon = PAYMENT_ICONS[method];
                const selected = paymentMethod === method;
                return (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    aria-pressed={selected}
                    className={cn(
                      'text-left rounded-md border p-3 transition-colors',
                      'min-h-[44px]',
                      selected
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-card hover:border-foreground/30',
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <Icon
                        size={16}
                        className={selected ? 'text-primary' : 'text-foreground/70'}
                      />
                      {selected && <Check size={12} className="text-primary" />}
                    </div>
                    <p className="text-sm" style={{ fontWeight: 500 }}>
                      {PAYMENT_METHOD_LABELS[method]}
                    </p>
                    <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">
                      {PAYMENT_METHOD_DESCRIPTIONS[method]}
                    </p>
                  </button>
                );
              })}
            </div>

            {paymentMethod === 'cash' && !currentCashRegister && (
              <div
                role="alert"
                className="mt-2.5 flex items-start gap-2.5 rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-amber-300"
              >
                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                <p className="leading-snug">
                  No tienes caja abierta. La venta se registra normalmente, pero
                  el efectivo <strong>no aparecerá en el arqueo</strong>. Para
                  el arqueo, abre tu caja desde el header antes de cobrar en
                  efectivo.
                </p>
              </div>
            )}
          </div>

          {/* Customer fields */}
          <div className="space-y-3">
            <Input
              label="Nombre del cliente"
              placeholder="Cliente presencial"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              required
              disabled={create.isPending}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Email"
                type="email"
                hint="Opcional"
                placeholder="cliente@email.com"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                disabled={create.isPending}
              />
              <Input
                label="Teléfono"
                type="tel"
                hint="Opcional"
                placeholder="+51 999 999 999"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                disabled={create.isPending}
              />
            </div>
          </div>

          {/* Coupon */}
          <div className="space-y-1.5">
            <Input
              label="Código de cupón (opcional)"
              placeholder="VERANO10"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              disabled={create.isPending}
              hint="Si tenés un cupón válido, el back aplica el descuento al confirmar."
              autoCapitalize="characters"
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label htmlFor="charge-notes" className="block text-sm">
              Notas (opcional)
            </label>
            <textarea
              id="charge-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              maxLength={500}
              placeholder="Observaciones internas, especificaciones del cliente…"
              disabled={create.isPending}
              className="w-full rounded-sm border border-border bg-input-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring resize-none disabled:opacity-50"
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

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={handleClose}
              disabled={create.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="md"
              loading={create.isPending}
              disabled={create.isPending}
            >
              {create.isPending ? 'Registrando…' : `Confirmar · ${formatPEN(subtotal)}`}
            </Button>
          </div>
        </form>
      </ModalContent>
    </Modal>
  );
}
