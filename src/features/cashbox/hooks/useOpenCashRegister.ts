import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cashRegisterApi } from '@/api/cashRegisterApi';
import { ApiError } from '@/api/errors';
import type { CashRegisterResponse, OpenCashRegisterInput } from '@/types/cashRegister';
import { cashRegisterKeys } from './useCurrentCashRegister';

/**
 * Mutation para abrir caja. En éxito, actualiza la cache de
 * `cashRegister/current` con la nueva caja abierta y dispara toast.
 */
export function useOpenCashRegister() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: OpenCashRegisterInput) => cashRegisterApi.open(input),
    onSuccess: (data: CashRegisterResponse) => {
      queryClient.setQueryData(cashRegisterKeys.current, data);
      toast.success('Caja abierta');
    },
    onError: (e: unknown) => {
      const msg = e instanceof ApiError ? e.message : 'No se pudo abrir la caja';
      toast.error(msg);
    },
  });
}
