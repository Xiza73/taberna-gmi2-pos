import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cashRegisterApi } from '@/api/cashRegisterApi';
import { ApiError } from '@/api/errors';
import type { CreateCashMovementInput } from '@/types/cashRegister';
import { cashRegisterKeys } from './useCurrentCashRegister';
import { cashMovementKeys } from './useCashMovements';

/**
 * Mutation para crear un movimiento (cash_in / cash_out) en la caja
 * abierta del staff actual. En éxito invalida tanto el listado de
 * movimientos como el registro de caja (porque el breakdown
 * `cashInAmount/cashOutAmount` cambió y el badge / Close dialog deben
 * recomputar `expectedAmount`).
 */
export function useCreateCashMovement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCashMovementInput) =>
      cashRegisterApi.createMovement(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cashMovementKeys.current });
      queryClient.invalidateQueries({ queryKey: cashRegisterKeys.current });
      toast.success('Movimiento registrado');
    },
    onError: (e: unknown) => {
      const msg =
        e instanceof ApiError ? e.message : 'No se pudo registrar el movimiento';
      toast.error(msg);
    },
  });
}
