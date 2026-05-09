import type { CustomerDocType, PaymentMethod } from '@/types/posOrder';

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Efectivo',
  yape_plin: 'Yape o Plin',
  bank_transfer: 'Transferencia',
  mercadopago: 'MercadoPago',
};

export const PAYMENT_METHOD_DESCRIPTIONS: Record<PaymentMethod, string> = {
  cash: 'Pago en efectivo en caja',
  yape_plin: 'Confirmá el comprobante en tu app',
  bank_transfer: 'Confirmá el voucher de la transferencia',
  mercadopago: 'Genera link de pago. La orden queda pendiente hasta confirmación.',
};

export const POS_PAYMENT_METHODS: PaymentMethod[] = [
  'cash',
  'yape_plin',
  'bank_transfer',
  'mercadopago',
];

export const CUSTOMER_DOC_TYPE_LABELS: Record<CustomerDocType, string> = {
  dni: 'DNI (Boleta)',
  ruc: 'RUC (Factura)',
};
