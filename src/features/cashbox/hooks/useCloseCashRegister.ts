import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cashRegisterApi } from '@/api/cashRegisterApi';
import { ApiError } from '@/api/errors';
import type { CloseCashRegisterInput } from '@/types/cashRegister';

/**
 * Mutation para cerrar caja. NO limpia la cache de `cashRegister/current`
 * acá — eso se hace en el dialog cuando el cajero confirma el resumen
 * del arqueo (Phase B). Si lo limpiáramos en `onSuccess`, el badge
 * desmonta el dialog antes de que se vea el resumen.
 *
 * La caja cerrada queda en `mutation.data` para mostrar el arqueo.
 */
export function useCloseCashRegister() {
  return useMutation({
    mutationFn: (input: CloseCashRegisterInput) => cashRegisterApi.close(input),
    onSuccess: () => {
      toast.success('Caja cerrada');
    },
    onError: (e: unknown) => {
      const msg = e instanceof ApiError ? e.message : 'No se pudo cerrar la caja';
      toast.error(msg);
    },
  });
}
