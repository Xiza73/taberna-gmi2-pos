import { useQuery } from '@tanstack/react-query';
import { cashRegisterApi } from '@/api/cashRegisterApi';

export const cashRegisterKeys = {
  all: ['cashRegister'] as const,
  current: ['cashRegister', 'current'] as const,
};

/**
 * Caja abierta del staff actual (o `null` si no hay caja abierta — el
 * back devuelve 404 y el cliente lo mapea a `null`).
 */
export function useCurrentCashRegister() {
  return useQuery({
    queryKey: cashRegisterKeys.current,
    queryFn: () => cashRegisterApi.getCurrent(),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
}
