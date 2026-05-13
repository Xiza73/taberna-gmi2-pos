import type {
  CashMovementResponse,
  CashRegisterResponse,
  CloseCashRegisterInput,
  CreateCashMovementInput,
  OpenCashRegisterInput,
} from '@/types/cashRegister';
import { apiClient } from './client';
import { ApiError } from './errors';

/**
 * Cliente HTTP de Caja Registradora. Todos los endpoints requieren staff
 * JWT con rol admin/super_admin (back exige `@RequireStaffRole(SUPER_ADMIN, ADMIN)`).
 */
export const cashRegisterApi = {
  /** POST /admin/pos/cash-register/open */
  open(input: OpenCashRegisterInput): Promise<CashRegisterResponse> {
    return apiClient.post<CashRegisterResponse>('/admin/pos/cash-register/open', input);
  },

  /** POST /admin/pos/cash-register/close */
  close(input: CloseCashRegisterInput): Promise<CashRegisterResponse> {
    return apiClient.post<CashRegisterResponse>('/admin/pos/cash-register/close', input);
  },

  /**
   * GET /admin/pos/cash-register/current
   * Devuelve null si el back tira 404 (POS_CASH_REGISTER_NOT_OPEN).
   */
  async getCurrent(): Promise<CashRegisterResponse | null> {
    try {
      return await apiClient.get<CashRegisterResponse>('/admin/pos/cash-register/current');
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) return null;
      throw e;
    }
  },

  /** GET /admin/pos/cash-register/:id (incluye movimientos). */
  getById(id: string): Promise<CashRegisterResponse> {
    return apiClient.get<CashRegisterResponse>(`/admin/pos/cash-register/${id}`);
  },

  /** POST /admin/pos/cash-register/movements */
  createMovement(input: CreateCashMovementInput): Promise<CashMovementResponse> {
    return apiClient.post<CashMovementResponse>(
      '/admin/pos/cash-register/movements',
      input,
    );
  },

  /** GET /admin/pos/cash-register/movements — movimientos de la caja abierta del staff. */
  listMovements(): Promise<CashMovementResponse[]> {
    return apiClient.get<CashMovementResponse[]>('/admin/pos/cash-register/movements');
  },
};
