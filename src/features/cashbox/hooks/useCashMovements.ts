import { useQuery } from '@tanstack/react-query';
import { cashRegisterApi } from '@/api/cashRegisterApi';

export const cashMovementKeys = {
  all: ['cashMovement'] as const,
  current: ['cashMovement', 'current'] as const,
};

/**
 * Lista los movimientos (cash_in / cash_out) de la caja abierta del staff
 * actual. El back devuelve 404 si no hay caja abierta — para no spamear
 * llamados, el caller debe pasar `enabled=false` cuando sabe que no hay
 * caja (ej. cuando `useCurrentCashRegister.data` es null).
 */
export function useCashMovements(enabled: boolean = true) {
  return useQuery({
    queryKey: cashMovementKeys.current,
    queryFn: cashRegisterApi.listMovements,
    enabled,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
}
