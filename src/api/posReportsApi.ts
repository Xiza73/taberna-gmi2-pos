import type {
  DailyPosReportResponse,
  DailyReportQuery,
  PaymentMethodReportResponse,
  RangeReportQuery,
  StaffSalesReportResponse,
} from '@/types/posReport';
import { apiClient } from './client';

/**
 * Cliente HTTP para reportes POS. Todos los endpoints requieren staff JWT
 * con rol admin/super_admin (back exige `@RequireStaffRole(SUPER_ADMIN, ADMIN)`)
 * y `byStaff` adicionalmente exige super_admin.
 */
export const posReportsApi = {
  /** GET /admin/pos/reports/daily — resumen del día. `date` default = hoy. */
  daily(query: DailyReportQuery = {}): Promise<DailyPosReportResponse> {
    return apiClient.get<DailyPosReportResponse>('/admin/pos/reports/daily', { query });
  },

  /**
   * GET /admin/pos/reports/by-payment-method — desglose por método de pago
   * en un rango de fechas. El back valida `dateFrom <= dateTo`.
   */
  byPaymentMethod(query: RangeReportQuery): Promise<PaymentMethodReportResponse> {
    return apiClient.get<PaymentMethodReportResponse>('/admin/pos/reports/by-payment-method', {
      query,
    });
  },

  /**
   * GET /admin/pos/reports/by-staff — ventas por vendedor en un rango.
   * Solo super_admin (el back devuelve 403 a admins normales).
   */
  byStaff(query: RangeReportQuery): Promise<StaffSalesReportResponse> {
    return apiClient.get<StaffSalesReportResponse>('/admin/pos/reports/by-staff', { query });
  },
};
