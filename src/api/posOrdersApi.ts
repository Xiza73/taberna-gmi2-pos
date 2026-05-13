import type {
  CreatePosOrderInput,
  PosOrderFilters,
  PosOrderListResponse,
  PosOrderResponse,
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
};
