import type { CreatePosOrderInput, PosOrderResponse } from '@/types/posOrder';
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
};
