import type {
  CancelPosOrderInput,
  CreatePosOrderInput,
  PosOrderFilters,
  PosOrderListResponse,
  PosOrderResponse,
  RefundPosOrderInput,
} from '@/types/posOrder';
import { apiClient } from './client';

/**
 * Cliente HTTP para ventas POS. Todos los endpoints requieren staff JWT
 * con rol admin/super_admin (back exige `@RequireStaffRole(SUPER_ADMIN, ADMIN)`).
 */
export const posOrdersApi = {
  /** POST /admin/pos/orders — crea venta directa (sin carrito). */
  create(input: CreatePosOrderInput): Promise<PosOrderResponse> {
    return apiClient.post<PosOrderResponse>('/admin/pos/orders', input);
  },

  /**
   * GET /admin/pos/orders — listado paginado de ventas POS/WhatsApp.
   * El back default-ea `channelIn: ['pos', 'whatsapp']` cuando no se
   * pasa `channel`, así que el front no envía ese filtro.
   */
  list(filters: PosOrderFilters = {}): Promise<PosOrderListResponse> {
    return apiClient.get<PosOrderListResponse>('/admin/pos/orders', {
      query: filters,
    });
  },

  /** GET /admin/pos/orders/:id — detalle con items + events. */
  get(id: string): Promise<PosOrderResponse> {
    return apiClient.get<PosOrderResponse>(`/admin/pos/orders/${id}`);
  },

  /**
   * POST /admin/pos/orders/:id/cancel — anula la venta. Restaura stock,
   * decrementa coupon uses si aplica, registra OrderEvent con el motivo
   * + nombre del staff. Solo permitido si la orden está en `paid`.
   */
  cancel(id: string, input: CancelPosOrderInput): Promise<PosOrderResponse> {
    return apiClient.post<PosOrderResponse>(
      `/admin/pos/orders/${id}/cancel`,
      input,
    );
  },

  /**
   * POST /admin/pos/orders/:id/refund — devuelve la venta total o
   * parcialmente. Total: omitir `items` → restaura todo + status
   * `refunded`. Parcial: enviar items con cantidades → restaura stock
   * parcial, status NO cambia. Solo super_admin (back valida).
   */
  refund(id: string, input: RefundPosOrderInput): Promise<PosOrderResponse> {
    return apiClient.post<PosOrderResponse>(
      `/admin/pos/orders/${id}/refund`,
      input,
    );
  },
};
