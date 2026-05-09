import { type FormEvent, useState } from 'react';
import { Banknote, Check, CreditCard, Smartphone, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { ApiError } from '@/api/errors';
import type {
  CustomerDocType,
  PaymentMethod,
  PosOrderResponse,
} from '@/types/posOrder';
import { cn } from '@/utils/cn';
import { formatPEN } from '@/utils/format';
import { useCreatePosOrder } from '../hooks/useCreatePosOrder';
import {
  CUSTOMER_DOC_TYPE_LABELS,
  PAYMENT_METHOD_DESCRIPTIONS,
  PAYMENT_METHOD_LABELS,
  POS_PAYMENT_METHODS,
} from '../lib/labels';
import { selectSubtotal, useSaleStore } from '../store/saleStore';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Callback con la orden creada — la page la usa para mostrar success. */
  onSuccess: (order: PosOrderResponse) => void;
}

const PAYMENT_ICONS: Record<PaymentMethod, typeof CreditCard> = {
  cash: Wallet,
  yape_plin: Smartphone,
  bank_transfer: Banknote,
  mercadopago: CreditCard,
};

const DOC_TYPES: CustomerDocType[] = ['dni', 'ruc'];

function isValidDocNumber(type: CustomerDocType, number: string): boolean {
  const trimmed = number.trim();
  if (type === 'dni') return /^\d{8}$/.test(trimmed);
  return /^\d{11}$/.test(trimmed);
}

/**
 * Modal de cobranza. Recoge método de pago + datos del cliente (mínimos:
 * solo nombre) + opcional boleta/factura → POST a `/admin/pos/orders`.
 *
 * El customerName es obligatorio (back lo exige); el resto opcional. Si
 * el cliente no quiere dar nombre, podemos sugerir poner "Cliente
 * presencial" o similar — eso lo decidimos en uso real.
 */
export function ChargeModal({ open, onOpenChange, onSuccess }: Props) {
  const items = useSaleStore((s) => s.items);
  const subtotal = useSaleStore(selectSubtotal);
  const create = useCreatePosOrder();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [invoiceEnabled, setInvoiceEnabled] = useState(false);
  const [docType, setDocType] = useState<CustomerDocType>('dni');
  const [docNumber, setDocNumber] = useState('');
  const [error, setError] = useState<string | null>(null);

  const docError =
    invoiceEnabled && docNumber.length > 0 && !isValidDocNumber(docType, docNumber)
      ? docType === 'dni'
        ? 'DNI debe tener 8 dígitos'
        : 'RUC debe tener 11 dígitos'
      : undefined;

  function reset() {
    setPaymentMethod('cash');
    setCustomerName('');
    setCustomerEmail('');
    setCustomerPhone('');
    setNotes('');
    setInvoiceEnabled(false);
    setDocType('dni');
    setDocNumber('');
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
    if (invoiceEnabled) {
      if (!docNumber.trim()) {
        setError('Ingresá el número de DNI o RUC.');
        return;
      }
      if (docError) return;
    }

    try {
      const order = await create.mutateAsync({
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        paymentMethod,
        channel: 'pos',
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
        customerDocType: invoiceEnabled ? docType : undefined,
        customerDocNumber:
          invoiceEnabled && docNumber.trim() ? docNumber.trim() : undefined,
        notes: notes.trim() || undefined,
        generateInvoice: invoiceEnabled,
        invoiceType: invoiceEnabled
          ? docType === 'dni'
            ? 'boleta'
            : 'factura'
          : undefined,
      });
      reset();
      onSuccess(order);
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

          {/* Invoice toggle */}
          <div className="rounded-md border border-border bg-muted/30 p-3 space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={invoiceEnabled}
                onChange={(e) => setInvoiceEnabled(e.target.checked)}
                disabled={create.isPending}
                className="mt-0.5 w-4 h-4 rounded border-border accent-primary cursor-pointer"
              />
              <div>
                <span className="text-sm" style={{ fontWeight: 500 }}>
                  Emitir comprobante con datos
                </span>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Boleta (DNI) o factura (RUC). Sin marcar = solo registro interno.
                </p>
              </div>
            </label>

            {invoiceEnabled && (
              <div className="space-y-2 pt-2 border-t border-border">
                <div className="flex gap-2">
                  {DOC_TYPES.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setDocType(type)}
                      aria-pressed={docType === type}
                      className={cn(
                        'flex-1 px-3 py-2 rounded-sm text-sm transition-colors',
                        docType === type
                          ? 'bg-foreground text-background'
                          : 'bg-card text-foreground hover:bg-secondary border border-border',
                      )}
                    >
                      {CUSTOMER_DOC_TYPE_LABELS[type]}
                    </button>
                  ))}
                </div>
                <Input
                  label={docType === 'dni' ? 'Número de DNI' : 'Número de RUC'}
                  type="text"
                  inputMode="numeric"
                  maxLength={docType === 'dni' ? 8 : 11}
                  placeholder={docType === 'dni' ? '12345678' : '20123456789'}
                  value={docNumber}
                  onChange={(e) => setDocNumber(e.target.value.replace(/\D/g, ''))}
                  error={docError}
                  hint={!docError ? (docType === 'dni' ? '8 dígitos' : '11 dígitos') : undefined}
                  disabled={create.isPending}
                />
              </div>
            )}
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
