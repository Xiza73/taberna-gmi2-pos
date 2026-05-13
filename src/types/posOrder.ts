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

export interface PosOrderEventResponse {
  id: string;
  orderId: string;
  /** Tipo del evento (ej. 'order_created', 'order_paid', 'order_cancelled'). */
  type: string;
  description: string;
  staffId: string | null;
  staffName: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
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
  /** Presente sólo en el detalle (GET /admin/pos/orders/:id). */
  items?: PosOrderItemResponse[];
  /** Presente sólo en el detalle (GET /admin/pos/orders/:id). */
  events?: PosOrderEventResponse[];
  /** Solo presente si paymentMethod === 'mercadopago'. */
  paymentUrl?: string | null;
}

/**
 * Filtros aceptados por GET /admin/pos/orders. Espejo de
 * `PosOrderFiltersDto` en el back. `dateFrom` / `dateTo` son ISO strings
 * (el back usa BETWEEN sobre `createdAt`).
 */
export interface PosOrderFilters {
  page?: number;
  limit?: number;
  status?: OrderStatus;
  paymentMethod?: PaymentMethod;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  sortBy?: 'createdAt' | 'total';
}

export interface PosOrderListResponse {
  /** Cada item es la versión liviana (sin `items` ni `events`). */
  items: PosOrderResponse[];
  total: number;
  page: number;
  limit: number;
}
