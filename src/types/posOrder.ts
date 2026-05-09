/**
 * Tipos POS — espejo de `backend/docs/modules/pos.md` y de
 * `CreatePosOrderDto` / `OrderResponseDto`. Mantenelo alineado.
 */

export type OrderStatus =
  | 'pending'
  | 'paid'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

/**
 * `cash` es típico para POS presencial. `mercadopago` deja la orden en
 * `pending` (genera preferencia + paymentUrl). El resto deja `paid` directo
 * y el staff confirma manualmente con el comprobante (Yape captura,
 * voucher banco, efectivo en caja).
 */
export type PaymentMethod =
  | 'cash'
  | 'yape_plin'
  | 'bank_transfer'
  | 'mercadopago';

export type OrderChannel = 'pos' | 'whatsapp';

export type CustomerDocType = 'dni' | 'ruc';

export interface PosOrderItemInput {
  productId: string;
  quantity: number;
}

export interface CreatePosOrderInput {
  items: PosOrderItemInput[];
  paymentMethod: PaymentMethod;
  channel: OrderChannel;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  customerDocType?: CustomerDocType;
  /** 8 dígitos DNI o 11 dígitos RUC. Requerido si `customerDocType` está. */
  customerDocNumber?: string;
  couponCode?: string;
  /** Solo WhatsApp con delivery. */
  addressId?: string;
  notes?: string;
  generateInvoice?: boolean;
  invoiceType?: 'boleta' | 'factura';
}

export interface PosOrderItemResponse {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  productImage: string | null;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export interface PosOrderResponse {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  channel: OrderChannel;
  /** Cents PEN. */
  subtotal: number;
  discount: number;
  shippingCost: number;
  total: number;
  couponCode: string | null;
  couponDiscount: number | null;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  customerDocType: CustomerDocType | null;
  customerDocNumber: string | null;
  notes: string | null;
  createdAt: string;
  items?: PosOrderItemResponse[];
  /** Solo presente si paymentMethod === 'mercadopago'. */
  paymentUrl?: string | null;
}
