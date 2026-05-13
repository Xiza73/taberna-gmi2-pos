import { useQuery } from '@tanstack/react-query';
import { posReportsApi } from '@/api/posReportsApi';

export const dailyReportKeys = {
  all: ['posReports', 'daily'] as const,
  byDate: (date: string) => ['posReports', 'daily', date] as const,
};

/**
 * Reporte diario de ventas POS. `placeholderData` mantiene visible el
 * último data set mientras se resuelve la nueva fecha (evita el "flash"
 * de skeleton al cambiar de día).
 */
export function useDailyReport(date: string) {
  return useQuery({
    queryKey: dailyReportKeys.byDate(date),
    queryFn: () => posReportsApi.daily({ date }),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });
}
