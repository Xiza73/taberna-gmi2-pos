import { useQuery } from '@tanstack/react-query';
import { posReportsApi } from '@/api/posReportsApi';

export const staffSalesReportKeys = {
  all: ['posReports', 'byStaff'] as const,
  byRange: (from: string, to: string) => ['posReports', 'byStaff', from, to] as const,
};

/**
 * Reporte de ventas por vendedor en un rango. `enabled` debe pasarse
 * SIEMPRE: solo se ejecuta cuando el usuario es super_admin Y el tab
 * está activo (el back devuelve 403 si llamamos como admin normal).
 */
export function useStaffSalesReport(dateFrom: string, dateTo: string, enabled: boolean) {
  return useQuery({
    queryKey: staffSalesReportKeys.byRange(dateFrom, dateTo),
    queryFn: () => posReportsApi.byStaff({ dateFrom, dateTo }),
    enabled,
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });
}
