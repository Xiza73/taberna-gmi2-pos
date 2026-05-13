import { useQuery } from '@tanstack/react-query';
import { posReportsApi } from '@/api/posReportsApi';

export const paymentMethodReportKeys = {
  all: ['posReports', 'byPaymentMethod'] as const,
  byRange: (from: string, to: string) => ['posReports', 'byPaymentMethod', from, to] as const,
};

/**
 * Reporte de ventas por método de pago en un rango. `enabled` permite al
 * caller cortar el fetch cuando el rango no es válido o el tab no está
 * activo.
 */
export function usePaymentMethodReport(dateFrom: string, dateTo: string, enabled: boolean = true) {
  return useQuery({
    queryKey: paymentMethodReportKeys.byRange(dateFrom, dateTo),
    queryFn: () => posReportsApi.byPaymentMethod({ dateFrom, dateTo }),
    enabled,
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });
}
