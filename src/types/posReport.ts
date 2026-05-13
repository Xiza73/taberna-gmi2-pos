/**
 * Tipos POS Reports — espejo de las response DTOs del back en
 * `backend/docs/modules/pos.md` (sección "Reportes POS"). Los tres
 * endpoints viven bajo `/admin/pos/reports/*` y devuelven montos en
 * centavos (PEN), igual que el resto del POS.
 *
 * Mantenelo alineado cuando cambien los DTOs del back.
 */

export interface DailyReportPaymentMethodBreakdown {
  paymentMethod: string;
  count: number;
  /** Centavos PEN. */
  total: number;
}

export interface DailyReportStatusBreakdown {
  status: string;
  count: number;
}

export interface DailyReportTopProduct {
  productId: string;
  productName: string;
  quantity: number;
  /** Centavos PEN. */
  total: number;
}

export interface DailyPosReportResponse {
  /** `YYYY-MM-DD`. */
  date: string;
  totalOrders: number;
  /** Centavos PEN. */
  totalSales: number;
  byPaymentMethod: DailyReportPaymentMethodBreakdown[];
  byStatus: DailyReportStatusBreakdown[];
  topProducts: DailyReportTopProduct[];
}

export interface PaymentMethodReportItem {
  paymentMethod: string;
  count: number;
  /** Centavos PEN. Ojo: el back llama a este campo `totalAmount` en el reporte por método de pago. */
  totalAmount: number;
}

export interface PaymentMethodReportResponse {
  /** `YYYY-MM-DD`. */
  dateFrom: string;
  /** `YYYY-MM-DD`. */
  dateTo: string;
  items: PaymentMethodReportItem[];
}

export interface StaffSalesReportItem {
  staffId: string;
  staffName: string;
  count: number;
  /** Centavos PEN. */
  totalAmount: number;
}

export interface StaffSalesReportResponse {
  /** `YYYY-MM-DD`. */
  dateFrom: string;
  /** `YYYY-MM-DD`. */
  dateTo: string;
  items: StaffSalesReportItem[];
}

/** Query para `GET /admin/pos/reports/daily`. `date` default = hoy en el back. */
export interface DailyReportQuery {
  /** `YYYY-MM-DD`. Si se omite, el back usa hoy. */
  date?: string;
}

/** Query compartida para reportes por rango (payment-method, by-staff). */
export interface RangeReportQuery {
  /** `YYYY-MM-DD`. */
  dateFrom: string;
  /** `YYYY-MM-DD`. */
  dateTo: string;
}
